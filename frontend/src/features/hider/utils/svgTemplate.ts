import type { CharacterTemplate, TemplatePart } from '../assets/templates'
import type { PartColors, PartId } from '../types'

/**
 * Single source of truth for how a template part is painted.
 *
 * Both the on-screen React layer (`CharacterLayer`) and the PNG exporter
 * (`exportImages`) call `getPartPresentation`, so what the hider sees is what
 * gets submitted. Do not inline these attributes anywhere else.
 */

/** Back to front. Head paints last so it sits on top of the torso. */
export const PART_ORDER: PartId[] = ['legs', 'arms', 'body', 'head']

export const DEFAULT_PART_COLOR = '#ffffff'

/** A dark rim keeps a white silhouette readable on a bright photo. */
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

export function createDefaultPartColors(): PartColors {
  return {
    head: DEFAULT_PART_COLOR,
    body: DEFAULT_PART_COLOR,
    arms: DEFAULT_PART_COLOR,
    legs: DEFAULT_PART_COLOR,
  }
}

/**
 * Serialise the coloured character to a standalone SVG document.
 *
 * Used only for rasterising to `character.png`. The background stays empty so
 * the exported PNG is transparent (contractRules.md §15).
 */
export function buildCharacterSvg(
  template: CharacterTemplate,
  partColors: PartColors,
): string {
  const paint = (layer: PartLayer) =>
    PART_ORDER.map((partId) => {
      const part = template.parts[partId]
      const { fill, stroke, strokeWidth } = getPartPresentation(
        part,
        partColors[partId],
        layer,
      )

      return (
        `<path d="${part.d}" fill="${fill}" stroke="${stroke}"` +
        ` stroke-width="${strokeWidth}" stroke-linecap="round"` +
        ' stroke-linejoin="round"/>'
      )
    }).join('')

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${template.width} ${template.height}"` +
    ` width="${template.width}" height="${template.height}">` +
    `<g>${paint('outline')}</g><g>${paint('fill')}</g></svg>`
  )
}
