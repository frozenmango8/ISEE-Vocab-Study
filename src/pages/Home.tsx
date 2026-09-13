import { Link } from 'react-router-dom'
import { WORDS } from '../data/words'
import { allSetIds, setPath, setTitle, wordsForSet } from '../lib/sets'
import { masteredCount } from '../lib/storage'

export function Home() {
  const allMastered = masteredCount(WORDS.map((w) => w.id))

  return (
    <main className="page">
      <h1>Study ISEE vocab</h1>
      <p className="lede">
        250 words from the study list. Pick a set, or study everything at once.
        Progress stays in this browser.
      </p>
      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div className="meta">Overall mastery</div>
        <div className="stat">{allMastered} / {WORDS.length}</div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${(allMastered / WORDS.length) * 100}%` }} />
        </div>
      </div>
      <div className="grid set-grid">
        {allSetIds().map((id) => {
          const words = wordsForSet(id)
          const done = masteredCount(words.map((w) => w.id))
          return (
            <Link key={setPath(id)} to={`/sets/${setPath(id)}`} className="set-card">
              <h3>{setTitle(id)}</h3>
              <div className="meta">{words.length} words · {done} mastered</div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${(done / words.length) * 100}%` }} />
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
