import type { CharacterTransform } from '../../../shared/types'
import type { EditorSnapshot, PaintStroke } from '../types'
import { clampTransform } from '../utils/geometry'

/**
 * Editor state with undo history.
 *
 * Everything here is feature-local: `frontend_agent.md` §8 keeps editor UI state
 * out of any global store, so no Zustand is involved.
 *
 * Gestures push history ONCE, on `BEGIN_GESTURE` (pointer down), and then stream
 * `SET_TRANSFORM` without pushing. Undo therefore steps back a whole drag rather
 * than one animation frame.
 */

export type EditorState = {
  present: EditorSnapshot
  past: EditorSnapshot[]
}

export type EditorAction =
  | { type: 'SET_TEMPLATE'; templateId: string }
  | { type: 'BEGIN_PAINT_STROKE'; stroke: PaintStroke }
  | { type: 'UPDATE_PAINT_STROKE'; points: PaintStroke['points'] }
  | { type: 'BEGIN_GESTURE' }
  | { type: 'SET_TRANSFORM'; transform: CharacterTransform }
  | { type: 'UNDO' }
  | { type: 'RESET' }

const HISTORY_LIMIT = 30

export const INITIAL_TRANSFORM: CharacterTransform = {
  positionX: 0.5,
  positionY: 0.5,
  scale: 0.4,
  rotation: 0,
}

export function createInitialEditorState(templateId: string): EditorState {
  return {
    present: {
      templateId,
      paintStrokes: [],
      transform: INITIAL_TRANSFORM,
    },
    past: [],
  }
}

function push(state: EditorState, present: EditorSnapshot): EditorState {
  return {
    present,
    past: [...state.past, state.present].slice(-HISTORY_LIMIT),
  }
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case 'SET_TEMPLATE': {
      if (action.templateId === state.present.templateId) {
        return state
      }

      // Paint is tied to the selected silhouette, so changing pose starts with
      // a clean canvas instead of leaving strokes at unrelated coordinates.
      return push(state, {
        ...state.present,
        templateId: action.templateId,
        paintStrokes: [],
      })
    }

    case 'BEGIN_PAINT_STROKE': {
      return push(state, {
        ...state.present,
        paintStrokes: [...state.present.paintStrokes, action.stroke],
      })
    }

    case 'UPDATE_PAINT_STROKE': {
      const lastStrokeIndex = state.present.paintStrokes.length - 1

      if (lastStrokeIndex < 0) {
        return state
      }

      const paintStrokes = [...state.present.paintStrokes]
      paintStrokes[lastStrokeIndex] = {
        ...paintStrokes[lastStrokeIndex],
        points: action.points,
      }

      return { ...state, present: { ...state.present, paintStrokes } }
    }

    case 'BEGIN_GESTURE':
      return push(state, state.present)

    case 'SET_TRANSFORM':
      return {
        ...state,
        present: {
          ...state.present,
          transform: clampTransform(action.transform),
        },
      }

    case 'UNDO': {
      const previous = state.past.at(-1)

      if (!previous) {
        return state
      }

      return { present: previous, past: state.past.slice(0, -1) }
    }

    case 'RESET':
      return createInitialEditorState(state.present.templateId)

    default:
      return state
  }
}
