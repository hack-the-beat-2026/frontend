import type { GameStatus } from '../../../shared/types'

/**
 * Mock game context for standalone development.
 *
 * These values normally come from the backend; nothing here is a source of
 * truth (contractRules.md §1).
 */
export const mockGame = {
  gameId: 1,
  nickname: '지수',
  designDurationSeconds: 600,
  hideDurationSeconds: 300,
  designStartedAt: () => new Date().toISOString(),
  status: 'DESIGNING' as GameStatus,
}
