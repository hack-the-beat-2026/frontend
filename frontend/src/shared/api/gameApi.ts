import { request } from './client'
import type { Game } from '@/shared/types'

/** contractRules.md §11 — HOST만 수행. 권한 검증은 Backend가 한다. */
export function startGame(roomId: number): Promise<Game> {
  return request<Game>(`/rooms/${roomId}/games/start`, {
    method: 'POST',
    auth: 'host',
  })
}

export function getGame(gameId: number): Promise<Game> {
  return request<Game>(`/games/${gameId}`)
}

/** contractRules.md §12 */
export function startHiding(gameId: number): Promise<Game> {
  return request<Game>(`/games/${gameId}/hiding/start`, {
    method: 'POST',
    auth: 'host',
  })
}

export function startSeeking(gameId: number): Promise<Game> {
  return request<Game>(`/games/${gameId}/seeking/start`, {
    method: 'POST',
    auth: 'host',
  })
}

export function finishGame(gameId: number): Promise<Game> {
  return request<Game>(`/games/${gameId}/finish`, {
    method: 'POST',
    auth: 'host',
  })
}
