/**
 * Theme-specific SVG illustrations
 * Used for decorative elements throughout the app
 */

import { ThemeId } from '@/lib/themes/definitions'

interface IllustrationProps {
  theme: ThemeId
  type: 'coin' | 'star' | 'badge' | 'trophy'
  className?: string
}

export function ThemeIllustration({ theme, type, className = '' }: IllustrationProps) {
  if (type === 'coin') {
    switch (theme) {
      case 'treasure':
        return (
          <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Gold Coin */}
            <circle cx="50" cy="50" r="45" fill="url(#goldGradient)" stroke="#8B6914" strokeWidth="3"/>
            <circle cx="50" cy="50" r="35" fill="none" stroke="#FFE55C" strokeWidth="2" opacity="0.5"/>
            <text x="50" y="60" fontSize="40" fontWeight="bold" fill="#8B6914" textAnchor="middle">$</text>
            <defs>
              <radialGradient id="goldGradient" cx="50%" cy="30%">
                <stop offset="0%" stopColor="#FFD700"/>
                <stop offset="100%" stopColor="#DAA520"/>
              </radialGradient>
            </defs>
          </svg>
        )
      
      case 'garden':
        return (
          <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Sunflower Seed */}
            <ellipse cx="50" cy="50" rx="30" ry="40" fill="#8B7355" stroke="#5D4E37" strokeWidth="2"/>
            <path d="M 35 50 Q 50 30 65 50" stroke="#A0826D" strokeWidth="2" fill="none"/>
            <path d="M 35 60 Q 50 70 65 60" stroke="#A0826D" strokeWidth="2" fill="none"/>
          </svg>
        )
      
      case 'cosmic':
        return (
          <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Star Crystal */}
            <path d="M 50 10 L 60 40 L 90 50 L 60 60 L 50 90 L 40 60 L 10 50 L 40 40 Z" 
              fill="url(#cosmicGradient)" stroke="#7C4DFF" strokeWidth="2"/>
            <circle cx="50" cy="50" r="8" fill="#FFF" opacity="0.8"/>
            <defs>
              <radialGradient id="cosmicGradient">
                <stop offset="0%" stopColor="#E040FB"/>
                <stop offset="100%" stopColor="#7C4DFF"/>
              </radialGradient>
            </defs>
          </svg>
        )
      
      case 'pixel':
        return (
          <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Pixel Coin */}
            <rect x="20" y="20" width="60" height="60" fill="#FFD700" stroke="#000" strokeWidth="4"/>
            <rect x="30" y="30" width="10" height="10" fill="#FFF"/>
            <rect x="40" y="40" width="20" height="20" fill="#FFA500"/>
            <rect x="60" y="60" width="10" height="10" fill="#DAA520"/>
          </svg>
        )
    }
  }

  if (type === 'star') {
    switch (theme) {
      case 'treasure':
        return (
          <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Ruby Gem */}
            <path d="M 50 10 L 70 40 L 50 90 L 30 40 Z" fill="#FF6F61" stroke="#8B0000" strokeWidth="2"/>
            <path d="M 50 10 L 70 40 L 50 50 Z" fill="#FF4444" opacity="0.5"/>
            <path d="M 50 90 L 30 40 L 50 50 Z" fill="#CC0000" opacity="0.5"/>
          </svg>
        )
      
      case 'garden':
        return (
          <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Flower */}
            <circle cx="50" cy="50" r="12" fill="#FDD835"/>
            {[0, 60, 120, 180, 240, 300].map((angle, i) => {
              const x = 50 + 25 * Math.cos((angle * Math.PI) / 180)
              const y = 50 + 25 * Math.sin((angle * Math.PI) / 180)
              return (
                <ellipse
                  key={i}
                  cx={x}
                  cy={y}
                  rx="15"
                  ry="10"
                  fill="#FF6F61"
                  transform={`rotate(${angle} ${x} ${y})`}
                />
              )
            })}
          </svg>
        )
      
      case 'cosmic':
        return (
          <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Star */}
            <path d="M 50 5 L 58 38 L 92 38 L 65 58 L 77 92 L 50 70 L 23 92 L 35 58 L 8 38 L 42 38 Z" 
              fill="url(#starGradient)" stroke="#FFD740" strokeWidth="2"/>
            <defs>
              <radialGradient id="starGradient">
                <stop offset="0%" stopColor="#FFF"/>
                <stop offset="100%" stopColor="#FFC107"/>
              </radialGradient>
            </defs>
          </svg>
        )
      
      case 'pixel':
        return (
          <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Pixel Star */}
            <rect x="40" y="10" width="20" height="20" fill="#FFFF00"/>
            <rect x="20" y="30" width="60" height="20" fill="#FFFF00"/>
            <rect x="30" y="50" width="40" height="20" fill="#FFFF00"/>
            <rect x="35" y="70" width="10" height="20" fill="#FFFF00"/>
            <rect x="55" y="70" width="10" height="20" fill="#FFFF00"/>
            <rect x="40" y="50" width="20" height="10" fill="#FFF" opacity="0.6"/>
          </svg>
        )
    }
  }

  return null
}
