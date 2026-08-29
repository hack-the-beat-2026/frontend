/**
 * Participant contracts.
 *
 * Source: contractRules.md §3 (ParticipantType, GameRole) and §4
 * (ParticipantStatus). Role assignment and status transitions are performed by
 * the backend; the frontend only renders what the backend returns.
 */

export type ParticipantType = 'HOST' | 'PLAYER'

export type GameRole = 'NONE' | 'HIDER' | 'SEEKER'

export type ParticipantStatus =
  | 'WAITING'
  | 'ACTIVE'
  | 'ELIMINATED'
  | 'SURVIVED'
  | 'LEFT'
