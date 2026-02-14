'use client'

import { useRouter } from 'next/navigation'
import { Kid, Transaction } from '@/lib/types/database'
import { getAllSkills, getSkillProgress, getSkillEmoji, getSkillName, calculateFinancialHealthScore } from '@/lib/utils/skills'
import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import SkillBadge from '@/components/ui/SkillBadge'

interface Props {
  kid: Kid
  recentTransactions: Transaction[]
}

export default function SkillsPageClient({ kid, recentTransactions }: Props) {
  const router = useRouter()
  const skills = getAllSkills(kid)
  const healthScore = calculateFinancialHealthScore(kid)
  
  // Extract skill-related transactions (those with skill points)
  const skillGains = recentTransactions
    .filter(t => t.amount > 0)
    .slice(0, 10)

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">
              Your Skills 🌟
            </h1>
            <p className="text-white/60">Track your financial learning progress</p>
          </div>
          <Button variant="ghost" onClick={() => router.push('/kid')}>
            ← Back to Dashboard
          </Button>
        </motion.div>

        {/* Financial Health Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="text-center py-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10" />
            
            <div className="relative z-10">
              <p className="text-white/60 text-lg mb-3">Financial Health Score</p>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              >
                <p className="text-7xl font-bold gradient-text mb-2">
                  {healthScore}
                </p>
                <p className="text-2xl text-white/80">
                  out of 100
                </p>
              </motion.div>
              
              <div className="mt-6 max-w-md mx-auto">
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${healthScore}%` }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className={`h-full bg-gradient-to-r ${
                      healthScore >= 75 ? 'from-green-400 to-green-600' :
                      healthScore >= 50 ? 'from-yellow-400 to-yellow-600' :
                      healthScore >= 25 ? 'from-orange-400 to-orange-600' :
                      'from-red-400 to-red-600'
                    }`}
                  />
                </div>
              </div>
              
              <p className="text-sm text-white/60 mt-4">
                {healthScore >= 75 ? '🌟 Excellent! You\'re a financial superstar!' :
                 healthScore >= 50 ? '💪 Good progress! Keep building those skills!' :
                 healthScore >= 25 ? '📈 Getting started! Keep learning and earning!' :
                 '🌱 Just beginning! Every journey starts somewhere!'}
              </p>
            </div>
          </Card>
        </motion.div>

        {/* All Skills Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4">
            Your Skill Levels
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(skills).map((skill, index) => {
              const progress = getSkillProgress(skill.points)
              
              return (
                <motion.div
                  key={skill.type}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Card className="relative overflow-hidden">
                    {/* Background gradient based on level */}
                    <div className={`absolute inset-0 opacity-10 ${
                      progress.current === 'gold' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                      progress.current === 'silver' ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                      'bg-gradient-to-br from-orange-400 to-orange-600'
                    }`} />
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-4xl">{skill.emoji}</span>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white">{skill.name}</h3>
                          <p className="text-sm text-white/60 capitalize">
                            {progress.current} Level
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold gradient-text">{skill.points}</div>
                          <div className="text-xs text-white/60">points</div>
                        </div>
                      </div>
                      
                      {progress.next && (
                        <div>
                          <div className="flex justify-between text-xs text-white/60 mb-2">
                            <span>Progress to {progress.next}</span>
                            <span>{progress.pointsNeeded} pts needed</span>
                          </div>
                          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress.progress}%` }}
                              transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                              className={`h-full bg-gradient-to-r ${
                                progress.current === 'bronze' ? 'from-orange-400 to-orange-600' :
                                progress.current === 'silver' ? 'from-gray-300 to-gray-500' :
                                'from-yellow-400 to-yellow-600'
                              }`}
                            />
                          </div>
                        </div>
                      )}
                      
                      {!progress.next && (
                        <div className="text-center py-2">
                          <p className="text-yellow-400 font-semibold">
                            🏆 Max Level Achieved!
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Recent Skill Gains */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <h2 className="text-2xl font-bold text-white mb-4">
              Recent Activity
            </h2>
            <div className="space-y-3">
              {skillGains.map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className="flex justify-between items-center py-3 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-2xl">
                      ✨
                    </div>
                    <div>
                      <p className="text-white font-medium">{tx.reason}</p>
                      <p className="text-xs text-white/40">
                        {new Date(tx.created_at).toLocaleDateString()} at{' '}
                        {new Date(tx.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    +{tx.amount}
                  </div>
                </motion.div>
              ))}
              
              {skillGains.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <p className="text-white/40">No activity yet</p>
                  <p className="text-sm text-white/30 mt-2">
                    Complete tasks and modules to start earning skill points!
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Tips Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6"
        >
          <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span>💡</span>
              <span>Pro Tips</span>
            </h3>
            <ul className="space-y-2 text-sm text-white/80">
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Complete different types of tasks to level up all your skills</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Educational modules give bonus points to specific skills</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>Higher skill levels unlock more advanced features and opportunities</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400">•</span>
                <span>A balanced skill tree makes you a well-rounded financial expert!</span>
              </li>
            </ul>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
