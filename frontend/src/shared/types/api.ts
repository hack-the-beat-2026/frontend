/** contractRules.md §31 — Backend 공통 Error Format */
export type ApiErrorBody = {
  code: string
  message: string
  timestamp: string
}

/** contractRules.md §32 — 반드시 처리해야 하는 Error Code */
export const API_ERROR_CODES = [
  'ROOM_NOT_FOUND',
  'ROOM_FULL',
  'DUPLICATE_NICKNAME',
  'INVALID_TOKEN',
  'ACCESS_DENIED',
  'GAME_NOT_FOUND',
  'GAME_INVALID_STATE',
  'INVALID_GAME_ROLE',
  'CHARACTER_NOT_FOUND',
  'CHARACTER_ALREADY_SUBMITTED',
  'CHARACTER_ALREADY_FOUND',
  'DESIGN_TIME_EXPIRED',
  'SEEK_TIME_EXPIRED',
  'INVALID_QR_TOKEN',
  'DUPLICATE_QR_TOKEN',
  'PRINT_NOT_READY',
] as const

export type KnownApiErrorCode = (typeof API_ERROR_CODES)[number]

/** 목록에 없는 코드가 와도 죽지 않도록 열어 둔다. */
export type ApiErrorCode = KnownApiErrorCode | (string & {})

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly timestamp: string

  constructor(params: {
    code: ApiErrorCode
    message: string
    status: number
    timestamp?: string
  }) {
    super(params.message)
    this.name = 'ApiError'
    this.code = params.code
    this.status = params.status
    this.timestamp = params.timestamp ?? new Date().toISOString()
  }

  /** §33 — 409는 서버 장애가 아니라 게임 상태가 바뀌었다는 신호다. */
  get isConflict(): boolean {
    return this.status === 409 || this.code === 'GAME_INVALID_STATE'
  }

  get isAuthError(): boolean {
    return this.code === 'INVALID_TOKEN' || this.code === 'ACCESS_DENIED'
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
