import './SeekerReadyPage.css'

export type SeekerReadyPageProps = {
  /** Backend에서 받은 현재 Game Status입니다. */
  gameStatus: string
  roomName?: string
  nickname?: string
  remainingSeconds?: number
  onOpenScanner?: () => void
}

function formatSeconds(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
}

export default function SeekerReadyPage({
  gameStatus,
  roomName = '파티 룸',
  nickname = 'Seeker',
  remainingSeconds,
  onOpenScanner,
}: SeekerReadyPageProps) {
  const isSeeking = gameStatus === 'SEEKING'

  return (
    <main className="seeker-ready" aria-labelledby="seeker-ready-title">
      <header className="seeker-ready__header">
        <span className="seeker-ready__eyebrow">2D HIDE &amp; SEEK</span>
        <span className="seeker-ready__room">{roomName}</span>
      </header>

      <section className="seeker-ready__content">
        <div className="seeker-ready__icon" aria-hidden="true">
          <span>⌕</span>
        </div>

        <p className="seeker-ready__role">찾는 사람</p>
        <h1 id="seeker-ready-title">
          {isSeeking ? '숨은 카드를 찾아보세요' : '탐색을 준비하고 있어요'}
        </h1>
        <p className="seeker-ready__description">
          {isSeeking
            ? '카드를 발견하면 뒷면의 QR을 스캔해 발각을 확인하세요.'
            : '디자인과 은신이 끝나면 주최자가 탐색을 시작합니다.'}
        </p>

        <div className="seeker-ready__status" role="status" aria-live="polite">
          <span className={`seeker-ready__dot${isSeeking ? ' is-active' : ''}`} />
          <span>{isSeeking ? '탐색 진행 중' : '탐색 시작 대기 중'}</span>
        </div>

        {isSeeking && remainingSeconds !== undefined && (
          <div className="seeker-ready__timer">
            <span>남은 시간</span>
            <strong>{formatSeconds(remainingSeconds)}</strong>
          </div>
        )}

        <button
          className="seeker-ready__button"
          type="button"
          disabled={!isSeeking || onOpenScanner === undefined}
          onClick={onOpenScanner}
        >
          QR 스캐너 열기
        </button>

        <p className="seeker-ready__player">{nickname}님으로 참가 중</p>
      </section>
    </main>
  )
}
