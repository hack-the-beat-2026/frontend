import { armsUp } from './armsUp'
import { crouching } from './crouching'
import { sitting } from './sitting'
import { standing } from './standing'
import type { CharacterTemplate } from './types'

export type { CharacterTemplate, TemplatePart } from './types'

/** Registry order is the order shown in the picker. */
export const characterTemplates: CharacterTemplate[] = [
  standing,
  armsUp,
  crouching,
  sitting,
]

export const defaultTemplate = standing

export function findTemplate(id: string): CharacterTemplate {
  return characterTemplates.find((template) => template.id === id) ?? defaultTemplate
}
