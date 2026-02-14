'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'

interface Achievement {
  id: string
  icon: string
  title: string
  description?: string
}

interface Props {
  achievement: Achievement | null
  onClose: () => void
}

export default function AchievementUnlockModal({ achievement, onClose }: Props) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (achievement) {
      setIsVisible(true)
      
      // Trigger confetti
      const duration = 2000
      const animationEnd = Date.now() + duration
      const colors = ['#FFD700', '#FFA500', '#FF69B4', '#00CED1', '#9370DB']

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()

        if (timeLeft <= 0) {
          clearInterval(interval)
          return
        }

        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors
        })
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors
        })
      }, 30)

      // Auto-close after 4 seconds
      const timeout = setTimeout(() => {
        setIsVisible(false)
        setTimeout(onClose, 300)
      }, 4000)

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
  }, [achievement, onClose])

  return (
    <AnimatePresence>
      {isVisible && achievement && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsVisible(false)
              setTimeout(onClose, 300)
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-purple-900/90 to-blue-900/90 backdrop-blur-xl border-2 border-yellow-500/50 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
            >
              {/* Sparkle effect */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="absolute -top-4 -right-4 text-4xl"
              >
                ✨
              </motion.div>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, -180, -360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className="absolute -top-4 -left-4 text-4xl"
              >
                ✨
              </motion.div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mb-4"
              >
                <h2 className="text-2xl font-bold text-yellow-400 mb-2">
                  Achievement Unlocked!
                </h2>
              </motion.div>

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
                className="text-8xl mb-6"
              >
                {achievement.icon}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-3xl font-bold text-white mb-3">
                  {achievement.title}
                </h3>
                {achievement.description && (
                  <p className="text-lg text-white/80">
                    {achievement.description}
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6"
              >
                <button
                  onClick={() => {
                    setIsVisible(false)
                    setTimeout(onClose, 300)
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  Awesome! 🎉
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
