/**
 * API error contracts.
 *
 * Source: contractRules.md §31 (error shape) and §32 (codes that must be
 * handled). Features branch on `code`, never on the raw HTTP status (§31).
 */

export type ApiErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'DUPLICATE_NICKNAME'
  | 'INVALID_TOKEN'
  | 'ACCESS_DENIED'
  | 'GAME_NOT_FOUND'
  | 'GAME_INVALID_STATE'
  | 'INVALID_GAME_ROLE'
  | 'CHARACTER_NOT_FOUND'
  | 'CHARACTER_ALREADY_SUBMITTED'
  | 'CHARACTER_ALREADY_FOUND'
  | 'DESIGN_TIME_EXPIRED'
  | 'SEEK_TIME_EXPIRED'
  | 'INVALID_QR_TOKEN'
  | 'DUPLICATE_QR_TOKEN'
  | 'PRINT_NOT_READY'

export type ApiError = {
  code: string
  message: string
  timestamp: string
  fieldErrors?: Record<string, string>
}
