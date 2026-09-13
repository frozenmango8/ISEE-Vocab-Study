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
    id: `${word.id}-${i}-${Math.random()}`,
    text,
    correct: text === correct,
    x: 8 + Math.random() * 70,
    y: 35 + Math.random() * 50,
    vx: (Math.random() * 2 - 1) * 0.12,
    vy: (Math.random() * 2 - 1) * 0.1,
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
  const frame = useRef<number>(0)

  useEffect(() => {
    if (!playing) return
    const started = Date.now()
    const tick = () => {
      const left = Math.max(0, DURATION - Math.floor((Date.now() - started) / 1000))
      setTime(left)
      setRocks((prev) =>
        prev.map((rock) => {
          let x = rock.x + rock.vx
          let y = rock.y + rock.vy
          let vx = rock.vx
          let vy = rock.vy
          if (x < 2 || x > 82) vx *= -1
          if (y < 28 || y > 82) vy *= -1
          return { ...rock, x: Math.min(82, Math.max(2, x)), y: Math.min(82, Math.max(28, y)), vx, vy }
        }),
      )
      if (left > 0) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [playing])

  useEffect(() => {
    if (playing && time === 0) {
      setPlaying(false)
      setBest(saveScore('blast', setPath(id!), score))
    }
  }, [playing, time, score, id])

  if (id == null) return <Navigate to="/" replace />

  function begin() {
    const round = spawn(words)
    setPrompt(round.prompt)
    setRocks(round.rocks)
    setScore(0)
    setCombo(0)
    setTime(DURATION)
    setPlaying(true)
    setFlash(null)
  }

  function blast(rock: Rock) {
    if (!playing) return
    if (rock.correct) {
      const nextCombo = combo + 1
      setCombo(nextCombo)
      setScore((s) => s + 100 + nextCombo * 20)
      setFlash('ok')
      const round = spawn(words)
      setPrompt(round.prompt)
      setRocks(round.rocks)
    } else {
      setCombo(0)
      setScore((s) => Math.max(0, s - 40))
      setFlash('bad')
      setRocks((prev) => prev.filter((r) => r.id !== rock.id))
    }
    window.setTimeout(() => setFlash(null), 250)
  }

  return (
    <main className="page page-wide">
      <BackToSet />
      <h1>Blast</h1>
      <div className="toolbar">
        <div className="meta">Best {best}</div>
        {!playing && <button className="btn" onClick={begin}>{time === 0 ? 'Play again' : 'Start'}</button>}
      </div>
      <div className="blast-stage" style={{ outline: flash === 'bad' ? '4px solid #ff725b' : flash === 'ok' ? '4px solid #18ae68' : undefined }}>
        <div className="blast-hud">
          <span>{time}s</span>
          <span>Score {score}</span>
          <span>Combo x{combo}</span>
        </div>
        <div className="blast-prompt">
          <div className="meta" style={{ color: '#c9ceff' }}>Blast the matching asteroid</div>
          <div className="prompt" style={{ color: '#fff', fontSize: 28 }}>{prompt || 'Press start'}</div>
        </div>
        {rocks.map((rock) => (
          <button
            key={rock.id}
            className="asteroid"
            style={{ left: `${rock.x}%`, top: `${rock.y}%` }}
            onClick={() => blast(rock)}
          >
            {rock.text}
          </button>
        ))}
      </div>
    </main>
  )
}
