'use client'

import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'

interface Stats {
  totalKids: number
  totalPoints: number
  totalAchievements: number
  activeStreaks: number
  longestStreak: number
  topKid: { name: string; points: number } | null
}

interface Props {
  stats: Stats
}

export default function FamilyStats({ stats }: Props) {
  return (
    <Card>
      <h3 className="text-xl font-bold text-white mb-4">📊 Family Stats</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10"
        >
          <div className="text-3xl mb-2">👥</div>
          <div className="text-2xl font-bold text-white">{stats.totalKids}</div>
          <div className="text-sm text-white/60">Kids</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-white/10"
        >
          <div className="text-3xl mb-2">⭐</div>
          <div className="text-2xl font-bold text-green-400">{stats.totalPoints.toLocaleString()}</div>
          <div className="text-sm text-white/60">Total Points</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-white/10"
        >
          <div className="text-3xl mb-2">🏆</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.totalAchievements}</div>
          <div className="text-sm text-white/60">Achievements</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center p-4 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-white/10"
        >
          <div className="text-3xl mb-2">🔥</div>
          <div className="text-2xl font-bold text-orange-400">{stats.activeStreaks}</div>
          <div className="text-sm text-white/60">Active Streaks</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center p-4 rounded-lg bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-white/10"
        >
          <div className="text-3xl mb-2">📈</div>
          <div className="text-2xl font-bold text-pink-400">{stats.longestStreak}</div>
          <div className="text-sm text-white/60">Longest Streak</div>
        </motion.div>

        {stats.topKid && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-white/10"
          >
            <div className="text-3xl mb-2">👑</div>
            <div className="text-lg font-bold text-purple-400 truncate">{stats.topKid.name}</div>
            <div className="text-sm text-white/60">{stats.topKid.points} pts</div>
          </motion.div>
        )}
      </div>

      {/* Recent milestone */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-6 p-4 rounded-lg bg-gradient-to-r from-purple-500/5 to-blue-500/5 border border-white/5"
      >
        <div className="flex items-center gap-3">
          <div className="text-2xl">🎯</div>
          <div className="flex-1">
            <div className="text-sm text-white/60">Family Goal Progress</div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((stats.totalPoints / 1000) * 100, 100)}%` }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                />
              </div>
              <div className="text-sm text-white/80 font-medium">
                {stats.totalPoints}/1000
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Card>
  )
}
