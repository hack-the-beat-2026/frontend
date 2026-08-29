type HiderTimerProps = {
  label: string
  expired: boolean
  title?: string
}

/**
 * Display-only phase timer (contractRules.md §13).
 *
 * Hitting zero changes nothing on its own — the backend decides when a phase
 * actually ends, so the expired state only tells the hider we are waiting.
 */
export function HiderTimer({ label, expired, title = '남은 시간' }: HiderTimerProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 rounded-xl bg-neutral-500/10 px-4 py-3">
      <span className="text-sm font-medium text-neutral-500">{title}</span>
      {expired ? (
        <span className="text-sm font-medium text-amber-600">
          시간 만료 — 서버 확인 중
        </span>
      ) : (
        <span className="text-2xl font-semibold tabular-nums text-neutral-800">
          {label}
        </span>
      )}
    </div>
  )
}
