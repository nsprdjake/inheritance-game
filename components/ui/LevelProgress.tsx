'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Props {
  currentLevel: string
  currentXP: number
  nextLevelXP: number
  nextLevel?: string
}

export default function LevelProgress({ currentLevel, currentXP, nextLevelXP, nextLevel }: Props) {
  const [progress, setProgress] = useState(0)
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress((currentXP / nextLevelXP) * 100)
    }, 100)
    return () => clearTimeout(timer)
  }, [currentXP, nextLevelXP])
  
  const getLevelIcon = (level: string) => {
    const levelLower = level?.toLowerCase() || 'bronze'
    switch (levelLower) {
      case 'gold': return '🏆'
      case 'silver': return '🥈'
      default: return '🥉'
    }
  }
  
  const getLevelColor = (level: string) => {
    const levelLower = level?.toLowerCase() || 'bronze'
    switch (levelLower) {
      case 'gold': return 'from-yellow-400 via-amber-500 to-orange-500'
      case 'silver': return 'from-gray-300 via-slate-400 to-gray-500'
      default: return 'from-amber-600 via-orange-500 to-amber-700'
    }
  }
  
  const getLevelGlow = (level: string) => {
    const levelLower = level?.toLowerCase() || 'bronze'
    switch (levelLower) {
      case 'gold': return '0 0 30px rgba(251, 191, 36, 0.6)'
      case 'silver': return '0 0 30px rgba(203, 213, 225, 0.5)'
      default: return '0 0 30px rgba(251, 146, 60, 0.4)'
    }
  }
  
  const isMaxLevel = !nextLevel || progress >= 100
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-glass p-6"
    >
      {/* Current Level Badge */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <motion.div
            className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getLevelColor(currentLevel)} flex items-center justify-center shadow-lg`}
            style={{
              boxShadow: getLevelGlow(currentLevel)
            }}
            animate={{
              boxShadow: [
                getLevelGlow(currentLevel),
                '0 0 40px rgba(255, 255, 255, 0.4)',
                getLevelGlow(currentLevel)
              ]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <span className="text-4xl">{getLevelIcon(currentLevel)}</span>
          </motion.div>
          
          <div>
            <p className="text-sm text-white/60 mb-1">Current Level</p>
            <h3 className="text-3xl font-black text-white capitalize">
              {currentLevel}
            </h3>
          </div>
        </div>
        
        {/* XP Display */}
        {!isMaxLevel && (
          <div className="text-right">
            <p className="text-2xl font-bold gradient-text-sunset">
              {currentXP}
            </p>
            <p className="text-xs text-white/50">
              / {nextLevelXP} XP
            </p>
          </div>
        )}
      </div>
      
      {/* Progress Bar */}
      {!isMaxLevel && nextLevel && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-white/70">
              Progress to <span className="font-bold capitalize">{nextLevel}</span>
            </p>
            <p className="text-sm font-bold text-white">
              {Math.round(progress)}%
            </p>
          </div>
          
          {/* Track */}
          <div className="relative h-6 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/20">
            {/* Fill */}
            <motion.div
              className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getLevelColor(nextLevel)}`}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{
                duration: 1.5,
                ease: 'easeOut'
              }}
              style={{
                boxShadow: getLevelGlow(nextLevel)
              }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
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
            </motion.div>
            
            {/* Next level icon */}
            <motion.div
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <span className="text-xl drop-shadow-lg">
                {getLevelIcon(nextLevel)}
              </span>
            </motion.div>
          </div>
          
          {/* Points remaining */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-xs text-center text-white/50 mt-3"
          >
            {nextLevelXP - currentXP > 0 
              ? `${nextLevelXP - currentXP} XP until ${nextLevel}! Keep going! 🚀`
              : 'Level up ready! 🎉'
            }
          </motion.p>
        </div>
      )}
      
      {/* Max level message */}
      {isMaxLevel && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-4"
        >
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-lg font-bold gradient-text-rainbow">
            Max Level Achieved!
          </p>
          <p className="text-sm text-white/60 mt-2">
            You're a financial superstar! ⭐
          </p>
        </motion.div>
      )}
    </motion.div>
  )
}
