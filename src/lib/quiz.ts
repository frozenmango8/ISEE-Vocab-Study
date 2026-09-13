import { WORDS } from '../data/words'
import type { AnswerWith, Word } from '../types'
import { definitionText } from './sets'

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function pickN<T>(items: T[], n: number): T[] {
  return shuffle(items).slice(0, Math.min(n, items.length))
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function acceptedAnswers(word: Word, answerWith: AnswerWith): string[] {
  if (answerWith === 'word') return [word.word]
  return [word.word, ...word.synonyms]
}

export function isWrittenCorrect(input: string, word: Word, answerWith: AnswerWith): boolean {
  const guess = normalize(input)
  if (!guess) return false
  return acceptedAnswers(word, answerWith).some((answer) => normalize(answer) === guess)
}

export function promptFor(word: Word, answerWith: AnswerWith): string {
  return answerWith === 'word' ? definitionText(word) : word.word
}

export function expectedLabel(word: Word, answerWith: AnswerWith): string {
  return answerWith === 'word' ? word.word : definitionText(word)
}

export function distractors(word: Word, pool: Word[], count: number): Word[] {
  const others = pool.filter((w) => w.id !== word.id)
  return pickN(others.length >= count ? others : WORDS.filter((w) => w.id !== word.id), count)
}

export function choiceLabel(word: Word, answerWith: AnswerWith): string {
  return expectedLabel(word, answerWith)
}
