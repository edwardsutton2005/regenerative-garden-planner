# Plant Art Style

This document locks the visual direction for plant art in the Regenerative Garden Planner. The generation pipeline (`scripts/generate-plant-assets.ts`) encodes it in `scripts/plant-art-config.ts`; when this document and the config disagree, update both together.

Art is presentation only. It never carries horticultural meaning: an asset's size on screen is not a plant's spread, and a sprite's shape is not a growth claim (see PRODUCT.md "Visual Direction").

## Source of Truth: the Tomato References

| File | Defines |
|---|---|
| `references/tomato-plant-reference.png` | **Plant sprites**: top-down mature plant on the canvas |
| `references/tomato-icon-reference.png` | **Icons**: inventory and catalog tiles |

Both are sent to the model as **image inputs**, not described in words. New assets must match them in pixel scale, saturation, lighting, outline darkness, and edge treatment. Once a few assets are approved, they can be added as extra references in `plant-art-config.ts` (`ASSETS.<kind>.references`) to strengthen consistency.

## Shared Look

- chunky, cozy garden-game aesthetic
- pixel-art-inspired but relatively high resolution: visible blocky pixel clusters, not true low-res pixel art
- simplified botanical forms with a strong, recognizable silhouette
- saturated natural colors; crisp, blocky edges; selective highlights
- minimal micro-detail; must read at small sizes
- inspired by cozy garden games, without copying any game's specific art

## Plant Sprites vs. Icons

| | Plant sprite (`-plant`) | Icon (`-icon`) |
|---|---|---|
| Purpose | the plant on the garden canvas | inventory bar and catalog tiles |
| Subject | the whole mature plant | the plant's most recognizable part: crop, leaf bunch, or flower |
| View | straight down, overhead, consistent across all plants | front-on, like the Tomato icon |
| Framing | whole plant centered, even margins | single subject centered, filling most of the square |
| Primary reference | Tomato plant reference | Tomato icon reference |

## Never Include

soil, dirt, ground tiles, grass, terrain; pots or containers; environment or scenery; text, letters, labels, watermarks; borders, frames, UI; checkerboard "transparency" patterns; background shadows.

## Output Expectations

- **Format:** square (1:1), generated at 2K (2048 × 2048) so it can be downscaled cleanly.
- **Background:** Gemini cannot return transparency, and asking for "transparent" tends to produce a painted checkerboard. So the model is asked for a **flat solid magenta (`#FF00FF`) key color**, and a separate post-processing step (`scripts/remove-background.ts`) turns it into real transparency.
- **Two files per candidate:** the raw image exactly as Gemini returned it (currently JPEG with magenta), and a `-transparent.png` with an alpha channel. The transparent PNG is what gets approved and used.
- **Composition:** the subject is centered with even margins.

### How Transparency Is Made

`scripts/remove-background.ts`, which runs automatically after generation and can be re-run on its own:

1. Flood-fill from the image border through near-magenta pixels. Only background connected to the edge is removed, so subject colors are never cut.
2. Remove enclosed pockets of near-pure magenta (gaps between leaves), with a tighter tolerance so pinkish subject colors survive.
3. Remove light, magenta-tinted smears connected to the background (half-rendered blurs the model sometimes leaves at an edge). Enclosed colors and reds are untouched; set `tintMargin: null` for red-purple subjects.
4. Remove the magenta-tinted fringe JPEG leaves along edges.
5. Defringe: an edge pixel noticeably more magenta-tinted than the pixel just inside it takes that inner color, so outlines don't carry a purple line.

Tolerances live in `DEFAULT_KEY_OPTIONS`. Edges are hard (fully opaque or fully transparent), which suits pixel art. **Magenta is a poor key for magenta or hot-pink plants**; choose a different key color in `plant-art-config.ts` before generating those.

## Naming and Folders

```
art/
  STYLE.md                         this document
  references/                      locked style references (do not edit casually)
  candidates/<plant-id>/           raw generations awaiting review
    <plant-id>-plant.jpg           raw first candidate (as returned); then -plant-2, -plant-3, …
    <plant-id>-plant-transparent.png   the same image with the background removed
    <plant-id>-plant.json          metadata: model, prompt, references, size, background share, date
    <plant-id>-icon.jpg / -icon-transparent.png / -icon.json
  approved/
    plants/<plant-id>.png          chosen plant sprite
    icons/<plant-id>.png           chosen icon
```

- `<plant-id>` is the id from `src/data/plants.ts` (for example `bush-bean`). There is no separate art catalog.
- Generation never overwrites a candidate: a re-run adds the next numbered version.
- Each candidate has a `.json` sidecar recording exactly how it was made, including the token usage the API reported and an estimated cost.
- If one request returns several images (the model sometimes does, and all are billed), every one is saved as its own numbered candidate.
- Each run prints an estimated cost before starting and the estimated total from reported usage at the end. Prices live in `PRICING` in `plant-art-config.ts`.
- Approval is manual: review the candidates (check the transparent PNG on both light and dark backgrounds), then copy the chosen `-transparent.png` into `approved/plants/` or `approved/icons/` named `<plant-id>.png`.
- `approved/manifest.json` records which candidate (or reference) each approved file came from, plus anything still pending. `art/approved-overview.png` shows the whole approved set side by side.
- Tomato's approved assets are the two references themselves (1254 × 1254 rather than 2048), since they define the style.

## Consistency Rules

1. Change the look in one place: `scripts/plant-art-config.ts` (shared style, exclusions, per-kind rules, background, model). Prompts are built deterministically from it; generation logic doesn't contain art direction.
2. Per-plant `SUBJECT_HINTS` describe *appearance only*. No horticultural claims.
3. Judge every candidate against the references at both full size and small size (about 48 px for icons, canvas size for sprites).
4. Reject candidates with soil, pots, text, borders, checkerboards, a perspective change, or a different pixel scale; regenerate instead of hand-patching.
5. Generate a small batch, review, approve, and only then expand to more plants.

## Running the Pipeline

```
npm run art:generate -- basil sunflower              # both assets for each plant
npm run art:generate -- basil --only icon            # one kind
npm run art:generate -- basil --variants 3          # 3 options per asset (pick the best); max 4
npm run art:generate -- basil --model gemini-nano-banana-2.1   # cheaper drafts
npm run art:generate -- basil sunflower --dry-run    # print prompts and estimated cost, no API calls
npm run art:generate -- all --yes                    # every plant (costs money)
npm run art:transparent -- basil sunflower           # (re)make transparent PNGs for existing candidates
npm run art:transparent -- basil --force             # rebuild after tuning the key options
```

Requires `GEMINI_API_KEY` in `.env.local` (git-ignored; see `.env.example`).

## In the App

`npm run art:build` turns `approved/` into small app files in `public/art/`. Re-run it after approving new art; it rebuilds from scratch.

- **Plant sprites and icons:** trimmed, centered, 128 px PNG. The canvas shows sprites at a fixed 44 px; the inventory and catalog show icons.
- **Textures** (`scripts/textures.ts`) are generated in code, not by Gemini. Image models are unreliable at seamless tiles, and these assets are tiny. They are 24 px tiles (one tile = 12 inches): soil, bed soil, and grass. Two octaves of seeded, periodic noise are quantized into a 5-color palette, plus wrapped speckles or grass blades. Change palettes or seeds there, then rebuild.
- **Bed frame** is built from `approved/bed/plank.png` and `corner.png`, cut from a ChatGPT sheet (`candidates/bed/bed-framework.png`) because Gemini credits ran out. The plank section avoids the knot and end moss. Its last 60 px are cross-faded into its start so it repeats seamlessly. It is downscaled to a 24 px board, the art's own pixel grid (about 5.6 source px per art pixel), and assembled as a 9-slice: a plank on each side, outer edge outward, and a post in each corner. The CSS `border-image` slice (24) must match `BED_BOARD` in `scripts/build-art.ts`.
- Plants without approved art fall back to a category-colored disc.

## Open Issues

- **Output format:** Gemini currently returns JPEG, so pixel edges are slightly soft and carry faint color noise at full size. It is not visible once downscaled to app sizes; a later step could snap images to their pixel grid if needed.
- **Unfinished icon bottoms:** icons repeatedly come back with the bottom edge half-rendered (blurred, pink-tinted). Plant sprites have not shown this. Step 3 above cleans small cases; large ones (where the subject itself is blurred) must be regenerated. Suspected cause: the mostly transparent icon reference; a version of it on flat magenta is worth trying.
- **No seeds:** prompts are deterministic, but the model's output is not; expect variation between runs.

## Character: the Gardener

A decorative character who walks the garden (see PRODUCT.md). Same shared look as the plants, but drawn as a **three-quarter top-down game character** (the camera above and in front, like cozy farming games), not straight overhead: a person seen from directly above reads as a hat. Like all art, it carries no horticultural meaning and is not drawn to scale with the plants.

**Design:** a friendly, approachable gardener with a wide-brimmed straw hat, a green apron or overalls over a simple shirt, gloves, and boots. Clear silhouette, chunky proportions (head about a third of the height), no fine detail. Avoid magenta, pink, and purple anywhere on the character, since magenta is the background key.

**Sheet layout:** one image, **1024 × 1536**, a grid of **4 columns × 6 rows** of 256 × 256 frames. No grid lines, borders, labels, or shadows on the ground.

| Row | Animation | Frames |
|---|---|---|
| 1 | Walk toward the viewer (down) | 4-frame walk cycle |
| 2 | Walk away from the viewer (up) | 4-frame walk cycle |
| 3 | Walk facing left (right is mirrored in code) | 4-frame walk cycle |
| 4 | Idle, facing the viewer | 4 frames: subtle breathing, one blink |
| 5 | Kneel to inspect a plant, facing the viewer | 4 frames: crouch, kneel, look closely, stand |
| 6 | Reactions, facing the viewer | 2 frames happy hop, 2 frames puzzled head-scratch |

**Frame rules:** the same character at the same size in every frame; horizontally centered in its cell; feet on the same baseline, about 20 px above each cell's bottom; nothing crosses into a neighboring cell. Background: flat solid magenta `#FF00FF`, so `scripts/remove-background.ts` can make it transparent.

**Files:** raw sheets go in `art/candidates/gardener/` (for example `gardener-sheet.png`, `-2`, …). The approved sheet is `art/approved/characters/gardener-source.png` (the first ChatGPT sheet, approved 2026-10-17), and `npm run art:build` turns it into `public/art/characters/gardener.png`.

**In practice ChatGPT ignored the magenta background** and painted a dark gradient with a glow. The build handles that: `scripts/sprite-sheet.ts` removes a gradually shaded background by stopping at the figures' dark outlines, so a sheet works as long as every figure has a closed dark outline. It also re-packs the figures into an even grid, since generated sheets drift from their own grid; the 24 figures only need to be separate and in the stated row order. If one sheet can't stay consistent, generate one row per image instead (1024 × 256, the same row order, named `gardener-walk-down.png` and so on).

**Prompt to use** (attach `references/tomato-plant-reference.png` and `references/tomato-icon-reference.png` as style references):

> A pixel-art-inspired sprite sheet of a friendly gardener character for a cozy top-down garden game, matching the attached reference images in pixel scale, saturation, lighting, outline darkness, and crisp blocky edges. Three-quarter top-down view. The gardener wears a wide-brimmed straw hat, a green apron over a simple shirt, gloves, and boots; chunky proportions, head about a third of the body height, strong readable silhouette, minimal micro-detail. Layout: 1024 × 1536 image, an invisible grid of 4 columns × 6 rows of 256 × 256 cells, one pose per cell, character centered in each cell with feet on the same baseline, same size in every cell, nothing crossing cell edges. Row 1: 4-frame walk cycle facing the viewer. Row 2: 4-frame walk cycle facing away. Row 3: 4-frame walk cycle facing left. Row 4: 4 idle frames facing the viewer (subtle breathing, one blink). Row 5: 4 frames kneeling to inspect a plant (crouch, kneel, look closely, stand). Row 6: 2 frames of a happy hop, then 2 frames of a puzzled head-scratch. Flat solid magenta (#FF00FF) background everywhere. No grid lines, borders, text, labels, ground, shadows, or scenery. No pink or purple on the character.
