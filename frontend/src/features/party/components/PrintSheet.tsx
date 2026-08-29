import { QRCodeSVG } from 'qrcode.react'
import type { CSSProperties } from 'react'
import {
  backGrid,
  paginate,
  qrPayload,
  PRINT_LAYOUTS,
  type PrintMode,
  type PrintSlot,
} from '../utils/printLayout'
import './print.css'

/**
 * 인쇄 시트.
 *
 * 앞면과 뒷면은 **같은 slots 배열**에서 나온다. 각각 정렬하지 않는다.
 * 페어링이 깨지면 엉뚱한 HIDER가 탈락한다 (architecture.md §18).
 */
export function PrintSheet({
  slots,
  mode,
  mirrorBack,
}: {
  slots: PrintSlot[]
  mode: PrintMode
  mirrorBack: boolean
}) {
  const spec = PRINT_LAYOUTS[mode]
  const pages = paginate(slots, spec)

  const style = {
    '--cols': spec.columns,
    '--rows': spec.rows,
    '--card-w': `${spec.cardWidthMm}mm`,
    '--card-h': `${spec.cardHeightMm}mm`,
    '--qr': `${spec.qrSizeMm}mm`,
  } as CSSProperties

  if (mode === 'fold') {
    return (
      <div className="print-root" style={style}>
        {pages.map((page) => (
          <div key={page.pageNumber} className="print-page">
            <div className="print-grid">
              {page.grid.flat().map((slot) => (
                <div key={slot.slotNumber} className="print-fold-slot">
                  <CharacterCard slot={slot} />
                  <div className="print-fold-line print-fold-hint" />
                  <QrCard slot={slot} qrSizeMm={spec.qrSizeMm} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="print-root" style={style}>
      {pages.map((page) => (
        <div key={`front-${page.pageNumber}`} className="print-page">
          <div className="print-grid">
            {page.grid.flat().map((slot) => (
              <CharacterCard key={slot.slotNumber} slot={slot} />
            ))}
          </div>
        </div>
      ))}

      {pages.map((page) => (
        <div key={`back-${page.pageNumber}`} className="print-page">
          <div className="print-grid">
            {backGrid(page.grid, mirrorBack)
              .flat()
              .map((slot) => (
                <QrCard
                  key={slot.slotNumber}
                  slot={slot}
                  qrSizeMm={spec.qrSizeMm}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function CharacterCard({ slot }: { slot: PrintSlot }) {
  if (!slot.character) {
    return <div className="print-card print-card--empty" />
  }

  return (
    <div className="print-card">
      <img
        className="print-card__image"
        src={slot.character.characterImageUrl}
        alt=""
      />
      <span className="print-card__name">
        {slot.slotNumber}. {slot.character.hiderNickname ?? ''}
      </span>
    </div>
  )
}

function QrCard({ slot, qrSizeMm }: { slot: PrintSlot; qrSizeMm: number }) {
  if (!slot.character) {
    return <div className="print-card print-card--empty" />
  }

  return (
    <div className="print-card">
      {/* QR에는 qrToken으로 만든 주소만 담는다. 닉네임·ID는 넣지 않는다 (§13.1) */}
      <QRCodeSVG
        className="print-card__qr"
        value={qrPayload(slot.character.qrToken)}
        size={mmToPx(qrSizeMm)}
        level="M"
        marginSize={0}
      />
      <span className="print-card__slot">{slot.slotNumber}</span>
      <span className="print-card__token">{slot.character.qrToken}</span>
    </div>
  )
}

/** QR 모듈이 뭉개지지 않도록 넉넉한 픽셀로 그린 뒤 CSS가 mm로 줄인다. */
function mmToPx(mm: number): number {
  return Math.round((mm / 25.4) * 300)
}
