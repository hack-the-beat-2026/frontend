import './SeekerScanResultPage.css'

export type FoundCharacterResult = {
  characterId: number
  hiderNickname: string
  originalPhotoUrl: string
  previewImageUrl: string
  survivalSeconds: number
}

export type ScanOutcome = 'success' | 'duplicate' | 'invalid' | 'error'

export type SeekerScanResultPageProps = {
  /** Backend 응답을 화면 상태로 변환한 값입니다. API 호출은 상위 계층에서 수행합니다. */
  outcome: ScanOutcome
  foundCharacter?: FoundCharacterResult
  errorCode?: string
  onRetry?: () => void
  onContinue?: () => void
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

function getErrorContent(outcome: ScanOutcome, errorCode?: string) {
  if (outcome === 'duplicate' || errorCode === 'CHARACTER_ALREADY_FOUND') {
    return {
      eyebrow: 'ALREADY FOUND',
      title: '이미 발견된 카드예요',
      description: '다른 찾는 사람이 먼저 스캔한 카드입니다. 주변을 계속 탐색해 보세요.',
    }
  }

  if (
    outcome === 'invalid' ||
    errorCode === 'INVALID_QR_TOKEN' ||
    errorCode === 'CHARACTER_NOT_FOUND'
  ) {
    return {
      eyebrow: 'INVALID QR',
      title: '유효하지 않은 QR이에요',
      description: '현재 게임에 속한 카드인지 확인한 뒤 다시 스캔해 주세요.',
    }
  }

  if (errorCode === 'GAME_INVALID_STATE' || errorCode === 'SEEK_TIME_EXPIRED') {
    return {
      eyebrow: 'GAME STATUS',
      title: '지금은 발견을 처리할 수 없어요',
      description: '게임 상태가 변경되었거나 탐색 시간이 끝났습니다.',
    }
  }

  return {
    eyebrow: 'SCAN ERROR',
    title: 'QR을 처리하지 못했어요',
    description: '잠시 후 카드를 다시 스캔해 주세요.',
  }
}

export default function SeekerScanResultPage({
  outcome,
  foundCharacter,
  errorCode,
  onRetry,
  onContinue,
}: SeekerScanResultPageProps) {
  if (outcome === 'success' && foundCharacter) {
    return (
      <main className="seeker-result seeker-result--success" aria-labelledby="seeker-result-title">
        <section className="seeker-result__content">
          <div className="seeker-result__success-mark" aria-hidden="true">
            ✓
          </div>
          <p className="seeker-result__eyebrow">FOUND</p>
          <h1 id="seeker-result-title">발견했어요!</h1>
          <p className="seeker-result__description">
            {foundCharacter.hiderNickname}님의 카드가 발각되었습니다.
          </p>

          <div className="seeker-result__photos">
            <figure>
              <img src={foundCharacter.originalPhotoUrl} alt="Hider가 촬영한 은신 장소" />
              <figcaption>원래 촬영한 장소</figcaption>
            </figure>
            <figure>
              <img src={foundCharacter.previewImageUrl} alt="장소에 배치한 위장 디자인" />
              <figcaption>이렇게 숨겼어요</figcaption>
            </figure>
          </div>

          <div className="seeker-result__survival">
            <span>Hider 생존 시간</span>
            <strong>{formatSurvivalTime(foundCharacter.survivalSeconds)}</strong>
          </div>

          {onContinue && (
            <button className="seeker-result__primary-button" type="button" onClick={onContinue}>
              다음 카드 찾기
            </button>
          )}
        </section>
      </main>
    )
  }

  const errorContent = getErrorContent(outcome, errorCode)
  const canRetry = outcome !== 'duplicate' && errorCode !== 'SEEK_TIME_EXPIRED'

  return (
    <main className="seeker-result" aria-labelledby="seeker-result-title">
      <section className="seeker-result__content seeker-result__content--error">
        <div className="seeker-result__error-mark" aria-hidden="true">
          !
        </div>
        <p className="seeker-result__eyebrow">{errorContent.eyebrow}</p>
        <h1 id="seeker-result-title">{errorContent.title}</h1>
        <p className="seeker-result__description">{errorContent.description}</p>

        <div className="seeker-result__actions">
          {canRetry && onRetry && (
            <button className="seeker-result__primary-button" type="button" onClick={onRetry}>
              다시 스캔하기
            </button>
          )}
          {onContinue && (
            <button className="seeker-result__secondary-button" type="button" onClick={onContinue}>
              탐색으로 돌아가기
            </button>
          )}
        </div>
      </section>
    </main>
  )
}
