'use client'

import { useState } from 'react'
import { EducationalModule, ModuleProgressWithModule, Kid } from '@/lib/types/database'
import { getSkillEmoji } from '@/lib/utils/skills'
import { motion, AnimatePresence } from 'framer-motion'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface Props {
  modules: EducationalModule[]
  progress: ModuleProgressWithModule[]
  kid: Kid
  familyId: string
}

export default function EducationalModules({ modules, progress, kid, familyId }: Props) {
  const [selectedModule, setSelectedModule] = useState<string | null>(null)

  // Filter modules by age tier
  const ageTier = kid.age_tier || 1
  const availableModules = modules.filter(module => 
    module.is_active && 
    module.min_age_tier <= ageTier &&
    module.max_age_tier >= ageTier
  )

  // Group modules by skill type
  const modulesBySkill = availableModules.reduce((acc, module) => {
    const skillType = module.skill_type || 'general'
    if (!acc[skillType]) acc[skillType] = []
    acc[skillType].push(module)
    return acc
  }, {} as Record<string, EducationalModule[]>)

  const getModuleProgress = (moduleId: string) => {
    return progress.find(p => p.module_id === moduleId)
  }

  const startModule = async (moduleId: string) => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      // Create or update progress
      const existing = getModuleProgress(moduleId)
      
      if (existing) {
        // Update last_accessed_at
        await supabase
          .from('module_progress')
          .update({ last_accessed_at: new Date().toISOString() })
          .eq('id', existing.id)
      } else {
        // Create new progress record
        await supabase
          .from('module_progress')
          .insert({
            module_id: moduleId,
            kid_id: kid.id,
            family_id: familyId,
            progress_percent: 0,
          })
      }
      
      // TODO: Actually launch the module content
      alert('Module launching! (Full implementation coming soon)')
    } catch (err: any) {
      console.error('Failed to start module:', err)
    }
  }

  if (availableModules.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <div className="text-5xl mb-4">📚</div>
          <p className="text-white/60">No learning modules available yet</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {Object.entries(modulesBySkill).map(([skillType, skillModules]) => (
        <div key={skillType}>
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            {skillType !== 'general' && (
              <span className="text-xl">{getSkillEmoji(skillType as any)}</span>
            )}
            <span className="capitalize">{skillType} Modules</span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {skillModules.map((module, index) => {
              const moduleProgress = getModuleProgress(module.id)
              const isCompleted = moduleProgress?.progress_percent === 100
              const isInProgress = moduleProgress && moduleProgress.progress_percent > 0 && !isCompleted

              return (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card hover className={isCompleted ? 'border-green-500/30' : ''}>
                    <div className="space-y-3">
                      {/* Module header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {module.icon && (
                              <span className="text-2xl">{module.icon}</span>
                            )}
                            <h5 className="font-semibold text-white">
                              {module.title}
                            </h5>
                          </div>
                          {module.description && (
                            <p className="text-xs text-white/60 mb-2">
                              {module.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              module.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                              module.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                              'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {module.difficulty}
                            </span>
                            {module.estimated_minutes && (
                              <span className="text-xs text-white/60">
                                ⏱️ {module.estimated_minutes} min
                              </span>
                            )}
                            {module.points_reward > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                +{module.points_reward} pts
                              </span>
                            )}
                          </div>
                        </div>
                        {isCompleted && (
                          <div className="ml-2 text-2xl">✅</div>
                        )}
                      </div>

                      {/* Progress bar */}
                      {moduleProgress && !isCompleted && (
                        <div>
                          <div className="flex justify-between text-xs text-white/60 mb-1">
                            <span>Progress</span>
                            <span>{moduleProgress.progress_percent}%</span>
                          </div>
                          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                              style={{ width: `${moduleProgress.progress_percent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Action button */}
                      <Button
                        variant={isCompleted ? 'ghost' : isInProgress ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => startModule(module.id)}
                        className="w-full"
                      >
                        {isCompleted ? '✓ Completed' : isInProgress ? 'Continue →' : 'Start Learning'}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
