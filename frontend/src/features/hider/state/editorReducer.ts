import type { CharacterTransform } from '../../../shared/types'
import type { EditorSnapshot, PartColors, PartId } from '../types'
import { clampTransform } from '../utils/geometry'
import { createDefaultPartColors } from '../utils/svgTemplate'

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
  | { type: 'SET_PART_COLOR'; partId: PartId; color: string }
  | { type: 'SET_ALL_PART_COLORS'; color: string }
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
      partColors: createDefaultPartColors(),
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

      // Pose changes keep the colours the hider already picked.
      return push(state, { ...state.present, templateId: action.templateId })
    }

    case 'SET_PART_COLOR': {
      if (state.present.partColors[action.partId] === action.color) {
        return state
      }

      const partColors: PartColors = {
        ...state.present.partColors,
        [action.partId]: action.color,
      }

      return push(state, { ...state.present, partColors })
    }

    case 'SET_ALL_PART_COLORS': {
      const partColors: PartColors = {
        head: action.color,
        body: action.color,
        arms: action.color,
        legs: action.color,
      }

      return push(state, { ...state.present, partColors })
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
