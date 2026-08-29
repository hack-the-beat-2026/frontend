import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  ApiRequestError,
  clearTokens,
  createRoom,
  finishGame,
  getCharacters,
  getGame,
  getGameResult,
  getMyCharacter,
  getParticipants,
  getPrintSheet,
  getQrImage,
  getRoom,
  joinRoom,
  lookupQr,
  markFound,
  markHidden,
  resolveAssetUrl,
  saveToken,
  startGame,
  startHiding,
  startSeeking,
  type CreateRoomRequest,
  type GameResultResponse,
  type ParticipantResponse,
  type PrintSheetResponse,
  type RoomResponse,
} from './shared/api'
import type { CharacterResponse, GameResponse } from './shared/types'
import { HiderDesignPage } from './features/hider/pages/HiderDesignPage'
import { HiderHidePage } from './features/hider/pages/HiderHidePage'
import { HiderRolePanel } from './features/hider/components/HiderRolePanel'
import { HiderWaitPage } from './features/hider/pages/HiderWaitPage'
import { usePhaseCountdown } from './features/hider/hooks/usePhaseCountdown'
import SeekerRoutes from './features/seeker/SeekerRoutes'
import type {
  FoundCharacterResult,
  ScanOutcome,
} from './features/seeker/pages/SeekerScanResultPage'
import './App.css'

type HostSession = {
  kind: 'host'
  roomId: number
  gameId: number
  roomCode: string
  name: string
}

type PlayerSession = {
  kind: 'player'
  participantId: number
  roomId: number
  gameId: number
  roomCode: string
  nickname: string
}

type Session = HostSession | PlayerSession

const SESSION_KEY = 'chameleonPartySession'

function getJoinCode() {
  const match = window.location.pathname.match(/^\/join\/([^/]+)$/i)
  return match ? decodeURIComponent(match[1]).toUpperCase() : ''
}

function getQrToken(rawValue: string) {
  const raw = rawValue.trim()

  try {
    const url = new URL(raw, window.location.origin)
    const match = url.pathname.match(/^\/c\/([^/]+)$/i)

    if (match) {
      return decodeURIComponent(match[1])
    }
  } catch {
    // A raw QR token is also accepted for manual/development scanning.
  }

  return raw
}

function loadSession(): Session | null {
  try {
    const value = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as Session | null

    if (value?.kind === 'host' || value?.kind === 'player') {
      return value
    }
  } catch {
    // A malformed or unavailable local session simply starts at the home page.
  }

  return null
}

function saveSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  clearTokens()
}

function errorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    const fieldMessage = error.fieldErrors
      ? Object.values(error.fieldErrors).filter(Boolean).join(' ')
      : ''

    return fieldMessage || error.message || error.code
  }

  return error instanceof Error ? error.message : '요청을 처리하지 못했습니다.'
}

function phaseLabel(status: GameResponse['status']) {
  return {
    WAITING: '게임 시작 대기',
    ROLE_ASSIGNED: '역할 확인 중',
    DESIGNING: '캐릭터 디자인 중',
    PRINTING: '카드 출력 중',
    HIDING: '카드 숨기는 중',
    SEEKING: '카드 찾는 중',
    FINISHED: '게임 종료',
  }[status]
}

function useClockNow() {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return now
}

function AppMessage({ error }: { error: string | null }) {
  if (!error) {
    return null
  }

  return (
    <p className="app-message app-message--error" role="alert">
      {error}
    </p>
  )
}

function HomePage({
  initialJoinCode,
  busy,
  error,
  onCreate,
  onJoin,
}: {
  initialJoinCode: string
  busy: boolean
  error: string | null
  onCreate: (request: CreateRoomRequest) => Promise<void>
  onJoin: (roomCode: string, nickname: string) => Promise<void>
}) {
  const [roomName, setRoomName] = useState('우리들의 숨바꼭질')
  const [seekerCount, setSeekerCount] = useState(1)
  const [roomCode, setRoomCode] = useState(initialJoinCode)
  const [nickname, setNickname] = useState('')

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onCreate({
      name: roomName.trim(),
      designDurationSeconds: 600,
      hideDurationSeconds: 300,
      seekDurationSeconds: 1200,
      seekerCount,
    })
  }

  const handleJoin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onJoin(roomCode.trim().toUpperCase(), nickname.trim())
  }

  return (
    <main className="app-home">
      <header className="app-home__hero">
        <p className="app-home__eyebrow">CHAMELEON PARTY</p>
        <h1>오늘의 숨바꼭질을 시작해요</h1>
        <p>방을 만들거나 초대받은 코드로 참가해 실제 게임을 시작할 수 있어요.</p>
      </header>

      <AppMessage error={error} />

      <section className="home-panels" aria-label="게임 시작 방법">
        <form className="home-panel" onSubmit={(event) => void handleCreate(event)}>
          <p className="app-home__eyebrow">HOST</p>
          <h2>새 방 만들기</h2>
          <p>친구들이 참가할 방을 만들고 게임을 시작하세요.</p>
          <label>
            방 이름
            <input
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              maxLength={100}
              required
            />
          </label>
          <label>
            찾는 사람 수
            <input
              type="number"
              min={1}
              max={100}
              value={seekerCount}
              onChange={(event) => setSeekerCount(Number(event.target.value))}
              required
            />
          </label>
          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? '방을 만드는 중…' : '방 만들기'}
          </button>
        </form>

        <form className="home-panel home-panel--join" onSubmit={(event) => void handleJoin(event)}>
          <p className="app-home__eyebrow">PLAYER</p>
          <h2>방 참가하기</h2>
          <p>방 코드를 입력하고 닉네임을 정해 참가하세요.</p>
          <label>
            방 코드
            <input
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
              maxLength={6}
              placeholder="A7K2Q9"
              required
            />
          </label>
          <label>
            닉네임
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              maxLength={30}
              placeholder="재원"
              required
            />
          </label>
          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? '참가하는 중…' : '방 참가하기'}
          </button>
        </form>
      </section>
    </main>
  )
}

function PageShell({ children, session, onLeave }: { children: ReactNode; session: Session; onLeave: () => void }) {
  return (
    <div className="game-shell">
      <header className="game-header">
        <div>
          <p className="game-header__brand">CHAMELEON PARTY</p>
          <strong>{session.roomCode}</strong>
        </div>
        <button type="button" className="text-button" onClick={onLeave}>
          나가기
        </button>
      </header>
      {children}
    </div>
  )
}

function LobbyPage({
  session,
  room,
  participants,
  busy,
  error,
  onStart,
}: {
  session: Session
  room: RoomResponse
  participants: ParticipantResponse[]
  busy: boolean
  error: string | null
  onStart: () => Promise<void>
}) {
  const isHost = session.kind === 'host'
  const canStart = participants.length >= 2 && room.seekerCount < participants.length

  return (
    <main className="lobby-page">
      <section className="lobby-hero">
        <p className="app-home__eyebrow">WAITING ROOM</p>
        <h1>{room.name}</h1>
        <p>친구들이 모두 들어오면 게임을 시작해 주세요.</p>
        <div className="room-code">
          <span>방 코드</span>
          <strong>{room.roomCode}</strong>
        </div>
      </section>

      <AppMessage error={error} />

      <section className="lobby-card">
        <div className="lobby-card__heading">
          <h2>참가자</h2>
          <span>{participants.length}명</span>
        </div>
        {isHost ? (
          <ul className="participant-list">
            {participants.length === 0 ? (
              <li className="empty-state">방 코드를 공유하고 친구를 기다려 주세요.</li>
            ) : (
              participants.map((participant) => (
                <li key={participant.participantId}>
                  <span>{participant.nickname}</span>
                  <small>참가 완료</small>
                </li>
              ))
            )}
          </ul>
        ) : (
          <p className="empty-state">주최자가 게임을 시작하면 역할이 정해집니다.</p>
        )}
      </section>

      {isHost ? (
        <button
          className="primary-button primary-button--wide"
          type="button"
          disabled={!canStart || busy}
          onClick={() => void onStart()}
        >
          {busy ? '게임을 시작하는 중…' : canStart ? '게임 시작하기' : '참가자 2명 이상 필요'}
        </button>
      ) : (
        <div className="waiting-pill">주최자의 게임 시작을 기다리는 중…</div>
      )}
    </main>
  )
}

function HostGamePage({
  session,
  game,
  characters,
  printSheet,
  qrUrls,
  printBusy,
  result,
  busy,
  error,
  onAction,
  onLoadPrint,
}: {
  session: HostSession
  game: GameResponse
  characters: CharacterResponse[]
  printSheet: PrintSheetResponse | null
  qrUrls: Record<number, string>
  printBusy: boolean
  result: GameResultResponse | null
  busy: boolean
  error: string | null
  onAction: (action: 'hiding' | 'seeking' | 'finish') => Promise<void>
  onLoadPrint: () => Promise<void>
}) {
  const now = useClockNow()
  const allHidden = characters.length > 0 && characters.every((character) => character.status === 'HIDDEN')
  const hideTimeOver = !game.hideEndsAt || new Date(game.hideEndsAt).getTime() <= now
  const seekTimeOver = !game.seekEndsAt || new Date(game.seekEndsAt).getTime() <= now

  return (
    <main className="host-game-page">
      <section className="status-hero">
        <p className="app-home__eyebrow">HOST CONTROL</p>
        <h1>{phaseLabel(game.status)}</h1>
        <p>게임 상태는 backend를 기준으로 자동 갱신됩니다.</p>
        <strong className="status-hero__status">{game.status}</strong>
      </section>
      <AppMessage error={error} />

      <section className="host-stats">
        <div><strong>{game.hiderCount}</strong><span>Hider</span></div>
        <div><strong>{game.seekerCount}</strong><span>Seeker</span></div>
        <div><strong>{characters.filter((character) => character.status === 'HIDDEN').length}</strong><span>숨김 완료</span></div>
      </section>

      <section className="host-card">
        <h2>다음 단계</h2>
        {game.status === 'DESIGNING' && <p>모든 Hider가 캐릭터를 제출하면 인쇄 단계로 넘어갑니다.</p>}
        {game.status === 'PRINTING' && <p>출력물을 준비한 뒤 숨기기 시작을 눌러 주세요.</p>}
        {game.status === 'HIDING' && <p>{allHidden ? '모든 Hider가 준비되었습니다.' : 'Hider가 카드를 숨기는 중입니다.'}</p>}
        {game.status === 'SEEKING' && <p>탐색 시간이 끝난 뒤 게임 종료를 확정할 수 있습니다.</p>}
        {game.status === 'FINISHED' && <p>게임이 종료되었습니다. 결과를 확인하세요.</p>}

        {game.status === 'PRINTING' && (
          <>
            <button className="secondary-button" type="button" disabled={printBusy} onClick={() => void onLoadPrint()}>
              {printBusy ? '인쇄 데이터를 불러오는 중…' : printSheet ? '인쇄 데이터 새로고침' : '인쇄 데이터 불러오기'}
            </button>
            <button className="primary-button" type="button" disabled={busy || !printSheet} onClick={() => void onAction('hiding')}>
              {!printSheet ? '먼저 인쇄 데이터를 불러오세요' : '숨기기 단계 시작'}
            </button>
          </>
        )}
        {game.status === 'HIDING' && (
          <button className="primary-button" type="button" disabled={busy || !allHidden || !hideTimeOver} onClick={() => void onAction('seeking')}>
            {!hideTimeOver ? '숨기기 시간 종료 대기' : !allHidden ? 'Hider 준비 대기' : '탐색 단계 시작'}
          </button>
        )}
        {game.status === 'SEEKING' && (
          <button className="primary-button" type="button" disabled={busy || !seekTimeOver} onClick={() => void onAction('finish')}>
            {seekTimeOver ? '게임 종료 처리' : '탐색 시간 진행 중'}
          </button>
        )}
      </section>

      {game.status === 'PRINTING' && printSheet ? (
        <PrintSheetPreview sheet={printSheet} qrUrls={qrUrls} />
      ) : null}

      {result ? <ResultView result={result} /> : null}
      <span className="sr-only">현재 세션 주최자 {session.name}</span>
    </main>
  )
}

function PrintSheetPreview({
  sheet,
  qrUrls,
}: {
  sheet: PrintSheetResponse
  qrUrls: Record<number, string>
}) {
  return (
    <section className="host-card print-sheet">
      <div className="host-card__heading">
        <h2>인쇄 미리보기</h2>
        <span>{sheet.paperSize} · {sheet.columns}열 · {sheet.scalePercent}%</span>
      </div>
      <p>앞면은 캐릭터, 뒷면은 같은 번호의 QR을 사용해 실제 카드와 맞춰 주세요.</p>
      <div className="print-sheet__grid">
        {sheet.characters.map((item) => (
          <article className="print-sheet__item" key={item.characterId}>
            <span>#{item.printSlot}</span>
            <img src={resolveAssetUrl(item.characterImageUrl)} alt={`캐릭터 ${item.printSlot}`} />
            {qrUrls[item.characterId] ? (
              <img src={qrUrls[item.characterId]} alt={`캐릭터 ${item.printSlot} QR`} />
            ) : (
              <small>QR 준비 중…</small>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function ResultView({ result }: { result: GameResultResponse }) {
  return (
    <section className="host-card">
      <h2>최종 결과: {result.winner === 'SEEKER' ? '찾는 사람 승리' : '숨는 사람 승리'}</h2>
      <ul className="result-list">
        {result.hiders.map((hider) => (
          <li key={hider.characterId}>
            <span>{hider.nickname}</span>
            <small>{hider.characterStatus} · {hider.survivalSeconds}초</small>
          </li>
        ))}
      </ul>
    </section>
  )
}

function HiderGamePage({
  session,
  game,
  onRefresh,
}: {
  session: PlayerSession
  game: GameResponse
  onRefresh: () => Promise<void>
}) {
  const [started, setStarted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [character, setCharacter] = useState<CharacterResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const designTimer = usePhaseCountdown(game.designStartedAt, game.designDurationSeconds)
  const hideTimer = usePhaseCountdown(game.hideStartedAt, game.hideDurationSeconds)

  useEffect(() => {
    if (!['DESIGNING', 'PRINTING', 'HIDING', 'FINISHED'].includes(game.status)) {
      return
    }

    void getMyCharacter(game.gameId)
      .then((nextCharacter) => {
        setCharacter(nextCharacter)

        if (game.status === 'DESIGNING' || game.status === 'PRINTING') {
          setSubmitted(true)
          setPreviewUrl(resolveAssetUrl(nextCharacter.previewImageUrl))
        }
      })
      .catch((requestError) => {
        if (!(requestError instanceof ApiRequestError) || requestError.code !== 'CHARACTER_NOT_FOUND') {
          setError(errorMessage(requestError))
        }
      })
  }, [game.gameId, game.status])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleHidden = async () => {
    if (!character) {
      return
    }

    try {
      await markHidden(game.gameId, character.characterId)
      await onRefresh()
    } catch (requestError) {
      setError(errorMessage(requestError))
    }
  }

  if (game.status === 'DESIGNING' && submitted) {
    return <HiderWaitPage gameStatus={game.status} previewUrl={previewUrl} />
  }

  if (game.status === 'DESIGNING' && !started) {
    return (
      <main className="player-page">
        <HiderRolePanel
          nickname={session.nickname}
          timerLabel={designTimer.label}
          timerExpired={designTimer.expired}
          onStart={() => setStarted(true)}
        />
      </main>
    )
  }

  if (game.status === 'DESIGNING') {
    return (
      <>
        <AppMessage error={error} />
        <HiderDesignPage
          gameId={game.gameId}
          designStartedAt={game.designStartedAt}
          designDurationSeconds={game.designDurationSeconds}
          onSubmitted={({ previewBlob }) => {
            setPreviewUrl(URL.createObjectURL(previewBlob))
            setSubmitted(true)
            void onRefresh()
          }}
          onRefreshGame={() => void onRefresh()}
        />
      </>
    )
  }

  if (game.status === 'HIDING' && character) {
    return (
      <>
        <AppMessage error={error} />
        <HiderHidePage
          timerLabel={hideTimer.label}
          timerExpired={hideTimer.expired}
          ready={character.status === 'HIDDEN'}
          onReady={() => void handleHidden()}
        />
      </>
    )
  }

  return (
    <main className="player-page">
      <HiderWaitPage
        gameStatus={game.status}
        previewUrl={character ? resolveAssetUrl(character.previewImageUrl) : previewUrl}
      />
      {error ? <AppMessage error={error} /> : null}
    </main>
  )
}

function SeekerGamePage({
  session,
  game,
  onRefresh,
}: {
  session: PlayerSession
  game: GameResponse
  onRefresh: () => Promise<void>
}) {
  const [route, setRoute] = useState<'wait' | 'scan' | 'found' | 'result'>('wait')
  const [scanOutcome, setScanOutcome] = useState<ScanOutcome>('error')
  const [foundCharacter, setFoundCharacter] = useState<FoundCharacterResult>()
  const [errorCode, setErrorCode] = useState<string>()
  const [result, setResult] = useState<GameResultResponse | null>(null)
  const now = useClockNow()

  const loadResult = useCallback(async () => {
    const nextResult = await getGameResult(game.gameId, 'participant')
    setResult(nextResult)
    setRoute('result')
  }, [game.gameId])

  useEffect(() => {
    if (game.status === 'FINISHED') {
      void loadResult().catch(() => undefined)
    }
  }, [game.status, loadResult])

  const handleScanToken = async (qrToken: string) => {
    const token = getQrToken(qrToken)

    try {
      await lookupQr(token)
      const found = await markFound(game.gameId, token)
      setFoundCharacter({
        characterId: found.characterId,
        hiderNickname: found.hiderNickname,
        originalPhotoUrl: resolveAssetUrl(found.originalPhotoUrl),
        previewImageUrl: resolveAssetUrl(found.previewImageUrl),
        survivalSeconds: found.survivalSeconds,
      })
      setScanOutcome('success')
      setErrorCode(undefined)
      setRoute('found')
      await onRefresh()

      if (found.gameFinished) {
        await loadResult()
      }
    } catch (requestError) {
      const code = requestError instanceof ApiRequestError ? requestError.code : undefined
      setErrorCode(code)
      setScanOutcome(code === 'CHARACTER_ALREADY_FOUND' ? 'duplicate' : code === 'INVALID_QR_TOKEN' ? 'invalid' : 'error')
      setRoute('found')
    }
  }

  const resultProps = result
    ? {
        winnerLabel: result.winner === 'SEEKER' ? '찾는 사람 팀 승리' : '숨는 사람 팀 승리',
        hiders: result.hiders.map((hider) => ({
          characterId: hider.characterId,
          nickname: hider.nickname,
          status: hider.characterStatus,
          survivalSeconds: hider.survivalSeconds,
        })),
        seekers: result.seekers.map((seeker) => ({
          participantId: seeker.participantId,
          nickname: seeker.nickname,
          foundCount: seeker.foundCount,
        })),
      }
    : undefined

  return (
    <>
      <SeekerRoutes
        route={route}
        gameStatus={game.status}
        roomName={session.roomCode}
        nickname={session.nickname}
        remainingSeconds={
          game.seekEndsAt ? Math.max(0, (new Date(game.seekEndsAt).getTime() - now) / 1000) : undefined
        }
        onOpenScanner={() => setRoute('scan')}
        onScanToken={handleScanToken}
        onCloseScanner={() => setRoute('wait')}
        scanOutcome={scanOutcome}
        foundCharacter={foundCharacter}
        errorCode={errorCode}
        onRetryScan={() => setRoute('scan')}
        onContinueSearching={() => setRoute(game.status === 'SEEKING' ? 'scan' : 'wait')}
        winnerLabel={resultProps?.winnerLabel}
        hiders={resultProps?.hiders}
        seekers={resultProps?.seekers}
      />
    </>
  )
}

function BackendApp() {
  const [session, setSession] = useState<Session | null>(() => loadSession())
  const [room, setRoom] = useState<RoomResponse | null>(null)
  const [participants, setParticipants] = useState<ParticipantResponse[]>([])
  const [characters, setCharacters] = useState<CharacterResponse[]>([])
  const [printSheet, setPrintSheet] = useState<PrintSheetResponse | null>(null)
  const [qrUrls, setQrUrls] = useState<Record<number, string>>({})
  const [printBusy, setPrintBusy] = useState(false)
  const [game, setGame] = useState<GameResponse | null>(null)
  const [result, setResult] = useState<GameResultResponse | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!session) {
      return
    }

    const nextRoom = await getRoom(session.roomCode)
    setRoom(nextRoom)

    if (session.kind === 'host') {
      const nextParticipants = await getParticipants(session.roomId)
      setParticipants(nextParticipants)
    }

    if (nextRoom.gameStatus !== 'WAITING') {
      const nextGame = await getGame(
        session.gameId,
        session.kind === 'host' ? 'host' : 'participant',
      )
      setGame(nextGame)
    } else {
      setGame(null)
    }
  }, [session])

  useEffect(() => {
    if (!session) {
      return
    }

    const load = async () => {
      try {
        setError(null)
        await refresh()
      } catch (requestError) {
        setError(errorMessage(requestError))
      }
    }

    void load()
    const interval = window.setInterval(() => void load(), 2500)

    return () => window.clearInterval(interval)
  }, [refresh, session])

  useEffect(() => {
    if (!session || session.kind !== 'host' || !game || !['PRINTING', 'HIDING', 'SEEKING', 'FINISHED'].includes(game.status)) {
      return
    }

    // The host-only character list is needed to unlock the next phase safely.
    void getCharacters(game.gameId).then(setCharacters).catch(() => undefined)
  }, [game, session])

  const loadPrintSheet = useCallback(async () => {
    if (!session || session.kind !== 'host' || !game || game.status !== 'PRINTING') {
      return
    }

    setPrintBusy(true)

    try {
      const sheet = await getPrintSheet(game.gameId)
      const entries = await Promise.all(
        sheet.characters.map(async (character) => {
          const blob = await getQrImage(game.gameId, character.characterId)
          return [character.characterId, URL.createObjectURL(blob)] as const
        }),
      )

      setQrUrls((current) => {
        Object.values(current).forEach((url) => URL.revokeObjectURL(url))
        return Object.fromEntries(entries) as Record<number, string>
      })
      setPrintSheet(sheet)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setPrintBusy(false)
    }
  }, [game, session])

  useEffect(() => () => {
    Object.values(qrUrls).forEach((url) => URL.revokeObjectURL(url))
  }, [qrUrls])

  useEffect(() => {
    if (!session || session.kind !== 'host' || !game || game.status !== 'FINISHED') {
      return
    }

    void getGameResult(game.gameId, 'host').then(setResult).catch(() => undefined)
  }, [game, session])

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)

    try {
      await action()
      await refresh()
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  const handleCreate = async (request: CreateRoomRequest) => {
    setBusy(true)
    setError(null)

    try {
      const created = await createRoom(request)
      clearTokens()
      saveToken('host', created.hostToken)
      const nextSession: HostSession = {
        kind: 'host',
        roomId: created.roomId,
        gameId: created.gameId,
        roomCode: created.roomCode,
        name: request.name,
      }
      saveSession(nextSession)
      setSession(nextSession)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  const handleJoin = async (roomCode: string, nickname: string) => {
    setBusy(true)
    setError(null)

    try {
      const roomInfo = await getRoom(roomCode)
      const joined = await joinRoom(roomCode, nickname)
      clearTokens()
      saveToken('participant', joined.participantToken)
      const nextSession: PlayerSession = {
        kind: 'player',
        participantId: joined.participantId,
        roomId: joined.roomId,
        gameId: joined.gameId,
        roomCode: roomInfo.roomCode,
        nickname,
      }
      saveSession(nextSession)
      setSession(nextSession)
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  const leave = () => {
    clearSession()
    setSession(null)
    setRoom(null)
    setGame(null)
  }

  if (!session) {
    return (
      <HomePage
        initialJoinCode={getJoinCode()}
        busy={busy}
        error={error}
        onCreate={handleCreate}
        onJoin={handleJoin}
      />
    )
  }

  if (!room) {
    return <main className="loading-page">방 정보를 불러오는 중…</main>
  }

  if (!game) {
    return (
      <PageShell session={session} onLeave={leave}>
        <LobbyPage
          session={session}
          room={room}
          participants={participants}
          busy={busy}
          error={error}
          onStart={() => run(() => startGame(room.roomId))}
        />
      </PageShell>
    )
  }

  if (session.kind === 'host') {
    return (
      <PageShell session={session} onLeave={leave}>
        <HostGamePage
          session={session}
          game={game}
          characters={characters}
          printSheet={printSheet}
          qrUrls={qrUrls}
          printBusy={printBusy}
          result={result}
          busy={busy}
          error={error}
          onAction={(action) =>
            run(() =>
              action === 'hiding'
                ? startHiding(game.gameId)
                : action === 'seeking'
                  ? startSeeking(game.gameId)
                  : finishGame(game.gameId),
            )
          }
          onLoadPrint={loadPrintSheet}
        />
      </PageShell>
    )
  }

  const playerContent = game.myRole === 'HIDER' ? (
    <HiderGamePage session={session} game={game} onRefresh={refresh} />
  ) : (
    <SeekerGamePage session={session} game={game} onRefresh={refresh} />
  )

  return (
    <PageShell session={session} onLeave={leave}>
      {playerContent}
    </PageShell>
  )
}

export default BackendApp
