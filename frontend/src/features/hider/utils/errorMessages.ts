import { isApiRequestError } from '../../../shared/api'

/**
 * Maps the backend error codes a hider can actually hit (contractRules.md §32)
 * to Korean copy. Branching happens on `code`, never on the HTTP status (§31).
 */
const HIDER_ERROR_MESSAGES: Record<string, string> = {
  CHARACTER_ALREADY_SUBMITTED:
    '이미 제출한 캐릭터가 있습니다. 한 게임에 한 장만 제출할 수 있어요.',
  DESIGN_TIME_EXPIRED: '디자인 제한 시간이 종료되었습니다.',
  GAME_INVALID_STATE: '게임 단계가 이미 넘어갔습니다. 최신 상태를 불러와 주세요.',
  GAME_NOT_FOUND: '게임을 찾을 수 없습니다.',
  INVALID_GAME_ROLE: '숨는 사람만 캐릭터를 제출할 수 있습니다.',
  INVALID_TOKEN: '세션이 만료되었습니다. 방에 다시 입장해 주세요.',
  ACCESS_DENIED: '권한이 없습니다.',
}

/**
 * Codes that mean the server moved on rather than that something broke.
 * contractRules.md §33: treat these as a normal game flow and refetch state.
 */
const STATE_MOVED_ON = new Set([
  'GAME_INVALID_STATE',
  'CHARACTER_ALREADY_SUBMITTED',
  'DESIGN_TIME_EXPIRED',
])

export type HiderErrorInfo = {
  code: string
  message: string
  /** True when the UI should re-sync with the backend instead of retrying. */
  needsRefresh: boolean
}

export function toHiderError(error: unknown): HiderErrorInfo {
  if (isApiRequestError(error)) {
    return {
      code: error.code,
      message: HIDER_ERROR_MESSAGES[error.code] ?? error.message,
      needsRefresh: error.status === 409 || STATE_MOVED_ON.has(error.code),
    }
  }

  return {
    code: 'UNKNOWN',
    message:
      error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
    needsRefresh: false,
  }
}
