import type { ApiError } from '../types'

/**
 * Shared HTTP client.
 *
 * Source: contractRules.md §7 (base URL), §6 (token handling) and §31 (error
 * shape). Features must never call `fetch` directly (§8) and must never mint a
 * token themselves (§6) — this module only ever *reads* stored tokens.
 */

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '')

export const API_ORIGIN = API_BASE_URL.startsWith('http')
  ? new URL(API_BASE_URL).origin
  : window.location.origin

export function resolveAssetUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`
}

export const HOST_TOKEN_KEY = 'hostToken'
export const PARTICIPANT_TOKEN_KEY = 'participantToken'

export type TokenKind = 'host' | 'participant'

/** Error thrown for any non-2xx response, carrying the backend `code` (§31). */
export class ApiRequestError extends Error {
  status: number
  code: string
  timestamp: string
  fieldErrors?: Record<string, string>

  constructor(status: number, body: ApiError) {
    super(body.message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = body.code
    this.timestamp = body.timestamp
    this.fieldErrors = body.fieldErrors
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError
}

function readToken(kind: TokenKind) {
  const key = kind === 'host' ? HOST_TOKEN_KEY : PARTICIPANT_TOKEN_KEY

  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function saveToken(kind: TokenKind, token: string) {
  const key = kind === 'host' ? HOST_TOKEN_KEY : PARTICIPANT_TOKEN_KEY
  localStorage.setItem(key, token)
}

export function clearTokens() {
  localStorage.removeItem(HOST_TOKEN_KEY)
  localStorage.removeItem(PARTICIPANT_TOKEN_KEY)
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as Partial<ApiError>

    if (typeof body?.code === 'string') {
      return {
        code: body.code,
        message: body.message ?? response.statusText,
        timestamp: body.timestamp ?? new Date().toISOString(),
        fieldErrors: body.fieldErrors,
      }
    }
  } catch {
    // Fall through to the generic shape below.
  }

  return {
    code: `HTTP_${response.status}`,
    message: response.statusText || 'Request failed',
    timestamp: new Date().toISOString(),
  }
}

export type RequestOptions = {
  method?: string
  body?: unknown
  /** Which stored token to send as `Authorization: Bearer ...` (§6). */
  auth?: TokenKind
  signal?: AbortSignal
}

export async function request<TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const { method = 'GET', body, auth, signal } = options
  const headers: Record<string, string> = {}

  if (body !== undefined) {
    if (!(body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }
  }

  if (auth) {
    const token = readToken(auth)

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    signal,
    body:
      body === undefined || body instanceof FormData
        ? body
        : JSON.stringify(body),
  })

  if (!response.ok) {
    throw new ApiRequestError(response.status, await toApiError(response))
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return (await response.json()) as TResponse
}

/** Fetch a protected binary asset such as the host-only QR image. */
export async function requestBlob(
  path: string,
  options: Omit<RequestOptions, 'body'> = {},
): Promise<Blob> {
  const { method = 'GET', auth, signal } = options
  const headers: Record<string, string> = {}

  if (auth) {
    const token = readToken(auth)

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    signal,
  })

  if (!response.ok) {
    throw new ApiRequestError(response.status, await toApiError(response))
  }

  return response.blob()
}
