import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import {
  createRoom,
  finishGame,
  joinRoom,
  queryKeys,
  startGame,
  startHiding,
  startSeeking,
} from '@/shared/api'
import { useSessionStore } from '@/shared/store/sessionStore'
import type { CreateRoomRequest, Game } from '@/shared/types'
import { toPartyRoute } from '../routes/partyPaths'

export function useCreateRoom() {
  const navigate = useNavigate()
  const setHostSession = useSessionStore((s) => s.setHostSession)

  return useMutation({
    mutationFn: (body: CreateRoomRequest) => createRoom(body),
    onSuccess: (room) => {
      // Token은 Backend가 발급한 값만 저장한다 (architecture.md §20).
      setHostSession({
        hostToken: room.hostToken,
        roomId: room.roomId,
        roomCode: room.roomCode,
      })
      navigate(toPartyRoute('lobby', { roomCode: room.roomCode }))
    },
  })
}

export function useJoinRoom(roomCode: string) {
  const setParticipantSession = useSessionStore((s) => s.setParticipantSession)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (nickname: string) => joinRoom(roomCode, { nickname }),
    onSuccess: (result) => {
      setParticipantSession({
        participantToken: result.participantToken,
        participantId: result.participantId,
        roomId: result.roomId,
        roomCode,
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.room(roomCode) })
    },
  })
}

/**
 * 게임 단계 전환.
 *
 * contractRules.md §12, §39 — 성공 후 최신 Game을 다시 조회해 UI를 갱신한다.
 * §33 — 409는 장애가 아니라 상태가 이미 바뀌었다는 신호이므로, 실패해도 재조회한다.
 */
function usePhaseMutation(
  gameId: number | undefined,
  action: (gameId: number) => Promise<Game>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => action(gameId!),
    onSettled: () => {
      if (!gameId) return
      queryClient.invalidateQueries({ queryKey: queryKeys.game(gameId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.characters(gameId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.printSheet(gameId) })
    },
  })
}

export function useStartGame(roomId: number | undefined) {
  const navigate = useNavigate()
  const setGameId = useSessionStore((s) => s.setGameId)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => startGame(roomId!),
    onSuccess: (game) => {
      setGameId(game.gameId)
      queryClient.setQueryData(queryKeys.game(game.gameId), game)
      navigate(toPartyRoute('dashboard', { gameId: game.gameId }))
    },
  })
}

export const useStartHiding = (gameId: number | undefined) =>
  usePhaseMutation(gameId, startHiding)

export const useStartSeeking = (gameId: number | undefined) =>
  usePhaseMutation(gameId, startSeeking)

export const useFinishGame = (gameId: number | undefined) =>
  usePhaseMutation(gameId, finishGame)
