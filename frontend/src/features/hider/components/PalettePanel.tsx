import { readableTextColor } from '../utils/color'

type PalettePanelProps = {
  sampledColors: string[]
  activeColor: string | null
  eyedropperActive: boolean
  eyedropperReady: boolean
  paintMode: boolean
  brushWidth: number
  onPickColor: (color: string) => void
  onToggleEyedropper: () => void
  onTogglePaintMode: () => void
  onBrushWidthChange: (width: number) => void
}

/** Picks a photo colour, then paints it freely over the character. */
export function PalettePanel({
  sampledColors,
  activeColor,
  eyedropperActive,
  eyedropperReady,
  paintMode,
  brushWidth,
  onPickColor,
  onToggleEyedropper,
  onTogglePaintMode,
  onBrushWidthChange,
}: PalettePanelProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-300/60 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
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

          <button
            type="button"
            onClick={onTogglePaintMode}
            disabled={!activeColor}
            aria-pressed={paintMode}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-40 ${
              paintMode ? 'bg-emerald-500 text-white' : 'border border-neutral-300 text-neutral-700'
            }`}
          >
            {paintMode ? '색칠 중' : '색칠 모드'}
          </button>
        </div>

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

      <label className="flex items-center gap-3 text-sm text-neutral-600">
        <span className="shrink-0">붓 크기</span>
        <input
          type="range"
          min="8"
          max="64"
          step="2"
          value={brushWidth}
          onChange={(event) => onBrushWidthChange(Number(event.target.value))}
          className="flex-1"
        />
        <span className="w-10 shrink-0 text-right tabular-nums">{brushWidth}</span>
      </label>

      <p className="text-xs text-neutral-500">
        배경에서 색을 뽑은 뒤 <strong>색칠 모드</strong>를 켜고 캐릭터 위를 드래그하세요.
        머리·팔·몸통·다리 구분 없이 원하는 위치에 칠할 수 있어요.
      </p>
    </div>
  )
}
