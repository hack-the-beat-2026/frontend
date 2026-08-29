import { request } from './client'
import type { Character, CharacterFoundResponse } from '@/shared/types'

/**
 * Front C 소유 영역. 시그니처만 먼저 고정해 둔다.
 *
 * architecture.md §13.2 — GET /api/v1/characters/qr/{qrToken}
 * /c/:qrToken 진입 시 바로 발견 처리하지 말고, 먼저 이걸로 확인한다 (contractRules §20).
 */
export function getCharacterByQrToken(qrToken: string): Promise<Character> {
  return request<Character>(
    `/characters/qr/${encodeURIComponent(qrToken)}`,
    { auth: 'auto' },
  )
}

/**
 * architecture.md §13.3 — POST /api/v1/games/{gameId}/characters/{qrToken}/found
 *
 * SEEKER 여부, SEEKING 상태, qrToken 유효성, 소속 게임, 중복 발견은 전부 서버가 검증한다.
 * 동시 스캔은 원자적 UPDATE로 하나만 성공한다 (§22).
 */
export function markCharacterFound(
  gameId: number,
  qrToken: string,
): Promise<CharacterFoundResponse> {
  return request<CharacterFoundResponse>(
    `/games/${gameId}/characters/${encodeURIComponent(qrToken)}/found`,
    { method: 'POST', auth: 'participant' },
  )
}
