import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { CapturedPhoto } from '../types'
import { useCamera } from '../hooks/useCamera'
import { createCapturedPhoto, releaseCapturedPhoto } from '../utils/photo'

type CameraCaptureProps = {
  onPhotoConfirmed: (photo: CapturedPhoto) => void
  /** Dev/desktop escape hatch so the flow is testable without a camera. */
  onUseMockPhoto?: () => Promise<CapturedPhoto>
}

/**
 * Step 1 — photograph the place the paper card will be hidden in.
 *
 * Rear camera first, with a file picker fallback for denied permissions and
 * desktop browsers.
 */
export function CameraCapture({
  onPhotoConfirmed,
  onUseMockPhoto,
}: CameraCaptureProps) {
  const { videoRef, status, start, stop, capture } = useCamera()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [pending, setPending] = useState<CapturedPhoto | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void start()
  }, [start])

  const replacePending = (photo: CapturedPhoto | null) => {
    setPending((current) => {
      if (current && current !== photo) {
        releaseCapturedPhoto(current)
      }

      return photo
    })
  }

  const handleCapture = async () => {
    setError(null)

    try {
      const photo = await capture()

      replacePending(photo)
      stop()
    } catch (captureError) {
      setError(
        captureError instanceof Error
          ? captureError.message
          : '촬영에 실패했습니다.',
      )
    }
  }

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    event.target.value = ''

    if (!file) {
      return
    }

    setError(null)

    try {
      replacePending(await createCapturedPhoto(file))
      stop()
    } catch {
      setError('사진을 불러오지 못했습니다.')
    }
  }

  const handleMock = async () => {
    if (!onUseMockPhoto) {
      return
    }

    setError(null)

    try {
      replacePending(await onUseMockPhoto())
      stop()
    } catch {
      setError('샘플 사진을 불러오지 못했습니다.')
    }
  }

  const handleRetake = () => {
    replacePending(null)
    void start()
  }

  const handleConfirm = () => {
    if (pending) {
      // Ownership moves to the editor; do not revoke the object URL here.
      setPending(null)
      onPhotoConfirmed(pending)
    }
  }

  const cameraBlocked = status === 'DENIED' || status === 'UNSUPPORTED'

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full overflow-hidden rounded-2xl bg-black aspect-[3/4]">
        {pending ? (
          <img
            src={pending.objectUrl}
            alt="촬영 결과 미리보기"
            className="h-full w-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="h-full w-full object-cover"
          />
        )}

        {!pending && cameraBlocked ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 px-6 text-center text-sm text-white">
            <p className="font-medium">
              {status === 'DENIED'
                ? '카메라 권한이 거부되었습니다'
                : '이 기기에서는 카메라를 쓸 수 없습니다'}
            </p>
            <p className="text-white/70">아래에서 사진을 불러와 주세요.</p>
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {pending ? (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleRetake}
            className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 font-medium text-neutral-700"
          >
            다시 찍기
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 rounded-xl bg-neutral-900 px-4 py-3 font-medium text-white"
          >
            이 사진 사용
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleCapture}
            disabled={status !== 'READY'}
            className="rounded-xl bg-neutral-900 px-4 py-3 font-medium text-white disabled:opacity-40"
          >
            {status === 'STARTING' ? '카메라 준비 중…' : '촬영'}
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-700"
            >
              사진 불러오기
            </button>
            {onUseMockPhoto ? (
              <button
                type="button"
                onClick={handleMock}
                className="flex-1 rounded-xl border border-dashed border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-500"
              >
                샘플 사진 사용
              </button>
            ) : null}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}
