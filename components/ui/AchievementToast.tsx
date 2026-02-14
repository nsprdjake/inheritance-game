'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
}

interface Props {
  achievement: Achievement | null
  onClose: () => void
  autoClose?: number
}

export default function AchievementToast({ achievement, onClose, autoClose = 5000 }: Props) {
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    if (achievement) {
      setIsVisible(true)
      
      // Trigger celebration
      const count = 150
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999
      }
      
      function fire(particleRatio: number, opts: any) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        })
      }
      
      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      })
      
      fire(0.2, {
        spread: 60,
      })
      
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      })
      
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      })
      
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      })
      
      // Auto close
      if (autoClose > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false)
          setTimeout(onClose, 500)
        }, autoClose)
        
        return () => clearTimeout(timer)
      }
    }
  }, [achievement, autoClose, onClose])
  
  const getRarityGradient = () => {
    switch (achievement?.rarity) {
      case 'legendary':
        return 'from-yellow-400 via-orange-500 to-red-500'
      case 'epic':
        return 'from-purple-500 via-pink-500 to-purple-600'
      case 'rare':
        return 'from-blue-500 via-cyan-500 to-blue-600'
      default:
        return 'from-green-500 via-emerald-500 to-green-600'
    }
  }
  
  const getRarityGlow = () => {
    switch (achievement?.rarity) {
      case 'legendary':
        return '0 0 40px rgba(251, 191, 36, 0.6), 0 0 80px rgba(251, 191, 36, 0.3)'
      case 'epic':
        return '0 0 40px rgba(168, 85, 247, 0.6), 0 0 80px rgba(168, 85, 247, 0.3)'
      case 'rare':
        return '0 0 40px rgba(59, 130, 246, 0.6), 0 0 80px rgba(59, 130, 246, 0.3)'
      default:
        return '0 0 40px rgba(34, 197, 94, 0.6), 0 0 80px rgba(34, 197, 94, 0.3)'
    }
  }
  
  return (
    <AnimatePresence>
      {isVisible && achievement && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 25 
          }}
          className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[9999] max-w-md w-full px-4"
        >
          <motion.div
            className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${getRarityGradient()} p-1`}
            style={{
              boxShadow: getRarityGlow()
            }}
            animate={{
              boxShadow: [
                getRarityGlow(),
                '0 0 60px rgba(255, 255, 255, 0.4)',
                getRarityGlow()
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <div className="bg-gray-900/95 backdrop-blur-xl rounded-3xl p-6 relative overflow-hidden">
              {/* Animated background stars */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: Math.random() * 2
                    }}
                  />
                ))}
              </div>
              
              <div className="relative z-10">
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mb-4"
                >
                  <p className="text-sm font-bold uppercase tracking-wider text-white/80 mb-2">
                    🎉 Achievement Unlocked! 🎉
                  </p>
                  {achievement.rarity && (
                    <div className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${getRarityGradient()} text-white text-xs font-bold uppercase tracking-wider`}>
                      {achievement.rarity}
                    </div>
                  )}
                </motion.div>
                
                {/* Icon and Content */}
                <div className="flex items-center gap-4 mb-4">
                  <motion.div
                    className="text-6xl"
                    animate={{
                      rotate: [0, -10, 10, -10, 0],
                      scale: [1, 1.2, 1.1, 1.2, 1]
                    }}
                    transition={{
                      duration: 0.8,
                      ease: 'easeOut'
                    }}
                  >
                    {achievement.icon}
                  </motion.div>
                  
                  <div className="flex-1">
                    <motion.h3
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl font-black text-white mb-1"
                    >
                      {achievement.title}
                    </motion.h3>
                    
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-white/70 text-sm"
                    >
                      {achievement.description}
                    </motion.p>
                  </div>
                </div>
                
                {/* Close button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  onClick={() => {
                    setIsVisible(false)
                    setTimeout(onClose, 500)
                  }}
                  className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 rounded-xl text-white/80 hover:text-white text-sm font-semibold transition-all"
                >
                  Awesome! 🚀
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
