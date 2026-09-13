import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { BackToSet } from '../components/SetLink'
import { useCurrentSet } from '../lib/hooks'
import { choiceLabel, distractors, expectedLabel, promptFor, shuffle } from '../lib/quiz'
import { setPath, wordsForSet } from '../lib/sets'
import { bestScore, saveScore } from '../lib/storage'
import type { Word } from '../types'

const SIZE = 8
type Grid = number[][]
type Shape = number[][]

const SHAPES: Shape[] = [
  [[1]],
  [[1, 1]],
  [[1], [1]],
  [[1, 1, 1]],
  [[1], [1], [1]],
  [[1, 1], [1, 1]],
  [[1, 0], [1, 1]],
  [[0, 1], [1, 1]],
  [[1, 1], [1, 0]],
  [[1, 1], [0, 1]],
  [[1, 1, 1], [1, 0, 0]],
  [[1, 1, 1], [0, 0, 1]],
  [[1, 0, 0], [1, 1, 1]],
  [[0, 0, 1], [1, 1, 1]],
  [[1, 1, 1, 1]],
  [[1], [1], [1], [1]],
  [[1, 1, 1], [0, 1, 0]],
  [[1, 1], [1, 1], [0, 1]],
]

function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => 0))
}

function randomPieces(): Shape[] {
  return [0, 1, 2].map(() => SHAPES[Math.floor(Math.random() * SHAPES.length)])
}

function canPlace(grid: Grid, shape: Shape, row: number, col: number): boolean {
  for (let r = 0; r < shape.length; r += 1) {
    for (let c = 0; c < shape[r].length; c += 1) {
      if (!shape[r][c]) continue
      const rr = row + r
      const cc = col + c
      if (rr < 0 || cc < 0 || rr >= SIZE || cc >= SIZE) return false
      if (grid[rr][cc]) return false
    }
  }
  return true
}

function canPlaceAnywhere(grid: Grid, shape: Shape): boolean {
  for (let r = 0; r < SIZE; r += 1) {
    for (let c = 0; c < SIZE; c += 1) {
      if (canPlace(grid, shape, r, c)) return true
    }
  }
  return false
}

function stamp(grid: Grid, shape: Shape, row: number, col: number): Grid {
  const next = grid.map((line) => [...line])
  for (let r = 0; r < shape.length; r += 1) {
    for (let c = 0; c < shape[r].length; c += 1) {
      if (shape[r][c]) next[row + r][col + c] = 1
    }
  }
  return next
}

function clearLines(grid: Grid): { grid: Grid; cleared: number } {
  const fullRows = grid.map((row) => row.every((cell) => cell === 1))
  const fullCols = Array.from({ length: SIZE }, (_, c) => grid.every((row) => row[c] === 1))
  const next = grid.map((row, r) =>
    row.map((cell, c) => (fullRows[r] || fullCols[c] ? 0 : cell)),
  )
  const cleared = fullRows.filter(Boolean).length + fullCols.filter(Boolean).length
  return { grid: next, cleared }
}

type Question = { word: Word; prompt: string; choices: string[]; answer: string }

function makeQuestion(pool: Word[]): Question {
  const word = pool[Math.floor(Math.random() * pool.length)]
  const choices = shuffle([word, ...distractors(word, pool, 3)]).map((w) => choiceLabel(w, 'word'))
  return { word, prompt: promptFor(word, 'word'), choices, answer: expectedLabel(word, 'word') }
}

export function Blocks() {
  const id = useCurrentSet()
  const words = useMemo(() => (id == null ? [] : wordsForSet(id)), [id])
  const [grid, setGrid] = useState<Grid>(emptyGrid)
  const [pieces, setPieces] = useState<Shape[]>(randomPieces)
  const [selected, setSelected] = useState(0)
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null)
  const [score, setScore] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [over, setOver] = useState(false)
  const [best, setBest] = useState(() => (id == null ? 0 : bestScore('blocks', setPath(id))))
  const [feedback, setFeedback] = useState<string | null>(null)

  if (id == null) return <Navigate to="/" replace />
  const setId = id

  function finish(nextScore: number) {
    setOver(true)
    setBest(saveScore('blocks', setPath(setId), nextScore))
  }

  function afterPlace(nextGrid: Grid, nextPieces: Shape[], gained: number) {
    const total = score + gained
    setScore(total)
    if (nextPieces.length === 0) {
      setPieces([])
      setQuestion(makeQuestion(words))
      setSelected(0)
      return
    }
    const playable = nextPieces.some((p) => canPlaceAnywhere(nextGrid, p))
    if (!playable) finish(total)
  }

  function placeAt(row: number, col: number) {
    if (over || question || selected < 0 || !pieces[selected]) return
    const shape = pieces[selected]
    if (!canPlace(grid, shape, row, col)) return
    const stamped = stamp(grid, shape, row, col)
    const cleared = clearLines(stamped)
    const cells = shape.flat().filter(Boolean).length
    const gained = cells * 10 + cleared.cleared * 80
    const nextPieces = pieces.filter((_, i) => i !== selected)
    setGrid(cleared.grid)
    setPieces(nextPieces)
    setSelected(0)
    setHover(null)
    afterPlace(cleared.grid, nextPieces, gained)
  }

  function answer(choice: string) {
    if (!question) return
    if (choice === question.answer) {
      const next = randomPieces()
      setPieces(next)
      setQuestion(null)
      setFeedback(null)
      if (!next.some((p) => canPlaceAnywhere(grid, p))) finish(score)
    } else {
      setFeedback(`Not quite. It was ${question.answer}. Try another.`)
      setQuestion(makeQuestion(words))
    }
  }

  function reset() {
    setGrid(emptyGrid())
    setPieces(randomPieces())
    setSelected(0)
    setScore(0)
    setQuestion(null)
    setOver(false)
    setFeedback(null)
    setHover(null)
  }

  const ghost = hover && pieces[selected] && canPlace(grid, pieces[selected], hover.r, hover.c)

  return (
    <main className="page page-wide">
      <BackToSet />
      <h1>Blocks</h1>
      <div className="toolbar">
        <div className="meta">Score {score}</div>
        <div className="meta">Best {best}</div>
        <button className="btn secondary" onClick={reset}>New game</button>
      </div>
      {over && <p className="feedback bad">No more moves. Final score {score}.</p>}
      <div className="blocks-layout">
        <div
          className="board"
          onMouseLeave={() => setHover(null)}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              let extra = cell ? ' filled' : ''
              if (ghost && pieces[selected]) {
                const shape = pieces[selected]
                const inShape =
                  r >= hover.r &&
                  c >= hover.c &&
                  r < hover.r + shape.length &&
                  c < hover.c + (shape[r - hover.r]?.length ?? 0) &&
                  shape[r - hover.r][c - hover.c]
                if (inShape) extra = canPlace(grid, shape, hover.r, hover.c) ? ' ghost' : ' invalid'
              }
              return (
                <button
                  key={`${r}-${c}`}
                  className={`cell${extra}`}
                  onMouseEnter={() => setHover({ r, c })}
                  onClick={() => placeAt(r, c)}
                  aria-label={`cell ${r} ${c}`}
                />
              )
            }),
          )}
        </div>
        <aside className="piece-tray">
          {question ? (
            <div className="card" style={{ padding: 16 }}>
              <p className="meta">Answer to earn 3 pieces</p>
              <p className="prompt" style={{ fontSize: 22 }}>{question.prompt}</p>
              <div className="choices">
                {question.choices.map((choice) => (
                  <button key={choice} className="choice" onClick={() => answer(choice)}>{choice}</button>
                ))}
              </div>
              {feedback && <p className="feedback bad">{feedback}</p>}
            </div>
          ) : (
            pieces.map((shape, i) => (
              <button
                key={i}
                className={`piece-btn${selected === i ? ' selected' : ''}`}
                onClick={() => setSelected(i)}
              >
                <div
                  className="mini-piece"
                  style={{ gridTemplateColumns: `repeat(${Math.max(...shape.map((r) => r.length))}, 16px)` }}
                >
                  {shape.map((row, r) =>
                    row.map((cell, c) => (
                      <div key={`${r}-${c}`} className="mini-cell" style={{ visibility: cell ? 'visible' : 'hidden' }} />
                    )),
                  )}
                </div>
              </button>
            ))
          )}
        </aside>
      </div>
    </main>
  )
}
