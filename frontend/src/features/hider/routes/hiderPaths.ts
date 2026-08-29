/**
 * Hider route paths.
 *
 * Source: contractRules.md §34. Where the collaboration guide and the backend
 * contract disagree on route shape, the contract wins — the same call Front A
 * made in `features/party/routes/partyPaths.ts`.
 *
 * `/game/:gameId/role` is intentionally NOT owned here: it is shared between
 * HIDER and SEEKER, so the integration owner routes it and renders
 * `HiderRolePanel` when the backend reports `role === 'HIDER'`.
 */
export const hiderRoutePaths = {
  design: '/game/:gameId/hider/design',
  wait: '/game/:gameId/hider/wait',
  hide: '/game/:gameId/hider/hide',
} as const

export type HiderRouteName = keyof typeof hiderRoutePaths

export type HiderRouteParams = {
  design: { gameId: number | string }
  wait: { gameId: number | string }
  hide: { gameId: number | string }
}

const encodePathSegment = (value: number | string) =>
  encodeURIComponent(String(value))

export function toHiderRoute<Name extends HiderRouteName>(
  name: Name,
  params: HiderRouteParams[Name],
) {
  return Object.entries(params as Record<string, number | string>).reduce(
    (path, [key, value]) => path.replace(`:${key}`, encodePathSegment(value)),
    hiderRoutePaths[name] as string,
  )
}
