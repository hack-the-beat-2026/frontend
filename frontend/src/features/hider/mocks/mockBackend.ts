import type { ApiError } from '../../../shared/types'

/**
 * Development-only `fetch` interceptor.
 *
 * It stubs the network at the boundary rather than swapping out `shared/api`,
 * so the dev harness exercises the real client: base URL, Bearer header,
 * `ApiError` parsing and the §32 error-code mapping all run for real.
 *
 * Used only from `features/hider/dev/`. Never imported by feature code.
 */

export type MockScenario =
  | 'SUCCESS'
  | 'CHARACTER_ALREADY_SUBMITTED'
  | 'DESIGN_TIME_EXPIRED'
  | 'GAME_INVALID_STATE'

const ERROR_STATUS: Record<Exclude<MockScenario, 'SUCCESS'>, number> = {
  CHARACTER_ALREADY_SUBMITTED: 409,
  DESIGN_TIME_EXPIRED: 409,
  GAME_INVALID_STATE: 409,
}

const ERROR_MESSAGES: Record<Exclude<MockScenario, 'SUCCESS'>, string> = {
  CHARACTER_ALREADY_SUBMITTED: 'Character already submitted for this game.',
  DESIGN_TIME_EXPIRED: 'Design phase has ended.',
  GAME_INVALID_STATE: 'Game is not in DESIGNING state.',
}

let scenario: MockScenario = 'SUCCESS'

export function setMockScenario(next: MockScenario) {
  scenario = next
}

export function getMockScenario() {
  return scenario
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function installMockBackend() {
  const originalFetch = globalThis.fetch.bind(globalThis)

  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input)

    if (!url.includes('/api/v1/')) {
      return originalFetch(input, init)
    }

    // Make the loading states visible.
    await new Promise((resolve) => setTimeout(resolve, 600))

    if (/\/api\/v1\/games\/[^/]+\/characters$/.test(url)) {
      if (scenario === 'SUCCESS') {
        return jsonResponse({ characterId: 42 }, 201)
      }

      const error: ApiError = {
        code: scenario,
        message: ERROR_MESSAGES[scenario],
        timestamp: new Date().toISOString(),
      }

      return jsonResponse(error, ERROR_STATUS[scenario])
    }

    return jsonResponse(
      {
        code: 'HTTP_404',
        message: `Unmocked endpoint: ${url}`,
        timestamp: new Date().toISOString(),
      },
      404,
    )
  }
}
