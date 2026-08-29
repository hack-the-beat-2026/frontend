import type {
  CharacterResponse,
  GameResponse,
  GameWinner,
  GameRole,
  ParticipantStatus,
  ParticipantType,
} from '../types'
import { request, requestBlob } from './client'

export type CreateRoomRequest = {
  name: string
  designDurationSeconds: number
  hideDurationSeconds: number
  seekDurationSeconds: number
  seekerCount: number
}

export type CreateRoomResponse = {
  roomId: number
  gameId: number
  roomCode: string
  hostToken: string
  joinUrl: string
}

export type RoomResponse = {
  roomId: number
  gameId: number
  roomCode: string
  name: string
  roomStatus: 'WAITING' | 'PLAYING' | 'FINISHED'
  gameStatus: GameResponse['status']
  designDurationSeconds: number
  hideDurationSeconds: number
  seekDurationSeconds: number
  seekerCount: number
}

export type JoinRoomResponse = {
  participantId: number
  participantToken: string
  roomId: number
  gameId: number
}

export type ParticipantResponse = {
  participantId: number
  nickname: string
  type: ParticipantType
  gameRole: GameRole
  status: ParticipantStatus
  joinedAt: string
}

export type HiderResultResponse = {
  participantId: number
  nickname: string
  characterId: number
  participantStatus: ParticipantStatus
  characterStatus: string
  survivalSeconds: number
  foundAt: string | null
  foundByParticipantId: number | null
  foundByNickname: string | null
  previewImageUrl: string
}

export type SeekerResultResponse = {
  participantId: number
  nickname: string
  foundCount: number
}

export type GameResultResponse = {
  gameId: number
  status: 'FINISHED'
  winner: GameWinner
  seekStartedAt: string | null
  seekEndsAt: string | null
  finishedAt: string | null
  hiders: HiderResultResponse[]
  seekers: SeekerResultResponse[]
}

export type QrCharacterResponse = {
  gameId: number
  characterId: number
  status: string
}

export type FoundCharacterResponse = {
  characterId: number
  hiderNickname: string
  originalPhotoUrl: string
  previewImageUrl: string
  survivalSeconds: number
  gameFinished: boolean
  winner: GameWinner
}

export type PrintCharacterResponse = {
  printSlot: number
  characterId: number
  characterImageUrl: string
  qrImageUrl: string
  qrToken: string
}

export type PrintSheetResponse = {
  gameId: number
  paperSize: string
  orientation: string
  duplexFlip: string
  scalePercent: number
  columns: number
  characters: PrintCharacterResponse[]
}

const id = (value: number | string) => encodeURIComponent(String(value))

export function createRoom(body: CreateRoomRequest) {
  return request<CreateRoomResponse>('/rooms', { method: 'POST', body })
}

export function getRoom(roomCode: string) {
  return request<RoomResponse>(`/rooms/${id(roomCode)}`)
}

export function joinRoom(roomCode: string, nickname: string) {
  return request<JoinRoomResponse>(`/rooms/${id(roomCode)}/participants`, {
    method: 'POST',
    body: { nickname },
  })
}

export function getParticipants(roomId: number | string) {
  return request<ParticipantResponse[]>(`/rooms/${id(roomId)}/participants`, {
    auth: 'host',
  })
}

export function startGame(roomId: number | string) {
  return request<GameResponse>(`/rooms/${id(roomId)}/games/start`, {
    method: 'POST',
    auth: 'host',
  })
}

export function getGame(gameId: number | string, auth: 'host' | 'participant') {
  return request<GameResponse>(`/games/${id(gameId)}`, { auth })
}

export function startHiding(gameId: number | string) {
  return request<GameResponse>(`/games/${id(gameId)}/hiding/start`, {
    method: 'POST',
    auth: 'host',
  })
}

export function startSeeking(gameId: number | string) {
  return request<GameResponse>(`/games/${id(gameId)}/seeking/start`, {
    method: 'POST',
    auth: 'host',
  })
}

export function finishGame(gameId: number | string) {
  return request<GameResponse>(`/games/${id(gameId)}/finish`, {
    method: 'POST',
    auth: 'host',
  })
}

export function lookupQr(qrToken: string) {
  return request<QrCharacterResponse>(`/characters/qr/${id(qrToken)}`, {
    auth: 'participant',
  })
}

export function markFound(gameId: number | string, qrToken: string) {
  return request<FoundCharacterResponse>(
    `/games/${id(gameId)}/characters/${id(qrToken)}/found`,
    { method: 'POST', auth: 'participant' },
  )
}

export function getGameResult(gameId: number | string, auth: 'host' | 'participant') {
  return request<GameResultResponse>(`/games/${id(gameId)}/result`, { auth })
}

export function getMyCharacter(gameId: number | string) {
  return request<import('../types').CharacterResponse>(
    `/games/${id(gameId)}/characters/me`,
    { auth: 'participant' },
  )
}

export function getCharacters(gameId: number | string) {
  return request<CharacterResponse[]>(`/games/${id(gameId)}/characters`, {
    auth: 'host',
  })
}

export function getPrintSheet(gameId: number | string) {
  return request<PrintSheetResponse>(`/games/${id(gameId)}/print-sheet`, {
    auth: 'host',
  })
}

export function getQrImage(gameId: number | string, characterId: number | string) {
  return requestBlob(`/games/${id(gameId)}/characters/${id(characterId)}/qr`, {
    auth: 'host',
  })
}

export function markHidden(gameId: number | string, characterId: number | string) {
  return request<import('../types').CharacterResponse>(
    `/games/${id(gameId)}/characters/${id(characterId)}/hidden`,
    { method: 'POST', auth: 'participant' },
  )
}
