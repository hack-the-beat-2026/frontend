import type { Participant } from './participant'

/** contractRules.md §2. Frontend가 이름을 바꾸거나 값을 추가하지 않는다. */
export type GameStatus =
  | 'WAITING'
  | 'ROLE_ASSIGNED'
  | 'DESIGNING'
  | 'PRINTING'
  | 'HIDING'
  | 'SEEKING'
  | 'FINISHED'

export type GameWinner = 'NONE' | 'HIDER' | 'SEEKER'

/**
 * §13의 타이머 필드. 남은 시간 표시는 UX 전용이며,
 * 시간 만료의 최종 판정은 Backend가 한다.
 */
export type GameTimers = {
  designStartedAt: string | null
  designDurationSeconds: number
  hideStartedAt: string | null
  hideDurationSeconds: number
  seekStartedAt: string | null
  seekDurationSeconds: number
}

export type Game = GameTimers & {
  gameId: number
  roomId: number
  status: GameStatus
  seekerCount: number
  winner: GameWinner
  /** 백엔드 확인 항목 2번 — Game 응답에 participants가 실리는지 미확정. */
  participants?: Participant[]
  hiderCount?: number
  foundCount?: number
  submittedCount?: number
  finishedAt?: string | null
}

/** GameStatus의 진행 순서. 스텝퍼 표시와 버튼 활성화 판정에 쓴다. */
export const GAME_STATUS_ORDER: readonly GameStatus[] = [
  'WAITING',
  'ROLE_ASSIGNED',
  'DESIGNING',
  'PRINTING',
  'HIDING',
  'SEEKING',
  'FINISHED',
]

export function gameStatusIndex(status: GameStatus): number {
  return GAME_STATUS_ORDER.indexOf(status)
}

/** UI 활성화 판정 전용. 실제 권한과 상태 판정은 Backend가 한다 (§11). */
export function isAtOrAfter(status: GameStatus, target: GameStatus): boolean {
  return gameStatusIndex(status) >= gameStatusIndex(target)
}
