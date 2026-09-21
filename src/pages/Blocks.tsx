import { useMemo, useRef, useState, type PointerEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { BackToSet } from '../components/SetLink'
import {
  canPlace,
  canPlaceAnywhere,
  dropOrigin,
  emptyGrid,
  filledCells,
  firstFilled,
  shapeWidth,
  stamp,
  tapOrigin,
  type Cell,
  type Grid,
  type Shape,
} from '../lib/blocks'
import { useCurrentSet } from '../lib/hooks'
import { choiceLabel, distractors, expectedLabel, promptFor, shuffle } from '../lib/quiz'
import { setPath, wordsForSet } from '../lib/sets'
import { bestScore, recordLearn, saveScore } from '../lib/storage'
import type { Word } from '../types'

const SIZE = 8
const BOARD_PAD = 6
const BOARD_GAP = 3

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

const COLORS = ['#4255ff', '#18ae68', '#ff8a3d', '#7c4dff', '#00bcd4']

type Piece = { id: string; shape: Shape; color: string }

type Drag = {
  index: number
  grab: Cell
  x: number
  y: number
  startX: number
  startY: number
  ghost: { origin: Cell; valid: boolean } | null
}

type Question = { word: Word; prompt: string; choices: string[]; answer: string }

function rotateShape(shape: Shape): Shape {
  const h = shape.length
  const w = shapeWidth(shape)
  const padded = shape.map((row) => {
    const next = [...row]
    while (next.length < w) next.push(0)
    return next
  })
  const rotated: Shape = []
  for (let c = 0; c < w; c += 1) {
    const row: number[] = []
    for (let r = h - 1; r >= 0; r -= 1) row.push(padded[r][c] ?? 0)
    rotated.push(row)
  }
  return rotated
}

function randomPieces(): Piece[] {
  return [0, 1, 2].map((i) => ({
    id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }))
}

function clearLines(grid: Grid): { grid: Grid; cleared: number } {
  const fullRows = grid.map((row) => row.every((cell) => cell === 1))
  const fullCols = Array.from({ length: SIZE }, (_, c) => grid.every((row) => row[c] === 1))
  const next = grid.map((row, r) => row.map((cell, c) => (fullRows[r] || fullCols[c] ? 0 : cell)))
  const cleared = fullRows.filter(Boolean).length + fullCols.filter(Boolean).length
  return { grid: next, cleared }
}

function makeQuestion(pool: Word[]): Question {
  const word = pool[Math.floor(Math.random() * pool.length)]
  const choices = shuffle([word, ...distractors(word, pool, 3)]).map((w) => choiceLabel(w, 'word'))
  return { word, prompt: promptFor(word, 'word'), choices, answer: expectedLabel(word, 'word') }
}

function boardMetrics(el: HTMLElement) {
  const rect = el.getBoundingClientRect()
  const inner = rect.width - BOARD_PAD * 2
  const cell = (inner - BOARD_GAP * (SIZE - 1)) / SIZE
  return { rect, cell }
}

function cellFromPoint(el: HTMLElement, clientX: number, clientY: number): Cell | null {
  const { rect, cell } = boardMetrics(el)
  const x = clientX - rect.left - BOARD_PAD
  const y = clientY - rect.top - BOARD_PAD
  if (x < 0 || y < 0) return null
  const c = Math.floor(x / (cell + BOARD_GAP))
  const r = Math.floor(y / (cell + BOARD_GAP))
  if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) return null
  return { r, c }
}

function grabFromPoint(shape: Shape, target: HTMLElement, clientX: number, clientY: number): Cell {
  const cells = filledCells(shape)
  const piece = (target.matches('.piece-preview') ? target : target.querySelector('.piece-preview')) as HTMLElement | null
  if (!piece || cells.length === 0) return firstFilled(shape)
  const rect = piece.getBoundingClientRect()
  const w = shapeWidth(shape)
  const h = shape.length
  const cellW = rect.width / w
  const cellH = rect.height / h
  const c = Math.min(w - 1, Math.max(0, Math.floor((clientX - rect.left) / cellW)))
  const r = Math.min(h - 1, Math.max(0, Math.floor((clientY - rect.top) / cellH)))
  return cells.find((cell) => cell.r === r && cell.c === c) ?? firstFilled(shape)
}

function PiecePreview({ shape, color, cell = 18 }: { shape: Shape; color: string; cell?: number }) {
  const w = shapeWidth(shape)
  return (
    <div
      className="piece-preview"
      style={{
        gridTemplateColumns: `repeat(${w}, ${cell}px)`,
        gridTemplateRows: `repeat(${shape.length}, ${cell}px)`,
        gap: `${Math.max(2, Math.round(cell / 8))}px`,
      }}
    >
      {shape.map((row, r) =>
        row.concat(Array.from({ length: w - row.length }, () => 0)).map((on, c) => (
          <div
            key={`${r}-${c}`}
            className="mini-cell"
            style={{
              width: cell,
              height: cell,
              background: on ? color : 'transparent',
              visibility: on ? 'visible' : 'hidden',
            }}
          />
        )),
      )}
    </div>
  )
}

export function Blocks() {
  const id = useCurrentSet()
  const words = useMemo(() => (id == null ? [] : wordsForSet(id)), [id])
  const boardRef = useRef<HTMLDivElement>(null)
  const [grid, setGrid] = useState<Grid>(emptyGrid)
  const [pieces, setPieces] = useState<Piece[]>(randomPieces)
  const [selected, setSelected] = useState(0)
  const [hover, setHover] = useState<{ origin: Cell; valid: boolean } | null>(null)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [score, setScore] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [over, setOver] = useState(false)
  const [best, setBest] = useState(() => (id == null ? 0 : bestScore('blocks', setPath(id))))
  const [feedback, setFeedback] = useState<string | null>(null)
  const [hint, setHint] = useState('Drag a piece onto the board, or tap a piece and then a cell.')

  if (id == null) return <Navigate to="/" replace />
  const setId = id

  const preview = drag?.ghost ?? hover
  const activeIndex = drag?.index ?? selected
  const active = pieces[activeIndex]

  function finish(nextScore: number) {
    setOver(true)
    setHint('No more moves.')
    setBest(saveScore('blocks', setPath(setId), nextScore))
  }

  function afterPlace(nextGrid: Grid, nextPieces: Piece[], gained: number) {
    const total = score + gained
    setScore(total)
    if (nextPieces.length === 0) {
      setPieces([])
      setQuestion(makeQuestion(words))
      setSelected(0)
      setHint('Answer correctly to earn 3 more pieces.')
      return
    }
    const playable = nextPieces.some((p) => canPlaceAnywhere(nextGrid, p.shape))
    if (!playable) finish(total)
    else setHint('Drag a piece onto the board, or tap a piece and then a cell.')
  }

  function placeOrigin(origin: Cell, index: number) {
    if (over || question) return
    const piece = pieces[index]
    if (!piece || !canPlace(grid, piece.shape, origin.r, origin.c)) {
      setHint('That spot does not fit. Try another cell or rotate.')
      return
    }
    const stamped = stamp(grid, piece.shape, origin.r, origin.c)
    const cleared = clearLines(stamped)
    const cells = filledCells(piece.shape).length
    const gained = cells * 10 + cleared.cleared * 80
    const nextPieces = pieces.filter((_, i) => i !== index)
    setGrid(cleared.grid)
    setPieces(nextPieces)
    setSelected(0)
    setHover(null)
    setDrag(null)
    afterPlace(cleared.grid, nextPieces, gained)
  }

  function updateHover(clientX: number, clientY: number, index = selected) {
    const board = boardRef.current
    const piece = pieces[index]
    if (!board || !piece || over || question) {
      setHover(null)
      return
    }
    const cell = cellFromPoint(board, clientX, clientY)
    if (!cell) {
      setHover(null)
      return
    }
    const origin = tapOrigin(piece.shape, cell, grid)
    if (!origin) {
      const fallback = { r: Math.max(0, cell.r), c: Math.max(0, cell.c) }
      setHover({ origin: fallback, valid: false })
      return
    }
    setHover({ origin, valid: true })
  }

  function startDrag(index: number, event: PointerEvent<HTMLButtonElement>) {
    if (over || question) return
    const piece = pieces[index]
    if (!piece) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const grab = grabFromPoint(piece.shape, event.currentTarget, event.clientX, event.clientY)
    setSelected(index)
    setDrag({
      index,
      grab,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      ghost: null,
    })
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    if (!drag) return
    const piece = pieces[drag.index]
    const board = boardRef.current
    if (!piece) return
    let ghost: Drag['ghost'] = null
    if (board) {
      const cell = cellFromPoint(board, event.clientX, event.clientY)
      if (cell) {
        const origin = dropOrigin(piece.shape, cell, drag.grab, grid)
        const grabbed = { r: cell.r - drag.grab.r, c: cell.c - drag.grab.c }
        ghost = origin
          ? { origin, valid: true }
          : { origin: grabbed, valid: false }
      }
    }
    setDrag({ ...drag, x: event.clientX, y: event.clientY, ghost })
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>) {
    if (!drag) return
    const piece = pieces[drag.index]
    const board = boardRef.current
    const cell = board ? cellFromPoint(board, event.clientX, event.clientY) : null
    const moved = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY)
    const origin = cell && piece ? dropOrigin(piece.shape, cell, drag.grab, grid) : null
    setDrag(null)
    if (origin && piece) {
      placeOrigin(origin, drag.index)
      return
    }
    if (moved < 8) {
      setSelected(drag.index)
      setHint('Selected. Drag it onto the board, or tap the cell where this piece should sit.')
    } else if (cell) {
      setHint('That spot does not fit. Rotate or try another cell.')
    }
  }

  function tapBoard(event: PointerEvent<HTMLDivElement>) {
    if (drag || over || question || !active) return
    const cell = cellFromPoint(event.currentTarget, event.clientX, event.clientY)
    if (!cell) return
    const origin = tapOrigin(active.shape, cell, grid)
    if (!origin) {
      setHint('That spot does not fit. Rotate or try another cell.')
      return
    }
    placeOrigin(origin, activeIndex)
  }

  function rotateSelected() {
    if (over || question || !pieces[selected]) return
    setPieces((prev) => prev.map((piece, i) => (
      i === selected ? { ...piece, shape: rotateShape(piece.shape) } : piece
    )))
    setHover(null)
  }

  function answer(choice: string) {
    if (!question) return
    recordLearn(question.word.id, choice === question.answer)
    if (choice === question.answer) {
      const next = randomPieces()
      setPieces(next)
      setQuestion(null)
      setFeedback(null)
      setSelected(0)
      if (!next.some((p) => canPlaceAnywhere(grid, p.shape))) finish(score)
      else setHint('Drag a piece onto the board, or tap a piece and then a cell.')
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
    setDrag(null)
    setHint('Drag a piece onto the board, or tap a piece and then a cell.')
  }

  return (
    <main className="page page-wide">
      <BackToSet />
      <h1>Blocks</h1>
      <p className="lede">{hint}</p>
      <div className="toolbar">
        <div className="meta">Score {score}</div>
        <div className="meta">Best {best}</div>
        <button className="btn secondary" onClick={rotateSelected} disabled={over || !!question || !pieces[selected]}>
          Rotate
        </button>
        <button className="btn secondary" onClick={reset}>New game</button>
      </div>
      {over && <p className="feedback bad">No more moves. Final score {score}.</p>}
      <div className="blocks-layout">
        <div
          ref={boardRef}
          className="board"
          onPointerMove={(e) => {
            if (!drag) updateHover(e.clientX, e.clientY)
          }}
          onPointerLeave={() => setHover(null)}
          onPointerUp={tapBoard}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              let extra = cell ? ' filled' : ''
              if (preview && active) {
                const onGhost = filledCells(active.shape).some((block) => (
                  preview.origin.r + block.r === r && preview.origin.c + block.c === c
                ))
                if (onGhost) extra = preview.valid ? ' ghost' : ' invalid'
              }
              return <div key={`${r}-${c}`} className={`cell${extra}`} />
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
            pieces.map((piece, i) => (
              <button
                key={piece.id}
                className={`piece-btn${selected === i ? ' selected' : ''}${drag?.index === i ? ' dragging' : ''}`}
                onPointerDown={(e) => startDrag(i, e)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={() => setDrag(null)}
              >
                <PiecePreview shape={piece.shape} color={piece.color} cell={22} />
              </button>
            ))
          )}
        </aside>
      </div>
      {drag && active && (
        <div className="drag-follow" style={{ left: drag.x, top: drag.y }}>
          <PiecePreview shape={active.shape} color={active.color} cell={28} />
        </div>
      )}
    </main>
  )
}
