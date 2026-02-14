'use client'

import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'

interface Props {
  balance: number
  dollarValue?: number
  level?: string
  showCelebration?: boolean
}

export default function AnimatedBalance({ balance, dollarValue, level = 'bronze', showCelebration = false }: Props) {
  const [displayBalance, setDisplayBalance] = useState(balance)
  
  // Smooth number counting animation
  const springConfig = { damping: 50, stiffness: 100 }
  const balanceSpring = useSpring(balance, springConfig)
  
  useEffect(() => {
    const unsubscribe = balanceSpring.on('change', (latest) => {
      setDisplayBalance(Math.floor(latest))
    })
    
    balanceSpring.set(balance)
    
    return () => unsubscribe()
  }, [balance, balanceSpring])
  
  // Trigger celebration when balance increases
  useEffect(() => {
    if (showCelebration && balance > 0) {
      triggerCelebration()
    }
  }, [balance, showCelebration])
  
  const triggerCelebration = () => {
    const duration = 2000
    const end = Date.now() + duration
    
    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FF6B9D', '#C23AFF', '#4F46E5', '#FFD700']
      })
      
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00D4FF', '#7B61FF', '#4ADE80', '#FBBF24']
      })
      
      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }
    
    frame()
  }
  
  const getLevelColor = () => {
    switch (level) {
      case 'gold': return 'from-yellow-400 via-orange-400 to-yellow-500'
      case 'silver': return 'from-gray-300 via-gray-200 to-gray-400'
      default: return 'from-amber-600 via-amber-500 to-orange-600'
    }
  }
  
  const getLevelGlow = () => {
    switch (level) {
      case 'gold': return 'drop-shadow-[0_0_30px_rgba(255,215,0,0.6)]'
      case 'silver': return 'drop-shadow-[0_0_30px_rgba(232,232,232,0.5)]'
      default: return 'drop-shadow-[0_0_30px_rgba(255,165,0,0.4)]'
    }
  }
  
  return (
    <div className="relative">
      {/* Background glow orbs */}
      <div className="absolute -inset-20 opacity-30">
        <motion.div
          className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>
      
      {/* Main balance card */}
      <div className="relative z-10 card-glass p-8 md:p-12 text-center overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <motion.div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20px 20px, rgba(255, 255, 255, 0.3) 2px, transparent 0)`,
              backgroundSize: '40px 40px'
            }}
            animate={{
              backgroundPosition: ['0px 0px', '40px 40px']
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        </div>
        
        <div className="relative z-10">
          {/* Label */}
          <motion.p 
            className="text-white/60 text-lg md:text-xl mb-4 font-medium"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Your Balance
          </motion.p>
          
          {/* Massive balance number */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 20,
              delay: 0.2
            }}
            className="mb-6"
          >
            <motion.div
              className={`text-8xl md:text-9xl font-black mb-3 bg-gradient-to-br ${getLevelColor()} bg-clip-text text-transparent ${getLevelGlow()}`}
              animate={{
                scale: balance > displayBalance ? [1, 1.15, 1] : 1
              }}
              transition={{
                duration: 0.5,
                ease: 'easeOut'
              }}
            >
              {displayBalance}
            </motion.div>
            
            <motion.p 
              className="text-2xl md:text-3xl text-white/90 font-semibold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              points ✨
            </motion.p>
          </motion.div>
          
          {/* Dollar value badge */}
          {dollarValue !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="inline-block"
            >
              <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 backdrop-blur-xl">
                <p className="text-green-400/70 text-sm font-medium mb-1">Worth</p>
                <p className="text-3xl md:text-4xl font-bold text-green-400">
                  ${dollarValue.toFixed(2)}
                </p>
              </div>
            </motion.div>
          )}
        </div>
        
        {/* Floating emoji decorations */}
        <motion.div
          className="absolute top-8 left-8 text-4xl"
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          💰
        </motion.div>
        
        <motion.div
          className="absolute top-12 right-12 text-3xl"
          animate={{
            y: [0, -8, 0],
            rotate: [0, -5, 5, 0]
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5
          }}
        >
          ✨
        </motion.div>
        
        <motion.div
          className="absolute bottom-12 left-16 text-3xl"
          animate={{
            y: [0, -12, 0],
            rotate: [0, 10, -10, 0]
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1
          }}
        >
          🌟
        </motion.div>
      </div>
    </div>
  )
}
