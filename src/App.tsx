import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CustomCursor from './components/CustomCursor'
import NetflixTitle from './components/NetflixTitle'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import Resume from './pages/Resume'

export default function App() {
  const [introComplete, setIntroComplete] = useState(false)

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true)
  }, [])

  return (
    <BrowserRouter>
      <CustomCursor />
      {!introComplete && <NetflixTitle onComplete={handleIntroComplete} />}
      <div
        className="transition-opacity duration-500"
        style={{ opacity: introComplete ? 1 : 0, pointerEvents: introComplete ? 'auto' : 'none' }}
      >
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resume" element={<Resume />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
