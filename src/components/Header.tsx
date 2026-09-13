import { Link } from 'react-router-dom'

export function Header() {
  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-mark">I</span>
        ISEE Vocab Study
      </Link>
    </header>
  )
}
