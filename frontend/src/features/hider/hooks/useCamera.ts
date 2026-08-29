import { useCallback, useEffect, useRef, useState } from 'react'
import type { CapturedPhoto } from '../types'
import { canvasToBlob, createCanvas } from '../utils/image'
import { createCapturedPhoto } from '../utils/photo'

export type CameraStatus =
  | 'IDLE'
  | 'STARTING'
  | 'READY'
  | 'DENIED'
  | 'UNSUPPORTED'

/**
 * Rear-facing camera capture.
 *
 * Every failure path is recoverable from the UI: `DENIED` and `UNSUPPORTED`
 * both fall back to the file picker / mock photo in `CameraCapture`, which is
 * what keeps the feature testable on a desktop with no camera
 * (`frontend_agent.md` Rule 19).
 */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [status, setStatus] = useState<CameraStatus>('IDLE')

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setStatus('IDLE')
  }, [])

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('UNSUPPORTED')
      return
    }

    setStatus('STARTING')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setStatus('READY')
    } catch (error) {
      const name = error instanceof Error ? error.name : ''

      setStatus(
        name === 'NotAllowedError' || name === 'SecurityError'
          ? 'DENIED'
          : 'UNSUPPORTED',
      )
    }
  }, [])

  const capture = useCallback(async (): Promise<CapturedPhoto> => {
    const video = videoRef.current

    if (!video || !video.videoWidth || !video.videoHeight) {
      throw new Error('카메라 화면을 아직 사용할 수 없습니다.')
    }

    const { canvas, context } = createCanvas(video.videoWidth, video.videoHeight)

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    return createCapturedPhoto(await canvasToBlob(canvas, 'image/jpeg', 0.92))
  }, [])

  // Release the camera when the editor leaves the CAMERA step or unmounts.
  useEffect(() => stop, [stop])

  return { videoRef, status, start, stop, capture }
}
