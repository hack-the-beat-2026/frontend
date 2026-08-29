import { request } from './client'
import type { PrintSheet } from '@/shared/types'

/**
 * architecture.md §17.5 — GET /api/v1/games/{gameId}/print-sheet
 *
 * qrToken이 실려 오므로 HOST 토큰으로만 호출한다.
 * QR 이미지는 서버가 주지 않는다. 인쇄 페이지가 qrToken으로 직접 렌더한다 (§21 규칙 24).
 */
export function getPrintSheet(gameId: number): Promise<PrintSheet> {
  return request<PrintSheet>(`/games/${gameId}/print-sheet`, { auth: 'host' })
}
