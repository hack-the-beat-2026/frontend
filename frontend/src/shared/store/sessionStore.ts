import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { GameRole } from '@/shared/types'

/**
 * contractRules.md §8 (frontend_agent.md) — 전역 상태는 최소한만 둔다.
 * Feature의 UI 상태(선택한 pose, editor zoom, scanner open 등)는 여기에 넣지 않는다.
 *
 * Token은 §6에 따라 Backend가 발급한 값만 저장한다.
 * Frontend에서 Token을 생성하지 않는다.
 */
export type SessionState = {
  hostToken: string | null
  participantToken: string | null

  roomId: number | null
  roomCode: string | null
  gameId: number | null
  participantId: number | null
  /** Backend가 배정한 자신의 역할. Frontend가 임의로 정하지 않는다. */
  role: GameRole

  setHostSession: (input: {
    hostToken: string
    roomId: number
    roomCode: string
  }) => void
  setParticipantSession: (input: {
    participantToken: string
    participantId: number
    roomId: number
    roomCode: string
  }) => void
  setGameId: (gameId: number | null) => void
  setRole: (role: GameRole) => void
  clear: () => void
}

const initialState = {
  hostToken: null,
  participantToken: null,
  roomId: null,
  roomCode: null,
  gameId: null,
  participantId: null,
  role: 'NONE',
} satisfies Omit<
  SessionState,
  'setHostSession' | 'setParticipantSession' | 'setGameId' | 'setRole' | 'clear'
>

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      ...initialState,

      setHostSession: ({ hostToken, roomId, roomCode }) =>
        set({ hostToken, roomId, roomCode }),

      setParticipantSession: ({
        participantToken,
        participantId,
        roomId,
        roomCode,
      }) => set({ participantToken, participantId, roomId, roomCode }),

      setGameId: (gameId) => set({ gameId }),

      setRole: (role) => set({ role }),

      clear: () => set({ ...initialState }),
    }),
    {
      name: 'chameleon-session',
      /**
       * ⚠️ contractRules.md §6은 localStorage를 예로 들지만 여기서는 sessionStorage를 쓴다.
       *
       * 이유: 심사와 데모는 한 브라우저에서 HOST 탭 / HIDER 탭 / SEEKER 탭을 동시에 연다.
       * localStorage는 같은 origin의 모든 탭이 공유하므로 hostToken과 participantToken이
       * 서로를 덮어써 데모가 성립하지 않는다. sessionStorage는 탭 단위로 격리된다.
       * (새로고침에는 살아남고, 새 탭에서만 초기화된다 — 원하는 동작 그대로다.)
       *
       * Token을 Backend가 발급하고 Frontend가 생성하지 않는다는 §6의 핵심은 그대로 지킨다.
       * 팀 합의 항목: PLAN.md 10장 참고.
       */
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)

/** React 밖(api client 등)에서 토큰을 읽기 위한 접근자. */
export function getSession(): SessionState {
  return useSessionStore.getState()
}

export function isHost(): boolean {
  return getSession().hostToken !== null
}
