import { QRCodeSVG } from 'qrcode.react'

/**
 * 입장 QR.
 *
 * Backend가 `joinQrUrl`을 주면 그 이미지를 쓰고, 비어 있으면 `joinUrl`로 직접 렌더한다.
 * 어느 쪽이든 QR에 담기는 값은 Backend가 만든 주소뿐이다 — Frontend가 토큰을 만들지 않는다.
 */
export function JoinQr({
  joinUrl,
  joinQrUrl,
  size = 176,
}: {
  joinUrl: string
  joinQrUrl?: string
  size?: number
}) {
  return (
    <div className="flex items-center justify-center rounded-2xl bg-white p-4">
      {joinQrUrl ? (
        <img
          src={joinQrUrl}
          alt="입장 QR 코드"
          width={size}
          height={size}
          className="h-auto max-w-full"
        />
      ) : (
        <QRCodeSVG value={joinUrl} size={size} level="M" marginSize={0} />
      )}
    </div>
  )
}
