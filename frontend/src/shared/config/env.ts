export type ApiMode = 'live' | 'mock'

const rawMode = import.meta.env.VITE_API_MODE
const apiMode: ApiMode = rawMode === 'live' ? 'live' : 'mock'

/**
 * 모든 REST 호출은 contractRules.md §7에 따라 `/api/v1`을 base로 한다.
 * 배포 환경에서는 VITE_API_BASE_URL로 절대 주소를 주입한다.
 */
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  wsUrl: import.meta.env.VITE_WS_URL ?? '/ws',
  apiMode,
  isMock: apiMode === 'mock',
} as const
