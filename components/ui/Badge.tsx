'use client'

import { motion } from 'framer-motion'

interface BadgeProps {
  icon: string
  title: string
  description?: string
  unlocked?: boolean
  onClick?: () => void
}

export default function Badge({ icon, title, description, unlocked = true, onClick }: BadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      onClick={onClick}
      className={`
        relative p-4 rounded-xl border-2 cursor-pointer
        transition-all duration-300 hover:scale-105
        ${unlocked 
          ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/50 shadow-lg shadow-yellow-500/20' 
          : 'bg-white/5 border-white/10 opacity-50 grayscale'
        }
      `}
    >
      <div className="text-4xl mb-2 text-center">{icon}</div>
      <h4 className={`text-sm font-bold text-center mb-1 ${unlocked ? 'text-white' : 'text-white/40'}`}>
        {title}
      </h4>
      {description && (
        <p className={`text-xs text-center ${unlocked ? 'text-white/60' : 'text-white/30'}`}>
          {description}
        </p>
      )}
      {unlocked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
        >
          <span className="text-xs">✓</span>
        </motion.div>
      )}
    </motion.div>
  )
}
