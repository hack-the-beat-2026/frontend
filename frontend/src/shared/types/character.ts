/**
 * Character contracts.
 *
 * Source: contractRules.md §5 (CharacterStatus), §16 (CharacterTransform),
 * §17 (CharacterSubmitRequest) and §22 (CharacterFoundResponse).
 *
 * The frontend never advances CharacterStatus on its own and never creates or
 * modifies a qrToken — the backend generates it on submit (§18).
 */

export type CharacterStatus =
  | 'EDITING'
  | 'SUBMITTED'
  | 'PRINTED'
  | 'HIDDEN'
  | 'FOUND'
  | 'SURVIVED'

/**
 * Placement of the character on top of the original photo.
 *
 * positionX / positionY are ratios in the 0..1 range, not canvas pixels, so the
 * placement can be reproduced on any screen size (§16).
 */
export type CharacterTransform = {
  positionX: number
  positionY: number
  scale: number
  rotation: number
}

export type CharacterSubmitRequest = {
  templateType: string
  positionX: number
  positionY: number

  scale: number
  rotation: number
}

export type CharacterResponse = CharacterSubmitRequest & {
  characterId: number
  gameId: number
  participantId: number
  nickname: string
  originalPhotoUrl: string
  characterImageUrl: string
  previewImageUrl: string
  qrToken?: string
  status: CharacterStatus
  submittedAt: string
}

export type CharacterFoundResponse = {
  characterId: number
  hiderNickname: string
  originalPhotoUrl: string
  previewImageUrl: string
  survivalSeconds: number
}
