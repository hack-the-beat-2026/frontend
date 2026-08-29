import type { CharacterTransform } from '../../../shared/types'
import { MAX_SCALE, MIN_SCALE } from '../utils/geometry'

type EditorToolbarProps = {
  transform: CharacterTransform
  canUndo: boolean
  onUndo: () => void
  onReset: () => void
  onBeginGesture: () => void
  onTransformChange: (transform: CharacterTransform) => void
  onPreview: () => void
}

/**
 * Undo / Reset plus slider equivalents of the pinch and twist gestures.
 *
 * The sliders are not a nicety: pinch-to-zoom is unreliable inside some mobile
 * webviews, and the game is delivered as a webview first.
 */
export function EditorToolbar({
  transform,
  canUndo,
  onUndo,
  onReset,
  onBeginGesture,
  onTransformChange,
  onPreview,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-center gap-3 text-sm text-neutral-600">
        <span className="w-10 shrink-0">크기</span>
        <input
          type="range"
          min={MIN_SCALE}
          max={MAX_SCALE}
          step={0.01}
          value={transform.scale}
          onPointerDown={onBeginGesture}
          onChange={(event) =>
            onTransformChange({ ...transform, scale: Number(event.target.value) })
          }
          className="flex-1"
        />
        <span className="w-12 shrink-0 text-right tabular-nums">
          {Math.round(transform.scale * 100)}%
        </span>
      </label>

      <label className="flex items-center gap-3 text-sm text-neutral-600">
        <span className="w-10 shrink-0">회전</span>
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          value={transform.rotation}
          onPointerDown={onBeginGesture}
          onChange={(event) =>
            onTransformChange({ ...transform, rotation: Number(event.target.value) })
          }
          className="flex-1"
        />
        <span className="w-12 shrink-0 text-right tabular-nums">
          {Math.round(transform.rotation)}°
        </span>
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 disabled:opacity-40"
        >
          되돌리기
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700"
        >
          초기화
        </button>
        <button
          type="button"
          onClick={onPreview}
          className="flex-[1.4] rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
        >
          완성 미리보기
        </button>
      </div>
    </div>
  )
}
