import type { RouteObject } from 'react-router'

/**
 * Front A 소유. Party / Host 화면의 라우트를 여기에 등록한다.
 *
 * Root Router(src/routes/AppRouter.tsx)는 이 배열을 spread 하기만 한다.
 * Agent는 Root Router를 직접 수정하지 않는다 (frontend_agent.md Rule 3).
 */
export const partyRoutes: RouteObject[] = []
