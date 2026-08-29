/** contractRules.md §29 — Frontend가 Event 이름을 임의로 만들지 않는다. */
export type RoomEventType =
  | 'PARTICIPANT_JOINED'
  | 'PARTICIPANT_LEFT'
  | 'GAME_STARTED'
  | 'ROLE_ASSIGNED'
  | 'DESIGN_SUBMITTED'
  | 'DESIGN_PHASE_ENDED'
  | 'HIDING_STARTED'
  | 'HIDER_READY'
  | 'SEEKING_STARTED'
  | 'CHARACTER_FOUND'
  | 'GAME_FINISHED'

/**
 * §39 — Event payload로 전체 State를 재구성하지 않는다.
 * Event는 "무엇을 다시 조회할지"를 알려주는 신호로만 쓴다.
 */
export type RoomEvent = {
  type: RoomEventType
  roomId: number
  gameId?: number
  timestamp: string
  payload?: unknown
}

/** Room Topic 경로 (§29) */
export function roomTopic(roomId: number): string {
  return `/topic/rooms/${roomId}`
}

/** 개인 역할 등 민감 정보 전용 큐 (§30) */
export const USER_GAME_QUEUE = '/user/queue/game'
