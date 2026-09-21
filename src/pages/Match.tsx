import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { BackToSet } from '../components/SetLink'
import { useCurrentSet } from '../lib/hooks'
import { pickN, shuffle } from '../lib/quiz'
import { definitionText, setPath, wordsForSet } from '../lib/sets'
import { bestMatch, recordLearn, saveMatch } from '../lib/storage'
import type { Word } from '../types'

type Tile = { key: string; wordId: string; text: string }

function makeTiles(words: Word[]): Tile[] {
  const pairs = pickN(words, Math.min(6, words.length))
  const tiles = pairs.flatMap((word) => [
    { key: `${word.id}-term`, wordId: word.id, text: word.word },
    { key: `${word.id}-def`, wordId: word.id, text: definitionText(word) },
  ])
  return shuffle(tiles)
}

function formatMs(ms: number) {
  return `${(ms / 1000).toFixed(2)}s`
}

export function Match() {
  const id = useCurrentSet()
  const words = useMemo(() => (id == null ? [] : wordsForSet(id)), [id])
  const [tiles, setTiles] = useState<Tile[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [matched, setMatched] = useState<string[]>([])
  const [shake, setShake] = useState<string[]>([])
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [finished, setFinished] = useState<number | null>(null)
  const [best, setBest] = useState<number | null>(null)

  useEffect(() => {
    if (id == null) return
    setBest(bestMatch(setPath(id)))
    start()
  }, [id])

  useEffect(() => {
    if (startedAt == null || finished != null) return
    const t = window.setInterval(() => setElapsed(Date.now() - startedAt), 50)
    return () => window.clearInterval(t)
  }, [startedAt, finished])

  if (id == null) return <Navigate to="/" replace />
  const setId = id

  function start() {
    setTiles(makeTiles(words))
    setSelected(null)
    setMatched([])
    setShake([])
    setStartedAt(Date.now())
    setElapsed(0)
    setFinished(null)
  }

  function clickTile(tile: Tile) {
    if (finished != null || matched.includes(tile.key)) return
    if (selected == null) {
      setSelected(tile.key)
      return
    }
    if (selected === tile.key) {
      setSelected(null)
      return
    }
    const first = tiles.find((t) => t.key === selected)
    if (!first) return
    if (first.wordId === tile.wordId) {
      recordLearn(tile.wordId, true)
      const next = [...matched, first.key, tile.key]
      setMatched(next)
      setSelected(null)
      if (next.length === tiles.length) {
        const ms = Date.now() - (startedAt ?? Date.now())
        setFinished(ms)
        setBest(saveMatch(setPath(setId), ms))
      }
    } else {
      setShake([first.key, tile.key])
      setSelected(null)
      window.setTimeout(() => setShake([]), 280)
    }
  }

  return (
    <main className="page">
      <BackToSet />
      <h1>Match</h1>
      <div className="toolbar">
        <div className="meta">Time {formatMs(finished ?? elapsed)}</div>
        <div className="meta">Best {best == null ? '—' : formatMs(best)}</div>
        <button className="btn secondary" onClick={start}>New game</button>
      </div>
      {finished != null && (
        <p className="feedback ok">Finished in {formatMs(finished)}{best === finished ? ' · new best!' : ''}</p>
      )}
      <div className="match-board">
        {tiles.map((tile) => (
          <button
            key={tile.key}
            className={`match-tile${selected === tile.key ? ' selected' : ''}${matched.includes(tile.key) ? ' matched' : ''}${shake.includes(tile.key) ? ' shake' : ''}`}
            onClick={() => clickTile(tile)}
          >
            {tile.text}
          </button>
        ))}
      </div>
    </main>
  )
}
