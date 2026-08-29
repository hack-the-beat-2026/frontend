import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { formatDuration, useCountdown } from '@/shared/hooks/useCountdown'
import { useSessionStore } from '@/shared/store/sessionStore'
import type { Game } from '@/shared/types'
import { DevPanel } from '../components/DevPanel'
import { ParticipantList } from '../components/ParticipantList'
import { PhaseStepper } from '../components/PhaseStepper'
import { Button, Card, ErrorBanner, PageShell } from '../components/ui'
import {
  useFinishGame,
  useStartHiding,
  useStartSeeking,
} from '../hooks/usePartyMutations'
import { useGame } from '../hooks/usePartyQueries'
import { errorMessage } from '../utils/errorMessage'
import { toPartyRoute } from '../routes/partyPaths'

/** 현재 단계의 타이머 소스. 어느 값을 쓸지만 고르고 판정은 하지 않는다. */
function currentTimer(game: Game): { startedAt: string | null; duration: number } {
  switch (game.status) {
    case 'DESIGNING':
      return {
        startedAt: game.designStartedAt,
        duration: game.designDurationSeconds,
      }
    case 'HIDING':
      return {
        startedAt: game.hideStartedAt,
        duration: game.hideDurationSeconds,
      }
    case 'SEEKING':
      return {
        startedAt: game.seekStartedAt,
        duration: game.seekDurationSeconds,
      }
    default:
      return { startedAt: null, duration: 0 }
  }
}

const STATUS_GUIDE: Record<Game['status'], string> = {
  WAITING: '참가자를 기다리는 중이에요.',
  ROLE_ASSIGNED: '역할을 나눴어요.',
  DESIGNING: '숨는 사람들이 장소를 찍고 위장을 만드는 중이에요.',
  PRINTING: '전원 제출 완료. 카드를 인쇄해 나눠 주세요.',
  HIDING: '숨는 사람들이 카드를 숨기는 중이에요.',
  SEEKING: '찾는 사람들이 카드를 찾는 중이에요.',
  FINISHED: '게임이 끝났어요.',
}

export function HostDashboardPage() {
  const { gameId: gameIdParam } = useParams()
  const gameId = Number(gameIdParam)
  const hostToken = useSessionStore((s) => s.hostToken)
  const [showRoles, setShowRoles] = useState(false)

  const game = useGame(Number.isFinite(gameId) ? gameId : undefined)
  const startHiding = useStartHiding(gameId)
  const startSeeking = useStartSeeking(gameId)
  const finishGame = useFinishGame(gameId)

  if (!hostToken) return <Navigate to={toPartyRoute('landing')} replace />

  if (!game.data) {
    return (
      <PageShell title="게임 진행">
        <ErrorBanner message={game.error ? errorMessage(game.error) : null} />
        {!game.error ? (
          <p className="py-10 text-center text-sm text-neutral-400">
            불러오는 중…
          </p>
        ) : null}
      </PageShell>
    )
  }

  const data = game.data
  const timer = currentTimer(data)
  const pendingError =
    startHiding.error ?? startSeeking.error ?? finishGame.error

  return (
    <PageShell title="게임 진행" subtitle={STATUS_GUIDE[data.status]}>
      <Card className="flex flex-col gap-5">
        <PhaseStepper status={data.status} />
        <PhaseTimer startedAt={timer.startedAt} duration={timer.duration} />

        <dl className="grid grid-cols-3 gap-2 text-center">
          <Stat label="숨는 사람" value={data.hiderCount ?? 0} />
          <Stat
            label="제출"
            value={`${data.submittedCount ?? 0} / ${data.hiderCount ?? 0}`}
          />
          <Stat
            label="발견"
            value={`${data.foundCount ?? 0} / ${data.submittedCount ?? 0}`}
          />
        </dl>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold text-neutral-900">다음 단계</h2>

        {data.status === 'DESIGNING' ? (
          <p className="text-sm text-neutral-500">
            모든 숨는 사람이 제출하면 자동으로 인쇄 단계로 넘어가요. 서버가
            판단하니 기다리시면 됩니다.
          </p>
        ) : null}

        {data.status === 'PRINTING' ? (
          <>
            <Link to={toPartyRoute('print', { gameId })}>
              <Button size="lg">카드 인쇄하기</Button>
            </Link>
            <Button
              variant="ghost"
              onClick={() => startHiding.mutate()}
              disabled={startHiding.isPending}
            >
              인쇄 끝났어요 · 숨기기 시작
            </Button>
          </>
        ) : null}

        {data.status === 'HIDING' ? (
          <>
            <Button
              size="lg"
              onClick={() => startSeeking.mutate()}
              disabled={startSeeking.isPending}
            >
              탐색 시작
            </Button>
            <p className="text-xs text-neutral-500">
              숨기기 시간이 끝나고 모든 숨는 사람이 완료를 눌러야 시작할 수
              있어요. 조건은 서버가 확인합니다.
            </p>
          </>
        ) : null}

        {data.status === 'SEEKING' ? (
          <Button
            variant="danger"
            onClick={() => finishGame.mutate()}
            disabled={finishGame.isPending}
          >
            지금 게임 끝내기
          </Button>
        ) : null}

        {data.status === 'FINISHED' ? (
          <Link to={`/game/${gameId}/result`}>
            <Button size="lg" variant="secondary">
              결과 보기
            </Button>
          </Link>
        ) : null}

        {data.status !== 'WAITING' && data.status !== 'DESIGNING' ? (
          <Link
            to={toPartyRoute('print', { gameId })}
            className="text-center text-sm text-neutral-500 underline underline-offset-4"
          >
            인쇄 화면 다시 열기
          </Link>
        ) : null}

        <ErrorBanner message={pendingError ? errorMessage(pendingError) : null} />
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900">참가자</h2>
          <button
            type="button"
            onClick={() => setShowRoles((value) => !value)}
            className="text-xs font-medium text-neutral-500 underline underline-offset-4"
          >
            {showRoles ? '역할 숨기기' : '역할 보기'}
          </button>
        </div>
        {showRoles ? (
          <p className="pt-1 text-xs text-amber-700">
            옆에서 찾는 사람이 볼 수 있어요. 확인만 하고 다시 숨기세요.
          </p>
        ) : null}
        <ParticipantList
          participants={data.participants ?? []}
          showRoles={showRoles}
        />
      </Card>

      <DevPanel gameId={gameId} />
    </PageShell>
  )
}

function PhaseTimer({
  startedAt,
  duration,
}: {
  startedAt: string | null
  duration: number
}) {
  const countdown = useCountdown(startedAt, duration)
  if (!startedAt) return null

  return (
    <div className="text-center">
      <p
        className={`font-mono text-5xl font-bold tabular-nums ${
          countdown.expired ? 'text-neutral-400' : 'text-neutral-900'
        }`}
      >
        {formatDuration(countdown.remainingSeconds)}
      </p>
      <p className="mt-1 text-xs text-neutral-400">
        {countdown.expired
          ? '시간이 끝났어요. 전환은 서버가 처리합니다.'
          : '남은 시간 (표시용 · 판정은 서버가 합니다)'}
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-neutral-50 py-3">
      <dt className="text-[11px] font-medium text-neutral-500">{label}</dt>
      <dd className="mt-0.5 text-lg font-bold text-neutral-900">{value}</dd>
    </div>
  )
}
