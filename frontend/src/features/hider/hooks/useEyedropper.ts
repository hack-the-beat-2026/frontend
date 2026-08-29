import { useCallback, useEffect, useState } from 'react'
import type { CapturedPhoto } from '../types'
import { rgbToHex } from '../utils/color'
import { createCanvas, loadImage } from '../utils/image'

type Sampler = {
  photo: CapturedPhoto
  context: CanvasRenderingContext2D
}

/**
 * Samples a colour out of the background photo — the digital equivalent of the
 * original game's スポイト.
 *
 * The photo is drawn once into an offscreen canvas at natural size and then
 * sampled with `getImageData`. Camera captures, file-picker blobs and the
 * bundled mock photo are all same-origin, so the canvas is never tainted.
 *
 * The sampler keeps a reference to the photo it was built from, so readiness is
 * derived during render instead of being reset from inside the effect.
 */
export function useEyedropper(photo: CapturedPhoto | null) {
  const [sampler, setSampler] = useState<Sampler | null>(null)

  useEffect(() => {
    if (!photo) {
      return
    }

    let cancelled = false

    loadImage(photo.objectUrl)
      .then((image) => {
        if (cancelled) {
          return
        }

        const { context } = createCanvas(photo.width, photo.height)

        context.drawImage(image, 0, 0, photo.width, photo.height)
        setSampler({ photo, context })
      })
      .catch(() => {
        // Leaving `sampler` stale keeps `ready` false for this photo.
      })

    return () => {
      cancelled = true
    }
  }, [photo])

  const current = sampler && sampler.photo === photo ? sampler : null

  /** `x` / `y` are pixels in the photo's natural coordinate space. */
  const sample = useCallback(
    (x: number, y: number): string | null => {
      if (!current) {
        return null
      }

      const [r, g, b] = current.context.getImageData(x, y, 1, 1).data

      return rgbToHex(r, g, b)
    },
    [current],
  )

  return { ready: current !== null, sample }
}
