import type { CharacterTemplate } from '../assets/templates'
import { characterTemplates } from '../assets/templates'
import type { PartColors } from '../types'
import { PART_ORDER, getPartPresentation } from '../utils/svgTemplate'

type TemplatePickerProps = {
  selectedId: string
  partColors: PartColors
  onSelect: (templateId: string) => void
}

function TemplateThumb({
  template,
  partColors,
}: {
  template: CharacterTemplate
  partColors: PartColors
}) {
  const paint = (layer: 'outline' | 'fill') =>
    PART_ORDER.map((partId) => {
      const part = template.parts[partId]
      const presentation = getPartPresentation(part, partColors[partId], layer)

      return (
        <path
          key={`${layer}-${partId}`}
          d={part.d}
          fill={presentation.fill}
          stroke={presentation.stroke}
          strokeWidth={presentation.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    })

  return (
    <svg
      viewBox={`0 0 ${template.width} ${template.height}`}
      className="h-24 w-full"
      aria-hidden="true"
    >
      <g>{paint('outline')}</g>
      <g>{paint('fill')}</g>
    </svg>
  )
}

/**
 * Pose picker. Changing the pose mid-edit keeps the colours already applied,
 * so a hider can try a different silhouette without losing their camouflage.
 */
export function TemplatePicker({
  selectedId,
  partColors,
  onSelect,
}: TemplatePickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {characterTemplates.map((template) => {
        const selected = template.id === selectedId

        return (
          <button
            key={template.id}
            type="button"
            onClick={() => onSelect(template.id)}
            aria-pressed={selected}
            className={`flex flex-col items-center gap-1 rounded-xl border-2 bg-neutral-500/20 p-2 transition ${
              selected ? 'border-sky-500' : 'border-transparent'
            }`}
          >
            <TemplateThumb template={template} partColors={partColors} />
            <span className="text-xs font-medium text-neutral-600">
              {template.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
