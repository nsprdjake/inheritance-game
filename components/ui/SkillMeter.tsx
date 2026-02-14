'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Props {
  skillName: string
  currentXP: number
  maxXP: number
  level: number
  icon?: string
  color?: 'bronze' | 'silver' | 'gold' | 'rainbow'
}

export default function SkillMeter({ skillName, currentXP, maxXP, level, icon = '⭐', color = 'bronze' }: Props) {
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    // Animate progress bar on mount
    const timer = setTimeout(() => {
      setProgress((currentXP / maxXP) * 100)
    }, 100)
    return () => clearTimeout(timer)
  }, [currentXP, maxXP])
  
  const getColorGradient = () => {
    switch (color) {
      case 'gold':
        return 'from-yellow-400 via-amber-500 to-orange-500'
      case 'silver':
        return 'from-gray-300 via-slate-400 to-gray-500'
      case 'rainbow':
        return 'from-pink-500 via-purple-500 to-blue-500'
      default:
        return 'from-amber-600 via-orange-500 to-amber-700'
    }
  }
  
  const getGlowColor = () => {
    switch (color) {
      case 'gold':
        return 'rgba(251, 191, 36, 0.4)'
      case 'silver':
        return 'rgba(203, 213, 225, 0.4)'
      case 'rainbow':
        return 'rgba(168, 85, 247, 0.4)'
      default:
        return 'rgba(251, 146, 60, 0.4)'
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="card-glass-hover p-6 cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            className="text-4xl"
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            {icon}
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-white">{skillName}</h3>
            <p className="text-sm text-white/60">Level {level}</p>
          </div>
        </div>
        
        {/* XP Counter */}
        <div className="text-right">
          <p className="text-2xl font-bold gradient-text-sunset">
            {currentXP}
          </p>
          <p className="text-xs text-white/50">/ {maxXP} XP</p>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="relative">
        {/* Track */}
        <div className="h-4 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/20">
          {/* Fill */}
          <motion.div
            className={`h-full bg-gradient-to-r ${getColorGradient()} relative overflow-hidden`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress, 100)}%` }}
            transition={{
              duration: 1.5,
              ease: 'easeOut',
              delay: 0.2
            }}
            style={{
              boxShadow: `0 0 20px ${getGlowColor()}`
            }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '200%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
                repeatDelay: 1
              }}
            />
            
            {/* Particle dots */}
            <div className="absolute inset-0 flex items-center justify-around px-2">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 bg-white rounded-full"
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1.2, 0.8]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>
        
        {/* Progress percentage */}
        <motion.div
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          initial={{ y: 10 }}
          animate={{ y: 0 }}
        >
          <div className="px-3 py-1 bg-black/80 backdrop-blur-xl rounded-lg border border-white/20">
            <p className="text-xs font-bold text-white">
              {Math.round(progress)}%
            </p>
          </div>
        </motion.div>
      </div>
      
      {/* Level up indicator */}
      {progress >= 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.7, type: 'spring', stiffness: 300 }}
          className="mt-3 text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/40 rounded-full">
            <span className="text-lg">🎉</span>
            <span className="text-sm font-bold text-green-400">Ready to level up!</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
