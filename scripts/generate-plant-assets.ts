// Generates candidate plant art with Gemini, using the locked reference
// images as style inputs. Orchestration only: art direction and model
// settings live in scripts/plant-art-config.ts; see art/STYLE.md.
//
// Usage:
//   npm run art:generate -- basil sunflower
//   npm run art:generate -- basil --only icon
//   npm run art:generate -- basil --variants 3            (3 options per asset, pick the best)
//   npm run art:generate -- basil --model gemini-nano-banana-2.1   (cheaper drafts)
//   npm run art:generate -- basil sunflower --dry-run     (prints prompts and cost, no API calls)
//   npm run art:generate -- all --yes                     (every plant; costs money)

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { GoogleGenAI } from '@google/genai'
import type { GenerateContentResponseUsageMetadata } from '@google/genai'
import sharp from 'sharp'
import { plants } from '../src/data/plants.ts'
import {
  ASSETS,
  BACKGROUND,
  IMAGE_CONFIG,
  MAX_VARIANTS,
  MODEL,
  PRICING,
  buildPrompt,
} from './plant-art-config.ts'
import type { AssetKind } from './plant-art-config.ts'
import { DEFAULT_KEY_OPTIONS, hexToRgb, makeTransparent, transparentPathFor } from './remove-background.ts'

const CANDIDATES_DIR = 'art/candidates'
const KINDS: AssetKind[] = ['plant', 'icon']

type Options = {
  plantIds: string[]
  kinds: AssetKind[]
  variants: number
  model: string
  dryRun: boolean
}

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`)
  process.exit(1)
}

function parseArgs(argv: string[]): Options {
  const valueOf = (flag: string) => {
    const i = argv.indexOf(flag)
    return i >= 0 ? argv[i + 1] : undefined
  }
  const valueFlags = ['--only', '--variants', '--model']
  const flags = new Set(argv.filter((a) => a.startsWith('--')))
  // Plant names: every argument that isn't a flag or a flag's value.
  const names = argv.filter((a, i) => !a.startsWith('--') && !valueFlags.includes(argv[i - 1]))

  if (names.length === 0) {
    fail(
      `Name the plants to generate, e.g. "npm run art:generate -- basil sunflower".\n  Plant ids: ${plants.map((p) => p.id).join(', ')}`,
    )
  }

  const only = valueOf('--only')
  if (only !== undefined && only !== 'plant' && only !== 'icon') fail('--only must be "plant" or "icon".')

  const variants = Number(valueOf('--variants') ?? 1)
  if (!Number.isInteger(variants) || variants < 1 || variants > MAX_VARIANTS) {
    fail(`--variants must be a whole number from 1 to ${MAX_VARIANTS}.`)
  }

  const model = valueOf('--model') ?? MODEL

  let plantIds: string[]
  if (names.includes('all')) {
    if (!flags.has('--yes') && !flags.has('--dry-run')) {
      fail(`"all" covers ${plants.length} plants and costs money. Re-run with --yes to confirm, or --dry-run to preview.`)
    }
    plantIds = plants.map((p) => p.id)
  } else {
    const unknown = names.filter((n) => !plants.some((p) => p.id === n))
    if (unknown.length > 0) {
      fail(`Unknown plant id(s): ${unknown.join(', ')}.\n  Plant ids: ${plants.map((p) => p.id).join(', ')}`)
    }
    plantIds = [...new Set(names)]
  }

  return { plantIds, kinds: only ? [only as AssetKind] : KINDS, variants, model, dryRun: flags.has('--dry-run') }
}

function mimeTypeFor(path: string): string {
  const ext = extname(path).toLowerCase()
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.webp') return 'image/webp'
  fail(`Unsupported reference image type: ${path}`)
}

function loadReference(path: string) {
  if (!existsSync(path)) fail(`Missing reference image: ${path}\n  See art/STYLE.md for where references live.`)
  return { inlineData: { mimeType: mimeTypeFor(path), data: readFileSync(path).toString('base64') } }
}

/** Never overwrites: basil-plant.jpg, then basil-plant-2.jpg, -3, … */
function nextFreePath(dir: string, base: string, ext: string): string {
  for (let n = 1; ; n++) {
    const path = join(dir, `${base}${n === 1 ? '' : `-${n}`}${ext}`)
    if (!existsSync(path)) return path
  }
}

const EXTENSION_FOR_MIME: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
}

/** Estimated USD cost of one response from its reported token usage. */
function costOf(model: string, usage: GenerateContentResponseUsageMetadata | undefined): number | null {
  const price = PRICING[model]
  if (!price || !usage) return null
  const outputTokens = (modality: string) =>
    (usage.candidatesTokensDetails ?? [])
      .filter((d) => d.modality === modality)
      .reduce((sum, d) => sum + (d.tokenCount ?? 0), 0)
  const perToken = (perMillion: number) => perMillion / 1_000_000
  return (
    (usage.promptTokenCount ?? 0) * perToken(price.input) +
    ((usage.thoughtsTokenCount ?? 0) + outputTokens('TEXT')) * perToken(price.textOutput) +
    outputTokens('IMAGE') * perToken(price.imageOutput)
  )
}

const formatUsd = (usd: number) => `$${usd.toFixed(usd < 1 ? 3 : 2)}`

type SavedImage = { path: string; transparentPath: string; size: string; notes: string[] }

/**
 * One API request for one asset. Saves *every* image the response contains
 * (the model sometimes returns several, all billed), each with a
 * transparent PNG and a metadata sidecar.
 */
async function requestOnce(
  ai: GoogleGenAI,
  model: string,
  plantId: string,
  plantName: string,
  kind: AssetKind,
): Promise<{ images: SavedImage[]; cost: number | null }> {
  const prompt = buildPrompt(kind, plantName, plantId)
  const references = ASSETS[kind].references
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }, ...references.map(loadReference)] }],
    config: { responseModalities: ['IMAGE'], imageConfig: { ...IMAGE_CONFIG } },
  })
  const cost = costOf(model, response.usageMetadata)

  const returned = (response.candidates ?? [])
    .flatMap((c) => c.content?.parts ?? [])
    .flatMap((p) => (p.inlineData?.data ? [p.inlineData] : []))
  if (returned.length === 0) {
    const candidate = response.candidates?.[0]
    const text = (candidate?.content?.parts ?? []).map((p) => p.text).filter(Boolean).join(' ')
    throw new Error(`${candidate?.finishReason ?? 'no image returned'}${text ? `: ${text}` : ''}`)
  }

  const dir = join(CANDIDATES_DIR, plantId)
  mkdirSync(dir, { recursive: true })
  const images: SavedImage[] = []
  for (const image of returned) {
    const mimeType = image.mimeType ?? 'application/octet-stream'
    const bytes = Buffer.from(image.data!, 'base64')
    const path = nextFreePath(dir, `${plantId}-${kind}`, EXTENSION_FOR_MIME[mimeType] ?? '.bin')
    writeFileSync(path, bytes)

    // Post-processing (separate module): key out the flat background into a
    // transparent PNG next to the raw image. The raw image is kept as made.
    const transparentPath = transparentPathFor(path)
    const keyed = await makeTransparent(path, transparentPath, {
      ...DEFAULT_KEY_OPTIONS,
      key: hexToRgb(BACKGROUND.hex),
    })
    const { width, height } = await sharp(bytes).metadata()

    // Sidecar metadata, so any candidate can be traced and reproduced.
    writeFileSync(
      path.replace(/\.[^.]+$/, '.json'),
      JSON.stringify(
        {
          plantId,
          plantName,
          kind,
          model,
          imageConfig: IMAGE_CONFIG,
          background: BACKGROUND.hex,
          references,
          prompt,
          mimeType,
          width,
          height,
          transparent: transparentPath,
          backgroundRemoved: Number(keyed.removedFraction.toFixed(3)),
          imagesInResponse: returned.length,
          usage: response.usageMetadata ?? null,
          estimatedResponseCostUsd: cost === null ? null : Number(cost.toFixed(4)),
          createdAt: new Date().toISOString(),
        },
        null,
        2,
      ) + '\n',
    )

    const notes: string[] = []
    if (width !== height) notes.push(`not square (${width}×${height})`)
    if (keyed.warning) notes.push(keyed.warning)
    images.push({ path, transparentPath, size: `${width}×${height}`, notes })
  }
  return { images, cost }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const jobs = options.plantIds.flatMap((plantId) =>
    options.kinds.map((kind) => ({ plantId, plantName: plants.find((p) => p.id === plantId)!.name, kind })),
  )
  const requests = jobs.length * options.variants
  const price = PRICING[options.model]
  const estimate = price ? (requests * price.tokensPerImage * price.imageOutput) / 1_000_000 : null

  console.log(`Model: ${options.model} · ${IMAGE_CONFIG.aspectRatio} · ${IMAGE_CONFIG.imageSize}`)
  console.log(
    `${requests} request(s): ${options.plantIds.join(', ')} × ${options.kinds.join(' + ')} × ${options.variants} variant(s)`,
  )
  console.log(
    estimate === null
      ? `Estimated cost: unknown (no price for ${options.model} in plant-art-config.ts)\n`
      : `Estimated cost: ~${formatUsd(estimate)} at list price (actual usage is reported below)\n`,
  )

  if (options.dryRun) {
    for (const { plantId, plantName, kind } of jobs) {
      ASSETS[kind].references.forEach(loadReference) // still verify references exist
      console.log(`── ${plantId}-${kind} (references: ${ASSETS[kind].references.join(', ')})`)
      console.log(buildPrompt(kind, plantName, plantId) + '\n')
    }
    console.log('Dry run: no API calls made.')
    return
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) fail('GEMINI_API_KEY is not set. Put it in .env.local (see .env.example); never commit it.')
  const ai = new GoogleGenAI({ apiKey })

  let saved = 0
  let failures = 0
  let totalCost = 0
  let costKnown = true
  for (const { plantId, plantName, kind } of jobs) {
    for (let v = 1; v <= options.variants; v++) {
      process.stdout.write(`• ${plantId}-${kind}${options.variants > 1 ? ` (${v}/${options.variants})` : ''} … `)
      try {
        const { images, cost } = await requestOnce(ai, options.model, plantId, plantName, kind)
        if (cost === null) costKnown = false
        else totalCost += cost
        const extra = images.length > 1 ? ` (response contained ${images.length} images)` : ''
        console.log(`${cost === null ? '' : `${formatUsd(cost)} `}${extra}`)
        for (const image of images) {
          saved++
          console.log(
            `    ${image.transparentPath} (${image.size})${image.notes.length ? `\n    ⚠ ${image.notes.join('; ')}` : ''}`,
          )
        }
      } catch (error) {
        failures++
        console.log(`failed: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
  }

  console.log(
    `\nDone: ${saved} image(s) saved, ${failures} request(s) failed. ` +
      `Estimated cost: ${costKnown ? formatUsd(totalCost) : 'partly unknown'} (from reported token usage).`,
  )
  console.log(`Candidates are in ${CANDIDATES_DIR}/<plant-id>/.`)
  if (failures > 0) process.exitCode = 1
}

await main()
