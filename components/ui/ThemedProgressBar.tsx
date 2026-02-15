'use client'

import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'

interface Props {
  value: number // 0-100
  label?: string
  showValue?: boolean
}

export default function ThemedProgressBar({ value, label, showValue = true }: Props) {
  const { theme, themeId } = useTheme()

  const getThemeStyle = () => {
    switch (themeId) {
      case 'pixel':
        // Pixelated chunky bar
        return {
          container: 'h-8 border-4 border-black',
          bar: 'h-full',
          segments: true,
        }
      case 'garden':
        // Organic flowing bar
        return {
          container: 'h-6 shadow-inner',
          bar: 'h-full rounded-full',
          segments: false,
        }
      case 'cosmic':
        // Sleek futuristic bar
        return {
          container: 'h-5 border-2',
          bar: 'h-full',
          segments: false,
        }
      case 'treasure':
        // Rustic chest progress
        return {
          container: 'h-7 border-2',
          bar: 'h-full',
          segments: false,
        }
    }
  }

  const style = getThemeStyle()

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold" style={{ color: theme.colors.textPrimary }}>
            {label}
          </span>
          {showValue && (
            <span className="text-xs font-bold" style={{ color: theme.colors.accent1 }}>
              {Math.round(value)}%
            </span>
          )}
        </div>
      )}

      <div
        className={`relative overflow-hidden ${style.container}`}
        style={{
          backgroundColor: `${theme.colors.bgLight}`,
          borderRadius: themeId === 'pixel' ? '4px' : theme.effects.borderRadius,
          borderColor: `${theme.colors.primary[0]}40`,
        }}
      >
        {/* Progress bar */}
        <motion.div
          className={style.bar}
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${theme.colors.primary[0]}, ${theme.colors.primary[1]}, ${theme.colors.secondary[0]})`,
            borderRadius: themeId === 'pixel' ? '0' : 'inherit',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />

        {/* Shimmer effect (not for pixel theme) */}
        {themeId !== 'pixel' && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              backgroundSize: '200% 100%',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '200% 0%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}

        {/* Pixel segments (only for pixel theme) */}
        {themeId === 'pixel' && (
          <div className="absolute inset-0 flex">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r-2 border-black/30"
                style={{ height: '100%' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
