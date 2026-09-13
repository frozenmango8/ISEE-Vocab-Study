import type { LearnLevel, LearnProgress, Store, TestRecord } from '../types'

const KEY = 'isee-vocab-v1'

const EMPTY: Store = {
  stars: {},
  learn: {},
  scores: { match: {}, blocks: {}, blast: {} },
  tests: [],
  settings: { answerWith: 'word' },
}

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return structuredClone(EMPTY)
    const parsed = JSON.parse(raw) as Partial<Store>
    return {
      stars: parsed.stars ?? {},
      learn: parsed.learn ?? {},
      scores: {
        match: parsed.scores?.match ?? {},
        blocks: parsed.scores?.blocks ?? {},
        blast: parsed.scores?.blast ?? {},
      },
      tests: parsed.tests ?? [],
      settings: { answerWith: parsed.settings?.answerWith ?? 'word' },
    }
  } catch {
    return structuredClone(EMPTY)
  }
}

function save(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store))
}

export function getStore(): Store {
  return load()
}

export function isStarred(id: string): boolean {
  return Boolean(load().stars[id])
}

export function toggleStar(id: string): boolean {
  const store = load()
  const next = !store.stars[id]
  if (next) store.stars[id] = true
  else delete store.stars[id]
  save(store)
  return next
}

export function getLearn(id: string): LearnProgress {
  return load().learn[id] ?? { level: 0, streak: 0 }
}

export function recordLearn(id: string, correct: boolean): LearnProgress {
  const store = load()
  const current = store.learn[id] ?? { level: 0 as LearnLevel, streak: 0 }
  if (correct) {
    const streak = current.streak + 1
    const level = Math.min(4, current.level + 1) as LearnLevel
    store.learn[id] = { level, streak }
  } else {
    store.learn[id] = { level: 0, streak: 0 }
  }
  save(store)
  return store.learn[id]
}

export function masteredCount(ids: string[]): number {
  const store = load()
  return ids.filter((id) => (store.learn[id]?.level ?? 0) >= 4).length
}

export function bestMatch(setKey: string): number | null {
  return load().scores.match[setKey] ?? null
}

export function saveMatch(setKey: string, ms: number): number {
  const store = load()
  const prev = store.scores.match[setKey]
  const best = prev == null ? ms : Math.min(prev, ms)
  store.scores.match[setKey] = best
  save(store)
  return best
}

export function bestScore(kind: 'blocks' | 'blast', setKey: string): number {
  return load().scores[kind][setKey] ?? 0
}

export function saveScore(kind: 'blocks' | 'blast', setKey: string, score: number): number {
  const store = load()
  const best = Math.max(store.scores[kind][setKey] ?? 0, score)
  store.scores[kind][setKey] = best
  save(store)
  return best
}

export function saveTest(record: TestRecord) {
  const store = load()
  store.tests = [record, ...store.tests].slice(0, 20)
  save(store)
}

export function recentTests(setKey: string): TestRecord[] {
  return load().tests.filter((t) => t.setId === setKey).slice(0, 5)
}

export function getAnswerWith() {
  return load().settings.answerWith
}

export function setAnswerWith(answerWith: Store['settings']['answerWith']) {
  const store = load()
  store.settings.answerWith = answerWith
  save(store)
}
