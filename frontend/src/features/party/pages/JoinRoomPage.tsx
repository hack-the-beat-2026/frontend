import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useSessionStore } from '@/shared/store/sessionStore'
import { ParticipantList } from '../components/ParticipantList'
import { Button, Card, ErrorBanner, Field, PageShell } from '../components/ui'
import { useRoom } from '../hooks/usePartyQueries'
import { useJoinRoom } from '../hooks/usePartyMutations'
import { errorMessage } from '../utils/errorMessage'

/**
 * contractRules.md §34의 라우트 트리에는 PLAYER 대기 화면이 없다.
 * 그래서 이 라우트가 「참가 폼」과 「참가 후 대기」를 함께 담당한다.
 * 게임이 시작되면 Front B/C 영역인 /game/:gameId/role 로 넘긴다.
 */
export function JoinRoomPage() {
  const { roomCode = '' } = useParams()
  const navigate = useNavigate()

  const participantToken = useSessionStore((s) => s.participantToken)
  const sessionRoomCode = useSessionStore((s) => s.roomCode)
  const joined = Boolean(participantToken) && sessionRoomCode === roomCode

  const room = useRoom(roomCode)
  const joinRoom = useJoinRoom(roomCode)
  const [nickname, setNickname] = useState('')

  // 게임 시작 여부는 서버 상태로만 판단한다 (contractRules.md §1).
  const currentGameId = room.data?.currentGameId ?? null
  useEffect(() => {
    if (joined && currentGameId) {
      navigate(`/game/${currentGameId}/role`, { replace: true })
    }
  }, [joined, currentGameId, navigate])

  if (joined) {
    return (
      <PageShell
        title="들어왔어요"
        subtitle="방장이 시작하면 자동으로 넘어가요."
      >
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900">
              {room.data?.name ?? '대기 중'}
            </h2>
            <span className="text-sm text-neutral-500">
              {room.data?.participantCount ?? 0}명
            </span>
          </div>
          <ParticipantList participants={room.data?.participants ?? []} />
        </Card>

        <div className="flex items-center justify-center gap-2 py-4 text-sm text-neutral-500">
          <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
          방장이 시작하기를 기다리는 중
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={room.data?.name ?? '방 참가'}
      subtitle={`방 코드 ${roomCode}`}
      footer={
        <Button
          size="lg"
          onClick={() => joinRoom.mutate(nickname.trim())}
          disabled={nickname.trim().length === 0 || joinRoom.isPending}
        >
          {joinRoom.isPending ? '들어가는 중…' : '참가하기'}
        </Button>
      }
    >
      <Card className="flex flex-col gap-4">
        <Field
          label="이름"
          value={nickname}
          maxLength={30}
          placeholder="파티에서 부를 이름"
          onChange={(event) => setNickname(event.target.value)}
          hint="가입은 필요 없어요. 이름만 정하면 끝."
        />
        <ErrorBanner
          message={
            joinRoom.error
              ? errorMessage(joinRoom.error)
              : room.error
                ? errorMessage(room.error)
                : null
          }
        />
      </Card>
    </PageShell>
  )
}
