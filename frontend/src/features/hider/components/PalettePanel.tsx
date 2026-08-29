import type { PartColors, PartId } from '../types'
import { readableTextColor } from '../utils/color'

const PART_LABELS: Record<PartId, string> = {
  head: '머리',
  body: '몸통',
  arms: '팔',
  legs: '다리',
}

const PART_IDS: PartId[] = ['head', 'body', 'arms', 'legs']

type PalettePanelProps = {
  partColors: PartColors
  selectedPart: PartId
  sampledColors: string[]
  activeColor: string | null
  eyedropperActive: boolean
  eyedropperReady: boolean
  onSelectPart: (partId: PartId) => void
  onPickColor: (color: string) => void
  onApplyToPart: () => void
  onApplyToAll: () => void
  onToggleEyedropper: () => void
}

/**
 * Eyedropper + per-part colouring.
 *
 * MVP colouring level is part-based fill (Head / Body / Arms / Legs), per
 * `frontend_agent.md` §5. There is no freehand brush.
 */
export function PalettePanel({
  partColors,
  selectedPart,
  sampledColors,
  activeColor,
  eyedropperActive,
  eyedropperReady,
  onSelectPart,
  onPickColor,
  onApplyToPart,
  onApplyToAll,
  onToggleEyedropper,
}: PalettePanelProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-300/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onToggleEyedropper}
          disabled={!eyedropperReady}
          aria-pressed={eyedropperActive}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-40 ${
            eyedropperActive
              ? 'bg-sky-500 text-white'
              : 'border border-neutral-300 text-neutral-700'
          }`}
        >
          스포이드 {eyedropperActive ? '끄기' : '켜기'}
        </button>

        <div
          className="flex h-10 min-w-24 items-center justify-center rounded-xl border border-neutral-300 px-3 text-xs font-medium"
          style={{
            backgroundColor: activeColor ?? '#ffffff',
            color: readableTextColor(activeColor ?? '#ffffff'),
          }}
        >
          {activeColor ?? '색 없음'}
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-neutral-500">뽑은 색</p>
        {sampledColors.length === 0 ? (
          <p className="text-xs text-neutral-400">
            스포이드를 켜고 배경을 탭해 색을 뽑아 보세요.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sampledColors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => onPickColor(color)}
                aria-label={`색 ${color} 선택`}
                aria-pressed={color === activeColor}
                className={`h-9 w-9 rounded-lg border-2 ${
                  color === activeColor ? 'border-sky-500' : 'border-neutral-300'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-neutral-500">색칠할 부위</p>
        <div className="grid grid-cols-4 gap-2">
          {PART_IDS.map((partId) => (
            <button
              key={partId}
              type="button"
              onClick={() => onSelectPart(partId)}
              aria-pressed={partId === selectedPart}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 py-2 text-xs font-medium ${
                partId === selectedPart
                  ? 'border-sky-500 text-sky-600'
                  : 'border-neutral-300 text-neutral-600'
              }`}
            >
              <span
                className="h-4 w-4 rounded-full border border-neutral-300"
                style={{ backgroundColor: partColors[partId] }}
              />
              {PART_LABELS[partId]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onApplyToPart}
          disabled={!activeColor}
          className="flex-1 rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          {PART_LABELS[selectedPart]}에 칠하기
        </button>
        <button
          type="button"
          onClick={onApplyToAll}
          disabled={!activeColor}
          className="flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 disabled:opacity-40"
        >
          전체에 칠하기
        </button>
      </div>
    </div>
  )
}
