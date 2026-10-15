# Gardening Data and Sources

## Curation Policy

The project treats horticultural knowledge as maintained application data, not content to generate at runtime. Plant facts and relationships are added conservatively from agricultural extension material or cross-checked reputable gardening references. Disputed or weakly supported claims are left neutral rather than filled in for completeness.

Normalized facts live in `src/data/`. Optional claim-level evidence points to entries in `src/data/sources.ts`. Data tests verify unique identifiers, relationship consistency, and that evidence references resolve to registered sources.

Evidence metadata and deterministic reasoning are separate. Adding or omitting a citation does not change a rule result. Missing evidence means provenance has not yet been recorded at the claim level; it should not be read as proof that a claim is either supported or unsupported.

## Registered Claim-Level Sources

The structured source registry (`src/data/sources.ts`) currently holds 28 university/college Extension sources backing every seed plant's `spacingInches` and `sunlightRequirement`. See "Spacing" and "Sunlight" below for the full tables.

Every registered source gives real-world horticultural guidance. None states the application's `SunlightLevel` category directly; that is a project-level normalization informed by, not copied from, the source. The former abstract `minimumSpacingCells` tiers were also project normalizations; they are being replaced by physical spacing values taken from sources (see "Spacing").

## Companion and Incompatible Relationships

The relationship dataset was assembled using a conservative cross-checking policy described in `src/data/relationships.ts`. Sources previously documented in the repository include:

- [The Old Farmer's Almanac companion planting guide](https://www.almanac.com/companion-planting-guide-vegetables)
- [Farmers' Almanac companion planting guide](https://www.farmersalmanac.com/companion-planting-guide)
- university extension guidance where relevant

Pairs with material disagreement, such as Tomato/Carrot, were omitted. Incompatible relationships are held to the same standard as companion relationships.

**Outstanding provenance issue:** existing relationship records do not yet identify which specific source supports each pair. Their `sourceIds` are therefore absent rather than populated with imprecise attribution. Newly researched relationships should record claim-level sources when added.

## Spacing

### Policy (physical-coordinate model)

Same-species spacing is curated as a physical distance in inches, taken from a cited source. It is held to the same standard as `sunlightRequirement`: every curated spacing value must carry at least one registered source in `evidence.spacingGuidance`, enforced by a data test.

- **What is recorded:** the source's plant-to-plant spacing (how far apart to set or thin plants of this crop), not between-row spacing. Row spacing describes a planting layout this app does not model.
- **Range:** when a source gives a range (e.g. "24 to 36 inches"), record both ends as a minimum and maximum. When it gives a single value, minimum and maximum are equal. The current spacing rule uses only the minimum; the maximum is kept so the source statement is not lost.
- **No conversions:** values are never derived from the former 1–4 tiers, never multiplied from a cell size, and never inferred from a plant's mature spread unless a source explicitly states that as spacing guidance.
- **Precedence:** prefer university Extension or similarly authoritative sources, consistent with "Adding New Knowledge" below. Where reputable sources disagree materially, record the source actually used and note the disagreement in the table below.
- **Unresolved plants:** if no adequate source is found for a plant, leave its spacing absent rather than guessing. An absent value means spacing is not evaluated for that plant; it is not reported as "spacing OK."

### History

The former abstract `minimumSpacingCells` tiers (1–4) were assigned from approximate guidance without per-plant citations, except for Sunflower. They were replaced, not converted, by the individually researched values below.

### Provenance table

Researched 2026-10-15. Every value below was checked against the linked page's own wording, not a search summary. Values are plant-to-plant (in-row or thinning) spacing; row spacing is ignored. `src/data/plants.ts` and `src/data/sources.ts` are the machine-readable source of truth; this table is documentation for human review.

| Plant | Spacing (in) min–max | Source | Quoted guidance | Notes |
|---|---|---|---|---|
| Tomato | 24–36 | [Growing tomatoes in home gardens — UMN Extension](https://extension.umn.edu/vegetables/growing-tomatoes) *(registered)* | "Allow two to three feet in all directions between vining plants. You can set bush-type plants closer together." | Vining (indeterminate) types. Bush types: "closer," with no figure. |
| Carrot | 2–3 | [How to Grow Carrots in Your Garden — USU Extension](https://extension.usu.edu/yardandgarden/research/carrots-in-the-garden) | "Seeded carrots should be spaced 2-3 inches between plants in the row" | Same page's summary says "Thin seedling carrots to 3 inches apart." |
| Lettuce | 4–4 | [Lettuce — Illinois Extension](https://extension.illinois.edu/gardening/lettuce) *(registered)* | "Thin seedlings to 4 inches apart for leaf lettuce and 6 to 8 inches apart for Cos or Butterhead." | Leaf lettuce, matching the catalogue's existing note. Head types need more: Cos/Butterhead 6–8, Crisphead 10–12 (same page); USU gives 8–12 for head lettuce. |
| Basil | 6–12 | [Growing basil in home gardens — UMN Extension](https://extension.umn.edu/vegetables/growing-basil) | "Thin and transplant seedlings to stand 6-12 inches apart once they have developed two to three pairs of true leaves." | Other Extension pages give wider final spacing (USU: thin to a final stand of 12 in; Penn State: 12–18 in for airflow). |
| Mint | 18–18 | [Mentha x piperita — NC State Extension Plant Toolbox](https://plants.ces.ncsu.edu/plants/mentha-x-piperita/) | "If planting in the ground, space plants 18" apart." | **Peppermint-specific.** No Extension page found gives a plant-to-plant figure for mint generally (USU's registered mint page gives only row spacing; Illinois and Penn State recommend containment instead). The catalogue entry is the generic "Mint". |
| Rosemary | 24–24 | [Herb Garden Plants: Rosemary — Penn State Extension](https://extension.psu.edu/herb-garden-plants-rosemary) | "transplant out in full sun (two feet apart)" | Disagreement: UF/IFAS Santa Rosa County gives 36–48 in for a 4–5 ft spread. Penn State is used as the more general temperate-garden statement. |
| Marigold | 8–10 | [How to Grow and Care for Marigolds in South Carolina — Clemson HGIC](https://hgic.clemson.edu/factsheet/how-to-grow-and-care-for-marigolds-in-south-carolina/) | "French Marigold Spacing – 8 to 10 inches apart." | French marigold, matching the catalogue's existing note. African: 12–16 in (same page). UMN gives no French figure ("can be spaced fairly close together"). |
| Sunflower | 18–24 | [Sunflowers — UMN Extension](https://extension.umn.edu/flowers/sunflowers) *(registered)* | "They require a good deal of room, so space them 18 to 24 inches apart." | Branching cultivars, matching the catalogue's existing note. Same page: 2–5 ft varieties ~6 in; taller ≥12 in; giants 24 in. |
| Onion | 3–4 | [Growing onions in home gardens — UMN Extension](https://extension.umn.edu/vegetables/growing-onions) *(registered)* | "After seedlings emerge, thin to 3 to 4 inches apart." | Transplants also "3 to 4 inches apart." |
| Bush Bean | 2–3 | [How to Grow Beans in Your Garden — USU Extension](https://extension.usu.edu/yardandgarden/research/beans-in-the-garden) *(registered)* | "Plant seeds 1 inch deep, spaced 2-3 inches apart, in rows 18-24 inches wide." | Applies to beans generally; no separate bush-bean figure. |
| Pea | 1–2 | [How to Grow Peas in Your Garden — USU Extension](https://extension.usu.edu/yardandgarden/research/peas-in-the-garden) | "Plant seeds ½-1 inch deep, spaced 1-2 inches apart, in rows 12-24 inches apart." | **Disagreement:** the registered UMN pea page says "Place the seeds in a shallow trench, six to seven inches apart," but the same page gives "about two inches apart in all directions" for wide rows. USU's 1–2 in is used, consistent with UMN's wide-row figure. |
| Bell Pepper | 18–18 | [How to Grow Peppers in Your Garden — USU Extension](https://extension.usu.edu/yardandgarden/research/peppers-in-the-garden) | "Transplants should be planted 18 inches apart in row, with rows 18-24 inches apart." | |
| Cucumber | 24–24 | [How to Grow Cucumber in Your Garden — USU Extension](https://extension.usu.edu/yardandgarden/research/cucumber-in-the-garden) | "Transplants should be planted 2 feet apart in row, with rows 4 feet apart." | **Interpretation:** the same page seeds "4-6 seeds every 12-18 inches" then thins "to 2 plants per location", so 12–18 in is a spacing between groups of two plants, not single plants. The single-plant transplant figure is used. |
| Cabbage | 12–18 | [How to Grow Cabbage in Your Garden — USU Extension](https://extension.usu.edu/yardandgarden/research/cabbage-in-the-garden) *(registered)* | "Seeded or transplanted cabbage should be spaced 12-18 inches between plants in the row" | |
| Potato | 10–12 | [Growing potatoes in home gardens — UMN Extension](https://extension.umn.edu/vegetables/growing-potatoes) *(registered)* | "Plant tuber pieces cut side down, 10 to 12 inches apart" | |
| Dill | 10–12 | [Growing dill in home gardens — UMN Extension](https://extension.umn.edu/vegetables/growing-dill) | "When seedlings are two inches high, thin them to stand 10-12 inches apart." | USU's dill guide gives 9 in. |

*(registered)* means the source was already registered for another claim before the spacing research. All sources in the table are now in `src/data/sources.ts` and attached to `evidence.spacingGuidance`.

**Effect under 12-inch snapping:** with placements snapped to 12-inch cell centers, same-species placements can only be 12, ~17, 24, ~26.8 … inches apart. A warning therefore appears only when the sourced minimum exceeds one of those distances:

- Tomato, Rosemary and Cucumber (24): orthogonal and diagonal neighbors.
- Mint, Sunflower and Bell Pepper (18): orthogonal and diagonal neighbors.
- Cabbage (12): no warning, because 12 is not less than 12.
- Every other plant: never.

Today's tiers warn more often, for example Tomato at up to three cells away.

## Lifecycle and Ecological Roles

Lifecycle and the current roles—pollinator support and nitrogen fixation—are curated intrinsic plant facts. Roles represent supported capability, not proof that the function is active at a particular moment. For example, pollinator support may depend on flowering, and nitrogen fixation depends on appropriate biological conditions.

**Outstanding provenance issue:** lifecycle and ecological-role assignments currently have no claim-level sources in the registry. They are regression-tested as curated values, but test coverage is not a substitute for published evidence. Source attribution remains data-quality work.

## Sunlight

### Garden cell sunlight (user-declared)

Current sunlight data supplied by the user for their own garden cells represents the user's category — full sun, partial sun, shade, or unmodeled — not a researched plant claim, measured irradiance, or simulated sun exposure. It therefore does not require a horticultural citation.

### Plant sunlight requirement (curated, Part 3B)

Each plant curates the sunlight categories it's commonly grown in (`Plant.sunlightRequirement`), evaluated by `domain/sunlightFit.ts`, which distinguishes a known mismatch from an unmodeled cell or an unmodeled plant requirement — insufficient information is never reported as a mismatch. Unlike lifecycle/ecological-role/spacing data, every plant's `sunlightRequirement` here is backed by at least one registered source in `evidence.sunlightRequirement` (enforced by a data test in `src/data/plants.test.ts`).

### V1 normalization policy

A real-world sunlight statement is translated into the app's three-category `SunlightLevel` set as follows:

- **full-sun** — approximately 6+ hours of direct sunlight.
- **partial-sun** — approximately 4–6 hours of direct sunlight, or a level a source explicitly names as suitable ("partial sun," "partial shade," etc.) regardless of hour count.
- **shade** — less than approximately 4 hours of direct sunlight.

A source's explicit category wording always takes precedence over inferring a category from an hour range. A plant is never marked as accepting `partial-sun` merely because it might survive there without a source affirmatively saying so — tolerance is not the same as a stated accepted growing condition.

### Provenance table

This table is documentation for human review. `src/data/sources.ts` and each plant's `Plant.evidence.sunlightRequirement` in `src/data/plants.ts` remain the machine-readable source of truth; if this table and the code ever disagree, the code is authoritative and this table is stale.

Where a cited source doesn't fully or specifically support the normalized set (a generic statement rather than a plant-specific one, or support for only part of a multi-level set), that's called out in the Notes column rather than left implied.

| Plant | `sunlightRequirement` | Source(s) | Notes |
|---|---|---|---|
| Tomato | `full-sun` | [Growing tomatoes in home gardens — UMN Extension](https://extension.umn.edu/vegetables/growing-tomatoes) | Explicit: "tomatoes are heat-loving plants that require a long, frost-free season and full sun." |
| Carrot | `full-sun`, `partial-sun` | [Use the whole garden and grow a salad in the shade — Illinois Extension](https://extension.illinois.edu/blogs/flowers-fruits-and-frass/2022-06-24-use-whole-garden-and-grow-salad-shade) | `partial-sun` is explicit and carrot-specific: "Carrots tolerate being grown in partially shaded places if you get at least four hours of sunlight." `full-sun` is not separately stated by this source — a carrot growing outside a partial-shade spot is assumed to get more light by default, but that's an inference from context, not a quoted claim. |
| Lettuce | `full-sun`, `partial-sun` | [Use the whole garden and grow a salad in the shade — Illinois Extension](https://extension.illinois.edu/blogs/flowers-fruits-and-frass/2022-06-24-use-whole-garden-and-grow-salad-shade); [Lettuce — Illinois Extension](https://extension.illinois.edu/gardening/lettuce) | The shade article explicitly supports `partial-sun`: "head lettuce grow well with about 4 hours of full sun." The Lettuce growing-guide page supports general full-sun cultivation but only mentions shade as a heat-avoidance strategy for loose-leaf varieties, not as a stated primary requirement. |
| Basil | `full-sun` | [Growing herbs in home gardens — UMN Extension](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-herbs); [Basil, A Summer Favorite — Penn State Extension](https://extension.psu.edu/basil-a-summer-favorite); [Basil — Illinois Extension](https://extension.illinois.edu/herbs/basil) | Strongly supported: two basil-specific sources agree explicitly — Penn State: "Choose a site with full sun, meaning at least six to eight hours per day"; Illinois: "Basil prefers a sunny location." The UMN source is general herb guidance, not basil-specific: "Most herbs need at least six hours of direct sunlight daily; full sun produces the best growth." |
| Mint | `full-sun`, `partial-sun` | [How to Grow Mint in Your Garden — Utah State University Extension](https://extension.usu.edu/yardandgarden/research/mint-in-the-garden) | Explicit: "Mint grows best in full sun to partial shade." |
| Rosemary | `full-sun` | [Rosemary — Illinois Extension](https://extension.illinois.edu/herbs/rosemary) | Explicit: "rosemary prefers a full sun location." |
| Marigold | `full-sun` | [Marigolds — UMN Extension](https://extension.umn.edu/gardening-minnesota/marigolds) | Source: these plants "thrive in full sun locations." |
| Sunflower | `full-sun` | [Plant Sunflowers in Mid-May for Summer Beauty and Pollinator Power — Illinois Extension](https://extension.illinois.edu/news-releases/plant-sunflowers-mid-may-summer-beauty-and-pollinator-power) | Explicit: sunflowers "thrive in full sun." |
| Onion | `full-sun` | [Growing onions in home gardens — UMN Extension](https://extension.umn.edu/vegetables/growing-onions) | Explicit: "All onions require full sun for the best growth." |
| Bush Bean | `full-sun` | [How to Grow Beans in Your Garden — Utah State University Extension](https://extension.usu.edu/yardandgarden/research/beans-in-the-garden) | Explicit: "Beans flourish in full sun." |
| Pea | `full-sun` | [Growing peas in home gardens — UMN Extension](https://extension.umn.edu/vegetables/growing-peas) | Explicit: "the plants do need full sun." |
| Bell Pepper | `full-sun` | [Raised bed gardens — UMN Extension](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/raised-bed-gardens) | Explicit, names peppers directly: "For plants like tomatoes, peppers, and eggplants that require full sun, locate your raised bed in an area that receives at least 6 to 8 hours of sunlight each day." |
| Cucumber | `full-sun` | [Get Started — Illinois Extension](https://extension.illinois.edu/gardening/get-started) | "Most fruiting vegetables need at least 6 to 8 hours of sunlight" — cucumber is unambiguously a fruiting vegetable, well supported by this general statement. |
| Cabbage | `full-sun` | [How to Grow Cabbage in Your Garden — Utah State University Extension](https://extension.usu.edu/yardandgarden/research/cabbage-in-the-garden) | Explicit: "Cabbage is a cool season vegetable that prefers sunny locations and fertile, well-drained soil." A separate Illinois Extension article ("Use the whole garden and grow a salad in the shade") lists cabbage among crops tolerating 4-6 hours of sun (partial-sun territory); that tolerance claim was not adopted into the curated set here, since USU's explicit full-sun preference for the crop is the more direct statement of its normal growing requirement, and a documented tolerance for less light is a different claim than an accepted growing condition. |
| Potato | `full-sun` | [Growing potatoes in home gardens — UMN Extension](https://extension.umn.edu/vegetables/growing-potatoes) | Source states "Potatoes need sunny locations to grow well" — general, not hour-quantified, but consistent with `full-sun`. |
| Dill | `full-sun` | [Dill — Illinois Extension](https://extension.illinois.edu/herbs/dill) | Explicit: "Dill performs best in a full sun location." |

**Title discrepancies from the original citation list:** two sources were requested by a title that no longer matches any live page. "University of Minnesota Extension, 'Growing basil in home gardens'" — no such page currently exists; the real, current UMN basil-adjacent page is "Growing herbs in home gardens" (general herb guidance, used above). "Illinois Extension, 'Plan your vegetable garden early'" — no such exact title currently exists; the real, current page carrying that content (the "most fruiting vegetables need 6 to 8 hours" / "leafy vegetables ... need less sunlight" statement) is titled "Get Started," likely a renamed/consolidated successor to an older Illinois Extension vegetable-garden-guide page. Both are registered under their real, current titles above.

**Outstanding provenance issue:** none for `sunlightRequirement` at the source-registration level — every seed plant now carries at least one registered source, and every entry has at least one plant-specific citation except Cucumber and Carrot's `full-sun` half (see their Notes above). Potato's source is general rather than hour-quantified but is still plant-specific and explicit about the category.

## Adding New Knowledge

For a new curated claim:

1. Prefer a university extension, government, or similarly authoritative horticultural source.
2. Record the exact page in `src/data/sources.ts`.
3. Attach its source ID to the specific plant fact or relationship it supports.
4. Keep normalized application values distinct from the real-world statements that informed them.
5. Add or update data-invariant tests where the new fact affects a closed taxonomy or relationship rule.
