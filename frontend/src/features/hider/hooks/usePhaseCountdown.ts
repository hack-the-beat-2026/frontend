import { useEffect, useState } from 'react'

/**
 * Display-only countdown — contractRules.md §13.
 *
 * This hook computes `startedAt + duration - now` and nothing else. Reaching
 * zero must NOT auto-submit, change a CharacterStatus or advance the game
 * phase; the backend owns expiry. `expired` exists purely so the UI can say
 * "waiting for the server".
 */
export function usePhaseCountdown(
  startedAt: string | null,
  durationSeconds: number,
) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)

    return () => window.clearInterval(timer)
  }, [])

  if (!startedAt) {
    return { remainingSeconds: null, expired: false, label: '--:--' }
  }

  const endsAt = new Date(startedAt).getTime() + durationSeconds * 1000
  const remainingSeconds = Math.max(0, Math.ceil((endsAt - now) / 1000))
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  return {
    remainingSeconds,
    expired: remainingSeconds === 0,
    label: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
  }
}
