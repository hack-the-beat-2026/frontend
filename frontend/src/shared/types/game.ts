/**
 * Backend Game Status.
 *
 * Source: contractRules.md §2. Do not rename, extend, or add UI-only phases
 * such as LOBBY / READY / GAME_OVER. Feature-local UI state must be declared
 * separately inside the owning feature.
 */
export type GameStatus =
  | 'WAITING'
  | 'ROLE_ASSIGNED'
  | 'DESIGNING'
  | 'PRINTING'
  | 'HIDING'
  | 'SEEKING'
  | 'FINISHED'

export type GameWinner = 'NONE' | 'HIDER' | 'SEEKER'

export type GameResponse = {
  gameId: number
  roomId: number
  status: GameStatus
  myRole: import('./participant').GameRole
  myParticipantStatus?: import('./participant').ParticipantStatus
  seekerCount: number
  hiderCount: number
  designDurationSeconds: number
  hideDurationSeconds: number
  seekDurationSeconds: number
  designStartedAt: string | null
  designEndsAt: string | null
  hideStartedAt: string | null
  hideEndsAt: string | null
  seekStartedAt: string | null
  seekEndsAt: string | null
  finishedAt: string | null
  winner: GameWinner
}
