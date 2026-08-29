import type { CapturedPhoto } from '../types'
import { loadImage } from './image'

/** Wrap a captured/selected image blob with the natural size the editor needs. */
export async function createCapturedPhoto(blob: Blob): Promise<CapturedPhoto> {
  const objectUrl = URL.createObjectURL(blob)

  try {
    const image = await loadImage(objectUrl)

    return {
      blob,
      objectUrl,
      width: image.naturalWidth,
      height: image.naturalHeight,
    }
  } catch (error) {
    URL.revokeObjectURL(objectUrl)
    throw error
  }
}

export function releaseCapturedPhoto(photo: CapturedPhoto | null) {
  if (photo) {
    URL.revokeObjectURL(photo.objectUrl)
  }
}
