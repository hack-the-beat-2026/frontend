import { useId } from 'react'
import type { CharacterTransform } from '../../../shared/types'
import type { CharacterTemplate } from '../assets/templates'
import type { PaintStroke } from '../types'
import type { Size } from '../utils/geometry'
import { getCharacterPixelBox } from '../utils/geometry'
import {
  DEFAULT_PART_COLOR,
  PART_ORDER,
  getPartPresentation,
} from '../utils/svgTemplate'

type CharacterLayerProps = {
  template: CharacterTemplate
  paintStrokes: PaintStroke[]
  transform: CharacterTransform
  surface: Size
}

function strokePath(stroke: PaintStroke) {
  const [first, ...rest] = stroke.points

  if (!first) {
    return null
  }

  const restOfPath = rest.map(({ x, y }) => `L ${x} ${y}`).join(' ')
  const d = restOfPath
    ? `M ${first.x} ${first.y} ${restOfPath}`
    : `M ${first.x} ${first.y} l 0.01 0`

  return (
    <path
      d={d}
      fill="none"
      stroke={stroke.color}
      strokeWidth={stroke.width}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

/** Draws the white silhouette and clips freehand paint to its shape. */
export function CharacterLayer({
  template,
  paintStrokes,
  transform,
  surface,
}: CharacterLayerProps) {
  const box = getCharacterPixelBox(template, transform, surface)
  const clipId = `character-clip-${useId().replaceAll(':', '')}`

  const paint = (layer: 'outline' | 'fill') =>
    PART_ORDER.map((partId) => {
      const part = template.parts[partId]
      const presentation = getPartPresentation(part, DEFAULT_PART_COLOR, layer)

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
      <defs>
        <clipPath id={clipId}>
          {PART_ORDER.map((partId) => {
            const part = template.parts[partId]

            return (
              <path
                key={partId}
                d={part.d}
                fill={typeof part.strokeWidth === 'number' ? 'none' : '#000'}
                stroke={typeof part.strokeWidth === 'number' ? '#000' : 'none'}
                strokeWidth={part.strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )
          })}
        </clipPath>
      </defs>

      <g>{paint('outline')}</g>
      <g>{paint('fill')}</g>
      <g clipPath={`url(#${clipId})`}>
        {paintStrokes.map((stroke, index) => (
          <g key={`${stroke.color}-${index}`}>{strokePath(stroke)}</g>
        ))}
      </g>
    </svg>
  )
}
