'use client'

import { useState } from 'react'
import { SavingsGoal, Kid } from '@/lib/types/database'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

interface Props {
  goals: SavingsGoal[]
  kid: Kid
  familyId: string
}

export default function SavingsGoalsWidget({ goals, kid, familyId }: Props) {
  const router = useRouter()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_points: '',
    icon: '🎯',
    color: 'purple',
  })

  const activeGoals = goals.filter(g => !g.is_completed)
  const completedGoals = goals.filter(g => g.is_completed)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { error } = await supabase
        .from('savings_goals')
        .insert({
          kid_id: kid.id,
          family_id: familyId,
          title: formData.title,
          description: formData.description || null,
          target_points: parseInt(formData.target_points),
          current_points: 0,
          icon: formData.icon,
          color: formData.color,
        })

      if (error) throw error

      setShowCreateModal(false)
      setFormData({
        title: '',
        description: '',
        target_points: '',
        icon: '🎯',
        color: 'purple',
      })
      router.refresh()
    } catch (err: any) {
      console.error('Failed to create goal:', err)
      alert('Failed to create goal. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  const contributeToGoal = async (goalId: string, amount: number) => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // Check if kid has enough balance
      const balance = (kid as any).balance || 0
      if (balance < amount) {
        alert('Not enough points!')
        return
      }

      // Update goal
      const goal = goals.find(g => g.id === goalId)
      if (!goal) return

      const newCurrent = goal.current_points + amount
      const isCompleting = newCurrent >= goal.target_points

      await supabase
        .from('savings_goals')
        .update({
          current_points: newCurrent,
          ...(isCompleting && {
            is_completed: true,
            completed_at: new Date().toISOString(),
          }),
        })
        .eq('id', goalId)

      // Deduct from kid's balance (create adjustment transaction)
      await supabase
        .from('transactions')
        .insert({
          family_id: familyId,
          kid_id: kid.id,
          amount: -amount,
          reason: `Saved toward: ${goal.title}`,
          transaction_type: 'adjustment',
        })

      router.refresh()
    } catch (err: any) {
      console.error('Failed to contribute:', err)
      alert('Failed to save points. Please try again.')
    }
  }

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
      blue: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
      green: 'from-green-500/20 to-green-600/20 border-green-500/30',
      yellow: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
      red: 'from-red-500/20 to-red-600/20 border-red-500/30',
      pink: 'from-pink-500/20 to-pink-600/20 border-pink-500/30',
    }
    return colors[color] || colors.purple
  }

  return (
    <>
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🎯</span>
            <span>Savings Goals</span>
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(true)}>
            + New Goal
          </Button>
        </div>

        {activeGoals.length === 0 && completedGoals.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🎯</div>
            <p className="text-white/60 mb-3">No savings goals yet</p>
            <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
              Create Your First Goal
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Active Goals */}
            {activeGoals.map((goal, index) => {
              const progress = (goal.current_points / goal.target_points) * 100
              const remaining = goal.target_points - goal.current_points

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-xl bg-gradient-to-br ${getColorClasses(goal.color || 'purple')} border`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    {goal.icon && <span className="text-3xl">{goal.icon}</span>}
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">{goal.title}</h4>
                      {goal.description && (
                        <p className="text-sm text-white/70 mb-2">{goal.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-white/80">
                          {goal.current_points} / {goal.target_points} points
                        </span>
                        <span className="text-white/60">•</span>
                        <span className="text-white/60">{remaining} to go</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-white/60 to-white/80"
                      />
                    </div>
                    <p className="text-xs text-white/60 mt-1 text-right">
                      {Math.round(progress)}% complete
                    </p>
                  </div>

                  {/* Quick save buttons */}
                  <div className="flex gap-2">
                    {[10, 25, 50].map((amount) => (
                      <Button
                        key={amount}
                        variant="ghost"
                        size="sm"
                        onClick={() => contributeToGoal(goal.id, amount)}
                        disabled={((kid as any).balance || 0) < amount}
                        className="flex-1 text-xs"
                      >
                        Save {amount}
                      </Button>
                    ))}
                  </div>
                </motion.div>
              )
            })}

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <div className="pt-3 border-t border-white/10">
                <p className="text-sm font-semibold text-green-400 mb-2">
                  ✅ Completed ({completedGoals.length})
                </p>
                {completedGoals.slice(0, 3).map((goal) => (
                  <div
                    key={goal.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20 mb-2"
                  >
                    {goal.icon && <span className="text-xl">{goal.icon}</span>}
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{goal.title}</p>
                      <p className="text-xs text-white/60">
                        {new Date(goal.completed_at || goal.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-2xl">🎉</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Create Goal Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card>
                <h2 className="text-2xl font-bold text-white mb-6">
                  Create Savings Goal
                </h2>

                <form onSubmit={handleCreate} className="space-y-4">
                  {/* Icon Picker */}
                  <div>
                    <label className="block text-sm text-white/80 mb-2">
                      Choose an Icon
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {['🎯', '🎮', '🎸', '🚲', '📱', '🎨', '⚽', '🎪', '🍕', '🎬'].map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon })}
                          className={`text-3xl p-2 rounded-lg transition-all ${
                            formData.icon === icon
                              ? 'bg-purple-500/30 border-2 border-purple-500'
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm text-white/80 mb-2">
                      Goal Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., New bike, Video game..."
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-purple-500/50 focus:outline-none"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm text-white/80 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="What are you saving for?"
                      rows={2}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-purple-500/50 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Target Points */}
                  <div>
                    <label className="block text-sm text-white/80 mb-2">
                      Target Points *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.target_points}
                      onChange={(e) => setFormData({ ...formData, target_points: e.target.value })}
                      placeholder="How many points?"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-purple-500/50 focus:outline-none"
                    />
                  </div>

                  {/* Color Picker */}
                  <div>
                    <label className="block text-sm text-white/80 mb-2">
                      Choose a Color
                    </label>
                    <div className="flex gap-2">
                      {['purple', 'blue', 'green', 'yellow', 'red', 'pink'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-10 h-10 rounded-lg transition-all ${
                            formData.color === color
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900'
                              : ''
                          } ${
                            color === 'purple' ? 'bg-purple-500' :
                            color === 'blue' ? 'bg-blue-500' :
                            color === 'green' ? 'bg-green-500' :
                            color === 'yellow' ? 'bg-yellow-500' :
                            color === 'red' ? 'bg-red-500' :
                            'bg-pink-500'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={creating}
                      className="flex-1"
                    >
                      {creating ? 'Creating...' : 'Create Goal'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
