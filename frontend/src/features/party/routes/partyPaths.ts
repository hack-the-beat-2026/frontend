export const partyRoutePaths = {
  landing: '/',
  createRoom: '/host/create',
  joinRoom: '/join/:roomCode',
  lobby: '/host/room/:roomCode',
  dashboard: '/host/game/:gameId',
  /**
   * architecture.md §17.5와 contractRules.md §28이 정한 정식 경로.
   * contractRules.md §34의 라우트 트리는 `/host/print/:gameId`로 적혀 있어
   * 아래 legacyPrint를 리다이렉트로 함께 유지한다.
   */
  print: '/host/games/:gameId/print',
  legacyPrint: '/host/print/:gameId',
} as const

export type PartyRouteName = keyof typeof partyRoutePaths

export type PartyRouteParams = {
  landing: undefined
  createRoom: undefined
  joinRoom: { roomCode: string }
  lobby: { roomCode: string }
  dashboard: { gameId: number | string }
  print: { gameId: number | string }
  legacyPrint: { gameId: number | string }
}

const encodePathSegment = (value: number | string) =>
  encodeURIComponent(String(value))

export function toPartyRoute<Name extends PartyRouteName>(
  name: Name,
  ...args: PartyRouteParams[Name] extends undefined
    ? []
    : [params: PartyRouteParams[Name]]
) {
  const params = args[0] as Record<string, number | string> | undefined

  if (!params) {
    return partyRoutePaths[name]
  }

  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, encodePathSegment(value)),
    partyRoutePaths[name] as string,
  )
}
