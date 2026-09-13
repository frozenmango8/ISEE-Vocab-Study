import { useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useCurrentSet } from '../lib/hooks'
import { definitionText, setPath, setTitle, wordsForSet } from '../lib/sets'
import { isStarred, masteredCount, toggleStar } from '../lib/storage'

const MODES = [
  { to: 'flashcards', title: 'Flashcards', icon: '🃏', tint: '#eef0ff', blurb: 'Flip through words and synonyms' },
  { to: 'learn', title: 'Learn', icon: '🎯', tint: '#e8f8ef', blurb: 'Adaptive questions that get harder' },
  { to: 'test', title: 'Test', icon: '📝', tint: '#fff4dc', blurb: 'Graded practice with mixed types' },
  { to: 'match', title: 'Match', icon: '⚡', tint: '#ffe8e4', blurb: 'Race the clock to pair cards' },
  { to: 'blocks', title: 'Blocks', icon: '🧱', tint: '#e8f3ff', blurb: 'Answer to earn pieces and clear lines' },
  { to: 'blast', title: 'Blast', icon: '☄️', tint: '#ece8ff', blurb: 'Hit the right asteroid before time runs out' },
]

export function SetPage() {
  const id = useCurrentSet()
  const [, setTick] = useState(0)
  const words = useMemo(() => (id == null ? [] : wordsForSet(id)), [id])

  if (id == null) return <Navigate to="/" replace />

  const done = masteredCount(words.map((w) => w.id))
  const base = `/sets/${setPath(id)}`

  return (
    <main className="page">
      <Link to="/" className="back">← All sets</Link>
      <h1>{setTitle(id)}</h1>
      <p className="lede">{words.length} words · {done} mastered in Learn</p>
      <div className="grid mode-grid">
        {MODES.map((mode) => (
          <Link key={mode.to} to={`${base}/${mode.to}`} className="mode-card">
            <div className="mode-icon" style={{ background: mode.tint }}>{mode.icon}</div>
            <h3>{mode.title}</h3>
            <div className="meta">{mode.blurb}</div>
          </Link>
        ))}
      </div>
      <section className="term-list">
        {words.map((word) => {
          const starred = isStarred(word.id)
          return (
            <div key={word.id} className="term-row">
              <strong>{word.word}</strong>
              <span>{definitionText(word)}</span>
              <button
                className={`star${starred ? ' on' : ''}`}
                onClick={() => {
                  toggleStar(word.id)
                  setTick((n) => n + 1)
                }}
                aria-label={starred ? 'Unstar' : 'Star'}
              >
                ★
              </button>
            </div>
          )
        })}
      </section>
    </main>
  )
}
