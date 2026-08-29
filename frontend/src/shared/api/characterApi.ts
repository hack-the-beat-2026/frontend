import type { CharacterResponse, CharacterSubmitRequest } from '../types'
import { request } from './client'

export type SubmitCharacterResponse = CharacterResponse

export type CharacterSubmitImages = {
  originalPhoto: Blob
  characterImage: Blob
  previewImage: Blob
}

/** Submit the three image parts and JSON metadata expected by the backend. */
export function submitCharacter(
  gameId: number | string,
  metadata: CharacterSubmitRequest,
  images: CharacterSubmitImages,
) {
  const form = new FormData()
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
    'metadata.json',
  )
  form.append('originalPhoto', images.originalPhoto, 'original.jpg')
  form.append('characterImage', images.characterImage, 'character.png')
  form.append('previewImage', images.previewImage, 'preview.jpg')

  return request<SubmitCharacterResponse>(
    `/games/${encodeURIComponent(String(gameId))}/characters`,
    { method: 'POST', body: form, auth: 'participant' },
  )
}
