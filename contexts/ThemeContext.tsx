'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { ThemeId, ThemeDefinition, getTheme, defaultTheme } from '@/lib/themes/definitions'

interface ThemeContextType {
  themeId: ThemeId
  theme: ThemeDefinition
  setTheme: (themeId: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

interface Props {
  children: React.ReactNode
  initialTheme?: ThemeId
}

export function ThemeProvider({ children, initialTheme }: Props) {
  const [themeId, setThemeId] = useState<ThemeId>(initialTheme || defaultTheme)
  const theme = getTheme(themeId)

  // Apply theme CSS variables to document root
  useEffect(() => {
    const root = document.documentElement
    const c = theme.colors
    
    // Background colors
    root.style.setProperty('--bg-deep', c.bgDeep)
    root.style.setProperty('--bg-mid', c.bgMid)
    root.style.setProperty('--bg-light', c.bgLight)
    
    // Primary gradient
    root.style.setProperty('--primary-1', c.primary[0])
    root.style.setProperty('--primary-2', c.primary[1])
    root.style.setProperty('--primary-3', c.primary[2])
    
    // Secondary gradient
    root.style.setProperty('--secondary-1', c.secondary[0])
    root.style.setProperty('--secondary-2', c.secondary[1])
    root.style.setProperty('--secondary-3', c.secondary[2])
    
    // Accents
    root.style.setProperty('--accent-1', c.accent1)
    root.style.setProperty('--accent-2', c.accent2)
    root.style.setProperty('--accent-3', c.accent3)
    root.style.setProperty('--accent-4', c.accent4)
    
    // Text
    root.style.setProperty('--text-primary', c.textPrimary)
    root.style.setProperty('--text-secondary', c.textSecondary)
    
    // Effects
    root.style.setProperty('--glow-color', c.glow)
    root.style.setProperty('--bronze-color', c.bronze)
    root.style.setProperty('--silver-color', c.silver)
    root.style.setProperty('--gold-color', c.gold)
    
    // Fonts
    root.style.setProperty('--font-display', theme.fonts.display)
    root.style.setProperty('--font-body', theme.fonts.body)
    
    // Effects
    root.style.setProperty('--border-radius', theme.effects.borderRadius)
    root.style.setProperty('--glass-opacity', theme.effects.glassOpacity.toString())
    
    // Store in localStorage for persistence
    localStorage.setItem('lyne-theme', themeId)
  }, [theme, themeId])

  // Load theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('lyne-theme') as ThemeId | null
    if (stored && stored !== themeId) {
      setThemeId(stored)
    }
  }, [])

  return (
    <ThemeContext.Provider value={{ themeId, theme, setTheme: setThemeId }}>
      {children}
    </ThemeContext.Provider>
  )
}
