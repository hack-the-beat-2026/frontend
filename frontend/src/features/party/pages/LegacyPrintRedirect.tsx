import { Navigate, useParams } from 'react-router'
import { toPartyRoute } from '../routes/partyPaths'

/**
 * contractRules.md §34의 라우트 트리는 인쇄를 `/host/print/:gameId`로 적었고,
 * §28과 architecture.md §17.5는 `/host/games/{gameId}/print`로 적었다.
 * 후자를 정식 경로로 쓰고, 전자로 들어와도 깨지지 않게 넘겨 준다.
 */
export function LegacyPrintRedirect() {
  const { gameId = '' } = useParams()
  return <Navigate to={toPartyRoute('print', { gameId })} replace />
}
