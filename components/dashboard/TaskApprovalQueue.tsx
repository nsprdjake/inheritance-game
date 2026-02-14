'use client'

import { useState } from 'react'
import { ClaimedTaskWithTemplate } from '@/lib/types/database'
import { getSkillEmoji } from '@/lib/utils/skills'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface Props {
  pendingTasks: ClaimedTaskWithTemplate[]
  userId: string
  onApprove?: () => void
}

export default function TaskApprovalQueue({ pendingTasks, userId, onApprove }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  const handleApprove = async (taskId: string) => {
    setLoading(taskId)
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { error } = await supabase
        .from('claimed_tasks')
        .update({
          status: 'approved',
          approved_by: userId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', taskId)

      if (error) throw error

      onApprove?.()
    } catch (err: any) {
      console.error('Failed to approve task:', err)
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async (taskId: string, reason: string) => {
    setLoading(taskId)
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { error } = await supabase
        .from('claimed_tasks')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          approved_by: userId,
        })
        .eq('id', taskId)

      if (error) throw error

      onApprove?.() // Trigger refresh
    } catch (err: any) {
      console.error('Failed to reject task:', err)
    } finally {
      setLoading(null)
      setExpandedTask(null)
    }
  }

  if (pendingTasks.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-xl font-bold text-white">Pending Approval</h3>
        <span className="px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold">
          {pendingTasks.length}
        </span>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {pendingTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover>
                <div className="space-y-3">
                  {/* Task header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {task.task_template?.skill_type && (
                          <span className="text-lg">
                            {getSkillEmoji(task.task_template.skill_type)}
                          </span>
                        )}
                        <h4 className="font-semibold text-white">
                          {task.task_template?.title || 'Task'}
                        </h4>
                      </div>
                      {task.task_template?.description && (
                        <p className="text-sm text-white/60">
                          {task.task_template.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
                        <span>👤 {task.kid?.name}</span>
                        <span>•</span>
                        <span>⏰ {new Date(task.completed_at || task.claimed_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold gradient-text">
                        +{task.task_template?.points || 0}
                      </div>
                      <div className="text-xs text-white/60">points</div>
                    </div>
                  </div>

                  {/* Kid's notes */}
                  {task.notes && (
                    <div className="glass-card p-3 bg-blue-500/10 border border-blue-500/20">
                      <p className="text-xs text-white/60 mb-1">Kid's Notes:</p>
                      <p className="text-sm text-white">{task.notes}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(task.id)}
                      disabled={loading === task.id}
                      className="flex-1"
                    >
                      ✓ Approve
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                      disabled={loading === task.id}
                    >
                      ✗ Reject
                    </Button>
                  </div>

                  {/* Rejection reason input */}
                  <AnimatePresence>
                    {expandedTask === task.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 pt-2 border-t border-white/10">
                          <input
                            type="text"
                            placeholder="Reason for rejection (optional)..."
                            className="input-glass text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleReject(task.id, e.currentTarget.value)
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement
                              handleReject(task.id, input.value)
                            }}
                            disabled={loading === task.id}
                            className="w-full"
                          >
                            Confirm Rejection
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
