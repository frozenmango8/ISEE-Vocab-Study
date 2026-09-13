export type Word = {
  id: string
  word: string
  synonyms: string[]
  set: number
}

export type SetId = number | 'all'

export type AnswerWith = 'word' | 'synonyms'

export type LearnLevel = 0 | 1 | 2 | 3 | 4

export type LearnProgress = {
  level: LearnLevel
  streak: number
}

export type TestRecord = {
  setId: string
  score: number
  total: number
  date: number
}

export type Store = {
  stars: Record<string, boolean>
  learn: Record<string, LearnProgress>
  scores: {
    match: Record<string, number>
    blocks: Record<string, number>
    blast: Record<string, number>
  }
  tests: TestRecord[]
  settings: {
    answerWith: AnswerWith
  }
}
