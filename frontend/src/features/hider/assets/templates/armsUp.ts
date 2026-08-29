import type { CharacterTemplate } from './types'

export const armsUp: CharacterTemplate = {
  id: 'ARMS_UP',
  label: '만세',
  width: 200,
  height: 400,
  parts: {
    head: { d: 'M128 60a28 28 0 1 1-56 0 28 28 0 1 1 56 0Z' },
    body: {
      d: 'M100 86c-14 0-26 8-30 20l-8 60c-2 14 6 26 20 26h36c14 0 22-12 20-26l-8-60c-4-12-16-20-30-20Z',
    },
    arms: { d: 'M72 110 52 58 46 26M128 110l20-52 6-32', strokeWidth: 22 },
    legs: { d: 'M86 190 82 274 78 358M114 190l4 84 4 84', strokeWidth: 26 },
  },
}
