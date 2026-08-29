import { useEffect } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { useSessionStore } from '@/shared/store/sessionStore'
import { DevPanel } from '../components/DevPanel'
import { JoinQr } from '../components/JoinQr'
import { ParticipantList } from '../components/ParticipantList'
import {
  Button,
  Card,
  CopyButton,
  ErrorBanner,
  PageShell,
} from '../components/ui'
import { useParticipants, useRoom } from '../hooks/usePartyQueries'
import { useStartGame } from '../hooks/usePartyMutations'
import { errorMessage } from '../utils/errorMessage'
import { toPartyRoute } from '../routes/partyPaths'

export function HostLobbyPage() {
  const { roomCode = '' } = useParams()
  const navigate = useNavigate()
  const hostToken = useSessionStore((s) => s.hostToken)
  const roomId = useSessionStore((s) => s.roomId)

  const room = useRoom(roomCode)
  const participants = useParticipants(roomId ?? undefined)
  const startGame = useStartGame(roomId ?? undefined)

  // 이미 게임이 시작된 방이면 대시보드로 넘긴다.
  // 어느 단계인지는 서버가 준 값으로만 판단한다.
  const currentGameId = room.data?.currentGameId ?? null
  useEffect(() => {
    if (currentGameId) {
      navigate(toPartyRoute('dashboard', { gameId: currentGameId }), {
        replace: true,
      })
    }
  }, [currentGameId, navigate])

  if (!hostToken) return <Navigate to={toPartyRoute('landing')} replace />

  const list = participants.data ?? room.data?.participants ?? []
  const canStart = list.length >= 2

  return (
    <PageShell
      title={room.data?.name ?? '대기 중'}
      subtitle="아래 코드나 QR로 친구들을 부르세요."
      footer={
        <>
          <Button
            size="lg"
            onClick={() => startGame.mutate()}
            disabled={!canStart || startGame.isPending}
          >
            {startGame.isPending
              ? '시작하는 중…'
              : canStart
                ? `${list.length}명으로 시작하기`
                : '2명 이상 모이면 시작할 수 있어요'}
          </Button>
          <div className="pt-2">
            <ErrorBanner
              message={startGame.error ? errorMessage(startGame.error) : null}
            />
          </div>
        </>
      }
    >
      <Card className="flex flex-col items-center gap-4">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-widest text-neutral-400">
            방 코드
          </p>
          <p className="mt-1 font-mono text-4xl font-extrabold tracking-[0.2em] text-neutral-900">
            {roomCode}
          </p>
        </div>

        {room.data ? (
          <JoinQr
            joinUrl={room.data.joinUrl}
            joinQrUrl={room.data.joinQrUrl}
          />
        ) : null}

        {room.data ? (
          <div className="flex w-full items-center gap-2 rounded-xl bg-neutral-50 px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-xs text-neutral-500">
              {room.data.joinUrl}
            </span>
            <CopyButton value={room.data.joinUrl} label="링크 복사" />
          </div>
        ) : null}
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900">참가자</h2>
          <span className="text-sm text-neutral-500">
            {list.length} / {room.data?.maxParticipants ?? 10}
          </span>
        </div>
        <ParticipantList participants={list} />
      </Card>

      <ErrorBanner
        message={
          room.error
            ? errorMessage(room.error)
            : participants.error
              ? errorMessage(participants.error)
              : null
        }
      />

      <DevPanel roomCode={roomCode} roomId={roomId ?? undefined} />
    </PageShell>
  )
}
