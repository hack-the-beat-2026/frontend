import type { PartId } from '../../types'

/**
 * A single body part of a silhouette template.
 *
 * Parts with `strokeWidth` are drawn as rounded strokes (limbs); parts without
 * it are filled (head, torso). Keeping both forms lets the templates stay short
 * and readable while still exporting cleanly to a transparent PNG.
 */
export type TemplatePart = {
  d: string
  strokeWidth?: number
}

export type CharacterTemplate = {
  /** Sent to the backend as `templateType` (contractRules.md §17). */
  id: string
  label: string
  width: number
  height: number
  parts: Record<PartId, TemplatePart>
}
