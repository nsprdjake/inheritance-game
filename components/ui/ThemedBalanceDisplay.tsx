'use client'

import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { ThemeIllustration } from './ThemeIllustrations'

interface Props {
  balance: number
  dollarValue: number
  level?: string
}

export default function ThemedBalanceDisplay({ balance, dollarValue, level = 'bronze' }: Props) {
  const { theme, themeId } = useTheme()

  const getThemeMessage = () => {
    switch (themeId) {
      case 'garden':
        return 'Seeds Collected'
      case 'cosmic':
        return 'Star Crystals'
      case 'treasure':
        return 'Gold Doubloons'
      case 'pixel':
        return 'Power Points'
    }
  }

  const getThemeSubtext = () => {
    switch (themeId) {
      case 'garden':
        return 'Plant them to grow your skills! 🌱'
      case 'cosmic':
        return 'Fuel for your cosmic journey! 🚀'
      case 'treasure':
        return 'X marks the spot! 🗺️'
      case 'pixel':
        return 'Level up! 🎮'
    }
  }

  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl p-8 backdrop-blur-xl"
      style={{
        background: `linear-gradient(135deg, ${theme.colors.primary[0]}20, ${theme.colors.secondary[0]}20)`,
        border: `2px solid ${theme.colors.primary[0]}40`,
        borderRadius: theme.effects.borderRadius,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring' }}
    >
      {/* Floating coin decoration */}
      <motion.div
        className="absolute -top-8 -right-8 w-24 h-24 opacity-20"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <ThemeIllustration theme={themeId} type="coin" className="w-full h-full" />
      </motion.div>

      {/* Theme-specific label */}
      <div className="text-sm font-medium mb-2" style={{ color: theme.colors.textSecondary }}>
        {getThemeMessage()}
      </div>

      {/* Giant balance number */}
      <motion.div
        className="text-6xl md:text-7xl font-black mb-2"
        style={{
          fontFamily: theme.fonts.display,
          background: `linear-gradient(135deg, ${theme.colors.primary[0]}, ${theme.colors.primary[1]}, ${theme.colors.secondary[0]})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
      >
        {balance.toLocaleString()}
      </motion.div>

      {/* Dollar value */}
      <div className="text-lg font-semibold mb-3" style={{ color: theme.colors.accent1 }}>
        ${dollarValue.toFixed(2)} real value
      </div>

      {/* Theme subtext */}
      <div className="text-sm italic" style={{ color: theme.colors.textSecondary }}>
        {getThemeSubtext()}
      </div>

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-3xl pointer-events-none"
        style={{
          boxShadow: `0 0 60px ${theme.colors.glow}40`,
          borderRadius: theme.effects.borderRadius,
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  )
}
