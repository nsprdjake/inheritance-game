'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AnimatedBalance from '@/components/ui/AnimatedBalance'
import SkillMeter from '@/components/ui/SkillMeter'
import TaskCard from '@/components/ui/TaskCard'
import LevelProgress from '@/components/ui/LevelProgress'
import AchievementToast from '@/components/ui/AchievementToast'
import { KidWithBalance, Transaction, FamilySettings, Achievement } from '@/lib/types/database'

interface Props {
  kid: KidWithBalance
  transactions: Transaction[]
  settings: FamilySettings | null
  achievements?: Achievement[]
  onSignOut: () => void
}

export default function MagicalKidDashboard({ kid, transactions, settings, achievements = [], onSignOut }: Props) {
  const [selectedTab, setSelectedTab] = useState<'home' | 'tasks' | 'skills' | 'rewards'>('home')
  const [achievementToShow, setAchievementToShow] = useState<any>(null)
  
  const dollarValue = kid.balance * (settings?.conversion_rate || 0.01)
  const totalEarned = kid.total_earned || transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
  
  const getLevelInfo = () => {
    switch (kid.level) {
      case 'gold':
        return { name: 'Gold', nextLevel: null, nextXP: null }
      case 'silver':
        return { name: 'Silver', nextLevel: 'Gold', nextXP: 500 }
      default:
        return { name: 'Bronze', nextLevel: 'Silver', nextXP: 200 }
    }
  }
  
  const levelInfo = getLevelInfo()
  
  // Mock skills data - replace with real data
  const skills = [
    { name: 'Money Management', currentXP: 145, maxXP: 200, level: 3, icon: '💰', color: 'gold' as const },
    { name: 'Saving Habits', currentXP: 89, maxXP: 150, level: 2, icon: '🏦', color: 'silver' as const },
    { name: 'Task Completion', currentXP: 234, maxXP: 300, level: 5, icon: '✅', color: 'rainbow' as const },
  ]
  
  // Mock tasks - replace with real data
  const mockTasks = [
    { 
      title: 'Make Your Bed',
      description: 'Start your day right!',
      points: 10,
      difficulty: 'easy' as const,
      icon: '🛏️',
      category: 'Daily',
      status: 'available' as const
    },
    {
      title: 'Help with Dishes',
      description: 'Clean up after dinner',
      points: 25,
      difficulty: 'medium' as const,
      icon: '🍽️',
      category: 'Chores',
      status: 'available' as const
    },
    {
      title: 'Study Session',
      description: 'Complete homework for 30 minutes',
      points: 50,
      difficulty: 'hard' as const,
      icon: '📚',
      category: 'Education',
      status: 'claimed' as const
    }
  ]
  
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'tasks', label: 'Tasks', icon: '⚡' },
    { id: 'skills', label: 'Skills', icon: '🌟' },
    { id: 'rewards', label: 'Rewards', icon: '🎁' }
  ]
  
  return (
    <div className="min-h-screen pb-24">
      {/* Achievement Toast */}
      <AchievementToast
        achievement={achievementToShow}
        onClose={() => setAchievementToShow(null)}
      />
      
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
            x: [0, -50, 0],
            y: [0, -30, 0]
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 4
          }}
        />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <motion.h1
                className="text-5xl md:text-6xl font-black mb-2"
                style={{
                  fontFamily: 'Fredoka, Inter, sans-serif'
                }}
              >
                <span className="gradient-text-rainbow">
                  Hey, {kid.name}!
                </span>
              </motion.h1>
              <p className="text-white/60 text-lg">Ready to level up? 🚀</p>
            </div>
            
            <button
              onClick={onSignOut}
              className="btn-ghost-glow"
            >
              Sign Out
            </button>
          </div>
        </motion.div>
        
        {/* Main Content Grid */}
        <AnimatePresence mode="wait">
          {selectedTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Left Column - Balance */}
              <div className="lg:col-span-2 space-y-6">
                <AnimatedBalance
                  balance={kid.balance}
                  dollarValue={dollarValue}
                  level={kid.level || 'bronze'}
                  showCelebration={false}
                />
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="card-glass p-6 text-center"
                  >
                    <p className="text-white/60 text-sm mb-2">Total Earned</p>
                    <p className="text-4xl font-black gradient-text-sunset">
                      {totalEarned}
                    </p>
                    <p className="text-white/50 text-xs mt-1">points</p>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="card-glass p-6 text-center"
                  >
                    <p className="text-white/60 text-sm mb-2">Tasks Done</p>
                    <p className="text-4xl font-black gradient-text-ocean">
                      {transactions.filter(t => t.amount > 0).length}
                    </p>
                    <p className="text-white/50 text-xs mt-1">completed</p>
                  </motion.div>
                </div>
                
                {/* Recent Activity */}
                <div className="card-glass p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <span>📈</span>
                    Recent Activity
                  </h2>
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {transactions.slice(0, 5).map((transaction, idx) => (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.amount > 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}>
                            <span className="text-xl">
                              {transaction.amount > 0 ? '✅' : '❌'}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {transaction.description || (transaction.amount > 0 ? 'Points earned' : 'Points deducted')}
                            </p>
                            <p className="text-white/50 text-xs">
                              {new Date(transaction.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <p className={`text-2xl font-bold ${
                          transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Right Column - Level & Skills Preview */}
              <div className="space-y-6">
                <LevelProgress
                  currentLevel={kid.level || 'bronze'}
                  currentXP={totalEarned}
                  nextLevelXP={levelInfo.nextXP || 999999}
                  nextLevel={levelInfo.nextLevel || undefined}
                />
                
                {/* Skills Preview */}
                <div className="card-glass p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span>🌟</span>
                    Top Skills
                  </h3>
                  
                  <div className="space-y-3">
                    {skills.slice(0, 3).map((skill, idx) => (
                      <motion.div
                        key={skill.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{skill.icon}</span>
                          <div className="flex-1">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-semibold text-white">{skill.name}</span>
                              <span className="text-xs text-white/60">Lv.{skill.level}</span>
                            </div>
                            <div className="progress-container">
                              <motion.div
                                className="progress-bar"
                                initial={{ width: 0 }}
                                animate={{ width: `${(skill.currentXP / skill.maxXP) * 100}%` }}
                                transition={{ duration: 1, delay: 0.3 + idx * 0.1 }}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedTab('skills')}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-400/40 rounded-xl text-white font-semibold transition-all"
                  >
                    View All Skills →
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
          
          {selectedTab === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-3xl font-black text-white mb-6">⚡ Available Tasks</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockTasks.map((task, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <TaskCard {...task} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          {selectedTab === 'skills' && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-3xl font-black text-white mb-6">🌟 Your Skills</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {skills.map((skill, idx) => (
                  <motion.div
                    key={skill.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <SkillMeter {...skill} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          {selectedTab === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-20"
            >
              <p className="text-6xl mb-4">🎁</p>
              <h2 className="text-3xl font-black text-white mb-4">Rewards Store</h2>
              <p className="text-white/60 mb-6">Coming soon! 🚀</p>
              <p className="text-white/40 text-sm">Save up your points for awesome rewards!</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Bottom Navigation */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      >
        <div className="max-w-md mx-auto px-4 pb-4">
          <div className="bg-gray-900/95 backdrop-blur-2xl border-2 border-white/20 rounded-3xl p-2 shadow-2xl">
            <div className="grid grid-cols-4 gap-2">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`relative py-3 px-4 rounded-2xl font-semibold text-sm transition-all ${
                    selectedTab === tab.id
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xl">{tab.icon}</span>
                    <span className="text-xs">{tab.label}</span>
                  </div>
                  
                  {selectedTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl -z-10"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
