'use client'

import { useState } from 'react'
import { TaskTemplate, Kid } from '@/lib/types/database'
import { getSkillEmoji, canAccessFeature, getSkillName, calculateAgeTier } from '@/lib/utils/skills'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface Props {
  tasks: TaskTemplate[]
  kid: Kid
  familyId: string
  onTaskClaimed?: () => void
}

export default function AvailableTasks({ tasks, kid, familyId, onTaskClaimed }: Props) {
  const [loading, setLoading] = useState<string | null>(null)

  // Filter tasks by age tier
  const ageTier = kid.age_tier || calculateAgeTier(kid.birthdate)
  const availableTasks = tasks.filter(task => 
    task.is_active && 
    task.min_age_tier <= ageTier &&
    task.max_age_tier >= ageTier
  )

  const claimTask = async (taskId: string) => {
    setLoading(taskId)
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { error } = await supabase
        .from('claimed_tasks')
        .insert({
          task_template_id: taskId,
          kid_id: kid.id,
          family_id: familyId,
          status: 'claimed',
        })

      if (error) throw error

      onTaskClaimed?.()
    } catch (err: any) {
      console.error('Failed to claim task:', err)
      alert('Failed to claim task. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  if (!canAccessFeature(kid, 2)) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-white/60">
            Task claiming unlocks at Tier 2 (age 9+)
          </p>
        </div>
      </Card>
    )
  }

  if (availableTasks.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-white/60">No tasks available right now</p>
          <p className="text-sm text-white/40 mt-2">
            Ask your parents to add some tasks!
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {availableTasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card hover>
              <div className="space-y-3">
                {/* Task header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-white">
                        {task.title}
                      </h4>
                      {task.is_recurring && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          {task.recurrence_pattern}
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-sm text-white/60 mb-2">
                        {task.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.skill_type && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                          <span className="text-base">{getSkillEmoji(task.skill_type)}</span>
                          <span className="text-xs text-white/80">{getSkillName(task.skill_type)}</span>
                        </div>
                      )}
                      <div className="text-sm font-bold gradient-text">
                        +{task.points} pts
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => claimTask(task.id)}
                  disabled={loading === task.id}
                  className="w-full"
                >
                  {loading === task.id ? 'Claiming...' : '✓ Claim Task'}
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
