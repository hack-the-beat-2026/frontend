import type { RouteObject } from 'react-router'

/**
 * Front C 소유. Seeker / QR / Result 화면의 라우트를 여기에 등록한다.
 *
 * 담당 경로 (contractRules.md §34):
 *   /game/:gameId/seeker/wait
 *   /game/:gameId/seeker/scan
 *   /game/:gameId/found/:characterId
 *   /game/:gameId/result
 *   /c/:qrToken
 *
 * Root Router는 이 배열을 spread 하기만 하므로 Root Router를 수정할 필요가 없다.
 */
export const seekerRoutes: RouteObject[] = []
