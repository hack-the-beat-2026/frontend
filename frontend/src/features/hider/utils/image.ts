/** Small canvas/image primitives shared by the exporter and the photo helpers. */

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()

    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('이미지를 불러오지 못했습니다.'))
    image.src = src
  })
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('이미지를 생성하지 못했습니다.'))
        }
      },
      type,
      quality,
    )
  })
}

export function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')

  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))

  const context = canvas.getContext('2d', { willReadFrequently: true })

  if (!context) {
    throw new Error('캔버스를 사용할 수 없습니다.')
  }

  return { canvas, context }
}
