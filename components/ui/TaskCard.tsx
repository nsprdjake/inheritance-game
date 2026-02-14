'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import confetti from 'canvas-confetti'

interface Props {
  title: string
  description?: string
  points: number
  difficulty?: 'easy' | 'medium' | 'hard'
  icon?: string
  category?: string
  onClaim?: () => void
  onComplete?: () => void
  status?: 'available' | 'claimed' | 'completed' | 'pending'
  imageUrl?: string
}

export default function TaskCard({
  title,
  description,
  points,
  difficulty = 'medium',
  icon = '✨',
  category,
  onClaim,
  onComplete,
  status = 'available',
  imageUrl
}: Props) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  
  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'easy': return 'from-green-500 to-emerald-600'
      case 'hard': return 'from-red-500 to-pink-600'
      default: return 'from-blue-500 to-indigo-600'
    }
  }
  
  const getDifficultyBadge = () => {
    switch (difficulty) {
      case 'easy': return '⭐'
      case 'hard': return '⭐⭐⭐'
      default: return '⭐⭐'
    }
  }
  
  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'from-green-500/20 to-emerald-500/20 border-green-400/40'
      case 'claimed': return 'from-yellow-500/20 to-amber-500/20 border-yellow-400/40'
      case 'pending': return 'from-purple-500/20 to-pink-500/20 border-purple-400/40'
      default: return 'from-white/5 to-white/10 border-white/20'
    }
  }
  
  const handleAction = () => {
    if (status === 'available' && onClaim) {
      onClaim()
      // Confetti burst
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#FF6B9D', '#C23AFF', '#4F46E5', '#FFD700']
      })
    } else if (status === 'claimed' && onComplete) {
      onComplete()
    }
  }
  
  const getActionText = () => {
    switch (status) {
      case 'completed': return '✅ Completed!'
      case 'claimed': return '🎯 Mark Complete'
      case 'pending': return '⏳ Pending Review'
      default: return '⚡ Claim Task'
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${getStatusColor()} backdrop-blur-xl border p-6 cursor-pointer group`}
      onClick={handleAction}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>
      
      {/* Glow effect on hover */}
      <motion.div
        className={`absolute -inset-1 bg-gradient-to-r ${getDifficultyColor()} opacity-0 group-hover:opacity-30 blur-xl transition-opacity duration-300 -z-10`}
      />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <motion.div
              className="text-5xl"
              animate={{
                rotate: isHovered ? [0, -10, 10, 0] : 0,
                scale: isHovered ? [1, 1.1, 1] : 1
              }}
              transition={{
                duration: 0.5,
                ease: 'easeInOut'
              }}
            >
              {icon}
            </motion.div>
            
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1 leading-tight">
                {title}
              </h3>
              
              {/* Category badge */}
              {category && (
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 rounded-lg border border-white/20 text-xs text-white/70">
                  {category}
                </div>
              )}
            </div>
          </div>
          
          {/* Points badge */}
          <motion.div
            className={`px-4 py-2 rounded-2xl bg-gradient-to-r ${getDifficultyColor()} shadow-lg flex flex-col items-center`}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <span className="text-2xl font-black text-white drop-shadow-lg">
              {points}
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-white/90">
              pts
            </span>
          </motion.div>
        </div>
        
        {/* Description */}
        {description && (
          <p className="text-white/70 text-sm mb-4 leading-relaxed">
            {description}
          </p>
        )}
        
        {/* Image preview */}
        {imageUrl && (
          <div className="mb-4 rounded-xl overflow-hidden border-2 border-white/20">
            <img 
              src={imageUrl} 
              alt={title}
              className="w-full h-32 object-cover"
            />
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-sm text-white/60">
            <span>{getDifficultyBadge()}</span>
            <span className="capitalize">{difficulty}</span>
          </div>
          
          {/* Action button */}
          <motion.div
            className={`px-4 py-2 rounded-xl font-semibold text-sm ${
              status === 'completed' 
                ? 'bg-green-500/20 text-green-400 border border-green-400/40'
                : status === 'pending'
                ? 'bg-purple-500/20 text-purple-400 border border-purple-400/40'
                : 'bg-white/10 text-white border border-white/20 group-hover:bg-white/20'
            }`}
            whileHover={{ scale: status === 'completed' || status === 'pending' ? 1 : 1.05 }}
            whileTap={{ scale: status === 'completed' || status === 'pending' ? 1 : 0.95 }}
          >
            {getActionText()}
          </motion.div>
        </div>
      </div>
      
      {/* Completion checkmark overlay */}
      {status === 'completed' && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-4 right-4"
        >
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
            <span className="text-2xl">✓</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
