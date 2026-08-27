'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export function NavigationProgress() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // pathname changed = navigation completed, finish the bar
    setWidth(100)
    const hide = setTimeout(() => { setVisible(false); setWidth(0) }, 350)
    return () => clearTimeout(hide)
  }, [pathname])

  // Intercept link clicks to start the bar
  useEffect(() => {
    function onLinkClick(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest('a')
      if (!a) return
      const href = a.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto')) return
      setVisible(true)
      setWidth(0)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setWidth(72), 30)
    }
    document.addEventListener('click', onLinkClick)
    return () => document.removeEventListener('click', onLinkClick)
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '3px',
        width: `${width}%`,
        background: 'var(--accent1)',
        zIndex: 9999,
        transition: width === 100 ? 'width 0.2s ease' : 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
        borderRadius: '0 3px 3px 0',
        boxShadow: '0 0 8px var(--accent1)',
      }}
    />
  )
}
