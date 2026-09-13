import { Link } from 'react-router-dom'
import { useCurrentSet } from '../lib/hooks'
import { setPath, setTitle } from '../lib/sets'

export function BackToSet() {
  const id = useCurrentSet()
  if (id == null) return <Link to="/" className="back">← Home</Link>
  return <Link to={`/sets/${setPath(id)}`} className="back">← {setTitle(id)}</Link>
}
