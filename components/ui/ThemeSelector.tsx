'use client'

import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { getAllThemes } from '@/lib/themes/definitions'

export default function ThemeSelector() {
  const { themeId, setTheme } = useTheme()
  const themes = getAllThemes()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white/90">
        Choose Your Adventure 🎨
      </h3>
      <p className="text-sm text-white/60">
        Pick a theme that matches your vibe
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        {themes.map((theme) => {
          const isActive = themeId === theme.id
          
          return (
            <motion.button
              key={theme.id}
              onClick={() => setTheme(theme.id)}
              className="relative group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Theme card */}
              <div
                className={`
                  relative p-6 rounded-2xl border-2 transition-all duration-300
                  ${isActive 
                    ? 'border-white/40 bg-white/10' 
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                  }
                `}
                style={{
                  background: isActive 
                    ? `linear-gradient(135deg, ${theme.colors.primary[0]}20, ${theme.colors.secondary[0]}20)`
                    : undefined
                }}
              >
                {/* Emoji icon */}
                <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                  {theme.emoji}
                </div>
                
                {/* Theme name */}
                <div className="font-bold text-lg mb-1">
                  {theme.name}
                </div>
                
                {/* Description */}
                <div className="text-xs text-white/60 leading-relaxed">
                  {theme.description}
                </div>
                
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    className="absolute -top-2 -right-2 bg-gradient-to-br from-green-400 to-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  >
                    ✓ Active
                  </motion.div>
                )}
                
                {/* Gradient preview bar */}
                <div className="mt-4 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full w-full"
                    style={{
                      background: `linear-gradient(90deg, ${theme.colors.primary[0]}, ${theme.colors.primary[1]}, ${theme.colors.secondary[0]})`
                    }}
                  />
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
      
      {/* Fun message */}
      <div className="text-center text-sm text-white/50 italic mt-6">
        Don't worry, you can switch anytime! 🎭
      </div>
    </div>
  )
}
