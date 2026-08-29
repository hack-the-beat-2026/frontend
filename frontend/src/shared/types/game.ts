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
