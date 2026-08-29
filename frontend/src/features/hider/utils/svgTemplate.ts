import type { CharacterTemplate, TemplatePart } from '../assets/templates'
import type { PaintStroke, PartId } from '../types'

/** Back to front. These paths define the silhouette and its clipping shape. */
export const PART_ORDER: PartId[] = ['legs', 'arms', 'body', 'head']

export const DEFAULT_PART_COLOR = '#ffffff'

/** A dark rim keeps the unpainted silhouette readable on a bright photo. */
export const OUTLINE_COLOR = 'rgba(17, 17, 22, 0.55)'
const OUTLINE_EXTRA_WIDTH = 7

export type PartLayer = 'outline' | 'fill'

export type PartPresentation = {
  fill: string
  stroke: string
  strokeWidth: number
}

export function getPartPresentation(
  part: TemplatePart,
  color: string,
  layer: PartLayer,
): PartPresentation {
  const isStroked = typeof part.strokeWidth === 'number'

  if (layer === 'outline') {
    return isStroked
      ? {
          fill: 'none',
          stroke: OUTLINE_COLOR,
          strokeWidth: (part.strokeWidth ?? 0) + OUTLINE_EXTRA_WIDTH,
        }
      : {
          fill: OUTLINE_COLOR,
          stroke: OUTLINE_COLOR,
          strokeWidth: OUTLINE_EXTRA_WIDTH,
        }
  }

  return isStroked
    ? { fill: 'none', stroke: color, strokeWidth: part.strokeWidth ?? 0 }
    : { fill: color, stroke: 'none', strokeWidth: 0 }
}

function renderPart(templatePart: TemplatePart, color: string, layer: PartLayer) {
  const { fill, stroke, strokeWidth } = getPartPresentation(templatePart, color, layer)

  return (
    `<path d="${templatePart.d}" fill="${fill}" stroke="${stroke}"` +
    ` stroke-width="${strokeWidth}" stroke-linecap="round"` +
    ' stroke-linejoin="round"/>'
  )
}

function renderClipPart(templatePart: TemplatePart) {
  if (typeof templatePart.strokeWidth === 'number') {
    return `<path d="${templatePart.d}" fill="none" stroke="#000" stroke-width="${templatePart.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`
  }

  return `<path d="${templatePart.d}" fill="#000"/>`
}

function renderStroke(stroke: PaintStroke) {
  const [first, ...rest] = stroke.points

  if (!first) {
    return ''
  }

  const points = rest.map(({ x, y }) => `L ${x} ${y}`).join(' ')
  const path = points ? `M ${first.x} ${first.y} ${points}` : `M ${first.x} ${first.y} l 0.01 0`

  return (
    `<path d="${path}" fill="none" stroke="${stroke.color}"` +
    ` stroke-width="${stroke.width}" stroke-linecap="round" stroke-linejoin="round"/>`
  )
}

/**
 * Serialise the silhouette and freehand paint strokes to a standalone SVG.
 * Paint is clipped to the silhouette, while the stroke coordinates remain in
 * template space so the same result can be used by the screen and exporter.
 */
export function buildCharacterSvg(
  template: CharacterTemplate,
  paintStrokes: PaintStroke[],
): string {
  const clipId = 'character-clip'
  const clip = PART_ORDER.map((partId) => renderClipPart(template.parts[partId])).join('')
  const outline = PART_ORDER
    .map((partId) => renderPart(template.parts[partId], DEFAULT_PART_COLOR, 'outline'))
    .join('')
  const fill = PART_ORDER
    .map((partId) => renderPart(template.parts[partId], DEFAULT_PART_COLOR, 'fill'))
    .join('')
  const strokes = paintStrokes.map(renderStroke).join('')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${template.width} ${template.height}"` +
    ` width="${template.width}" height="${template.height}">` +
    `<defs><clipPath id="${clipId}">${clip}</clipPath></defs>` +
    `<g>${outline}</g><g>${fill}</g>` +
    `<g clip-path="url(#${clipId})">${strokes}</g></svg>`
  )
}
