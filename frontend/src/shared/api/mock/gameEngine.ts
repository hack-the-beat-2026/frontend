import { ApiError } from '@/shared/types'
import type { Game, PrintCharacter } from '@/shared/types'
import {
  elapsedSeconds,
  nowIso,
  phaseExpired,
  type MockCharacter,
  type MockDb,
  type MockParticipant,
} from './mockDb'

/**
 * Backend의 시간 판정과 승패 확정을 흉내 낸다.
 * 조회 시점마다 호출해 "서버가 알아서 넘긴다"는 실제 동작을 재현한다.
 *
 * 전환 규칙은 architecture.md §15와 §21을 그대로 따른다.
 * - DESIGNING → PRINTING : 시간 만료가 아니라 **모든 HIDER 제출 완료**가 조건이다.
 *   (제한시간이 끝나면 Frontend가 현재 Canvas를 자동 제출한다)
 * - HIDING → SEEKING     : 자동 전환하지 않는다. HOST의 명시적 요청이 필요하다.
 * - SEEKING → FINISHED   : 전원 발견(SEEKER 승) 또는 시간 만료(HIDER 승).
 */
export function refreshGame(db: MockDb, game: Game): Game {
  const characters = db.characters.filter((c) => c.gameId === game.gameId)
  const hiders = db.participants.filter(
    (p) => p.roomId === game.roomId && p.role === 'HIDER',
  )

  if (game.status === 'DESIGNING') {
    if (hiders.length > 0 && characters.length >= hiders.length) {
      game.status = 'PRINTING'
    }
  }

  if (game.status === 'SEEKING') {
    const alive = characters.filter((c) => c.status !== 'FOUND')
    if (
      (characters.length > 0 && alive.length === 0) ||
      phaseExpired(game.seekStartedAt, game.seekDurationSeconds)
    ) {
      finishGame(db, game)
    }
  }

  return decorate(db, game)
}

/** 조회용 파생 값. 저장하지 않는다. */
export function decorate(db: MockDb, game: Game): Game {
  const characters = db.characters.filter((c) => c.gameId === game.gameId)
  const players = db.participants.filter((p) => p.roomId === game.roomId)

  return {
    ...game,
    hiderCount: players.filter((p) => p.role === 'HIDER').length,
    submittedCount: characters.length,
    foundCount: characters.filter((c) => c.status === 'FOUND').length,
    participants: players.map((p) => ({
      participantId: p.participantId,
      nickname: p.nickname,
      type: p.type,
      status: p.status,
      role: p.role,
    })),
  }
}

/**
 * architecture.md §21 규칙 26 —
 * 숨기기 시간 종료 + 모든 HIDER 준비 완료 + HOST 명시적 요청을 **모두** 만족해야 탐색이 시작된다.
 */
export function startSeeking(db: MockDb, game: Game): void {
  const characters = db.characters.filter((c) => c.gameId === game.gameId)
  const notHidden = characters.filter((c) => c.status !== 'HIDDEN')

  if (!phaseExpired(game.hideStartedAt, game.hideDurationSeconds)) {
    throw new ApiError({
      code: 'GAME_INVALID_STATE',
      message: '숨기기 제한시간이 아직 끝나지 않았습니다.',
      status: 409,
    })
  }
  if (notHidden.length > 0) {
    throw new ApiError({
      code: 'GAME_INVALID_STATE',
      message: `아직 숨기기를 완료하지 않은 HIDER가 ${notHidden.length}명 있습니다.`,
      status: 409,
    })
  }

  game.status = 'SEEKING'
  game.seekStartedAt = nowIso()
}

export function finishGame(db: MockDb, game: Game): void {
  const characters = db.characters.filter((c) => c.gameId === game.gameId)
  const survivors = characters.filter((c) => c.status !== 'FOUND')

  for (const character of survivors) {
    character.status = 'SURVIVED'
    character.survivalSeconds = Math.round(
      elapsedSeconds(game.seekStartedAt ?? game.hideStartedAt),
    )
  }

  for (const participant of db.participants) {
    if (participant.roomId !== game.roomId) continue
    if (participant.role !== 'HIDER') continue
    const own = characters.find(
      (c) => c.participantId === participant.participantId,
    )
    participant.status = own?.status === 'FOUND' ? 'ELIMINATED' : 'SURVIVED'
  }

  game.status = 'FINISHED'
  // §21 규칙 11, 12
  game.winner = survivors.length === 0 ? 'SEEKER' : 'HIDER'
  game.finishedAt = nowIso()

  const room = db.rooms.find((r) => r.roomId === game.roomId)
  if (room) room.status = 'FINISHED'
}

export function requireHost(
  db: MockDb,
  roomId: number,
  token: string | null,
): void {
  const room = db.rooms.find((r) => r.roomId === roomId)
  if (!room) {
    throw new ApiError({
      code: 'ROOM_NOT_FOUND',
      message: '방을 찾을 수 없습니다.',
      status: 404,
    })
  }
  if (!token) {
    throw new ApiError({
      code: 'INVALID_TOKEN',
      message: '토큰이 없습니다.',
      status: 401,
    })
  }
  if (room.hostToken !== token) {
    throw new ApiError({
      code: 'ACCESS_DENIED',
      message: 'HOST만 수행할 수 있습니다.',
      status: 403,
    })
  }
}

export function requireParticipant(
  db: MockDb,
  roomId: number,
  token: string | null,
): MockParticipant {
  const participant = db.participants.find(
    (p) => p.roomId === roomId && p.token === token,
  )
  if (!participant) {
    throw new ApiError({
      code: 'INVALID_TOKEN',
      message: '참가자 토큰이 유효하지 않습니다.',
      status: 401,
    })
  }
  return participant
}

export function requireStatus(game: Game, allowed: Game['status'][]): void {
  if (!allowed.includes(game.status)) {
    throw new ApiError({
      code: 'GAME_INVALID_STATE',
      message: `현재 상태(${game.status})에서는 수행할 수 없습니다.`,
      status: 409,
    })
  }
}

/** architecture.md §17.5 Print Sheet 응답 형태. */
export function toPrintCharacter(character: MockCharacter): PrintCharacter {
  return {
    characterId: character.characterId,
    hiderNickname: character.hiderNickname,
    characterImageUrl: character.characterImageUrl,
    status: character.status,
    qrToken: character.qrToken,
  }
}
