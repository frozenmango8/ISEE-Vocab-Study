import { useParams } from 'react-router-dom'
import { parseSetId } from './sets'

export function useCurrentSet() {
  const { setId } = useParams()
  return parseSetId(setId)
}
