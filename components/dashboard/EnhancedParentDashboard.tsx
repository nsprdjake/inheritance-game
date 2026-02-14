'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import confetti from 'canvas-confetti'

interface Kid {
  id: string
  name: string
  balance: number
  level?: string
  total_earned?: number
}

interface Props {
  kids: Kid[]
  familyName?: string
  onQuickAward: (kidId: string, points: number) => void
  onDeduct: (kidId: string, points: number) => void
}

export default function EnhancedParentDashboard({ kids, familyName, onQuickAward, onDeduct }: Props) {
  const [selectedKid, setSelectedKid] = useState<string | null>(null)
  
  const handleAward = (kidId: string, points: number) => {
    onQuickAward(kidId, points)
    
    // Confetti celebration
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6B9D', '#C23AFF', '#4F46E5', '#FFD700', '#4ADE80']
    })
  }
  
  const getLevelColor = (level?: string) => {
    switch (level) {
      case 'gold': return 'from-yellow-400 to-orange-500'
      case 'silver': return 'from-gray-300 to-gray-500'
      default: return 'from-amber-600 to-orange-600'
    }
  }
  
  const getLevelIcon = (level?: string) => {
    switch (level) {
      case 'gold': return '🏆'
      case 'silver': return '🥈'
      default: return '🥉'
    }
  }
  
  const totalFamilyPoints = kids.reduce((sum, kid) => sum + kid.balance, 0)
  const totalFamilyEarned = kids.reduce((sum, kid) => sum + (kid.total_earned || 0), 0)
  
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-5xl font-black mb-2" style={{ fontFamily: 'Fredoka, Inter, sans-serif' }}>
            <span className="gradient-text-sunset">
              {familyName || 'Family'} Dashboard
            </span>
          </h1>
          <p className="text-white/60 text-lg">Manage your family's financial journey 💫</p>
        </motion.div>
        
        {/* Family Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-glass p-6 text-center"
          >
            <p className="text-white/60 text-sm mb-2">Total Family Points</p>
            <p className="text-5xl font-black gradient-text-ocean mb-1">
              {totalFamilyPoints}
            </p>
            <p className="text-white/50 text-xs">across all kids</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-glass p-6 text-center"
          >
            <p className="text-white/60 text-sm mb-2">All-Time Earned</p>
            <p className="text-5xl font-black gradient-text-sunset mb-1">
              {totalFamilyEarned}
            </p>
            <p className="text-white/50 text-xs">total points earned</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-glass p-6 text-center"
          >
            <p className="text-white/60 text-sm mb-2">Active Kids</p>
            <p className="text-5xl font-black gradient-text-rainbow mb-1">
              {kids.length}
            </p>
            <p className="text-white/50 text-xs">family members</p>
          </motion.div>
        </div>
        
        {/* Kid Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {kids.map((kid, idx) => (
            <motion.div
              key={kid.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="card-glass-hover p-6 cursor-pointer"
              onClick={() => setSelectedKid(selectedKid === kid.id ? null : kid.id)}
            >
              {/* Kid Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-3xl shadow-lg">
                    👤
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-black text-white mb-1">
                      {kid.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${getLevelColor(kid.level)} text-white text-sm font-bold flex items-center gap-1`}>
                        <span>{getLevelIcon(kid.level)}</span>
                        <span className="capitalize">{kid.level || 'Bronze'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Balance */}
                <div className="text-right">
                  <p className="text-4xl font-black gradient-text-sunset">
                    {kid.balance}
                  </p>
                  <p className="text-white/50 text-xs">points</p>
                </div>
              </div>
              
              {/* Quick Award Buttons */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAward(kid.id, 10)
                  }}
                  className="py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="text-xs mb-1">+10</div>
                  <div className="text-sm">✨</div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAward(kid.id, 25)
                  }}
                  className="py-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="text-xs mb-1">+25</div>
                  <div className="text-sm">⭐</div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAward(kid.id, 50)
                  }}
                  className="py-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="text-xs mb-1">+50</div>
                  <div className="text-sm">🌟</div>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeduct(kid.id, 25)
                  }}
                  className="py-3 bg-gradient-to-r from-red-500 to-red-600 rounded-xl text-white font-bold shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="text-xs mb-1">-25</div>
                  <div className="text-sm">❌</div>
                </motion.button>
              </div>
              
              {/* Stats Row */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="text-center flex-1">
                  <p className="text-xs text-white/50 mb-1">Total Earned</p>
                  <p className="text-lg font-bold text-white">
                    {kid.total_earned || 0}
                  </p>
                </div>
                
                <div className="text-center flex-1 border-l border-white/10">
                  <p className="text-xs text-white/50 mb-1">This Week</p>
                  <p className="text-lg font-bold text-green-400">
                    +{Math.floor(Math.random() * 100)} {/* Replace with real data */}
                  </p>
                </div>
                
                <div className="text-center flex-1 border-l border-white/10">
                  <p className="text-xs text-white/50 mb-1">Streak</p>
                  <p className="text-lg font-bold text-orange-400">
                    {Math.floor(Math.random() * 7)}🔥 {/* Replace with real data */}
                  </p>
                </div>
              </div>
              
              {/* Expanded Details */}
              {selectedKid === kid.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/10"
                >
                  <p className="text-white/60 text-sm mb-3">Quick Actions:</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-white text-sm font-semibold transition-all"
                    >
                      📊 View Details
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-white text-sm font-semibold transition-all"
                    >
                      🎯 Assign Task
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-white text-sm font-semibold transition-all"
                    >
                      📚 Learning
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="py-3 bg-white/5 hover:bg-white/10 border border-white/20 rounded-xl text-white text-sm font-semibold transition-all"
                    >
                      ⚙️ Settings
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
