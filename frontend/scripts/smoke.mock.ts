/* mock 백엔드 + 인쇄 페어링 스모크 테스트. vite --ssr 로 번들해서 node로 돌린다. */

class MemoryStorage {
  private map = new Map<string, string>()
  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null
  }
  setItem(key: string, value: string) {
    this.map.set(key, value)
  }
  removeItem(key: string) {
    this.map.delete(key)
  }
  clear() {
    this.map.clear()
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null
  }
  get length() {
    return this.map.size
  }
}

const g = globalThis as Record<string, unknown>
g.localStorage = new MemoryStorage()
g.sessionStorage = new MemoryStorage()
g.location = { origin: 'http://localhost:5173' }

let failures = 0
const results: string[] = []

function check(label: string, condition: boolean, detail = '') {
  if (condition) {
    results.push(`  ok   ${label}`)
  } else {
    failures += 1
    results.push(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`)
  }
}

async function expectError(label: string, code: string, run: () => Promise<unknown>) {
  try {
    await run()
    check(label, false, `에러가 안 났다 (기대: ${code})`)
  } catch (error) {
    const actual = (error as { code?: string }).code
    check(label, actual === code, `기대 ${code}, 실제 ${actual}`)
  }
}

async function main() {
  const { mockRequest, mockDevTools } = await import('@/shared/api/mock')
  const { useSessionStore } = await import('@/shared/store/sessionStore')
  const { buildPrintSlots, paginate, backGrid, PRINT_LAYOUTS } = await import(
    '@/features/party/utils/printLayout'
  )
  type Any = Record<string, any>

  const asHost = (hostToken: string) =>
    useSessionStore.setState({ hostToken, participantToken: null })
  const asPlayer = (participantToken: string) =>
    useSessionStore.setState({ hostToken: null, participantToken })

  // 1. 방 생성
  const room = (await mockRequest('/rooms', {
    method: 'POST',
    auth: 'none',
    body: {
      name: '테스트 파티',
      designDurationSeconds: 60,
      hideDurationSeconds: 30,
      seekDurationSeconds: 120,
      seekerCount: 2,
    },
  })) as Any
  check('방 생성 → roomCode 6자리', /^[A-Z0-9]{6}$/.test(room.roomCode), room.roomCode)
  check('방 생성 → hostToken 발급', typeof room.hostToken === 'string')

  // 2. 참가
  const tokens: Any[] = []
  for (const nickname of ['지우', '민서', '하준', '서연', '도윤']) {
    tokens.push(
      (await mockRequest(`/rooms/${room.roomCode}/participants`, {
        method: 'POST',
        auth: 'none',
        body: { nickname },
      })) as Any,
    )
  }
  check('참가자 5명', tokens.length === 5)

  await expectError('중복 닉네임 거절', 'DUPLICATE_NICKNAME', () =>
    mockRequest(`/rooms/${room.roomCode}/participants`, {
      method: 'POST',
      auth: 'none',
      body: { nickname: '지우' },
    }),
  )
  await expectError('없는 방 거절', 'ROOM_NOT_FOUND', () =>
    mockRequest('/rooms/ZZZZZZ/participants', {
      method: 'POST',
      auth: 'none',
      body: { nickname: '아무개' },
    }),
  )

  // 3. HOST 권한
  asPlayer(tokens[0].participantToken)
  await expectError('PLAYER 토큰으로 게임 시작 불가', 'ACCESS_DENIED', () =>
    mockRequest(`/rooms/${room.roomId}/games/start`, { method: 'POST', auth: 'auto' }),
  )

  asHost(room.hostToken)
  const game = (await mockRequest(`/rooms/${room.roomId}/games/start`, {
    method: 'POST',
    auth: 'host',
  })) as Any
  check('게임 시작 → DESIGNING', game.status === 'DESIGNING', game.status)
  check('역할 배정: SEEKER 2 / HIDER 3', game.hiderCount === 3, `hider=${game.hiderCount}`)

  const participants = game.participants as Any[]
  const hiders = participants.filter((p) => p.role === 'HIDER')
  const seekers = participants.filter((p) => p.role === 'SEEKER')
  check('SEEKER 2명', seekers.length === 2, String(seekers.length))

  const tokenOf = (participantId: number) =>
    tokens.find((t) => t.participantId === participantId)!.participantToken

  // 4. 캐릭터 제출
  asPlayer(tokenOf(seekers[0].participantId))
  await expectError('SEEKER는 캐릭터 제출 불가', 'INVALID_GAME_ROLE', () =>
    mockRequest(`/games/${game.gameId}/characters`, {
      method: 'POST',
      auth: 'participant',
      body: { templateType: 'STANDING_01', originalPhotoUrl: 'a', characterImageUrl: 'b', previewImageUrl: 'c', positionX: 0.5, positionY: 0.5, scale: 1, rotation: 0 },
    }),
  )

  const submitBody = { templateType: 'STANDING_01', originalPhotoUrl: 'a', characterImageUrl: 'b', previewImageUrl: 'c', positionX: 0.5, positionY: 0.5, scale: 1, rotation: 0 }

  for (const [index, hider] of hiders.entries()) {
    asPlayer(tokenOf(hider.participantId))
    const character = (await mockRequest(`/games/${game.gameId}/characters`, {
      method: 'POST',
      auth: 'participant',
      body: submitBody,
    })) as Any
    check(`qrToken 자동 생성 (${hider.nickname})`, typeof character.qrToken === 'string' && character.qrToken.length > 10)

    // 아직 DESIGNING인 동안(마지막 제출 전) 중복 제출을 시도한다.
    if (index === 0 && hiders.length > 1) {
      await expectError('중복 제출 거절', 'CHARACTER_ALREADY_SUBMITTED', () =>
        mockRequest(`/games/${game.gameId}/characters`, {
          method: 'POST',
          auth: 'participant',
          body: submitBody,
        }),
      )
    }
  }

  // 5. 전원 제출 → PRINTING (시간이 아니라 제출 완료가 조건)
  asHost(room.hostToken)
  let current = (await mockRequest(`/games/${game.gameId}`, { method: 'GET', auth: 'auto' })) as Any
  check('전원 제출 → PRINTING', current.status === 'PRINTING', current.status)

  // 6. 인쇄 시트
  const sheet = (await mockRequest(`/games/${game.gameId}/print-sheet`, { method: 'GET', auth: 'host' })) as Any
  check('print-sheet 캐릭터 3장', sheet.characters.length === 3, String(sheet.characters.length))
  const qrTokens = new Set(sheet.characters.map((c: Any) => c.qrToken))
  check('qrToken은 캐릭터마다 고유', qrTokens.size === 3)

  asPlayer(tokenOf(hiders[0].participantId))
  await expectError('PLAYER 토큰으로 print-sheet 접근 불가', 'ACCESS_DENIED', () =>
    mockRequest(`/games/${game.gameId}/print-sheet`, { method: 'GET', auth: 'auto' }),
  )

  // 7. 인쇄 페어링 (앞면 i번째 ↔ 뒷면 i번째가 같은 캐릭터인가)
  const slots = buildPrintSlots(sheet.characters)
  check('슬롯 정렬은 characterId 오름차순', slots.every((s, i) => i === 0 || s.character!.characterId > slots[i - 1].character!.characterId))

  const spec = PRINT_LAYOUTS.duplex
  const pages = paginate(slots, spec)
  let pairingOk = true
  for (const page of pages) {
    const front = page.grid
    const back = backGrid(page.grid, true)
    for (let row = 0; row < front.length; row += 1) {
      const width = front[row].length
      for (let col = 0; col < width; col += 1) {
        // 장변 넘김이면 뒷면 col은 물리적으로 (width-1-col) 위치에 온다.
        const physical = back[row][width - 1 - col]
        if (physical.slotNumber !== front[row][col].slotNumber) pairingOk = false
      }
    }
  }
  check('양면 반전 후에도 앞면 카드 ↔ 뒷면 QR 짝 유지', pairingOk)

  const foldPages = paginate(slots, PRINT_LAYOUTS.fold)
  check('접지형은 슬롯 자체가 앞뒤 한 쌍', foldPages[0].grid.flat()[0].slotNumber === 1)

  // 8. 숨기기
  asHost(room.hostToken)
  await mockRequest(`/games/${game.gameId}/hiding/start`, { method: 'POST', auth: 'host' })
  current = (await mockRequest(`/games/${game.gameId}`, { method: 'GET', auth: 'auto' })) as Any
  check('숨기기 시작 → HIDING', current.status === 'HIDING', current.status)

  await expectError('숨기기 완료 전에는 탐색 시작 불가', 'GAME_INVALID_STATE', () =>
    mockRequest(`/games/${game.gameId}/seeking/start`, { method: 'POST', auth: 'host' }),
  )

  for (const character of sheet.characters) {
    const owner = hiders.find((h) => {
      const full = mockDevTools.snapshot().characters.find((c) => c.characterId === character.characterId)
      return full?.participantId === h.participantId
    })!
    asPlayer(tokenOf(owner.participantId))
    await mockRequest(`/games/${game.gameId}/characters/${character.characterId}/hidden`, { method: 'POST', auth: 'participant' })
  }

  asHost(room.hostToken)
  await expectError('시간 전에는 여전히 탐색 시작 불가', 'GAME_INVALID_STATE', () =>
    mockRequest(`/games/${game.gameId}/seeking/start`, { method: 'POST', auth: 'host' }),
  )

  mockDevTools.skipTimer(game.gameId)
  await mockRequest(`/games/${game.gameId}/seeking/start`, { method: 'POST', auth: 'host' })
  current = (await mockRequest(`/games/${game.gameId}`, { method: 'GET', auth: 'auto' })) as Any
  check('조건 충족 후 탐색 시작 → SEEKING', current.status === 'SEEKING', current.status)

  // 9. 발견
  const qrList = sheet.characters.map((c: Any) => c.qrToken)

  asPlayer(tokenOf(hiders[0].participantId))
  await expectError('HIDER는 발견 처리 불가', 'INVALID_GAME_ROLE', () =>
    mockRequest(`/games/${game.gameId}/characters/${qrList[0]}/found`, { method: 'POST', auth: 'participant' }),
  )

  asPlayer(tokenOf(seekers[0].participantId))
  await expectError('없는 QR 거절', 'INVALID_QR_TOKEN', () =>
    mockRequest(`/games/${game.gameId}/characters/qr_없는토큰/found`, { method: 'POST', auth: 'participant' }),
  )

  const first = (await mockRequest(`/games/${game.gameId}/characters/${qrList[0]}/found`, { method: 'POST', auth: 'participant' })) as Any
  check('발견 응답에 닉네임·생존시간', typeof first.hiderNickname === 'string' && typeof first.survivalSeconds === 'number')

  await expectError('같은 QR 중복 스캔 거절', 'CHARACTER_ALREADY_FOUND', () =>
    mockRequest(`/games/${game.gameId}/characters/${qrList[0]}/found`, { method: 'POST', auth: 'participant' }),
  )

  await mockRequest(`/games/${game.gameId}/characters/${qrList[1]}/found`, { method: 'POST', auth: 'participant' })
  await mockRequest(`/games/${game.gameId}/characters/${qrList[2]}/found`, { method: 'POST', auth: 'participant' })

  current = (await mockRequest(`/games/${game.gameId}`, { method: 'GET', auth: 'auto' })) as Any
  check('전원 발견 → FINISHED', current.status === 'FINISHED', current.status)
  check('전원 발견 → SEEKER 승', current.winner === 'SEEKER', current.winner)

  // 10. 시간 만료 시 HIDER 승
  const room2 = (await mockRequest('/rooms', { method: 'POST', auth: 'none', body: { name: 'r2', designDurationSeconds: 60, hideDurationSeconds: 30, seekDurationSeconds: 120, seekerCount: 1 } })) as Any
  const p2: Any[] = []
  for (const nickname of ['A', 'B', 'C']) {
    p2.push((await mockRequest(`/rooms/${room2.roomCode}/participants`, { method: 'POST', auth: 'none', body: { nickname } })) as Any)
  }
  asHost(room2.hostToken)
  const game2 = (await mockRequest(`/rooms/${room2.roomId}/games/start`, { method: 'POST', auth: 'host' })) as Any
  const hiders2 = (game2.participants as Any[]).filter((p) => p.role === 'HIDER')
  for (const hider of hiders2) {
    asPlayer(p2.find((t) => t.participantId === hider.participantId)!.participantToken)
    await mockRequest(`/games/${game2.gameId}/characters`, { method: 'POST', auth: 'participant', body: { templateType: 'T', originalPhotoUrl: 'a', characterImageUrl: 'b', previewImageUrl: 'c', positionX: 0.5, positionY: 0.5, scale: 1, rotation: 0 } })
  }
  asHost(room2.hostToken)
  await mockRequest(`/games/${game2.gameId}/hiding/start`, { method: 'POST', auth: 'host' })
  mockDevTools.markAllHidden(game2.gameId)
  mockDevTools.skipTimer(game2.gameId)
  await mockRequest(`/games/${game2.gameId}/seeking/start`, { method: 'POST', auth: 'host' })
  mockDevTools.skipTimer(game2.gameId)
  const finished2 = (await mockRequest(`/games/${game2.gameId}`, { method: 'GET', auth: 'auto' })) as Any
  check('탐색 시간 만료 → FINISHED', finished2.status === 'FINISHED', finished2.status)
  check('생존자 있으면 HIDER 승', finished2.winner === 'HIDER', finished2.winner)

  console.log(results.join('\n'))
  console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`)
  process.exit(failures === 0 ? 0 : 1)
}

main().catch((error) => {
  console.log(results.join('\n'))
  console.error('\nUNCAUGHT', error)
  process.exit(1)
})
