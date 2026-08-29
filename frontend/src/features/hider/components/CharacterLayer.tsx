import type { CharacterTransform } from '../../../shared/types'
import type { CharacterTemplate } from '../assets/templates'
import type { PartColors, PartId } from '../types'
import type { Size } from '../utils/geometry'
import { getCharacterPixelBox } from '../utils/geometry'
import { PART_ORDER, getPartPresentation } from '../utils/svgTemplate'

type CharacterLayerProps = {
  template: CharacterTemplate
  partColors: PartColors
  transform: CharacterTransform
  surface: Size
  highlightPart?: PartId | null
}

/**
 * Draws the character over the photo.
 *
 * Presentation comes from `getPartPresentation` and placement from
 * `getCharacterPixelBox` — the same two helpers `exportImages` uses, so the
 * preview that gets submitted matches this view exactly.
 */
export function CharacterLayer({
  template,
  partColors,
  transform,
  surface,
  highlightPart = null,
}: CharacterLayerProps) {
  const box = getCharacterPixelBox(template, transform, surface)

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

  const highlight = highlightPart ? template.parts[highlightPart] : null

  return (
    <svg
      viewBox={`0 0 ${template.width} ${template.height}`}
      width={box.width}
      height={box.height}
      className="pointer-events-none absolute"
      style={{
        left: box.centerX - box.width / 2,
        top: box.centerY - box.height / 2,
        transform: `rotate(${transform.rotation}deg)`,
      }}
      aria-hidden="true"
    >
      <g>{paint('outline')}</g>
      <g>{paint('fill')}</g>
      {highlight ? (
        <path
          d={highlight.d}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={(highlight.strokeWidth ?? 0) + 5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="10 8"
          opacity={0.9}
        />
      ) : null}
    </svg>
  )
}
