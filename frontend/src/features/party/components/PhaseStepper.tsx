import type { GameStatus } from '@/shared/types'
import { gameStatusIndex } from '@/shared/types'

/**
 * Backend GameStatus를 그대로 표시한다.
 * 라벨만 한국어로 바꾸고, LOBBY / READY 같은 별도 Phase 이름을 만들지 않는다
 * (contractRules.md §2).
 */
const STEPS: { status: GameStatus; label: string }[] = [
  { status: 'DESIGNING', label: '위장 제작' },
  { status: 'PRINTING', label: '인쇄' },
  { status: 'HIDING', label: '숨기기' },
  { status: 'SEEKING', label: '탐색' },
  { status: 'FINISHED', label: '종료' },
]

export function PhaseStepper({ status }: { status: GameStatus }) {
  const current = gameStatusIndex(status)

  return (
    <ol className="flex items-center gap-1">
      {STEPS.map((step) => {
        const index = gameStatusIndex(step.status)
        const done = current > index
        const active = current === index

        return (
          <li key={step.status} className="flex-1">
            <div
              className={`h-1.5 rounded-full ${
                done
                  ? 'bg-emerald-600'
                  : active
                    ? 'bg-emerald-400'
                    : 'bg-neutral-200'
              }`}
            />
            <p
              className={`mt-1.5 text-center text-[11px] font-medium ${
                active
                  ? 'text-emerald-700'
                  : done
                    ? 'text-neutral-600'
                    : 'text-neutral-400'
              }`}
            >
              {step.label}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
