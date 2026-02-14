'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { KidWithBalance, Transaction, FamilySettings, Achievement, Streak, TaskTemplate, ClaimedTaskWithTemplate, EducationalModule, ModuleProgressWithModule, SavingsGoal } from '@/lib/types/database'
import SkillTreeView from '@/components/kid/SkillTreeView'
import AvailableTasks from '@/components/kid/AvailableTasks'
import EducationalModules from '@/components/kid/EducationalModules'
import ClaimedTasksList from '@/components/kid/ClaimedTasksList'
import SkillsOverview from '@/components/dashboard/SkillsOverview'
import SavingsGoalsWidget from '@/components/kid/SavingsGoalsWidget'
import AgeTierBadge from '@/components/ui/AgeTierBadge'
import { canAccessFeature, calculateAgeTier } from '@/lib/utils/skills'

interface Props {
  kid: KidWithBalance
  transactions: Transaction[]
  settings: FamilySettings | null
  achievements?: Achievement[]
  streak?: Streak
  availableTasks?: TaskTemplate[]
  claimedTasks?: ClaimedTaskWithTemplate[]
  educationalModules?: EducationalModule[]
  moduleProgress?: ModuleProgressWithModule[]
  savingsGoals?: SavingsGoal[]
  familyId: string
}

export default function KidDashboardClient({ 
  kid, 
  transactions, 
  settings, 
  achievements = [], 
  streak,
  availableTasks = [],
  claimedTasks = [],
  educationalModules = [],
  moduleProgress = [],
  savingsGoals = [],
  familyId
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [selectedTab, setSelectedTab] = useState<'activity' | 'achievements' | 'calculator' | 'skills' | 'tasks' | 'learn'>('activity')

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const dollarValue = kid.balance * (settings?.conversion_rate || 0.01)

  const getLevelInfo = (level?: string) => {
    switch (level) {
      case 'gold':
        return { name: 'Gold', emoji: '🏆', color: 'from-yellow-500 to-orange-500', next: null, nextPoints: null }
      case 'silver':
        return { name: 'Silver', emoji: '🥈', color: 'from-gray-300 to-gray-500', next: 'Gold', nextPoints: 500 }
      default:
        return { name: 'Bronze', emoji: '🥉', color: 'from-amber-700 to-amber-900', next: 'Silver', nextPoints: 200 }
    }
  }

  const levelInfo = getLevelInfo(kid.level)
  const totalEarned = kid.total_earned || transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
  const progressToNext = levelInfo.nextPoints ? ((totalEarned / levelInfo.nextPoints) * 100) : 100

  // Predefined rewards with prices
  const rewards = [
    { name: '30 min screen time', cost: 50, emoji: '📱' },
    { name: 'Choose dinner', cost: 75, emoji: '🍕' },
    { name: 'Stay up 30 min late', cost: 100, emoji: '🌙' },
    { name: 'Skip a chore', cost: 150, emoji: '🎯' },
    { name: 'Movie night pick', cost: 200, emoji: '🎬' },
    { name: 'Ice cream trip', cost: 250, emoji: '🍦' },
    { name: 'Friend sleepover', cost: 500, emoji: '🎉' },
  ]

  const canAfford = rewards.filter(r => r.cost <= kid.balance)
  const almostAfford = rewards.filter(r => r.cost > kid.balance && r.cost <= kid.balance + 100)

  // Default achievements if none from DB
  const defaultAchievements = [
    { type: 'getting_started', title: 'Getting Started! 🎯', description: 'Complete your first task', unlocked: totalEarned >= 1 },
    { type: 'first_points', title: 'First Steps! 🌟', description: 'Earn your first 10 points', unlocked: totalEarned >= 10 },
    { type: 'century_club', title: 'Century Club! 💯', description: 'Earn 100 total points', unlocked: totalEarned >= 100 },
    { type: 'high_roller', title: 'High Roller! 🏆', description: 'Earn 500 total points', unlocked: totalEarned >= 500 },
  ]

  const displayAchievements = achievements.length > 0 
    ? achievements.map(a => ({ ...a, unlocked: true }))
    : defaultAchievements

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-start mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Hey, {kid.name}! 👋
            </h1>
            <p className="text-white/60 mb-3">Your Points Dashboard</p>
            <AgeTierBadge tier={kid.age_tier || calculateAgeTier(kid.birthdate)} showDetails />
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            Sign Out
          </Button>
        </motion.div>

        {/* Balance Card - Big and prominent */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-8 text-center py-12 relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 animate-pulse" />
            
            <div className="relative z-10">
              <p className="text-white/60 text-lg mb-4">Your Balance</p>
              <motion.div 
                className="mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              >
                <p className="text-7xl md:text-8xl font-bold gradient-text mb-2">
                  {kid.balance}
                </p>
                <p className="text-2xl text-white/80">
                  points
                </p>
              </motion.div>

              <div className="flex justify-center gap-4 flex-wrap">
                <div className="inline-block px-6 py-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-white/60 text-sm">Worth</p>
                  <p className="text-3xl font-bold text-green-400">
                    ${dollarValue.toFixed(2)}
                  </p>
                </div>

                <div className={`inline-block px-6 py-3 rounded-xl bg-gradient-to-br ${levelInfo.color} border border-white/20`}>
                  <p className="text-white/80 text-sm">Level</p>
                  <p className="text-3xl font-bold text-white">
                    {levelInfo.emoji} {levelInfo.name}
                  </p>
                </div>

                {streak && streak.current_streak > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-block px-6 py-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30"
                  >
                    <p className="text-white/80 text-sm">Streak</p>
                    <p className="text-3xl font-bold text-orange-400">
                      🔥 {streak.current_streak} days
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Progress to next level */}
              {levelInfo.next && (
                <div className="mt-6 max-w-md mx-auto">
                  <div className="flex justify-between text-sm text-white/60 mb-2">
                    <span>{totalEarned} total earned</span>
                    <span>Next: {levelInfo.next} ({levelInfo.nextPoints})</span>
                  </div>
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progressToNext, 100)}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`h-full bg-gradient-to-r ${levelInfo.color}`}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Tabs */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
          <button
            onClick={() => setSelectedTab('activity')}
            className={`py-3 rounded-lg transition-all ${selectedTab === 'activity' ? 'bg-white/10 border-2 border-white/20' : 'bg-white/5'}`}
          >
            <div className="text-2xl mb-1">📊</div>
            <div className="text-xs text-white/80">Activity</div>
          </button>
          <button
            onClick={() => setSelectedTab('skills')}
            className={`py-3 rounded-lg transition-all ${selectedTab === 'skills' ? 'bg-white/10 border-2 border-white/20' : 'bg-white/5'}`}
          >
            <div className="text-2xl mb-1">🌳</div>
            <div className="text-xs text-white/80">Skills</div>
          </button>
          {canAccessFeature(kid, 2) && (
            <button
              onClick={() => setSelectedTab('tasks')}
              className={`py-3 rounded-lg transition-all ${selectedTab === 'tasks' ? 'bg-white/10 border-2 border-white/20' : 'bg-white/5'}`}
            >
              <div className="text-2xl mb-1">✓</div>
              <div className="text-xs text-white/80">Tasks</div>
              {claimedTasks.length > 0 && (
                <div className="inline-block px-1.5 py-0.5 mt-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs">
                  {claimedTasks.length}
                </div>
              )}
            </button>
          )}
          <button
            onClick={() => setSelectedTab('learn')}
            className={`py-3 rounded-lg transition-all ${selectedTab === 'learn' ? 'bg-white/10 border-2 border-white/20' : 'bg-white/5'}`}
          >
            <div className="text-2xl mb-1">📚</div>
            <div className="text-xs text-white/80">Learn</div>
          </button>
          <button
            onClick={() => setSelectedTab('achievements')}
            className={`py-3 rounded-lg transition-all ${selectedTab === 'achievements' ? 'bg-white/10 border-2 border-white/20' : 'bg-white/5'}`}
          >
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-xs text-white/80">Badges</div>
          </button>
          <button
            onClick={() => setSelectedTab('calculator')}
            className={`py-3 rounded-lg transition-all ${selectedTab === 'calculator' ? 'bg-white/10 border-2 border-white/20' : 'bg-white/5'}`}
          >
            <div className="text-2xl mb-1">🎁</div>
            <div className="text-xs text-white/80">Rewards</div>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Activity Tab */}
          {selectedTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Skills Overview */}
              <Card>
                <SkillsOverview kid={kid} />
              </Card>

              {/* Savings Goals */}
              {canAccessFeature(kid, 2) && (
                <SavingsGoalsWidget
                  goals={savingsGoals}
                  kid={{ ...kid, balance: kid.balance }}
                  familyId={familyId}
                />
              )}

              {/* Available Tasks Preview */}
              {canAccessFeature(kid, 2) && availableTasks.length > 0 && (
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>✓</span>
                      <span>Available Tasks</span>
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedTab('tasks')}
                    >
                      See all →
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {availableTasks.slice(0, 3).map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                        onClick={() => setSelectedTab('tasks')}
                      >
                        <div className="flex-1">
                          <p className="text-white font-medium">{task.title}</p>
                          <p className="text-xs text-white/60">{task.description}</p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-xl font-bold gradient-text">+{task.points}</div>
                          <div className="text-xs text-white/60">points</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Continue Learning Preview */}
              {moduleProgress.length > 0 && (
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <span>📚</span>
                      <span>Continue Learning</span>
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedTab('learn')}
                    >
                      See all →
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {moduleProgress
                      .filter(p => p.progress_percent < 100)
                      .slice(0, 2)
                      .map((prog, index) => {
                        const module = educationalModules.find(m => m.id === prog.module_id)
                        if (!module) return null
                        
                        return (
                          <motion.div
                            key={prog.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer"
                            onClick={() => setSelectedTab('learn')}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              {module.icon && <span className="text-2xl">{module.icon}</span>}
                              <div className="flex-1">
                                <p className="text-white font-medium">{module.title}</p>
                                <p className="text-xs text-white/60">{prog.progress_percent}% complete</p>
                              </div>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                                style={{ width: `${prog.progress_percent}%` }}
                              />
                            </div>
                          </motion.div>
                        )
                      })}
                  </div>
                </Card>
              )}

              {/* Recent Activity */}
              <Card>
                <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {transactions.slice(0, 10).map((tx, index) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex justify-between items-center py-3 border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${tx.amount > 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                          {tx.amount > 0 ? '✨' : '📉'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{tx.reason}</p>
                          <p className="text-xs text-white/40">
                            {new Date(tx.created_at).toLocaleDateString()} at{' '}
                            {new Date(tx.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className={`text-2xl font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount}
                      </div>
                    </motion.div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🎯</div>
                      <p className="text-white/40">No activity yet</p>
                      <p className="text-sm text-white/30 mt-2">Complete tasks to start earning points!</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {/* Achievements Tab */}
          {selectedTab === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <h3 className="text-xl font-bold text-white mb-4">Your Achievements</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {displayAchievements.map((achievement, index) => (
                    <motion.div
                      key={achievement.type || index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Badge
                        icon={achievement.icon || achievement.title.match(/[🎯🌟💯🏆]/)?.[0] || '⭐'}
                        title={achievement.title}
                        description={achievement.description}
                        unlocked={achievement.unlocked !== false}
                      />
                    </motion.div>
                  ))}
                </div>

                {streak && (
                  <div className="mt-6 p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20">
                    <h4 className="text-lg font-bold text-white mb-3">🔥 Streak Stats</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-white/60 text-sm">Current Streak</p>
                        <p className="text-3xl font-bold text-orange-400">{streak.current_streak} days</p>
                      </div>
                      <div>
                        <p className="text-white/60 text-sm">Longest Streak</p>
                        <p className="text-3xl font-bold text-yellow-400">{streak.longest_streak} days</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {/* Skills Tab */}
          {selectedTab === 'skills' && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SkillTreeView kid={kid} />
            </motion.div>
          )}

          {/* Tasks Tab */}
          {selectedTab === 'tasks' && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-6">
                {/* My Claimed Tasks */}
                <ClaimedTasksList
                  claimedTasks={claimedTasks}
                  kid={kid}
                  onTaskUpdated={() => router.refresh()}
                />

                {/* Available Tasks */}
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">Available Tasks</h3>
                  <AvailableTasks
                    tasks={availableTasks}
                    kid={kid}
                    familyId={familyId}
                    onTaskClaimed={() => router.refresh()}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Learn Tab */}
          {selectedTab === 'learn' && (
            <motion.div
              key="learn"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span>📚</span>
                  <span>Learning Modules</span>
                </h3>
                <EducationalModules
                  modules={educationalModules}
                  progress={moduleProgress}
                  kid={kid}
                  familyId={familyId}
                />
              </Card>
            </motion.div>
          )}

          {/* Calculator Tab */}
          {selectedTab === 'calculator' && (
            <motion.div
              key="calculator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card>
                <h3 className="text-xl font-bold text-white mb-6">What Can You Afford?</h3>

                {canAfford.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-green-400 mb-3">✅ You Can Afford:</h4>
                    <div className="space-y-2">
                      {canAfford.map((reward, index) => (
                        <motion.div
                          key={reward.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex justify-between items-center p-4 rounded-lg bg-green-500/10 border border-green-500/20"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{reward.emoji}</span>
                            <span className="text-white font-medium">{reward.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-400">{reward.cost} pts</div>
                            <div className="text-xs text-white/60">{kid.balance - reward.cost} left after</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {almostAfford.length > 0 && (
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-yellow-400 mb-3">⏳ Almost There:</h4>
                    <div className="space-y-2">
                      {almostAfford.map((reward, index) => (
                        <motion.div
                          key={reward.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex justify-between items-center p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{reward.emoji}</span>
                            <span className="text-white font-medium">{reward.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-yellow-400">{reward.cost} pts</div>
                            <div className="text-xs text-white/60">Need {reward.cost - kid.balance} more</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-lg font-semibold text-white/60 mb-3">🎯 Future Goals:</h4>
                  <div className="space-y-2">
                    {rewards.filter(r => !canAfford.includes(r) && !almostAfford.includes(r)).map((reward, index) => (
                      <div
                        key={reward.name}
                        className="flex justify-between items-center p-4 rounded-lg bg-white/5 border border-white/10 opacity-60"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl grayscale">{reward.emoji}</span>
                          <span className="text-white/60 font-medium">{reward.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-white/40">{reward.cost} pts</div>
                          <div className="text-xs text-white/30">Need {reward.cost - kid.balance} more</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
