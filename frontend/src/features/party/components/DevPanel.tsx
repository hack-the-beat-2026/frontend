import { useQueryClient } from '@tanstack/react-query'
import { mockDevTools } from '@/shared/api/mock'
import { queryKeys } from '@/shared/api'
import { env } from '@/shared/config/env'

/**
 * mock 모드 전용 개발 도구.
 *
 * Front B / Front C가 아직 없어도 Front A 화면을 끝까지 확인할 수 있어야 한다
 * (frontend_agent.md §10 완료 기준). 실제 백엔드(live) 모드에서는 렌더되지 않는다.
 */
export function DevPanel({
  roomCode,
  roomId,
  gameId,
}: {
  roomCode?: string
  roomId?: number
  gameId?: number
}) {
  const queryClient = useQueryClient()
  if (!env.isMock) return null

  const refresh = () => {
    if (roomCode) {
      queryClient.invalidateQueries({ queryKey: queryKeys.room(roomCode) })
    }
    if (roomId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.participants(roomId) })
    }
    if (gameId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.game(gameId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.printSheet(gameId) })
    }
  }

  return (
    <details className="rounded-xl bg-neutral-900/90 px-4 py-3 text-neutral-200 print:hidden">
      <summary className="cursor-pointer text-xs font-semibold tracking-wide">
        개발 도구 (mock 모드)
      </summary>
      <div className="mt-3 flex flex-wrap gap-2">
        {roomCode ? (
          <DevButton
            label="참가자 5명 채우기"
            onClick={() => {
              mockDevTools.seedParticipants(roomCode, 5)
              refresh()
            }}
          />
        ) : null}
        {gameId ? (
          <>
            <DevButton
              label="HIDER 캐릭터 자동 제출"
              onClick={() => {
                mockDevTools.seedCharacters(gameId)
                refresh()
              }}
            />
            <DevButton
              label="HIDER 숨기기 완료"
              onClick={() => {
                mockDevTools.markAllHidden(gameId)
                refresh()
              }}
            />
            <DevButton
              label="현재 단계 시간 넘기기"
              onClick={() => {
                mockDevTools.skipTimer(gameId)
                refresh()
              }}
            />
          </>
        ) : null}
        <DevButton
          label="mock 데이터 초기화"
          onClick={() => {
            mockDevTools.reset()
            queryClient.clear()
            location.href = '/'
          }}
        />
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-neutral-400">
        세션은 탭마다 따로, mock 서버는 모든 탭이 공유한다. 새 탭을 열면 다른 사람이
        되므로 HOST · HIDER · SEEKER를 한 브라우저에서 동시에 볼 수 있다.
      </p>
    </details>
  )
}

function DevButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg bg-neutral-700 px-3 py-1.5 text-xs font-medium hover:bg-neutral-600"
    >
      {label}
    </button>
  )
}
