import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { BackToSet } from '../components/SetLink'
import { useCurrentSet } from '../lib/hooks'
import { choiceLabel, distractors, expectedLabel, isWrittenCorrect, promptFor, shuffle } from '../lib/quiz'
import { wordsForSet } from '../lib/sets'
import { getAnswerWith, getLearn, isStarred, masteredCount, MASTERED_LEVEL, recordLearn, setAnswerWith } from '../lib/storage'
import type { AnswerWith, Word } from '../types'

type Kind = 'mc' | 'tf' | 'written' | 'spell'
type Question = {
  word: Word
  kind: Kind
  prompt: string
  choices?: string[]
  answer: string
  truth?: boolean
}

const ROUND = 7

function kindForLevel(level: number, allowWrite: boolean, allowSpell: boolean): Kind {
  if (level <= 0) return 'mc'
  if (level === 1) return 'tf'
  if (allowSpell && level >= 3) return 'spell'
  if (allowWrite || level >= 2) return 'written'
  return 'mc'
}

function makeQuestion(word: Word, pool: Word[], answerWith: AnswerWith, kind: Kind): Question {
  const prompt = kind === 'spell' ? promptFor(word, 'word') : promptFor(word, answerWith)
  const answer = kind === 'spell' ? word.word : expectedLabel(word, answerWith)

  if (kind === 'mc') {
    const options = shuffle([word, ...distractors(word, pool, 3)]).map((w) =>
      kind === 'mc' ? choiceLabel(w, answerWith) : expectedLabel(w, answerWith),
    )
    return { word, kind, prompt, choices: options, answer }
  }

  if (kind === 'tf') {
    const truthful = Math.random() > 0.45
    const shown = truthful ? answer : choiceLabel(distractors(word, pool, 1)[0], answerWith)
    return {
      word,
      kind,
      prompt: `${prompt}\n\nIs this a match?\n${shown}`,
      choices: ['True', 'False'],
      answer: truthful ? 'True' : 'False',
      truth: truthful,
    }
  }

  return { word, kind, prompt, answer }
}

export function Learn() {
  const id = useCurrentSet()
  const [answerWith, setAw] = useState<AnswerWith>(getAnswerWith())
  const [starredOnly, setStarredOnly] = useState(false)
  const [allowWrite, setAllowWrite] = useState(true)
  const [allowSpell, setAllowSpell] = useState(true)
  const [started, setStarted] = useState(false)
  const [queue, setQueue] = useState<Question[]>([])
  const [qIndex, setQIndex] = useState(0)
  const [typed, setTyped] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const [resolved, setResolved] = useState<boolean | null>(null)
  const [roundCorrect, setRoundCorrect] = useState(0)
  const [lastRound, setLastRound] = useState<{ correct: number; total: number } | null>(null)

  const words = useMemo(() => {
    if (id == null) return []
    return wordsForSet(id).filter((w) => !starredOnly || isStarred(w.id))
  }, [id, starredOnly])

  if (id == null) return <Navigate to="/" replace />

  const current = queue[qIndex]
  const done = masteredCount(words.map((w) => w.id))

  function startRound() {
    const pool = words.length ? words : wordsForSet(id!)
    const ranked = [...pool].sort((a, b) => getLearn(a.id).level - getLearn(b.id).level)
    const unmastered = ranked.filter((w) => getLearn(w.id).level < MASTERED_LEVEL)
    const source = (unmastered.length ? unmastered : ranked).slice(0, Math.max(ROUND, 1))
    const selected = shuffle(source).slice(0, Math.min(ROUND, source.length))
    const questions = selected.map((word) => {
      const level = getLearn(word.id).level
      return makeQuestion(word, pool, answerWith, kindForLevel(level, allowWrite, allowSpell))
    })
    setQueue(questions)
    setQIndex(0)
    setTyped('')
    setPicked(null)
    setResolved(null)
    setRoundCorrect(0)
    setLastRound(null)
    setStarted(true)
    setAnswerWith(answerWith)
  }

  function grade(value: string) {
    if (!current || resolved != null) return
    const ok =
      current.kind === 'written' || current.kind === 'spell'
        ? isWrittenCorrect(value, current.word, current.kind === 'spell' ? 'word' : answerWith)
        : value === current.answer
    recordLearn(current.word.id, ok)
    setResolved(ok)
    if (ok) setRoundCorrect((n) => n + 1)
    setPicked(value)
  }

  function next() {
    if (qIndex + 1 >= queue.length) {
      setLastRound({ correct: roundCorrect, total: queue.length })
      setStarted(false)
      setQueue([])
      return
    }
    setQIndex((n) => n + 1)
    setTyped('')
    setPicked(null)
    setResolved(null)
  }

  return (
    <main className="page">
      <BackToSet />
      <h1>Learn</h1>
      <p className="lede">{done} / {words.length} mastered in {id === 'all' ? 'this collection' : `set ${id}`}</p>

      {!started || !current ? (
        <section className="card setup-card">
          <div className="toolbar">
            <button className={`chip${answerWith === 'word' ? ' on' : ''}`} onClick={() => setAw('word')}>
              Answer with word
            </button>
            <button className={`chip${answerWith === 'synonyms' ? ' on' : ''}`} onClick={() => setAw('synonyms')}>
              Answer with synonyms
            </button>
            <button className={`chip${allowWrite ? ' on' : ''}`} onClick={() => setAllowWrite((v) => !v)}>
              Write
            </button>
            <button className={`chip${allowSpell ? ' on' : ''}`} onClick={() => setAllowSpell((v) => !v)}>
              Spell
            </button>
            <button className={`chip${starredOnly ? ' on' : ''}`} onClick={() => setStarredOnly((v) => !v)}>
              Starred only
            </button>
          </div>
          {lastRound && (
            <div style={{ marginBottom: 16 }}>
              <div className="meta">Last round</div>
              <div className="stat">{lastRound.correct} / {lastRound.total}</div>
            </div>
          )}
          <p className="meta">Questions move from multiple choice to true/false to written as you improve.</p>
          <button className="btn" onClick={startRound} disabled={!words.length}>
            {lastRound ? 'Study again' : 'Start round'}
          </button>
        </section>
      ) : (
        <section className="question-card">
          <div className="meta">Question {qIndex + 1} of {queue.length} · {current.kind}</div>
          <p className="prompt" style={{ whiteSpace: 'pre-wrap' }}>{current.prompt}</p>
          {current.choices ? (
            <div className="choices">
              {current.choices.map((choice) => {
                const show = resolved != null
                const cls = show
                  ? choice === current.answer
                    ? ' correct'
                    : choice === picked
                      ? ' wrong'
                      : ''
                  : ''
                return (
                  <button key={choice} className={`choice${cls}`} disabled={resolved != null} onClick={() => grade(choice)}>
                    {choice}
                  </button>
                )
              })}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                grade(typed)
              }}
            >
              <input
                className="field"
                value={typed}
                autoFocus
                onChange={(e) => setTyped(e.target.value)}
                placeholder={current.kind === 'spell' ? 'Type the word' : 'Type your answer'}
                disabled={resolved != null}
              />
            </form>
          )}
          {resolved != null && (
            <div className={`feedback ${resolved ? 'ok' : 'bad'}`}>
              {resolved ? 'Correct' : `Correct answer: ${current.answer}`}
            </div>
          )}
          {resolved != null && (
            <div className="toolbar" style={{ marginTop: 16 }}>
              <button className="btn" onClick={next}>
                {qIndex + 1 >= queue.length ? `Finish round · ${roundCorrect} correct` : 'Next'}
              </button>
            </div>
          )}
        </section>
      )}
    </main>
  )
}
