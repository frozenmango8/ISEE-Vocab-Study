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
  x: number
  y: number
  vx: number
  vy: number
}

function spawn(pool: Word[]): { prompt: string; rocks: Rock[] } {
  const word = pool[Math.floor(Math.random() * pool.length)]
  const answerWithWord = Math.random() > 0.5
  const prompt = promptFor(word, answerWithWord ? 'word' : 'synonyms')
  const correct = expectedLabel(word, answerWithWord ? 'word' : 'synonyms')
  const wrong = distractors(word, pool, 3).map((w) => expectedLabel(w, answerWithWord ? 'word' : 'synonyms'))
  const rocks = shuffle([correct, ...wrong]).map((text, i) => ({
    id: `${word.id}-${i}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    correct: text === correct,
    x: 6 + (i % 2) * 42 + Math.random() * 8,
    y: 42 + Math.floor(i / 2) * 24 + Math.random() * 6,
    vx: (Math.random() * 2 - 1) * 0.02,
    vy: (Math.random() * 2 - 1) * 0.016,
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
  const [best, setBest] = useState(() => (id == null ? 0 : bestScore('blast', setPath(id))))
  const [flash, setFlash] = useState<string | null>(null)
  const rocksRef = useRef<Rock[]>([])
  const playingRef = useRef(false)
  const scoreRef = useRef(0)
  const startedAt = useRef(0)

  useEffect(() => {
    rocksRef.current = rocks
  }, [rocks])

  useEffect(() => {
    playingRef.current = playing
    if (!playing) return

    let raf = 0
    const tick = () => {
      if (!playingRef.current) return
      const left = Math.max(0, DURATION - Math.floor((Date.now() - startedAt.current) / 1000))
      setTime(left)
      if (left <= 0) {
        playingRef.current = false
        setPlaying(false)
        if (id != null) setBest(saveScore('blast', setPath(id), scoreRef.current))
        return
      }
      rocksRef.current = rocksRef.current.map((rock) => {
        let x = rock.x + rock.vx
        let y = rock.y + rock.vy
        let vx = rock.vx
        let vy = rock.vy
        if (x < 2 || x > 78) vx *= -1
        if (y < 38 || y > 78) vy *= -1
        x = Math.min(78, Math.max(2, x))
        y = Math.min(78, Math.max(38, y))
        const el = document.getElementById(`rock-${rock.id}`)
        if (el) {
          el.style.left = `${x}%`
          el.style.top = `${y}%`
        }
        return { ...rock, x, y, vx, vy }
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, id])

  if (id == null) return <Navigate to="/" replace />

  function begin() {
    const round = spawn(words)
    rocksRef.current = round.rocks
    scoreRef.current = 0
    startedAt.current = Date.now()
    playingRef.current = true
    setPrompt(round.prompt)
    setRocks(round.rocks)
    setScore(0)
    setCombo(0)
    setTime(DURATION)
    setPlaying(true)
    setFlash(null)
  }

  function blast(rock: Rock) {
    if (!playingRef.current) return
    if (rock.correct) {
      setCombo((c) => {
        const next = c + 1
        const nextScore = scoreRef.current + 100 + next * 20
        scoreRef.current = nextScore
        setScore(nextScore)
        return next
      })
      setFlash('ok')
      const round = spawn(words)
      rocksRef.current = round.rocks
      setPrompt(round.prompt)
      setRocks(round.rocks)
    } else {
      setCombo(0)
      scoreRef.current = Math.max(0, scoreRef.current - 40)
      setScore(scoreRef.current)
      setFlash('bad')
      const next = rocksRef.current.filter((r) => r.id !== rock.id)
      rocksRef.current = next
      setRocks(next)
    }
    window.setTimeout(() => setFlash(null), 220)
  }

  return (
    <main className="page page-wide">
      <BackToSet />
      <h1>Blast</h1>
      <div className="toolbar">
        <div className="meta">Best {best}</div>
        {!playing && <button className="btn" onClick={begin}>{time === 0 ? 'Play again' : 'Start'}</button>}
      </div>
      <div className={`blast-stage${flash === 'ok' ? ' hit' : ''}${flash === 'bad' ? ' miss' : ''}`}>
        <div className="blast-hud">
          <span>{time}s</span>
          <span>Score {score}</span>
          <span>Combo x{combo}</span>
        </div>
        <div className="blast-prompt">
          <div className="meta">Blast the matching asteroid</div>
          <div className="prompt">{prompt || 'Press start'}</div>
        </div>
        {rocks.map((rock) => (
          <button
            id={`rock-${rock.id}`}
            key={rock.id}
            className="asteroid"
            style={{ left: `${rock.x}%`, top: `${rock.y}%` }}
            onPointerDown={(e) => {
              e.preventDefault()
              blast(rock)
            }}
          >
            {rock.text}
          </button>
        ))}
      </div>
    </main>
  )
}
