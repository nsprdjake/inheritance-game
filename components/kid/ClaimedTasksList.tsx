'use client'

import { useState } from 'react'
import { ClaimedTaskWithTemplate, Kid } from '@/lib/types/database'
import { getSkillEmoji, getSkillName, calculateAgeTier } from '@/lib/utils/skills'
import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface Props {
  claimedTasks: ClaimedTaskWithTemplate[]
  kid: Kid
  onTaskUpdated?: () => void
}

export default function ClaimedTasksList({ claimedTasks, kid, onTaskUpdated }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [expandedTask, setExpandedTask] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const ageTier = kid.age_tier || calculateAgeTier(kid.birthdate)

  const markCompleted = async (taskId: string) => {
    setLoading(taskId)
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      // Auto-approve for Tier 3+, otherwise pending approval
      const newStatus = ageTier >= 3 ? 'approved' : 'pending_approval'
      
      const { error } = await supabase
        .from('claimed_tasks')
        .update({
          status: newStatus,
          completed_at: new Date().toISOString(),
          notes: notes[taskId] || null,
        })
        .eq('id', taskId)
        .eq('status', 'claimed')

      if (error) throw error

      onTaskUpdated?.()
    } catch (err: any) {
      console.error('Failed to mark task as completed:', err)
      alert('Failed to update task. Please try again.')
    } finally {
      setLoading(null)
      setExpandedTask(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'claimed':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            In Progress
          </span>
        )
      case 'completed':
      case 'pending_approval':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            Waiting for approval
          </span>
        )
      case 'approved':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
            ✓ Approved
          </span>
        )
      case 'rejected':
        return (
          <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
            Rejected
          </span>
        )
      default:
        return null
    }
  }

  if (claimedTasks.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-white/60">No claimed tasks yet</p>
          <p className="text-sm text-white/40 mt-2">
            Claim a task below to get started!
          </p>
        </div>
      </Card>
    )
  }

  // Group tasks by status
  const activeTasks = claimedTasks.filter(t => t.status === 'claimed')
  const pendingTasks = claimedTasks.filter(t => t.status === 'pending_approval' || t.status === 'completed')
  const completedTasks = claimedTasks.filter(t => t.status === 'approved')
  const rejectedTasks = claimedTasks.filter(t => t.status === 'rejected')

  return (
    <div className="space-y-6">
      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">
            🎯 Active Tasks ({activeTasks.length})
          </h4>
          <div className="space-y-3">
            {activeTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-semibold text-white">
                            {task.task_template?.title || 'Task'}
                          </h5>
                          {getStatusBadge(task.status)}
                        </div>
                        {task.task_template?.description && (
                          <p className="text-sm text-white/60 mb-2">
                            {task.task_template.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          {task.task_template?.skill_type && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                              <span className="text-sm">{getSkillEmoji(task.task_template.skill_type)}</span>
                              <span className="text-xs text-white/80">{getSkillName(task.task_template.skill_type)}</span>
                            </div>
                          )}
                          <div className="text-sm font-bold gradient-text">
                            +{task.task_template?.points || 0} pts
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Mark Complete Section */}
                    {expandedTask === task.id ? (
                      <div className="space-y-2 pt-3 border-t border-white/10">
                        <label className="block">
                          <span className="text-sm text-white/80 mb-1 block">
                            Add notes (optional):
                          </span>
                          <textarea
                            value={notes[task.id] || ''}
                            onChange={(e) => setNotes({ ...notes, [task.id]: e.target.value })}
                            placeholder="Describe what you did..."
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:border-purple-500/50 focus:outline-none resize-none"
                            rows={3}
                          />
                        </label>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => markCompleted(task.id)}
                            disabled={loading === task.id}
                            className="flex-1"
                          >
                            {loading === task.id ? 'Submitting...' : 
                              ageTier >= 3 ? '✓ Mark Complete (Auto-approve)' : '✓ Submit for Approval'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedTask(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setExpandedTask(task.id)}
                        className="w-full"
                      >
                        ✓ Mark as Complete
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Approval */}
      {pendingTasks.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-yellow-400 mb-3">
            ⏳ Waiting for Approval ({pendingTasks.length})
          </h4>
          <div className="space-y-3">
            {pendingTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-yellow-500/20">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-white">
                          {task.task_template?.title || 'Task'}
                        </h5>
                        {getStatusBadge(task.status)}
                      </div>
                      {task.notes && (
                        <p className="text-sm text-white/60 italic mb-2">
                          "{task.notes}"
                        </p>
                      )}
                      <div className="text-sm text-white/50">
                        Submitted {new Date(task.completed_at || task.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-xl font-bold gradient-text">
                      +{task.task_template?.points || 0}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Completed */}
      {completedTasks.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-green-400 mb-3">
            ✅ Recently Completed ({completedTasks.length})
          </h4>
          <div className="space-y-2">
            {completedTasks.slice(0, 5).map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-white font-medium text-sm">
                      {task.task_template?.title || 'Task'}
                    </p>
                    <p className="text-xs text-white/50">
                      {new Date(task.approved_at || task.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-lg font-bold text-green-400">
                  +{task.task_template?.points || 0}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Rejected Tasks */}
      {rejectedTasks.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold text-red-400 mb-3">
            ❌ Rejected ({rejectedTasks.length})
          </h4>
          <div className="space-y-2">
            {rejectedTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 rounded-lg bg-red-500/5 border border-red-500/20"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-white font-medium text-sm">
                    {task.task_template?.title || 'Task'}
                  </p>
                  {getStatusBadge(task.status)}
                </div>
                {task.rejection_reason && (
                  <p className="text-xs text-red-400/80">
                    Reason: {task.rejection_reason}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
