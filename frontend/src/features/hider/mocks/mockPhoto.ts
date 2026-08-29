import type { CapturedPhoto } from '../types'
import { canvasToBlob, createCanvas } from '../utils/image'
import { createCapturedPhoto } from '../utils/photo'

/**
 * A synthetic "bookshelf" photo, drawn rather than shipped as a binary.
 *
 * It gives the eyedropper plenty of distinct colours to sample, so the whole
 * camouflage flow can be exercised on a desktop with no camera
 * (`frontend_agent.md` Rule 19).
 */
const SPINE_COLORS = [
  '#7f4f24', '#936639', '#a68a64', '#582f0e', '#414833',
  '#333d29', '#6b705c', '#3f4238', '#8a5a44', '#5c4033',
]

export async function createMockPhoto(): Promise<CapturedPhoto> {
  const width = 900
  const height = 1200
  const { canvas, context } = createCanvas(width, height)

  context.fillStyle = '#2b2118'
  context.fillRect(0, 0, width, height)

  const shelfHeight = height / 4

  for (let shelf = 0; shelf < 4; shelf += 1) {
    const top = shelf * shelfHeight

    context.fillStyle = '#4a3728'
    context.fillRect(0, top + shelfHeight - 18, width, 18)

    let x = 12

    while (x < width - 30) {
      const spineWidth = 26 + ((shelf * 7 + x) % 34)
      const spineHeight = shelfHeight - 40 - ((x + shelf * 13) % 30)

      context.fillStyle = SPINE_COLORS[(shelf * 3 + Math.floor(x / 30)) % SPINE_COLORS.length]
      context.fillRect(x, top + shelfHeight - 18 - spineHeight, spineWidth, spineHeight)

      context.fillStyle = 'rgba(255,255,255,0.12)'
      context.fillRect(x + 4, top + shelfHeight - 18 - spineHeight + 14, spineWidth - 8, 4)

      x += spineWidth + 5
    }
  }

  return createCapturedPhoto(await canvasToBlob(canvas, 'image/jpeg', 0.9))
}
