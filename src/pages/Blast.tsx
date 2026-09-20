import { useEffect, useMemo, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { BackToSet } from '../components/SetLink'
import { useCurrentSet } from '../lib/hooks'
import { distractors, expectedLabel, promptFor, shuffle } from '../lib/quiz'
import { setPath, wordsForSet } from '../lib/sets'
import { bestScore, saveScore } from '../lib/storage'
import type { Word } from '../types'

const DURATION = 60

type Rock = {
  id: string
  text: string
  correct: boolean
}

function spawn(pool: Word[]): { prompt: string; rocks: Rock[] } {
  const word = pool[Math.floor(Math.random() * pool.length)]
  const answerWithWord = Math.random() > 0.5
  const prompt = promptFor(word, answerWithWord ? 'word' : 'synonyms')
  const correct = expectedLabel(word, answerWithWord ? 'word' : 'synonyms')
  const wrong = distractors(word, pool, 3).map((w) => expectedLabel(w, answerWithWord ? 'word' : 'synonyms'))
  const rocks = shuffle([correct, ...wrong]).map((text, i) => ({
    id: `${word.id}-${i}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    correct: text === correct,
  }))
  return { prompt, rocks }
}

export function Blast() {
  const id = useCurrentSet()
  const words = useMemo(() => (id == null ? [] : wordsForSet(id)), [id])
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(DURATION)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [prompt, setPrompt] = useState('')
  const [rocks, setRocks] = useState<Rock[]>([])
  const [locked, setLocked] = useState(false)
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null)
  const [best, setBest] = useState(() => (id == null ? 0 : bestScore('blast', setPath(id))))
  const playingRef = useRef(false)
  const scoreRef = useRef(0)
  const comboRef = useRef(0)
  const startedAt = useRef(0)

  useEffect(() => {
    playingRef.current = playing
    if (!playing) return
    const tick = window.setInterval(() => {
      const left = Math.max(0, DURATION - Math.floor((Date.now() - startedAt.current) / 1000))
      setTime(left)
      if (left <= 0) {
        playingRef.current = false
        setPlaying(false)
        if (id != null) setBest(saveScore('blast', setPath(id), scoreRef.current))
      }
    }, 250)
    return () => window.clearInterval(tick)
  }, [playing, id])

  if (id == null) return <Navigate to="/" replace />

  function nextRound() {
    const round = spawn(words)
    setPrompt(round.prompt)
    setRocks(round.rocks)
    setLocked(false)
    setFlash(null)
  }

  function begin() {
    scoreRef.current = 0
    comboRef.current = 0
    startedAt.current = Date.now()
    playingRef.current = true
    setScore(0)
    setCombo(0)
    setTime(DURATION)
    setPlaying(true)
    nextRound()
  }

  function hit(rock: Rock) {
    if (!playingRef.current || locked) return
    setLocked(true)
    if (rock.correct) {
      const nextCombo = comboRef.current + 1
      comboRef.current = nextCombo
      scoreRef.current += 100 + nextCombo * 20
      setCombo(nextCombo)
      setScore(scoreRef.current)
      setFlash('ok')
    } else {
      comboRef.current = 0
      scoreRef.current = Math.max(0, scoreRef.current - 40)
      setCombo(0)
      setScore(scoreRef.current)
      setFlash('bad')
    }
    window.setTimeout(() => {
      if (playingRef.current) nextRound()
    }, 320)
  }

  return (
    <main className="page page-wide">
      <BackToSet />
      <h1>Blast</h1>
      <p className="lede">Tap the card that matches the prompt. Cards stay put so hits actually register.</p>
      <div className="toolbar">
        <div className="meta">Best {best}</div>
        {!playing && <button className="btn" onClick={begin}>{time === 0 && score > 0 ? 'Play again' : 'Start'}</button>}
      </div>

      <div className={`blast-stage${flash === 'ok' ? ' hit' : ''}${flash === 'bad' ? ' miss' : ''}`}>
        <div className="blast-hud">
          <span>{playing || time === 0 ? `${time}s` : `${DURATION}s`}</span>
          <span>Score {score}</span>
          <span>Combo x{combo}</span>
        </div>
        <div className="blast-prompt">
          <div className="meta">Blast the match</div>
          <div className="prompt">{prompt || 'Press start, then tap the matching card'}</div>
        </div>

        {playing && rocks.length > 0 && (
          <div className="blast-grid">
            {rocks.map((rock, i) => (
              <button
                key={rock.id}
                className={`blast-card float-${(i % 4) + 1}${flash && rock.correct ? ' is-correct' : ''}${flash === 'bad' && !rock.correct ? ' is-dim' : ''}`}
                disabled={locked}
                onPointerDown={(e) => {
                  e.preventDefault()
                  hit(rock)
                }}
              >
                {rock.text}
              </button>
            ))}
          </div>
        )}

        {!playing && time === 0 && (
          <div className="blast-over">
            <div className="meta">Time’s up</div>
            <div className="stat" style={{ color: '#fff' }}>{score}</div>
            <button className="btn" onClick={begin}>Play again</button>
          </div>
        )}
      </div>
    </main>
  )
}
