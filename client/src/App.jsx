import './App.css'
import { Container } from 'react-bootstrap'
import { Routes, Route, Navigate } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import Instructions from './pages/Instructions.jsx'
import LoginForm from './pages/LoginForm.jsx'
import PlayPage from './pages/PlayPage.jsx'
import Ranking from './pages/Ranking.jsx'
import RequireAuth from './components/RequireAuth.jsx'

export default function App() {

  return (
    <>
      <NavBar />
      <Container className="py-4">
        <Routes>
          <Route path="/" element={<Instructions />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/play" element={<RequireAuth><PlayPage /></RequireAuth>} />
          <Route path="/ranking" element={<RequireAuth><Ranking /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </>
  )
}


