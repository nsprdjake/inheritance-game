/**
 * 🎨 LYNE THEME SYSTEM
 * 
 * 4 Radically Different Visual Identities
 * Each theme is a complete aesthetic overhaul
 */

export type ThemeId = 'garden' | 'cosmic' | 'treasure' | 'pixel'

export interface ThemeDefinition {
  id: ThemeId
  name: string
  emoji: string
  description: string
  colors: {
    // Backgrounds
    bgDeep: string
    bgMid: string
    bgLight: string
    
    // Primary gradient (for buttons, highlights)
    primary: [string, string, string]
    
    // Secondary gradient (for accents)
    secondary: [string, string, string]
    
    // Accent colors (for badges, icons)
    accent1: string
    accent2: string
    accent3: string
    accent4: string
    
    // Text
    textPrimary: string
    textSecondary: string
    
    // Special effects
    glow: string
    
    // Skill tier colors (bronze, silver, gold)
    bronze: string
    silver: string
    gold: string
  }
  fonts: {
    display: string // Big headers
    body: string    // Regular text
  }
  effects: {
    borderRadius: string // Card corners
    glassOpacity: number // Glass card transparency
    particleEmoji: string[] // Floating decorations
  }
}

export const themes: Record<ThemeId, ThemeDefinition> = {
  garden: {
    id: 'garden',
    name: 'Garden Grove',
    emoji: '🌸',
    description: 'Grow your skills like plants in a peaceful garden',
    colors: {
      bgDeep: '#1A2820',
      bgMid: '#243529',
      bgLight: '#2F4336',
      primary: ['#7CB342', '#558B2F', '#33691E'], // Fresh greens
      secondary: ['#FDD835', '#F9A825', '#F57F17'], // Sunlight yellows
      accent1: '#FF6F61', // Flower coral
      accent2: '#4DD0E1', // Water cyan
      accent3: '#AED581', // Leaf green
      accent4: '#F8BBD0', // Blossom pink
      textPrimary: '#FAFAFA',
      textSecondary: 'rgba(250, 250, 250, 0.7)',
      glow: '#7CB342',
      bronze: '#8D6E63', // Soil brown
      silver: '#B0BEC5', // Stone gray
      gold: '#FFD54F', // Honey gold
    },
    fonts: {
      display: '"Fredoka", "Comic Neue", sans-serif',
      body: '"Inter", system-ui, sans-serif',
    },
    effects: {
      borderRadius: '24px',
      glassOpacity: 0.12,
      particleEmoji: ['🌱', '🌿', '🌸', '🦋', '🐝', '☀️'],
    },
  },

  cosmic: {
    id: 'cosmic',
    name: 'Cosmic Quest',
    emoji: '🚀',
    description: 'Explore the galaxy and reach for the stars',
    colors: {
      bgDeep: '#0A0E1A',
      bgMid: '#141B2E',
      bgLight: '#1E2742',
      primary: ['#7C4DFF', '#536DFE', '#2979FF'], // Deep purple to blue
      secondary: ['#00E5FF', '#00B8D4', '#0097A7'], // Cyan nebula
      accent1: '#FF4081', // Pink supernova
      accent2: '#FFC107', // Star yellow
      accent3: '#69F0AE', // Alien green
      accent4: '#E040FB', // Cosmic purple
      textPrimary: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.75)',
      glow: '#7C4DFF',
      bronze: '#FF8A65', // Mars orange
      silver: '#CFD8DC', // Moon gray
      gold: '#FFD740', // Sun gold
    },
    fonts: {
      display: '"Orbitron", "Fredoka", sans-serif',
      body: '"Inter", system-ui, sans-serif',
    },
    effects: {
      borderRadius: '20px',
      glassOpacity: 0.08,
      particleEmoji: ['✨', '⭐', '🌟', '🪐', '🌙', '☄️'],
    },
  },

  treasure: {
    id: 'treasure',
    name: 'Treasure Island',
    emoji: '🏴‍☠️',
    description: 'Set sail on an adventure to find golden treasure',
    colors: {
      bgDeep: '#1A1410',
      bgMid: '#2C1F1A',
      bgLight: '#3D2B23',
      primary: ['#FF9800', '#F57C00', '#E65100'], // Treasure gold to copper
      secondary: ['#00ACC1', '#0097A7', '#00838F'], // Ocean teal
      accent1: '#FFD700', // Gold coins
      accent2: '#8B4513', // Wooden chest
      accent3: '#FF6F61', // Ruby red
      accent4: '#40E0D0', // Turquoise gem
      textPrimary: '#FFF8DC', // Parchment white
      textSecondary: 'rgba(255, 248, 220, 0.8)',
      glow: '#FFD700',
      bronze: '#CD7F32', // Bronze medal
      silver: '#C0C0C0', // Silver coin
      gold: '#FFD700', // Gold doubloon
    },
    fonts: {
      display: '"Rye", "Fredoka", serif',
      body: '"Inter", system-ui, sans-serif',
    },
    effects: {
      borderRadius: '16px',
      glassOpacity: 0.15,
      particleEmoji: ['💰', '⚓', '🗺️', '💎', '🏴‍☠️', '⛵'],
    },
  },

  pixel: {
    id: 'pixel',
    name: 'Pixel Arcade',
    emoji: '🎮',
    description: 'Level up in a retro gaming adventure',
    colors: {
      bgDeep: '#0F0F1E',
      bgMid: '#1A1A2E',
      bgLight: '#25254A',
      primary: ['#FF00FF', '#FF0080', '#FF0040'], // Hot pink/magenta
      secondary: ['#00FFFF', '#00CCFF', '#0099FF'], // Cyan neon
      accent1: '#FFFF00', // Yellow power-up
      accent2: '#00FF00', // Green 1-up
      accent3: '#FF4500', // Orange fire
      accent4: '#9D00FF', // Purple warp
      textPrimary: '#FFFFFF',
      textSecondary: 'rgba(255, 255, 255, 0.85)',
      glow: '#FF00FF',
      bronze: '#8B7355', // Copper circuit
      silver: '#A8A8A8', // Metal gray
      gold: '#FFD700', // Gold trophy
    },
    fonts: {
      display: '"Press Start 2P", "Courier New", monospace',
      body: '"Inter", system-ui, sans-serif',
    },
    effects: {
      borderRadius: '8px', // Sharp corners like pixels
      glassOpacity: 0.1,
      particleEmoji: ['🎮', '👾', '🕹️', '🏆', '⭐', '💾'],
    },
  },
}

export const defaultTheme: ThemeId = 'cosmic'

/**
 * Get theme by ID with fallback to default
 */
export function getTheme(themeId?: string): ThemeDefinition {
  if (!themeId || !(themeId in themes)) {
    return themes[defaultTheme]
  }
  return themes[themeId as ThemeId]
}

/**
 * Get all available themes for selector
 */
export function getAllThemes(): ThemeDefinition[] {
  return Object.values(themes)
}
