import { createBrowserRouter, RouterProvider } from 'react-router'
import { partyRoutes } from '@/features/party/routes/partyRoutes'
import { hiderRoutes } from '@/features/hider/routes/hiderRoutes'
import { seekerRoutes } from '@/features/seeker/routes/seekerRoutes'
import { NotFoundPage } from './NotFoundPage'

/**
 * Root Router. 통합 담당자만 수정한다 (frontend_agent.md Rule 3).
 *
 * 각 Feature는 자기 `*Routes.tsx` 배열에만 라우트를 추가하면 되고,
 * 이 파일을 건드릴 필요가 없다. 그래야 3인이 동시에 작업해도 충돌하지 않는다.
 */
const router = createBrowserRouter([
  ...partyRoutes,
  ...hiderRoutes,
  ...seekerRoutes,
  { path: '*', element: <NotFoundPage /> },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
