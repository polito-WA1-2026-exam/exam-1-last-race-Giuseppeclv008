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


