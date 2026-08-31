# Gardening Data and Sources

## Curation Policy

The project treats horticultural knowledge as maintained application data, not content to generate at runtime. Plant facts and relationships are added conservatively from agricultural extension material or cross-checked reputable gardening references. Disputed or weakly supported claims are left neutral rather than filled in for completeness.

Normalized facts live in `src/data/`. Optional claim-level evidence points to entries in `src/data/sources.ts`. Data tests verify unique identifiers, relationship consistency, and that evidence references resolve to registered sources.

Evidence metadata and deterministic reasoning are separate. Adding or omitting a citation does not change a rule result. Missing evidence means provenance has not yet been recorded at the claim level; it should not be read as proof that a claim is either supported or unsupported.

## Registered Claim-Level Source

The current structured source registry contains one source:

- [Sunflowers — University of Minnesota Extension](https://extension.umn.edu/flowers/sunflowers)
  - Attached to the spacing guidance that informed Sunflower's normalized spacing tier.

The source gives real-world horticultural guidance. It does not state the application's abstract `minimumSpacingCells` value; that value is a project-level normalization.

## Companion and Incompatible Relationships

The relationship dataset was assembled using a conservative cross-checking policy described in `src/data/relationships.ts`. Sources previously documented in the repository include:

- [The Old Farmer's Almanac companion planting guide](https://www.almanac.com/companion-planting-guide-vegetables)
- [Farmers' Almanac companion planting guide](https://www.farmersalmanac.com/companion-planting-guide)
- university extension guidance where relevant

Pairs with material disagreement, such as Tomato/Carrot, were omitted. Incompatible relationships are held to the same standard as companion relationships.

**Outstanding provenance issue:** existing relationship records do not yet identify which specific source supports each pair. Their `sourceIds` are therefore absent rather than populated with imprecise attribution. Newly researched relationships should record claim-level sources when added.

## Spacing

Plant comments document approximate real-world spacing guidance used to assign relative tiers from 1 through 4. The dataset notes the following source pool:

- University of Minnesota Extension where available
- The Old Farmer's Almanac plant guides
- Farmers' Almanac
- Gardening Know How spacing material
- Blooming Expert spacing material

The domain rule applies a plant's tier only to another placement of the same plant and uses Chebyshev distance. The grid has no physical scale, so the tiers must not be presented as an inches-to-cells conversion.

**Outstanding provenance issue:** except for Sunflower, individual spacing assignments do not yet carry precise source records. Several source-pool references also lack exact page URLs in the existing project notes. Those claims should be researched and attributed individually before the dataset is presented as fully sourced.

## Lifecycle and Ecological Roles

Lifecycle and the current roles—pollinator support and nitrogen fixation—are curated intrinsic plant facts. Roles represent supported capability, not proof that the function is active at a particular moment. For example, pollinator support may depend on flowering, and nitrogen fixation depends on appropriate biological conditions.

**Outstanding provenance issue:** lifecycle and ecological-role assignments currently have no claim-level sources in the registry. They are regression-tested as curated values, but test coverage is not a substitute for published evidence. Source attribution remains data-quality work.

## Sunlight

Current sunlight data is supplied by the user for their own garden cells. It represents the user's category—full sun, partial sun, shade, or unmodeled—not a researched plant claim, measured irradiance, or simulated sun exposure. It therefore does not require a horticultural citation.

Plant sunlight requirements and fit evaluation are not implemented. When added, those requirements should be sourced per plant and should distinguish unknown conditions from known incompatibility.

## Adding New Knowledge

For a new curated claim:

1. Prefer a university extension, government, or similarly authoritative horticultural source.
2. Record the exact page in `src/data/sources.ts`.
3. Attach its source ID to the specific plant fact or relationship it supports.
4. Keep normalized application values distinct from the real-world statements that informed them.
5. Add or update data-invariant tests where the new fact affects a closed taxonomy or relationship rule.
