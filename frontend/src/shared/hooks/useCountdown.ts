import { useEffect, useState } from 'react'

export type Countdown = {
  /** 남은 초. 만료되면 0. startedAt이 없으면 null. */
  remainingSeconds: number | null
  totalSeconds: number
  expired: boolean
  /** 0~1 진행률. startedAt이 없으면 0. */
  progress: number
}

function computeRemaining(
  startedAt: string | null,
  durationSeconds: number,
): number | null {
  if (!startedAt) return null
  const started = Date.parse(startedAt)
  if (Number.isNaN(started)) return null
  const elapsed = (Date.now() - started) / 1000
  return Math.max(0, Math.round(durationSeconds - elapsed))
}

/**
 * contractRules.md §13 — Frontend Countdown은 UX 전용이다.
 * 이 훅의 `expired`를 근거로 게임 단계를 넘기거나 자동 제출하지 않는다.
 * 시간 만료의 최종 판정은 Backend가 한다.
 */
export function useCountdown(
  startedAt: string | null,
  durationSeconds: number,
): Countdown {
  // 남은 시간은 render 시점에 계산한다. 상태는 1초마다 다시 그리기 위한 tick뿐이다.
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!startedAt) return

    const id = window.setInterval(() => {
      setTick((tick) => tick + 1)
    }, 1000)

    return () => window.clearInterval(id)
  }, [startedAt])

  const remainingSeconds = computeRemaining(startedAt, durationSeconds)

  return {
    remainingSeconds,
    totalSeconds: durationSeconds,
    expired: remainingSeconds !== null && remainingSeconds <= 0,
    progress:
      remainingSeconds === null || durationSeconds <= 0
        ? 0
        : 1 - remainingSeconds / durationSeconds,
  }
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return '--:--'
  const clamped = Math.max(0, Math.floor(seconds))
  const m = Math.floor(clamped / 60)
  const s = clamped % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
