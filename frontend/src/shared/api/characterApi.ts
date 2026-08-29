import { request } from './client'
import type { Character, CharacterSubmitRequest } from '@/shared/types'

/**
 * Front B 소유 영역. 시그니처만 먼저 고정해 둔다.
 * architecture.md §12 — HIDER는 한 Game에 Character 하나만 제출한다.
 * 디자인 제한시간이 0이 되면 Frontend가 현재 Canvas로 이 API를 한 번 자동 호출한다.
 */
export function submitCharacter(
  gameId: number,
  body: CharacterSubmitRequest,
): Promise<Character> {
  return request<Character>(`/games/${gameId}/characters`, {
    method: 'POST',
    body,
    auth: 'participant',
  })
}

/** GET /api/v1/games/{gameId}/characters/me — HIDER 본인 것만. */
export function getMyCharacter(gameId: number): Promise<Character> {
  return request<Character>(`/games/${gameId}/characters/me`, {
    auth: 'participant',
  })
}

/** GET /api/v1/games/{gameId}/characters — HOST 전용. 대시보드 제출 현황에 쓴다. */
export function getCharacters(gameId: number): Promise<Character[]> {
  return request<Character[]>(`/games/${gameId}/characters`, { auth: 'host' })
}

/**
 * POST /api/v1/games/{gameId}/characters/{characterId}/hidden — HIDER 본인만.
 * architecture.md §21 규칙 26 — 모든 HIDER의 준비 완료가 탐색 시작 조건이다.
 */
export function markCharacterHidden(
  gameId: number,
  characterId: number,
): Promise<Character> {
  return request<Character>(
    `/games/${gameId}/characters/${characterId}/hidden`,
    { method: 'POST', auth: 'participant' },
  )
}
