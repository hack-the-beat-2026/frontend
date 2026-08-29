import { isApiError } from '@/shared/types'

/**
 * contractRules.md §31 — HTTP status가 아니라 code로 분기한다.
 * Front A와 관련된 코드만 다룬다. 나머지는 서버 message를 그대로 보여준다.
 */
const MESSAGES: Record<string, string> = {
  ROOM_NOT_FOUND: '그런 방이 없어요. 코드를 다시 확인해 주세요.',
  ROOM_FULL: '방이 가득 찼어요. 최대 10명까지 참여할 수 있어요.',
  DUPLICATE_NICKNAME: '이미 쓰고 있는 이름이에요. 다른 이름으로 해주세요.',
  INVALID_TOKEN: '세션이 만료됐어요. 처음부터 다시 시작해 주세요.',
  ACCESS_DENIED: '이 작업은 방장만 할 수 있어요.',
  GAME_NOT_FOUND: '게임을 찾을 수 없어요.',
  GAME_INVALID_STATE: '지금 단계에서는 할 수 없는 동작이에요.',
  PRINT_NOT_READY: '아직 인쇄할 수 없어요. 모든 참가자의 제출을 기다려 주세요.',
  NETWORK_ERROR: '서버에 연결하지 못했어요. 네트워크를 확인해 주세요.',
}

export function errorMessage(error: unknown): string {
  if (isApiError(error)) {
    return MESSAGES[error.code] ?? error.message
  }
  if (error instanceof Error) return error.message
  return '알 수 없는 오류가 발생했어요.'
}
