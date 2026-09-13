import { SET_COUNT, WORDS } from '../data/words'
import type { SetId, Word } from '../types'

export function parseSetId(raw: string | undefined): SetId | null {
  if (!raw) return null
  if (raw === 'all') return 'all'
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1 || n > SET_COUNT) return null
  return n
}

export function setPath(id: SetId): string {
  return id === 'all' ? 'all' : String(id)
}

export function setTitle(id: SetId): string {
  return id === 'all' ? 'All 250 words' : `Set ${id}`
}

export function wordsForSet(id: SetId): Word[] {
  if (id === 'all') return WORDS
  return WORDS.filter((w) => w.set === id)
}

export function definitionText(word: Word): string {
  return word.synonyms.join(', ')
}

export function allSetIds(): SetId[] {
  return [...Array.from({ length: SET_COUNT }, (_, i) => i + 1), 'all']
}
