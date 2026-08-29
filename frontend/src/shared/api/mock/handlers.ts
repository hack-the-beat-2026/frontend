import { ApiError } from '@/shared/types'
import type {
  CharacterFoundResponse,
  CharacterSubmitRequest,
  CreateRoomRequest,
  CreateRoomResponse,
  Game,
  JoinRoomRequest,
  JoinRoomResponse,
  Participant,
  PrintSheet,
  Room,
} from '@/shared/types'
import {
  assignRoles,
  MOCK_MAX_PARTICIPANTS,
  nextId,
  nowIso,
  randomRoomCode,
  randomToken,
  toParticipant,
  type MockCharacter,
  type MockDb,
} from './mockDb'
import {
  decorate,
  finishGame,
  refreshGame,
  requireHost,
  requireParticipant,
  requireStatus,
  startSeeking,
  toPrintCharacter,
} from './gameEngine'

export type MockContext = {
  params: Record<string, string>
  body: unknown
  token: string | null
  db: MockDb
}

export type MockRoute = {
  method: string
  segments: string[]
  handler: (ctx: MockContext) => unknown
}

function fail(code: string, message: string, status: number): never {
  throw new ApiError({ code, message, status })
}

function joinUrlFor(roomCode: string): string {
  const origin =
    typeof location === 'undefined' ? 'http://localhost:5173' : location.origin
  return `${origin}/join/${roomCode}`
}

function roomByCode(db: MockDb, roomCode: string) {
  const room = db.rooms.find(
    (r) => r.roomCode.toUpperCase() === roomCode.toUpperCase(),
  )
  if (!room) fail('ROOM_NOT_FOUND', '방을 찾을 수 없습니다.', 404)
  return room
}

function roomById(db: MockDb, roomId: number) {
  const room = db.rooms.find((r) => r.roomId === roomId)
  if (!room) fail('ROOM_NOT_FOUND', '방을 찾을 수 없습니다.', 404)
  return room
}

function gameById(db: MockDb, gameId: number): Game {
  const game = db.games.find((g) => g.gameId === gameId)
  if (!game) fail('GAME_NOT_FOUND', '게임을 찾을 수 없습니다.', 404)
  return game
}

function toRoom(db: MockDb, roomCode: string): Room {
  const room = roomByCode(db, roomCode)
  const participants = db.participants.filter((p) => p.roomId === room.roomId)
  return {
    roomId: room.roomId,
    roomCode: room.roomCode,
    name: room.name,
    status: room.status,
    joinUrl: joinUrlFor(room.roomCode),
    // 실제 백엔드는 QR 이미지 URL을 줄 수 있다(확인 항목 4번).
    // mock은 비워 두고 클라이언트가 joinUrl로 직접 렌더한다.
    joinQrUrl: '',
    participantCount: participants.length,
    maxParticipants: MOCK_MAX_PARTICIPANTS,
    currentGameId: room.currentGameId,
    participants: participants.map(toParticipant),
  }
}

function printSheet(db: MockDb, gameId: number): PrintSheet {
  return {
    gameId,
    characters: db.characters
      .filter((c) => c.gameId === gameId)
      .map(toPrintCharacter),
  }
}

const createRoom = ({ db, body }: MockContext): CreateRoomResponse => {
  const input = body as CreateRoomRequest
  const roomId = nextId(db)
  const hostToken = randomToken('host')
  const roomCode = randomRoomCode(db)

  db.rooms.push({
    roomId,
    roomCode,
    name: input.name,
    hostToken,
    status: 'WAITING',
    designDurationSeconds: input.designDurationSeconds,
    hideDurationSeconds: input.hideDurationSeconds,
    seekDurationSeconds: input.seekDurationSeconds,
    seekerCount: input.seekerCount,
    currentGameId: null,
    createdAt: nowIso(),
  })

  return {
    roomId,
    roomCode,
    hostToken,
    joinUrl: joinUrlFor(roomCode),
    joinQrUrl: '',
  }
}

const joinRoom = ({ db, params, body }: MockContext): JoinRoomResponse => {
  const room = roomByCode(db, params.roomCode)
  const input = body as JoinRoomRequest
  const nickname = input.nickname.trim()
  const existing = db.participants.filter((p) => p.roomId === room.roomId)

  if (existing.length >= MOCK_MAX_PARTICIPANTS) {
    fail('ROOM_FULL', '방 정원이 가득 찼습니다.', 409)
  }
  if (existing.some((p) => p.nickname === nickname)) {
    fail('DUPLICATE_NICKNAME', '이미 사용 중인 닉네임입니다.', 409)
  }
  if (room.currentGameId !== null) {
    fail('GAME_INVALID_STATE', '이미 시작된 게임입니다.', 409)
  }

  const participantId = nextId(db)
  const participantToken = randomToken('player')
  db.participants.push({
    participantId,
    roomId: room.roomId,
    nickname,
    token: participantToken,
    type: 'PLAYER',
    status: 'WAITING',
    role: 'NONE',
  })

  return { participantId, participantToken, roomId: room.roomId }
}

const startGame = ({ db, params, token }: MockContext): Game => {
  const roomId = Number(params.roomId)
  requireHost(db, roomId, token)
  const room = roomById(db, roomId)

  if (room.currentGameId !== null) {
    fail('GAME_INVALID_STATE', '이미 게임이 시작됐습니다.', 409)
  }

  const players = db.participants.filter((p) => p.roomId === roomId)
  if (players.length < 2) {
    fail('GAME_INVALID_STATE', '참가자가 2명 이상이어야 시작할 수 있습니다.', 409)
  }

  assignRoles(players, room.seekerCount)

  const gameId = nextId(db)
  const game: Game = {
    gameId,
    roomId,
    // contractRules.md에 DESIGNING을 여는 엔드포인트가 없다.
    // 실제 백엔드가 ROLE_ASSIGNED에 머무는지는 확인 항목이고,
    // mock은 게임 시작과 동시에 DESIGNING으로 들어간다.
    status: 'DESIGNING',
    designStartedAt: nowIso(),
    designDurationSeconds: room.designDurationSeconds,
    hideStartedAt: null,
    hideDurationSeconds: room.hideDurationSeconds,
    seekStartedAt: null,
    seekDurationSeconds: room.seekDurationSeconds,
    seekerCount: room.seekerCount,
    winner: 'NONE',
    finishedAt: null,
  }
  db.games.push(game)
  room.currentGameId = gameId
  room.status = 'PLAYING'

  return decorate(db, game)
}

const submitCharacter = ({
  db,
  params,
  body,
  token,
}: MockContext): MockCharacter => {
  const game = gameById(db, Number(params.gameId))
  const participant = requireParticipant(db, game.roomId, token)
  requireStatus(game, ['DESIGNING'])

  if (participant.role !== 'HIDER') {
    fail('INVALID_GAME_ROLE', 'HIDER만 제출할 수 있습니다.', 403)
  }
  if (
    db.characters.some(
      (c) =>
        c.gameId === game.gameId &&
        c.participantId === participant.participantId,
    )
  ) {
    fail('CHARACTER_ALREADY_SUBMITTED', '이미 제출했습니다.', 409)
  }

  const input = body as CharacterSubmitRequest
  const character: MockCharacter = {
    characterId: nextId(db),
    gameId: game.gameId,
    participantId: participant.participantId,
    hiderNickname: participant.nickname,
    templateType: input.templateType,
    originalPhotoUrl: input.originalPhotoUrl,
    characterImageUrl: input.characterImageUrl,
    previewImageUrl: input.previewImageUrl,
    positionX: input.positionX,
    positionY: input.positionY,
    scale: input.scale,
    rotation: input.rotation,
    status: 'SUBMITTED',
    submittedAt: nowIso(),
    printedAt: null,
    foundAt: null,
    foundByParticipantId: null,
    survivalSeconds: null,
    // qrToken은 Backend(= 이 mock)가 제출 시점에 만든다. architecture.md §13.1
    qrToken: randomToken('qr'),
  }
  db.characters.push(character)
  return character
}

const markFound = ({
  db,
  params,
  token,
}: MockContext): CharacterFoundResponse => {
  const game = gameById(db, Number(params.gameId))
  const participant = requireParticipant(db, game.roomId, token)
  refreshGame(db, game)
  requireStatus(game, ['SEEKING'])

  if (participant.role !== 'SEEKER') {
    fail('INVALID_GAME_ROLE', 'SEEKER만 발견 처리할 수 있습니다.', 403)
  }

  const qrToken = params.qrToken.trim()
  const character = db.characters.find((c) => c.qrToken === qrToken)
  if (!character) {
    fail('INVALID_QR_TOKEN', '알 수 없는 QR입니다.', 404)
  }
  if (character.gameId !== game.gameId) {
    fail('INVALID_QR_TOKEN', '다른 방의 QR입니다.', 409)
  }
  if (character.status === 'FOUND') {
    fail('CHARACTER_ALREADY_FOUND', '이미 발견된 카드입니다.', 409)
  }

  character.status = 'FOUND'
  character.foundAt = nowIso()
  character.foundByParticipantId = participant.participantId
  character.survivalSeconds = Math.round(
    (Date.now() - Date.parse(game.seekStartedAt ?? nowIso())) / 1000,
  )

  const hider = db.participants.find(
    (p) => p.participantId === character.participantId,
  )
  if (hider) hider.status = 'ELIMINATED'

  refreshGame(db, game)

  return {
    characterId: character.characterId,
    hiderNickname: character.hiderNickname,
    originalPhotoUrl: character.originalPhotoUrl,
    previewImageUrl: character.previewImageUrl,
    survivalSeconds: character.survivalSeconds,
  }
}

export const routes: MockRoute[] = [
  { method: 'POST', segments: ['rooms'], handler: createRoom },

  {
    method: 'GET',
    segments: ['rooms', ':roomCode'],
    handler: ({ db, params }): Room => toRoom(db, params.roomCode),
  },

  {
    method: 'POST',
    segments: ['rooms', ':roomCode', 'participants'],
    handler: joinRoom,
  },

  {
    method: 'GET',
    segments: ['rooms', ':roomId', 'participants'],
    handler: ({ db, params }): Participant[] =>
      db.participants
        .filter((p) => p.roomId === Number(params.roomId))
        .map(toParticipant),
  },

  {
    method: 'POST',
    segments: ['rooms', ':roomId', 'games', 'start'],
    handler: startGame,
  },

  {
    method: 'GET',
    segments: ['games', ':gameId'],
    handler: ({ db, params }): Game =>
      refreshGame(db, gameById(db, Number(params.gameId))),
  },

  {
    method: 'POST',
    segments: ['games', ':gameId', 'hiding', 'start'],
    handler: ({ db, params, token }): Game => {
      const game = gameById(db, Number(params.gameId))
      requireHost(db, game.roomId, token)
      requireStatus(game, ['PRINTING'])
      game.status = 'HIDING'
      game.hideStartedAt = nowIso()
      return decorate(db, game)
    },
  },

  {
    method: 'POST',
    segments: ['games', ':gameId', 'seeking', 'start'],
    handler: ({ db, params, token }): Game => {
      const game = gameById(db, Number(params.gameId))
      requireHost(db, game.roomId, token)
      requireStatus(game, ['HIDING'])
      startSeeking(db, game)
      return decorate(db, game)
    },
  },

  {
    method: 'POST',
    segments: ['games', ':gameId', 'finish'],
    handler: ({ db, params, token }): Game => {
      const game = gameById(db, Number(params.gameId))
      requireHost(db, game.roomId, token)
      requireStatus(game, ['HIDING', 'SEEKING'])
      finishGame(db, game)
      return decorate(db, game)
    },
  },

  {
    method: 'GET',
    segments: ['games', ':gameId', 'print-sheet'],
    handler: ({ db, params, token }): PrintSheet => {
      const game = gameById(db, Number(params.gameId))
      requireHost(db, game.roomId, token)
      refreshGame(db, game)
      if (game.status === 'WAITING' || game.status === 'ROLE_ASSIGNED') {
        fail('PRINT_NOT_READY', '아직 인쇄할 수 없습니다.', 409)
      }
      return printSheet(db, game.gameId)
    },
  },

  {
    method: 'GET',
    segments: ['games', ':gameId', 'characters'],
    handler: ({ db, params }): MockCharacter[] =>
      db.characters.filter((c) => c.gameId === Number(params.gameId)),
  },

  {
    method: 'POST',
    segments: ['games', ':gameId', 'characters'],
    handler: submitCharacter,
  },

  {
    method: 'GET',
    segments: ['games', ':gameId', 'characters', 'me'],
    handler: ({ db, params, token }): MockCharacter => {
      const game = gameById(db, Number(params.gameId))
      const participant = requireParticipant(db, game.roomId, token)
      const character = db.characters.find(
        (c) =>
          c.gameId === game.gameId &&
          c.participantId === participant.participantId,
      )
      if (!character) {
        fail('CHARACTER_NOT_FOUND', '제출한 캐릭터가 없습니다.', 404)
      }
      return character
    },
  },

  {
    method: 'POST',
    segments: ['games', ':gameId', 'characters', ':characterId', 'hidden'],
    handler: ({ db, params, token }): MockCharacter => {
      const game = gameById(db, Number(params.gameId))
      const participant = requireParticipant(db, game.roomId, token)
      requireStatus(game, ['HIDING'])

      const character = db.characters.find(
        (c) => c.characterId === Number(params.characterId),
      )
      if (!character || character.gameId !== game.gameId) {
        fail('CHARACTER_NOT_FOUND', '캐릭터를 찾을 수 없습니다.', 404)
      }
      if (character.participantId !== participant.participantId) {
        fail('ACCESS_DENIED', '본인 캐릭터만 처리할 수 있습니다.', 403)
      }

      character.status = 'HIDDEN'
      return character
    },
  },

  {
    method: 'GET',
    segments: ['characters', 'qr', ':qrToken'],
    handler: ({ db, params }): MockCharacter => {
      const character = db.characters.find(
        (c) => c.qrToken === params.qrToken.trim(),
      )
      if (!character) {
        fail('INVALID_QR_TOKEN', '알 수 없는 QR입니다.', 404)
      }
      return character
    },
  },

  {
    method: 'POST',
    segments: ['games', ':gameId', 'characters', ':qrToken', 'found'],
    handler: markFound,
  },
]
