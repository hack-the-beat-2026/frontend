import { useQuery } from '@tanstack/react-query'
import {
  getGame,
  getParticipants,
  getPrintSheet,
  getRoom,
  queryKeys,
} from '@/shared/api'

/**
 * Phase 4에서 STOMP로 갈아탈 자리다. 그 전까지는 폴링으로 같은 UX를 낸다.
 * WebSocket을 붙일 때도 이벤트로 상태를 재구성하지 않고
 * 아래 쿼리를 invalidate 하는 방식으로 바꾼다 (contractRules.md §39).
 */
const LOBBY_POLL_MS = 2000
const GAME_POLL_MS = 3000

export function useRoom(roomCode: string | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.room(roomCode ?? ''),
    queryFn: () => getRoom(roomCode!),
    enabled: Boolean(roomCode) && enabled,
    refetchInterval: LOBBY_POLL_MS,
  })
}

export function useParticipants(roomId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.participants(roomId ?? 0),
    queryFn: () => getParticipants(roomId!),
    enabled: Boolean(roomId),
    refetchInterval: LOBBY_POLL_MS,
  })
}

export function useGame(gameId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.game(gameId ?? 0),
    queryFn: () => getGame(gameId!),
    enabled: Boolean(gameId),
    refetchInterval: GAME_POLL_MS,
  })
}

export function usePrintSheet(gameId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.printSheet(gameId ?? 0),
    queryFn: () => getPrintSheet(gameId!),
    enabled: Boolean(gameId) && enabled,
  })
}
