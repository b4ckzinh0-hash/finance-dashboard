'use client'

import { useState, useEffect } from 'react'

export function usePrivacyMode() {
  const [isPrivate, setIsPrivate] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('privacy-mode')
    const isPrivateStored = stored === 'true'
    setIsPrivate(isPrivateStored)
    document.documentElement.setAttribute('data-privacy', isPrivateStored ? 'true' : 'false')

    // Sync privacy mode state across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'privacy-mode') {
        const next = e.newValue === 'true'
        setIsPrivate(next)
        document.documentElement.setAttribute('data-privacy', next ? 'true' : 'false')
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const toggle = () => {
    setIsPrivate(prev => {
      const next = !prev
      localStorage.setItem('privacy-mode', String(next))
      document.documentElement.setAttribute('data-privacy', next ? 'true' : 'false')
      return next
    })
  }

  return { isPrivate, toggle }
}
