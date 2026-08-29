import type { CharacterTransform } from '../../shared/types'

/**
 * Feature-local UI types for the hider editor.
 *
 * contractRules.md §2 explicitly allows a local UI state machine as long as it
 * is kept distinct from the backend `GameStatus`. None of the names below
 * overlap with a backend enum, and no backend domain type is redeclared here —
 * those are imported from `shared/types` (Rule 5/6).
 */

/** Local screen machine inside the design page. Never a `GameStatus`. */
export type EditorUiState = 'CAMERA' | 'SELECT_TEMPLATE' | 'EDITING' | 'PREVIEW'

/** Internal silhouette paths used only to build the clipping mask. */
export type PartId = 'head' | 'body' | 'arms' | 'legs'

export type PaintPoint = {
  x: number
  y: number
}

/** A freehand brush stroke in the template's local coordinate space. */
export type PaintStroke = {
  color: string
  width: number
  points: PaintPoint[]
}

/** A single undoable state of the editor. */
export type EditorSnapshot = {
  templateId: string
  paintStrokes: PaintStroke[]
  transform: CharacterTransform
}

/** The captured background photo plus everything derived from it. */
export type CapturedPhoto = {
  blob: Blob
  objectUrl: string
  width: number
  height: number
}

/** The three files required by contractRules.md §15. */
export type CharacterExportBundle = {
  original: Blob
  character: Blob
  preview: Blob
}

export type SubmitPhase = 'IDLE' | 'EXPORTING' | 'UPLOADING' | 'SUBMITTING' | 'DONE'
