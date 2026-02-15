'use client'

import { useEffect, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

interface Particle {
  id: number
  emoji: string
  left: number
  top: number
  delay: number
  duration: number
}

export default function ThemeParticles() {
  const { theme } = useTheme()
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    // Generate 8 random particles using theme emojis
    const newParticles: Particle[] = theme.effects.particleEmoji.flatMap((emoji, index) => {
      return [
        {
          id: index * 2,
          emoji,
          left: Math.random() * 100,
          top: Math.random() * 100,
          delay: Math.random() * 10,
          duration: 10 + Math.random() * 10,
        },
        {
          id: index * 2 + 1,
          emoji,
          left: Math.random() * 100,
          top: Math.random() * 100,
          delay: Math.random() * 10,
          duration: 10 + Math.random() * 10,
        },
      ]
    }).slice(0, 12) // Limit to 12 particles

    setParticles(newParticles)
  }, [theme])

  return (
    <div className="theme-particles pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="theme-particle absolute"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        >
          {particle.emoji}
        </div>
      ))}
    </div>
  )
}
