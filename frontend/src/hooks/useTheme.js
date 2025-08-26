import { useEffect, useState } from 'react'

const applyTheme = (t) => {
  const root = document.documentElement
  root.classList.toggle('dark', t === 'dark')
  localStorage.setItem('theme', t)
}

export default function useTheme() {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const initial = saved || (prefersDark ? 'dark' : 'light')
      setTheme(initial)
      applyTheme(initial)
    } catch {}
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return next
    })
  }

  return { theme, toggleTheme }
}