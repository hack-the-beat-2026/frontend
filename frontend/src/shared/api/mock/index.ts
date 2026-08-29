import { ApiError } from '@/shared/types'
import { getSession } from '@/shared/store/sessionStore'
import { nextId, readDb, resetDb, writeDb, type MockDb } from './mockDb'
import { routes, type MockContext } from './handlers'

/**
 * Backend 대역. VITE_API_MODE=mock 일 때만 shared/api/client.ts가 여기로 보낸다.
 * Feature 코드에서 직접 import 하지 않는다.
 */

export type MockRequestInit = {
  method: string
  body?: unknown
  auth: 'host' | 'participant' | 'auto' | 'none'
}

const MOCK_LATENCY_MS = 120

function resolveToken(auth: MockRequestInit['auth']): string | null {
  const session = getSession()
  switch (auth) {
    case 'host':
      return session.hostToken
    case 'participant':
      return session.participantToken
    case 'auto':
      return session.hostToken ?? session.participantToken
    case 'none':
      return null
  }
}

function matchRoute(method: string, pathSegments: string[]) {
  for (const route of routes) {
    if (route.method !== method) continue
    if (route.segments.length !== pathSegments.length) continue

    const params: Record<string, string> = {}
    let matched = true

    for (let i = 0; i < route.segments.length; i += 1) {
      const pattern = route.segments[i]
      const actual = pathSegments[i]
      if (pattern.startsWith(':')) {
        params[pattern.slice(1)] = decodeURIComponent(actual)
      } else if (pattern !== actual) {
        matched = false
        break
      }
    }

    if (matched) return { route, params }
  }
  return null
}

export async function mockRequest<T>(
  path: string,
  init: MockRequestInit,
): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

  const [pathname] = path.split('?')
  const segments = pathname.split('/').filter(Boolean)
  const found = matchRoute(init.method, segments)

  if (!found) {
    throw new ApiError({
      code: 'MOCK_ROUTE_NOT_FOUND',
      message: `mock 서버에 ${init.method} ${pathname} 핸들러가 없습니다.`,
      status: 404,
    })
  }

  // 매 요청마다 localStorage에서 새로 읽는다. 다른 탭의 변경이 곧바로 반영된다.
  const db = readDb()
  const context: MockContext = {
    db,
    params: found.params,
    body: init.body,
    token: resolveToken(init.auth),
  }

  // handler가 throw하면 writeDb에 도달하지 않는다 = 실패한 요청은 저장되지 않는다.
  const result = found.route.handler(context)
  writeDb(db)
  return structuredClone(result) as T
}

/**
 * 개발용 도구. mock 모드에서만 의미가 있다.
 *
 * Front A는 Front B 없이도 인쇄 미리보기를 확인해야 하므로
 * HIDER 캐릭터를 대신 만들어 넣을 수단이 필요하다 (frontend_agent.md §10).
 */
export const mockDevTools = {
  reset: resetDb,

  /** 아직 제출하지 않은 HIDER 전원의 캐릭터를 만들어 넣는다. 만든 개수를 반환한다. */
  seedCharacters(gameId: number): number {
    const db = readDb()
    const game = db.games.find((g) => g.gameId === gameId)
    if (!game) return 0

    const hiders = db.participants.filter(
      (p) => p.roomId === game.roomId && p.role === 'HIDER',
    )
    let created = 0

    for (const hider of hiders) {
      const already = db.characters.some(
        (c) => c.gameId === gameId && c.participantId === hider.participantId,
      )
      if (already) continue

      const image = placeholderCharacter(hider.nickname)
      db.characters.push({
        characterId: nextId(db),
        gameId,
        participantId: hider.participantId,
        hiderNickname: hider.nickname,
        templateType: 'STANDING_01',
        originalPhotoUrl: image,
        characterImageUrl: image,
        previewImageUrl: image,
        positionX: 0.5,
        positionY: 0.5,
        scale: 0.7,
        rotation: 0,
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        printedAt: null,
        foundAt: null,
        foundByParticipantId: null,
        survivalSeconds: null,
        qrToken: `qr_seed_${gameId}_${hider.participantId}`,
      })
      created += 1
    }

    writeDb(db)
    return created
  },

  /** 아직 참가하지 않은 자리를 더미 PLAYER로 채운다. Lobby 화면 확인용. */
  seedParticipants(roomCode: string, count: number): number {
    const db = readDb()
    const room = db.rooms.find(
      (r) => r.roomCode.toUpperCase() === roomCode.toUpperCase(),
    )
    if (!room) return 0

    const names = ['지우', '민서', '하준', '서연', '도윤', '예린', '태오', '수아']
    let created = 0

    for (let i = 0; i < count; i += 1) {
      const nickname = `${names[i % names.length]}${i >= names.length ? i : ''}`
      if (
        db.participants.some(
          (p) => p.roomId === room.roomId && p.nickname === nickname,
        )
      ) {
        continue
      }
      db.participants.push({
        participantId: nextId(db),
        roomId: room.roomId,
        nickname,
        token: `player_seed_${room.roomId}_${i}`,
        type: 'PLAYER',
        status: 'WAITING',
        role: 'NONE',
      })
      created += 1
    }

    writeDb(db)
    return created
  },

  /**
   * 제출된 캐릭터를 전부 HIDDEN으로 만든다.
   * 실제로는 HIDER가 /characters/{id}/hidden 을 호출해야 하지만,
   * Front B 없이 HOST 화면만으로 탐색 단계까지 가보려면 대신 눌러줄 수단이 필요하다.
   */
  markAllHidden(gameId: number): number {
    const db = readDb()
    let changed = 0
    for (const character of db.characters) {
      if (character.gameId !== gameId) continue
      if (character.status === 'FOUND' || character.status === 'HIDDEN') continue
      character.status = 'HIDDEN'
      changed += 1
    }
    writeDb(db)
    return changed
  },

  /** 현재 Phase의 시작 시각을 뒤로 당겨 제한시간이 지난 것으로 만든다. */
  skipTimer(gameId: number): boolean {
    const db = readDb()
    const game = db.games.find((g) => g.gameId === gameId)
    if (!game) return false

    const past = (seconds: number) =>
      new Date(Date.now() - (seconds + 5) * 1000).toISOString()

    if (game.status === 'DESIGNING') {
      game.designStartedAt = past(game.designDurationSeconds)
    } else if (game.status === 'HIDING') {
      game.hideStartedAt = past(game.hideDurationSeconds)
    } else if (game.status === 'SEEKING') {
      game.seekStartedAt = past(game.seekDurationSeconds)
    } else {
      return false
    }

    writeDb(db)
    return true
  },

  snapshot(): MockDb {
    return readDb()
  },
}

/** 실루엣 자리표시자. 실제 캐릭터는 Front B의 Canvas가 만든다. */
function placeholderCharacter(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 360
  }
  const fill = `hsl(${hash}, 45%, 55%)`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 200"><rect width="120" height="200" fill="none"/><circle cx="60" cy="34" r="24" fill="${fill}"/><path d="M60 62c-24 0-40 16-40 40v56h16v42h48v-42h16v-56c0-24-16-40-40-40z" fill="${fill}"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
