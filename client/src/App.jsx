import './App.css'
import { Container, Spinner } from 'react-bootstrap'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/auth-context.js'
import NavBar from './components/NavBar.jsx'
import Instructions from './pages/Instructions.jsx'
import LoginForm from './pages/LoginForm.jsx'
import PlayPage from './pages/PlayPage.jsx'
import Ranking from './pages/Ranking.jsx'

// Guards a route: renders children only when a user is logged in,
// otherwise redirects to the login page.
export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}



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


