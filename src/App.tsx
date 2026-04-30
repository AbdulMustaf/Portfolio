import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import CustomCursor from './components/CustomCursor'
import NetflixTitle from './components/NetflixTitle'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import Experience from './pages/Experience'
import Skills from './pages/Skills'
import Projects from './pages/Projects'
import Contact from './pages/Contact'
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
          <Route path="/experience" element={<Experience />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/resume" element={<Resume />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
