import type { CharacterTransform } from '../../../shared/types'
import type { CharacterTemplate } from '../assets/templates'
import type { CapturedPhoto, CharacterExportBundle, PaintStroke } from '../types'
import { getCharacterPixelBox } from './geometry'
import { canvasToBlob, createCanvas, loadImage } from './image'
import { buildCharacterSvg } from './svgTemplate'

/**
 * Produces the three files contractRules.md §15 requires:
 *
 *   original.jpg   the captured place photo, untouched
 *   character.png  the coloured character on a TRANSPARENT background
 *   preview.jpg    the photo with the character composited at its real position
 *
 * `character.png` deliberately bakes in NO transform. positionX/Y, scale and
 * rotation travel as separate fields (§16/§17), so baking them here would apply
 * every placement twice when the backend or the seeker re-composites the shot.
 */

/** Rasterise the character above its viewBox size so printed cards stay sharp. */
const CHARACTER_EXPORT_SCALE = 3

const JPEG_QUALITY = 0.92

/**
 * The SVG is inlined as a `charset=utf-8` data URL rather than a blob URL: data
 * URLs are same-origin, so the canvas is never tainted and `preview.jpg` can be
 * read back with `toBlob`.
 */
function toSvgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export async function loadCharacterImage(
  template: CharacterTemplate,
  paintStrokes: PaintStroke[],
) {
  return loadImage(toSvgDataUrl(buildCharacterSvg(template, paintStrokes)))
}

export async function renderOriginalJpeg(photo: CapturedPhoto): Promise<Blob> {
  const image = await loadImage(photo.objectUrl)
  const { canvas, context } = createCanvas(photo.width, photo.height)

  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  return canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY)
}

export async function renderCharacterPng(
  template: CharacterTemplate,
  paintStrokes: PaintStroke[],
): Promise<Blob> {
  const image = await loadCharacterImage(template, paintStrokes)
  const { canvas, context } = createCanvas(
    template.width * CHARACTER_EXPORT_SCALE,
    template.height * CHARACTER_EXPORT_SCALE,
  )

  // No fill: the canvas starts fully transparent and must stay that way.
  context.drawImage(image, 0, 0, canvas.width, canvas.height)

  return canvasToBlob(canvas, 'image/png')
}

export async function renderPreviewJpeg(
  photo: CapturedPhoto,
  template: CharacterTemplate,
  paintStrokes: PaintStroke[],
  transform: CharacterTransform,
): Promise<Blob> {
  const [background, character] = await Promise.all([
    loadImage(photo.objectUrl),
    loadCharacterImage(template, paintStrokes),
  ])

  const { canvas, context } = createCanvas(photo.width, photo.height)

  context.drawImage(background, 0, 0, canvas.width, canvas.height)

  // Same helper the on-screen stage uses, so preview matches what was edited.
  const box = getCharacterPixelBox(template, transform, {
    width: canvas.width,
    height: canvas.height,
  })

  context.save()
  context.translate(box.centerX, box.centerY)
  context.rotate((transform.rotation * Math.PI) / 180)
  context.drawImage(character, -box.width / 2, -box.height / 2, box.width, box.height)
  context.restore()

  return canvasToBlob(canvas, 'image/jpeg', JPEG_QUALITY)
}

export async function exportCharacterBundle(
  photo: CapturedPhoto,
  template: CharacterTemplate,
  paintStrokes: PaintStroke[],
  transform: CharacterTransform,
): Promise<CharacterExportBundle> {
  const [original, character, preview] = await Promise.all([
    renderOriginalJpeg(photo),
    renderCharacterPng(template, paintStrokes),
    renderPreviewJpeg(photo, template, paintStrokes, transform),
  ])

  return { original, character, preview }
}
