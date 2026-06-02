import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

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


