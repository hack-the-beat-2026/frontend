import type { RouteObject } from 'react-router'
import { CreateRoomPage } from '../pages/CreateRoomPage'
import { HostDashboardPage } from '../pages/HostDashboardPage'
import { HostLobbyPage } from '../pages/HostLobbyPage'
import { JoinRoomPage } from '../pages/JoinRoomPage'
import { LandingPage } from '../pages/LandingPage'
import { LegacyPrintRedirect } from '../pages/LegacyPrintRedirect'
import { PrintPage } from '../pages/PrintPage'
import { partyRoutePaths } from './partyPaths'

/**
 * Front A 소유. Party / Host 화면의 라우트.
 *
 * Root Router(src/routes/AppRouter.tsx)는 이 배열을 spread 하기만 한다.
 * Agent는 Root Router를 직접 수정하지 않는다 (frontend_agent.md Rule 3).
 */
export const partyRoutes: RouteObject[] = [
  { path: partyRoutePaths.landing, element: <LandingPage /> },
  { path: partyRoutePaths.createRoom, element: <CreateRoomPage /> },
  { path: partyRoutePaths.joinRoom, element: <JoinRoomPage /> },
  { path: partyRoutePaths.lobby, element: <HostLobbyPage /> },
  { path: partyRoutePaths.dashboard, element: <HostDashboardPage /> },
  { path: partyRoutePaths.print, element: <PrintPage /> },
  { path: partyRoutePaths.legacyPrint, element: <LegacyPrintRedirect /> },
]
