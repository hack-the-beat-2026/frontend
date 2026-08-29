import type { GameStatus } from '../../../shared/types'

type HiderWaitPageProps = {
  gameStatus: GameStatus
  previewUrl?: string | null
}

/**
 * Post-submit waiting room.
 *
 * The copy is driven entirely by the backend `GameStatus` — the frontend never
 * decides that design is over or that printing has started (contractRules.md §1).
 * There is deliberately no re-submit button (§17).
 */
export function HiderWaitPage({ gameStatus, previewUrl }: HiderWaitPageProps) {
  const message =
    gameStatus === 'DESIGNING'
      ? '다른 숨는 사람들이 아직 디자인 중이에요.'
      : gameStatus === 'PRINTING'
        ? '주최자가 카드를 출력하고 있어요. 잠시만 기다려 주세요.'
        : gameStatus === 'HIDING'
          ? '카드를 받았다면 촬영했던 그 자리에 숨겨 주세요.'
          : '주최자가 다음 단계를 시작할 때까지 기다려 주세요.'

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 p-4">
      <div className="rounded-2xl bg-emerald-500/10 px-5 py-6 text-center">
        <p className="text-2xl font-semibold text-emerald-900">제출 완료</p>
        <p className="mt-1 text-sm text-emerald-700">{message}</p>
      </div>

      {previewUrl ? (
        <figure className="flex flex-col gap-2">
          <img
            src={previewUrl}
            alt="제출한 위장 미리보기"
            className="w-full rounded-2xl"
          />
          <figcaption className="text-center text-xs text-neutral-400">
            내가 제출한 위장
          </figcaption>
        </figure>
      ) : null}

      <p className="text-center text-xs text-neutral-400">
        현재 단계: {gameStatus}
      </p>
    </div>
  )
}
