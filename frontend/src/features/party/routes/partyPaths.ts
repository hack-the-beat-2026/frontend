export const partyRoutePaths = {
  landing: '/',
  createRoom: '/host/create',
  joinRoom: '/join/:roomCode',
  lobby: '/host/room/:roomCode',
  dashboard: '/host/game/:gameId',
  print: '/host/print/:gameId',
} as const

export type PartyRouteName = keyof typeof partyRoutePaths

export type PartyRouteParams = {
  landing: undefined
  createRoom: undefined
  joinRoom: { roomCode: string }
  lobby: { roomCode: string }
  dashboard: { gameId: number | string }
  print: { gameId: number | string }
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
    (path, [key, value]) =>
      path.replace(`:${key}`, encodePathSegment(value)),
    partyRoutePaths[name] as string,
  )
}
