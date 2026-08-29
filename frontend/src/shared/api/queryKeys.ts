/**
 * §39 — Event 수신 후 관련 Query만 invalidate 한다.
 * 키를 각 Feature에서 새로 만들지 말고 여기 것을 쓴다.
 */
export const queryKeys = {
  room: (roomCode: string) => ['room', roomCode] as const,
  participants: (roomId: number) => ['participants', roomId] as const,
  game: (gameId: number) => ['game', gameId] as const,
  characters: (gameId: number) => ['characters', gameId] as const,
  printSheet: (gameId: number) => ['printSheet', gameId] as const,
} as const
