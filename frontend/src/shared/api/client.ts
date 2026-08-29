import { env } from '@/shared/config/env'
import { getSession } from '@/shared/store/sessionStore'
import { ApiError } from '@/shared/types'
import type { ApiErrorBody } from '@/shared/types'
import { mockRequest } from './mock'

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

/**
 * 어떤 Token으로 요청할지.
 * - 'host'        : HOST 전용 엔드포인트
 * - 'participant' : PLAYER 전용 엔드포인트
 * - 'auto'        : 현재 탭이 가진 Token을 사용 (session은 탭 단위로 격리돼 있다)
 * - 'none'        : Authorization 없이
 */
export type AuthMode = 'host' | 'participant' | 'auto' | 'none'

export type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  auth?: AuthMode
  signal?: AbortSignal
}

function resolveToken(auth: AuthMode): string | null {
  const session = getSession()
  switch (auth) {
    case 'host':
      return session.hostToken
    case 'participant':
      return session.participantToken
    case 'auto':
      return session.hostToken ?? session.participantToken
    case 'none':
      return null
  }
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { code?: unknown }).code === 'string'
  )
}

async function toApiError(response: Response): Promise<ApiError> {
  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    body = null
  }

  if (isErrorBody(body)) {
    return new ApiError({
      code: body.code,
      message: body.message,
      status: response.status,
      timestamp: body.timestamp,
    })
  }

  return new ApiError({
    code: `HTTP_${response.status}`,
    message: response.statusText || '요청을 처리하지 못했습니다.',
    status: response.status,
  })
}

/**
 * contractRules.md §6, §7, §8, §31.
 *
 * - Base URL은 항상 /api/v1
 * - Authorization: Bearer {token}
 * - Backend Error는 ApiError로 정규화해 던진다 (code 기준 분기가 가능하도록)
 *
 * React Component에서 이 함수를 직접 호출하지 않는다.
 * 반드시 roomApi / gameApi / characterApi / scanApi / printApi를 거친다.
 */
export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, auth = 'auto', signal } = options

  if (env.isMock) {
    return mockRequest<T>(path, { method, body, auth })
  }

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = resolveToken(auth)
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${env.apiBaseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiError({
      code: 'NETWORK_ERROR',
      message: '서버에 연결하지 못했습니다.',
      status: 0,
    })
  }

  if (!response.ok) throw await toApiError(response)

  if (response.status === 204) return undefined as T
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}
