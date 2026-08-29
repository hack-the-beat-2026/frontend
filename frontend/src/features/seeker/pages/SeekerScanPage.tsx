import { useEffect, useRef, useState } from 'react'
import './SeekerScanPage.css'

type Barcode = {
  rawValue?: string
}

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Barcode[]>
}

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[]
}) => BarcodeDetectorLike

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor
  }
}

export type SeekerScanPageProps = {
  /** Backend에서 받은 현재 Game Status입니다. */
  gameStatus: string
  onScanToken: (qrToken: string) => Promise<void> | void
  onClose?: () => void
}

type CameraState = 'idle' | 'starting' | 'ready' | 'error'
type ScanState = 'scanning' | 'validating'

const DETECTION_INTERVAL_MS = 500
const MAX_DETECTION_ATTEMPTS = 180

export default function SeekerScanPage({
  gameStatus,
  onScanToken,
  onClose,
}: SeekerScanPageProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const scanCallbackRef = useRef(onScanToken)
  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [scanState, setScanState] = useState<ScanState>('scanning')
  const [errorMessage, setErrorMessage] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const isSeeking = gameStatus === 'SEEKING'

  useEffect(() => {
    scanCallbackRef.current = onScanToken
  }, [onScanToken])

  useEffect(() => {
    if (!isSeeking) {
      return
    }

    const video = videoRef.current
    let cancelled = false
    let stream: MediaStream | undefined
    let detectionTimer: number | undefined
    let detectionAttempts = 0

    const stopStream = () => {
      stream?.getTracks().forEach((track) => track.stop())
      stream = undefined
    }

    const startCamera = async () => {
      setCameraState('starting')
      setScanState('scanning')
      setErrorMessage('')

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState('error')
        setErrorMessage('이 기기에서는 카메라를 사용할 수 없습니다.')
        return
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' } },
        })

        if (cancelled || !video) {
          stopStream()
          return
        }

        video.srcObject = stream
        await video.play()

        if (cancelled) {
          return
        }

        setCameraState('ready')

        if (!window.BarcodeDetector) {
          setErrorMessage(
            '이 브라우저는 QR 자동 인식을 지원하지 않습니다. 다른 브라우저에서 시도해 주세요.',
          )
          return
        }

        const detector = new window.BarcodeDetector({ formats: ['qr_code'] })

        const detectQr = async () => {
          if (cancelled) {
            return
          }

          detectionAttempts += 1
          if (detectionAttempts > MAX_DETECTION_ATTEMPTS) {
            setCameraState('error')
            setErrorMessage('QR을 찾지 못했습니다. 카드를 화면 안에 맞춰 다시 시도해 주세요.')
            return
          }

          try {
            const [barcode] = await detector.detect(video)
            const qrToken = barcode?.rawValue?.trim()

            if (qrToken) {
              setScanState('validating')
              Promise.resolve()
                .then(() => scanCallbackRef.current(qrToken))
                .catch(() => {
                if (!cancelled) {
                  setScanState('scanning')
                  setErrorMessage('QR 검증에 실패했습니다. 다시 스캔해 주세요.')
                  detectionTimer = window.setTimeout(detectQr, DETECTION_INTERVAL_MS)
                }
                })
              return
            }
          } catch {
            // 인식 중인 프레임은 일시적으로 실패할 수 있으므로 다음 프레임에서 재시도합니다.
          }

          if (!cancelled) {
            detectionTimer = window.setTimeout(detectQr, DETECTION_INTERVAL_MS)
          }
        }

        void detectQr()
      } catch {
        if (!cancelled) {
          setCameraState('error')
          setErrorMessage('카메라 권한이 필요합니다. 권한을 허용한 뒤 다시 시도해 주세요.')
        }
      }
    }

    void startCamera()

    return () => {
      cancelled = true
      if (detectionTimer !== undefined) {
        window.clearTimeout(detectionTimer)
      }
      stopStream()
      if (video) {
        video.srcObject = null
      }
    }
  }, [isSeeking, retryKey])

  const retryCamera = () => {
    setRetryKey((key) => key + 1)
  }

  return (
    <main className="seeker-scan" aria-labelledby="seeker-scan-title">
      <header className="seeker-scan__header">
        {onClose && (
          <button className="seeker-scan__close" type="button" onClick={onClose}>
            닫기
          </button>
        )}
        <p className="seeker-scan__eyebrow">QR SCANNER</p>
      </header>

      <section className="seeker-scan__content">
        <h1 id="seeker-scan-title">카드 뒷면의 QR을 비춰주세요</h1>
        <p className="seeker-scan__description">
          카드를 실제로 발견해 뒤집은 뒤 QR이 네모 안에 들어오도록 맞춰주세요.
        </p>

        <div className="seeker-scan__camera-frame">
          <video
            ref={videoRef}
            className="seeker-scan__video"
            autoPlay
            muted
            playsInline
            aria-label="QR 스캔 카메라 미리보기"
          />
          <span className="seeker-scan__corner seeker-scan__corner--top-left" />
          <span className="seeker-scan__corner seeker-scan__corner--top-right" />
          <span className="seeker-scan__corner seeker-scan__corner--bottom-left" />
          <span className="seeker-scan__corner seeker-scan__corner--bottom-right" />
          {(!isSeeking || cameraState === 'starting') && (
            <div className="seeker-scan__camera-message">
              {isSeeking ? '카메라를 준비하고 있어요' : '탐색 시작 후 스캔할 수 있어요'}
            </div>
          )}
        </div>

        <div className="seeker-scan__status" role="status" aria-live="polite">
          <span
            className={`seeker-scan__status-dot${
              scanState === 'validating' ? ' is-validating' : ''
            }`}
          />
          <span>
            {scanState === 'validating'
              ? 'QR을 확인하고 있어요'
              : errorMessage || (isSeeking ? 'QR을 찾고 있어요' : '탐색 시작 대기 중')}
          </span>
        </div>

        {cameraState === 'error' && (
          <button className="seeker-scan__retry" type="button" onClick={retryCamera}>
            카메라 다시 시도
          </button>
        )}
      </section>
    </main>
  )
}
