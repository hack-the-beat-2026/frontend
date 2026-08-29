/**
 * backend/architecture.md §7.4, §19(characters), CharacterStatus.java
 *
 * ⚠️ contractRules.md §5는 'EDITING'을 포함하지만 Backend enum에는 없다.
 * EDITING은 Frontend Editor의 로컬 UI 상태이고, 서버 Character는 SUBMITTED부터 시작한다.
 * SSOT는 architecture.md이므로 여기서는 Backend enum을 따른다.
 */
export type CharacterStatus =
  | 'SUBMITTED'
  | 'PRINTED'
  | 'HIDDEN'
  | 'FOUND'
  | 'SURVIVED'

/**
 * architecture.md §16 / contractRules.md §16.
 * positionX / positionY는 Canvas Pixel이 아니라 0~1 비율이다 (DB CHECK 제약).
 */
export type CharacterTransform = {
  positionX: number
  positionY: number
  scale: number
  rotation: number
}

/** POST /api/v1/games/{gameId}/characters */
export type CharacterSubmitRequest = CharacterTransform & {
  templateType: string
  originalPhotoUrl: string
  characterImageUrl: string
  previewImageUrl: string
}

export type Character = CharacterTransform & {
  characterId: number
  gameId: number
  participantId: number
  hiderNickname: string
  templateType: string
  originalPhotoUrl: string
  characterImageUrl: string
  previewImageUrl: string
  status: CharacterStatus
  submittedAt: string
  printedAt: string | null
  foundAt: string | null
  foundByParticipantId: number | null
  survivalSeconds: number | null
}

/**
 * GET /api/v1/games/{gameId}/print-sheet (architecture.md §17.5)
 *
 * qrToken은 Backend가 제출 시점에 생성한다 (§13.1). Frontend는 절대 만들지 않는다.
 * QR 이미지는 영속화하지 않고 인쇄 페이지에서 qrToken으로 렌더한다 (§21 규칙 24).
 */
export type PrintCharacter = {
  characterId: number
  hiderNickname?: string
  characterImageUrl: string
  qrToken: string
  status?: CharacterStatus
}

export type PrintSheet = {
  gameId: number
  characters: PrintCharacter[]
}

/** architecture.md §13.3 */
export type CharacterFoundResponse = {
  characterId: number
  hiderNickname: string
  originalPhotoUrl: string
  previewImageUrl: string
  survivalSeconds: number
}
