import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { BackToSet } from '../components/SetLink'
import { useCurrentSet } from '../lib/hooks'
import { shuffle } from '../lib/quiz'
import { definitionText, wordsForSet } from '../lib/sets'
import { isStarred, toggleStar } from '../lib/storage'
import type { Word } from '../types'

export function Flashcards() {
  const id = useCurrentSet()
  const [deck, setDeck] = useState<Word[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [termFirst, setTermFirst] = useState(true)
  const [starredOnly, setStarredOnly] = useState(false)
  const [starVersion, setStarVersion] = useState(0)

  function rebuild(onlyStarred = starredOnly) {
    if (id == null) {
      setDeck([])
      return
    }
    const words = wordsForSet(id).filter((w) => !onlyStarred || isStarred(w.id))
    setDeck(shuffle(words))
    setIndex(0)
    setFlipped(false)
  }

  useEffect(() => {
    rebuild()
  }, [id, starredOnly])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((v) => !v)
      }
      if (e.key === 'ArrowRight') {
        setIndex((i) => (deck.length ? (i + 1) % deck.length : 0))
        setFlipped(false)
      }
      if (e.key === 'ArrowLeft') {
        setIndex((i) => (deck.length ? (i - 1 + deck.length) % deck.length : 0))
        setFlipped(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deck.length])

  if (id == null) return <Navigate to="/" replace />

  const card = deck[index]
  const front = card ? (termFirst ? card.word : definitionText(card)) : ''
  const back = card ? (termFirst ? definitionText(card) : card.word) : ''

  function go(next: number) {
    if (!deck.length) return
    setIndex((next + deck.length) % deck.length)
    setFlipped(false)
  }

  return (
    <main className="page">
      <BackToSet />
      <h1>Flashcards</h1>
      <div className="toolbar">
        <button className={`chip${termFirst ? ' on' : ''}`} onClick={() => { setTermFirst(true); setFlipped(false) }}>
          Word first
        </button>
        <button className={`chip${!termFirst ? ' on' : ''}`} onClick={() => { setTermFirst(false); setFlipped(false) }}>
          Synonyms first
        </button>
        <button className={`chip${starredOnly ? ' on' : ''}`} onClick={() => setStarredOnly((v) => !v)}>
          Starred only
        </button>
        <button className="btn secondary" onClick={() => rebuild()}>
          Shuffle
        </button>
      </div>

      {!card ? (
        <p className="empty">No starred words in this set yet.</p>
      ) : (
        <>
          <div className="flash-wrap">
            <div
              className={`flash-card${flipped ? ' flipped' : ''}`}
              onClick={() => setFlipped((v) => !v)}
              role="button"
              tabIndex={0}
            >
              <div className="flash-inner">
                <div className="flash-face">
                  <div className="flash-word">{front}</div>
                  <div className="flash-hint">Click or press space to flip</div>
                </div>
                <div className="flash-face back">
                  <div className="flash-def">{back}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="nav-row">
            <button className="btn secondary" onClick={() => go(index - 1)}>Back</button>
            <div className="meta">
              {index + 1} / {deck.length}
              <button
                key={starVersion}
                className={`star${isStarred(card.id) ? ' on' : ''}`}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleStar(card.id)
                  setStarVersion((n) => n + 1)
                }}
              >
                ★
              </button>
            </div>
            <button className="btn" onClick={() => go(index + 1)}>Next</button>
          </div>
        </>
      )}
    </main>
  )
}
