'use client'

import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'
import { KidWithBalance } from '@/lib/types/database'

interface Props {
  kid: KidWithBalance
  balance: number
  level?: string
  totalEarned?: number
}

export default function EnhancedKidDashboard({ kid, balance, level = 'bronze', totalEarned = 0 }: Props) {
  const getLevelInfo = () => {
    switch (level) {
      case 'gold':
        return { 
          name: 'Gold', 
          emoji: '🏆', 
          color: 'from-yellow-500 to-orange-500',
          next: null,
          nextPoints: null
        }
      case 'silver':
        return { 
          name: 'Silver', 
          emoji: '🥈', 
          color: 'from-gray-300 to-gray-500',
          next: 'Gold',
          nextPoints: 500
        }
      default:
        return { 
          name: 'Bronze', 
          emoji: '🥉', 
          color: 'from-amber-700 to-amber-900',
          next: 'Silver',
          nextPoints: 200
        }
    }
  }

  const levelInfo = getLevelInfo()
  const progressToNext = levelInfo.nextPoints ? ((totalEarned / levelInfo.nextPoints) * 100) : 100

  return (
    <div className="space-y-6">
      {/* Big Balance Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="text-center py-12 relative overflow-hidden">
          {/* Animated background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 animate-pulse" />
          
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-white/60 text-lg mb-4">Your Balance</p>
            </motion.div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.3 }}
              className="mb-6"
            >
              <p className="text-8xl font-bold gradient-text mb-2">
                {balance}
              </p>
              <p className="text-3xl text-white/80">
                points
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center gap-4 flex-wrap"
            >
              {/* Level Badge */}
              <div className={`inline-block px-8 py-4 rounded-xl bg-gradient-to-br ${levelInfo.color} border border-white/20`}>
                <p className="text-white/80 text-sm">Level</p>
                <p className="text-4xl font-bold text-white">
                  {levelInfo.emoji} {levelInfo.name}
                </p>
              </div>

              {/* Total Earned */}
              {totalEarned > 0 && (
                <div className="inline-block px-8 py-4 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-white/60 text-sm">Total Earned</p>
                  <p className="text-3xl font-bold text-white">
                    {totalEarned}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Progress to Next Level */}
            {levelInfo.next && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-8 max-w-md mx-auto"
              >
                <div className="flex justify-between text-sm text-white/60 mb-2">
                  <span>{totalEarned} earned</span>
                  <span>Next: {levelInfo.next} ({levelInfo.nextPoints})</span>
                </div>
                <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progressToNext, 100)}%` }}
                    transition={{ duration: 1.5, delay: 0.8 }}
                    className={`h-full bg-gradient-to-r ${levelInfo.color}`}
                  />
                </div>
                <p className="text-xs text-white/50 mt-2 text-center">
                  {levelInfo.nextPoints && levelInfo.nextPoints - totalEarned > 0
                    ? `${levelInfo.nextPoints - totalEarned} points until ${levelInfo.next}!`
                    : 'You made it! 🎉'
                  }
                </p>
              </motion.div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
