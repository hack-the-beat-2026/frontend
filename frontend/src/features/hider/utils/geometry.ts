import type { CharacterTransform } from '../../../shared/types'
import type { CharacterTemplate } from '../assets/templates'

/**
 * Coordinate model — contractRules.md §16.
 *
 *   positionX / positionY : ratio of the background photo (0..1), CENTRE of the
 *                           character. Never canvas pixels.
 *   scale                 : character height ÷ photo height.
 *   rotation              : degrees, clockwise.
 *
 * Every consumer resolves a transform through `getCharacterPixelBox`, passing
 * whichever surface it draws on — the on-screen stage passes the displayed rect,
 * the exporter passes the photo's natural size. Because the stage is rendered at
 * the photo's exact aspect ratio, both produce the same placement.
 */

export type Size = { width: number; height: number }

export type CharacterPixelBox = {
  centerX: number
  centerY: number
  width: number
  height: number
}

export const MIN_SCALE = 0.05
export const MAX_SCALE = 1.2

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function getCharacterPixelBox(
  template: CharacterTemplate,
  transform: CharacterTransform,
  surface: Size,
): CharacterPixelBox {
  const height = transform.scale * surface.height
  const width = height * (template.width / template.height)

  return {
    width,
    height,
    centerX: transform.positionX * surface.width,
    centerY: transform.positionY * surface.height,
  }
}

/** Keep the character centre inside the photo so it can never be dragged away. */
export function clampTransform(transform: CharacterTransform): CharacterTransform {
  return {
    positionX: clamp(transform.positionX, 0, 1),
    positionY: clamp(transform.positionY, 0, 1),
    scale: clamp(transform.scale, MIN_SCALE, MAX_SCALE),
    rotation: normaliseRotation(transform.rotation),
  }
}

export function normaliseRotation(degrees: number) {
  const wrapped = degrees % 360

  return wrapped > 180 ? wrapped - 360 : wrapped < -180 ? wrapped + 360 : wrapped
}

/** Convert a pointer delta in displayed pixels into a ratio delta. */
export function pixelDeltaToRatio(deltaX: number, deltaY: number, surface: Size) {
  return {
    x: surface.width === 0 ? 0 : deltaX / surface.width,
    y: surface.height === 0 ? 0 : deltaY / surface.height,
  }
}

/** Map a point on the displayed stage to a pixel in the photo's natural space. */
export function stagePointToPhotoPixel(
  point: { x: number; y: number },
  stage: Size,
  photo: Size,
) {
  if (stage.width === 0 || stage.height === 0) {
    return { x: 0, y: 0 }
  }

  return {
    x: Math.round(clamp((point.x / stage.width) * photo.width, 0, photo.width - 1)),
    y: Math.round(clamp((point.y / stage.height) * photo.height, 0, photo.height - 1)),
  }
}

/** Map a displayed stage point into the unrotated template coordinate space. */
export function stagePointToCharacterPoint(
  point: { x: number; y: number },
  box: CharacterPixelBox,
  template: Size,
  rotation: number,
) {
  const dx = point.x - box.centerX
  const dy = point.y - box.centerY
  const radians = (rotation * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const unrotatedX = dx * cos + dy * sin
  const unrotatedY = -dx * sin + dy * cos

  return {
    x: clamp(((unrotatedX + box.width / 2) / box.width) * template.width, 0, template.width),
    y: clamp(((unrotatedY + box.height / 2) / box.height) * template.height, 0, template.height),
  }
}

export function distanceBetween(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function angleBetween(a: { x: number; y: number }, b: { x: number; y: number }) {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
}
