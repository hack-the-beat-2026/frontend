import { request } from './client'
import type {
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  Participant,
  Room,
} from '@/shared/types'

/** architecture.md §10.1 — POST /api/v1/rooms */
export function createRoom(
  body: CreateRoomRequest,
): Promise<CreateRoomResponse> {
  return request<CreateRoomResponse>('/rooms', {
    method: 'POST',
    body,
    auth: 'none',
  })
}

/** architecture.md §10.1 — POST /api/v1/rooms/{roomCode}/participants */
export function joinRoom(
  roomCode: string,
  body: JoinRoomRequest,
): Promise<JoinRoomResponse> {
  return request<JoinRoomResponse>(
    `/rooms/${encodeURIComponent(roomCode)}/participants`,
    { method: 'POST', body, auth: 'none' },
  )
}

/** architecture.md §10.1 — GET /api/v1/rooms/{roomCode}. 참가 전에도 조회 가능해야 한다. */
export function getRoom(roomCode: string): Promise<Room> {
  return request<Room>(`/rooms/${encodeURIComponent(roomCode)}`, {
    auth: 'auto',
  })
}

/** architecture.md §10.1 — GET /api/v1/rooms/{roomId}/participants. HOST 전용. */
export function getParticipants(roomId: number): Promise<Participant[]> {
  return request<Participant[]>(`/rooms/${roomId}/participants`, {
    auth: 'host',
  })
}
