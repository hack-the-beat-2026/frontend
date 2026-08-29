import type { RouteObject } from 'react-router'

/**
 * Front B 소유. Hider / Camouflage Editor 화면의 라우트를 여기에 등록한다.
 *
 * 담당 경로 (contractRules.md §34):
 *   /game/:gameId/role
 *   /game/:gameId/hider/design
 *   /game/:gameId/hider/wait
 *   /game/:gameId/hider/hide
 *
 * Root Router는 이 배열을 spread 하기만 하므로 Root Router를 수정할 필요가 없다.
 */
export const hiderRoutes: RouteObject[] = []
