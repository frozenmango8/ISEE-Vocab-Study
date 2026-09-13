import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { BackToSet } from '../components/SetLink'
import { useCurrentSet } from '../lib/hooks'
import { choiceLabel, distractors, expectedLabel, isWrittenCorrect, promptFor, shuffle } from '../lib/quiz'
import { setPath, wordsForSet } from '../lib/sets'
import { getAnswerWith, saveTest } from '../lib/storage'
import type { AnswerWith, Word } from '../types'

type Kind = 'mc' | 'tf' | 'written' | 'matching'
type Item = {
  word: Word
  kind: Kind
  prompt: string
  choices?: string[]
  answer: string
  pairs?: { left: string; right: string; key: string }[]
  rights?: string[]
}

function buildItems(pool: Word[], count: number, kinds: Kind[], answerWith: AnswerWith): Item[] {
  const selected = shuffle(pool).slice(0, count)
  return selected.map((word, i) => {
    const kind = kinds[i % kinds.length]
    if (kind === 'matching') {
      const group = shuffle([word, ...distractors(word, pool, 3)]).slice(0, 4)
      const pairs = group.map((w) => ({
        left: w.word,
        right: expectedLabel(w, 'synonyms'),
        key: w.id,
      }))
      return {
        word,
        kind,
        prompt: 'Match each word to its synonyms',
        pairs: shuffle(pairs.map((p) => ({ ...p }))),
        rights: shuffle(pairs.map((p) => p.right)),
        answer: pairs.map((p) => p.right).join('||'),
      }
    }
    if (kind === 'mc') {
      const choices = shuffle([word, ...distractors(word, pool, 3)]).map((w) => choiceLabel(w, answerWith))
      return { word, kind, prompt: promptFor(word, answerWith), choices, answer: expectedLabel(word, answerWith) }
    }
    if (kind === 'tf') {
      const truthful = Math.random() > 0.45
      const shown = truthful ? expectedLabel(word, answerWith) : choiceLabel(distractors(word, pool, 1)[0], answerWith)
      return {
        word,
        kind,
        prompt: `${promptFor(word, answerWith)}\n\nSuggested answer: ${shown}`,
        choices: ['True', 'False'],
        answer: truthful ? 'True' : 'False',
      }
    }
    return { word, kind, prompt: promptFor(word, answerWith), answer: expectedLabel(word, answerWith) }
  })
}

export function Test() {
  const id = useCurrentSet()
  const words = useMemo(() => (id == null ? [] : wordsForSet(id)), [id])
  const [answerWith, setAw] = useState<AnswerWith>(getAnswerWith())
  const [count, setCount] = useState(10)
  const [kinds, setKinds] = useState<Kind[]>(['mc', 'tf', 'written'])
  const [items, setItems] = useState<Item[]>([])
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [matches, setMatches] = useState<Record<string, string>>({})
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [missed, setMissed] = useState<string[]>([])

  if (id == null) return <Navigate to="/" replace />
  const setId = id

  const current = items[index]

  function toggleKind(kind: Kind) {
    setKinds((prev) => {
      if (prev.includes(kind)) {
        const next = prev.filter((k) => k !== kind)
        return next.length ? next : prev
      }
      return [...prev, kind]
    })
  }

  function start() {
    const built = buildItems(words, Math.min(count, words.length), kinds, answerWith)
    setItems(built)
    setIndex(0)
    setTyped('')
    setMatches({})
    setScore(0)
    setDone(false)
    setMissed([])
  }

  function submitCurrent() {
    if (!current) return
    let ok = false
    if (current.kind === 'written') ok = isWrittenCorrect(typed, current.word, answerWith)
    else if (current.kind === 'matching') {
      ok = (current.pairs ?? []).every((p) => matches[p.key] === p.right)
    } else {
      ok = typed === current.answer
    }
    const nextScore = score + (ok ? 1 : 0)
    const nextMissed = ok ? missed : [...missed, `${current.word.word} — ${current.answer}`]
    if (index + 1 >= items.length) {
      saveTest({ setId: setPath(setId), score: nextScore, total: items.length, date: Date.now() })
      setScore(nextScore)
      setMissed(nextMissed)
      setDone(true)
      return
    }
    setScore(nextScore)
    setMissed(nextMissed)
    setIndex((n) => n + 1)
    setTyped('')
    setMatches({})
  }

  if (done || !items.length) {
    return (
      <main className="page">
        <BackToSet />
        <h1>Test</h1>
        {done ? (
          <section className="card setup-card">
            <div className="meta">Score</div>
            <div className="stat">{score} / {items.length}</div>
            {missed.length > 0 && (
              <div style={{ margin: '16px 0' }}>
                <h2>Review</h2>
                {missed.map((line) => <p key={line} className="meta">{line}</p>)}
              </div>
            )}
            <button className="btn" onClick={() => { setItems([]); setDone(false) }}>New test</button>
          </section>
        ) : (
          <section className="card setup-card">
            <div className="toolbar">
              {[5, 10, 15, 20].map((n) => (
                <button key={n} className={`chip${count === n ? ' on' : ''}`} onClick={() => setCount(n)}>{n} questions</button>
              ))}
              <button className={`chip${count === words.length ? ' on' : ''}`} onClick={() => setCount(words.length)}>All</button>
            </div>
            <div className="toolbar">
              {(['mc', 'tf', 'written', 'matching'] as Kind[]).map((kind) => (
                <button key={kind} className={`chip${kinds.includes(kind) ? ' on' : ''}`} onClick={() => toggleKind(kind)}>
                  {kind}
                </button>
              ))}
            </div>
            <div className="toolbar">
              <button className={`chip${answerWith === 'word' ? ' on' : ''}`} onClick={() => setAw('word')}>Answer with word</button>
              <button className={`chip${answerWith === 'synonyms' ? ' on' : ''}`} onClick={() => setAw('synonyms')}>Answer with synonyms</button>
            </div>
            <button className="btn" onClick={start}>Start test</button>
          </section>
        )}
      </main>
    )
  }

  return (
    <main className="page">
      <BackToSet />
      <h1>Test</h1>
      <section className="question-card">
        <div className="meta">Question {index + 1} of {items.length}</div>
        <p className="prompt" style={{ whiteSpace: 'pre-wrap' }}>{current.prompt}</p>
        {current.kind === 'matching' && current.pairs && current.rights ? (
          <div className="grid" style={{ gap: 10 }}>
            {current.pairs.map((pair) => (
              <label key={pair.key} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, alignItems: 'center' }}>
                <strong>{pair.left}</strong>
                <select
                  className="field"
                  value={matches[pair.key] ?? ''}
                  onChange={(e) => setMatches((m) => ({ ...m, [pair.key]: e.target.value }))}
                >
                  <option value="">Choose…</option>
                  {current.rights!.map((right) => (
                    <option key={right} value={right}>{right}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        ) : current.choices ? (
          <div className="choices">
            {current.choices.map((choice) => (
              <button
                key={choice}
                className={`choice${typed === choice ? ' selected' : ''}`}
                onClick={() => setTyped(choice)}
              >
                {choice}
              </button>
            ))}
          </div>
        ) : (
          <input className="field" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Type your answer" />
        )}
        <div className="toolbar" style={{ marginTop: 16 }}>
          <button className="btn" onClick={submitCurrent}>
            {index + 1 >= items.length ? 'Submit test' : 'Next'}
          </button>
        </div>
      </section>
    </main>
  )
}
