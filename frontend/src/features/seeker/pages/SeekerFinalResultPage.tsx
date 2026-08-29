import './SeekerFinalResultPage.css'

export type FinalHiderResult = {
  characterId: number
  nickname: string
  status: string
  survivalSeconds: number
  isMvp?: boolean
}

export type FinalSeekerResult = {
  participantId: number
  nickname: string
  foundCount: number
}

export type SeekerFinalResultPageProps = {
  /** Backend Game Result를 화면에 맞게 전달받습니다. 승패를 Client에서 계산하지 않습니다. */
  winnerLabel: string
  hiders: readonly FinalHiderResult[]
  seekers: readonly FinalSeekerResult[]
  onExit?: () => void
}

function formatSurvivalTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = safeSeconds % 60

  if (minutes === 0) {
    return `${remainingSeconds}초`
  }

  return `${minutes}분 ${String(remainingSeconds).padStart(2, '0')}초`
}

function getHiderStatusLabel(status: string) {
  if (status === 'SURVIVED') {
    return '생존'
  }

  if (status === 'FOUND') {
    return '발각'
  }

  return status
}

export default function SeekerFinalResultPage({
  winnerLabel,
  hiders,
  seekers,
  onExit,
}: SeekerFinalResultPageProps) {
  const totalFound = seekers.reduce((total, seeker) => total + seeker.foundCount, 0)

  return (
    <main className="seeker-final-result" aria-labelledby="seeker-final-result-title">
      <section className="seeker-final-result__hero">
        <p className="seeker-final-result__eyebrow">GAME FINISHED</p>
        <div className="seeker-final-result__trophy" aria-hidden="true">
          ★
        </div>
        <h1 id="seeker-final-result-title">게임이 끝났어요</h1>
        <p className="seeker-final-result__winner">{winnerLabel}</p>
        <p className="seeker-final-result__description">Backend 판정 결과를 확인해 보세요.</p>
      </section>

      <section className="seeker-final-result__stats" aria-label="게임 요약">
        <div>
          <strong>{totalFound}</strong>
          <span>발견된 카드</span>
        </div>
        <div>
          <strong>{hiders.length}</strong>
          <span>전체 Hider</span>
        </div>
        <div>
          <strong>{seekers.length}</strong>
          <span>전체 Seeker</span>
        </div>
      </section>

      <section className="seeker-final-result__section" aria-labelledby="hider-ranking-title">
        <div className="seeker-final-result__section-heading">
          <div>
            <p className="seeker-final-result__section-eyebrow">HIDER</p>
            <h2 id="hider-ranking-title">생존 기록</h2>
          </div>
          <span>{hiders.length}명</span>
        </div>

        <div className="seeker-final-result__hider-list">
          {hiders.map((hider) => (
            <article
              className={`seeker-final-result__hider-card${hider.isMvp ? ' is-mvp' : ''}`}
              key={hider.characterId}
            >
              <div className="seeker-final-result__rank-mark" aria-hidden="true">
                {hider.isMvp ? '★' : '·'}
              </div>
              <div className="seeker-final-result__person">
                <strong>{hider.nickname}</strong>
                {hider.isMvp && <span>최장 생존</span>}
              </div>
              <div className="seeker-final-result__survival">
                <strong>{formatSurvivalTime(hider.survivalSeconds)}</strong>
                <span>{getHiderStatusLabel(hider.status)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="seeker-final-result__section" aria-labelledby="seeker-ranking-title">
        <div className="seeker-final-result__section-heading">
          <div>
            <p className="seeker-final-result__section-eyebrow">SEEKER</p>
            <h2 id="seeker-ranking-title">발견 기록</h2>
          </div>
          <span>{seekers.length}명</span>
        </div>

        <div className="seeker-final-result__seeker-list">
          {seekers.map((seeker) => (
            <article className="seeker-final-result__seeker-card" key={seeker.participantId}>
              <strong>{seeker.nickname}</strong>
              <span>{seeker.foundCount}개 발견</span>
            </article>
          ))}
        </div>
      </section>

      {onExit && (
        <button className="seeker-final-result__exit" type="button" onClick={onExit}>
          나가기
        </button>
      )}
    </main>
  )
}
