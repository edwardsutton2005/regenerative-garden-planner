export type SourceId = string

/**
 * A structured, addressable reference for a curated horticultural claim.
 * Registered only when actually attached to a specific claim (see
 * data/sources.ts) — evidence metadata, never consumed by deterministic
 * reasoning. See ARCHITECTURE.md "Knowledge Provenance Is Separate From
 * Reasoning."
 */
export type KnowledgeSource = {
  id: SourceId
  title: string
  publisher: string
  url: string
}
