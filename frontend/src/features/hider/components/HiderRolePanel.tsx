import { HiderTimer } from './HiderTimer'

type HiderRolePanelProps = {
  nickname: string
  timerLabel: string
  timerExpired: boolean
  onStart: () => void
}

/**
 * Role briefing for a HIDER.
 *
 * Exported as a component rather than a route: `/game/:gameId/role` is shared
 * with the seeker feature, so the integration owner owns that route and renders
 * this panel when the backend reports `role === 'HIDER'`. The frontend never
 * decides the role itself (contractRules.md §3).
 */
export function HiderRolePanel({
  nickname,
  timerLabel,
  timerExpired,
  onStart,
}: HiderRolePanelProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-emerald-500/10 px-5 py-6 text-center">
        <p className="text-sm font-medium text-emerald-700">{nickname} 님의 역할</p>
        <p className="mt-1 text-3xl font-semibold text-emerald-900">숨는 사람</p>
      </div>

      <HiderTimer
        label={timerLabel}
        expired={timerExpired}
        title="디자인 남은 시간"
      />

      <ol className="flex flex-col gap-2 text-sm text-neutral-600">
        <li>1. 카드를 숨길 장소를 촬영합니다.</li>
        <li>2. 사람 모형을 배경 위에 배치합니다.</li>
        <li>3. 스포이드로 배경 색을 뽑아 모형을 위장시킵니다.</li>
        <li>4. 제출하면 주최자가 종이 카드로 출력해 줍니다.</li>
      </ol>

      <button
        type="button"
        onClick={onStart}
        className="rounded-xl bg-neutral-900 px-4 py-3 font-medium text-white"
      >
        촬영 시작
      </button>
    </div>
  )
}
