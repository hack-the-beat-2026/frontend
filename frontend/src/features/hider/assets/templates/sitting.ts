import type { CharacterTemplate } from './types'

/** Side view: upright torso, thighs forward, shins down — a seated profile. */
export const sitting: CharacterTemplate = {
  id: 'SITTING',
  label: '앉기',
  width: 200,
  height: 400,
  parts: {
    head: { d: 'M105 92a27 27 0 1 1-54 0 27 27 0 1 1 54 0Z' },
    body: {
      d: 'M78 116c-13 0-25 8-29 20l-8 56c-2 13 6 25 20 25h34c14 0 22-12 20-25l-8-56c-4-12-16-20-29-20Z',
    },
    arms: { d: 'M76 140 66 198 124 212M86 144l-8 54 54 12', strokeWidth: 21 },
    legs: { d: 'M76 214 150 226 156 308M90 218l62 12 4 78', strokeWidth: 25 },
  },
}
