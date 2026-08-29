import type { CharacterTemplate } from './types'

export const crouching: CharacterTemplate = {
  id: 'CROUCHING',
  label: '웅크리기',
  width: 200,
  height: 400,
  parts: {
    head: { d: 'M126 88a26 26 0 1 1-52 0 26 26 0 1 1 52 0Z' },
    body: {
      d: 'M100 112c-13 0-24 8-28 19l-7 48c-2 13 6 24 19 24h32c13 0 21-11 19-24l-7-48c-4-11-15-19-28-19Z',
    },
    arms: { d: 'M74 134 56 184 76 222M126 134l18 50-20 38', strokeWidth: 21 },
    legs: { d: 'M86 202 58 262 86 312M114 202l28 60-26 50', strokeWidth: 25 },
  },
}
