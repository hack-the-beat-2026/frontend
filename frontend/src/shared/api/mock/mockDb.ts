import type {
  Character,
  Game,
  GameRole,
  Participant,
  ParticipantStatus,
  RoomStatus,
} from '@/shared/types'

/**
 * ⚠️ 이 폴더는 **Backend 대역**이다. 백엔드 저장소가 아직 비어 있어
 * 프론트 3인이 독립적으로 개발·데모하기 위해 둔다 (VITE_API_MODE=mock).
 *
 * 여기서 token과 qrToken을 만드는 것은 contractRules.md §6/§18 위반이 아니다.
 * 그 규칙은 "Frontend 코드가" 만들지 말라는 뜻이고, 이 파일은 서버 역할이다.
 * Feature 코드에서 이 모듈을 직접 import 하지 않는다 — 반드시 shared/api를 거친다.
 *
 * 저장소는 localStorage다. 세션(sessionStore)이 탭 단위인 것과 반대로,
 * mock DB는 모든 탭이 공유해야 HOST 탭 / HIDER 탭 / SEEKER 탭 데모가 성립한다.
 */

const DB_KEY = 'chameleon-mock-db'
export const MOCK_MAX_PARTICIPANTS = 10

export type MockRoom = {
  roomId: number
  roomCode: string
  name: string
  hostToken: string
  status: RoomStatus
  designDurationSeconds: number
  hideDurationSeconds: number
  seekDurationSeconds: number
  seekerCount: number
  currentGameId: number | null
  createdAt: string
}

export type MockParticipant = Participant & {
  roomId: number
  token: string
}

export type MockCharacter = Character & {
  qrToken: string
}

export type MockDb = {
  seq: number
  rooms: MockRoom[]
  participants: MockParticipant[]
  games: Game[]
  characters: MockCharacter[]
}

const emptyDb: MockDb = {
  seq: 1,
  rooms: [],
  participants: [],
  games: [],
  characters: [],
}

export function readDb(): MockDb {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) return structuredClone(emptyDb)
    return { ...structuredClone(emptyDb), ...(JSON.parse(raw) as MockDb) }
  } catch {
    return structuredClone(emptyDb)
  }
}

export function writeDb(db: MockDb): void {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db))
  } catch {
    // quota 초과 등은 mock에서 무시한다.
  }
}

export function resetDb(): void {
  localStorage.removeItem(DB_KEY)
}

export function nextId(db: MockDb): number {
  db.seq += 1
  return db.seq
}

export function randomToken(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replaceAll('-', '')
      : Math.random().toString(36).slice(2).padEnd(24, '0')
  return `${prefix}_${rand.slice(0, 24)}`
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function randomRoomCode(db: MockDb): string {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    let code = ''
    for (let i = 0; i < 6; i += 1) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
    }
    if (!db.rooms.some((room) => room.roomCode === code)) return code
  }
  return `R${Date.now().toString(36).toUpperCase().slice(-5)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function elapsedSeconds(startedAt: string | null): number {
  if (!startedAt) return 0
  return (Date.now() - Date.parse(startedAt)) / 1000
}

export function phaseExpired(
  startedAt: string | null,
  durationSeconds: number,
): boolean {
  if (!startedAt) return false
  return elapsedSeconds(startedAt) >= durationSeconds
}

export function toParticipant(participant: MockParticipant): Participant {
  return {
    participantId: participant.participantId,
    nickname: participant.nickname,
    type: participant.type,
    status: participant.status,
    role: participant.role,
  }
}

export function assignRoles(
  participants: MockParticipant[],
  seekerCount: number,
): void {
  const players = participants.filter((p) => p.type === 'PLAYER')
  const shuffled = [...players].sort(() => Math.random() - 0.5)
  const seekers = Math.min(Math.max(seekerCount, 1), Math.max(players.length - 1, 1))

  shuffled.forEach((player, index) => {
    const role: GameRole = index < seekers ? 'SEEKER' : 'HIDER'
    player.role = role
    player.status = 'ACTIVE' satisfies ParticipantStatus
  })
}

export function findGame(db: MockDb, gameId: number): Game | undefined {
  return db.games.find((game) => game.gameId === gameId)
}
