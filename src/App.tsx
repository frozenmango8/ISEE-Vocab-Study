import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Header } from './components/Header'
import { Blast } from './pages/Blast'
import { Blocks } from './pages/Blocks'
import { Flashcards } from './pages/Flashcards'
import { Home } from './pages/Home'
import { Learn } from './pages/Learn'
import { Match } from './pages/Match'
import { SetPage } from './pages/SetPage'
import { Test } from './pages/Test'

export default function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sets/:setId" element={<SetPage />} />
          <Route path="/sets/:setId/flashcards" element={<Flashcards />} />
          <Route path="/sets/:setId/learn" element={<Learn />} />
          <Route path="/sets/:setId/test" element={<Test />} />
          <Route path="/sets/:setId/match" element={<Match />} />
          <Route path="/sets/:setId/blocks" element={<Blocks />} />
          <Route path="/sets/:setId/blast" element={<Blast />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </HashRouter>
  )
}
