/**
 * contractRules.md §3, §4.
 * 이 값들은 Backend 공식 값이다. Feature에서 재정의하거나 값을 추가하지 않는다.
 */

export type ParticipantType = 'HOST' | 'PLAYER'

export type GameRole = 'NONE' | 'HIDER' | 'SEEKER'

export type ParticipantStatus =
  | 'WAITING'
  | 'ACTIVE'
  | 'ELIMINATED'
  | 'SURVIVED'
  | 'LEFT'

export type Participant = {
  participantId: number
  nickname: string
  type: ParticipantType
  status: ParticipantStatus
  /**
   * 역할은 Backend가 배정한다 (§3).
   * §30에 따라 다른 참가자의 역할은 노출되지 않을 수 있으므로 'NONE'일 수 있다.
   * HOST 응답에 실제 역할이 실리는지는 백엔드 확인 항목 7번.
   */
  role: GameRole
}
