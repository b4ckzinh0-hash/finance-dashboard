'use client'

import { useState, useEffect } from 'react'

export function usePrivacyMode() {
  const [isPrivate, setIsPrivate] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('privacy-mode')
    const isPrivateStored = stored === 'true'
    setIsPrivate(isPrivateStored)
    document.documentElement.setAttribute('data-privacy', isPrivateStored ? 'true' : 'false')
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
