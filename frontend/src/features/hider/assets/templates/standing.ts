import type { CharacterTemplate } from './types'

export const standing: CharacterTemplate = {
  id: 'STANDING',
  label: '서 있기',
  width: 200,
  height: 400,
  parts: {
    head: { d: 'M128 46a28 28 0 1 1-56 0 28 28 0 1 1 56 0Z' },
    body: {
      d: 'M100 72c-14 0-26 8-30 20l-8 60c-2 14 6 26 20 26h36c14 0 22-12 20-26l-8-60c-4-12-16-20-30-20Z',
    },
    arms: { d: 'M72 96 60 160 56 216M128 96l12 64 4 56', strokeWidth: 22 },
    legs: { d: 'M86 176 82 268 78 356M114 176l4 92 4 88', strokeWidth: 26 },
  },
}
