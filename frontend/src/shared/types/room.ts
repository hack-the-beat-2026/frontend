import type { Participant } from './participant'

/** backend RoomStatus.java */
export type RoomStatus = 'WAITING' | 'PLAYING' | 'FINISHED' | 'CLOSED'

/** contractRules.md §9 */
export type CreateRoomRequest = {
  name: string
  designDurationSeconds: number
  hideDurationSeconds: number
  seekDurationSeconds: number
  seekerCount: number
}

export type CreateRoomResponse = {
  roomId: number
  /** Backend가 생성한 6자리 코드. Frontend가 만들지 않는다. */
  roomCode: string
  hostToken: string
  joinUrl: string
  joinQrUrl: string
}

/** contractRules.md §10 */
export type JoinRoomRequest = {
  nickname: string
}

export type JoinRoomResponse = {
  participantId: number
  participantToken: string
  roomId: number
}

export type Room = {
  roomId: number
  roomCode: string
  name: string
  status: RoomStatus
  joinUrl: string
  joinQrUrl: string
  participantCount: number
  maxParticipants: number
  /** 방에 현재 진행 중인 게임이 있으면 그 id. 없으면 null. */
  currentGameId: number | null
  /** GET /api/v1/rooms/{roomId}/participants 는 HOST 전용이다. 공개 방 조회에는 없을 수 있다. */
  participants?: Participant[]
}
