'use client'

import { Kid } from '@/lib/types/database'
import { getAllSkills } from '@/lib/utils/skills'
import { motion } from 'framer-motion'
import SkillMeter from '@/components/ui/SkillMeter'
import Card from '@/components/ui/Card'

interface Props {
  kid: Kid
  showTitle?: boolean
}

export default function SkillsOverview({ kid, showTitle = true }: Props) {
  const skills = getAllSkills(kid)
  
  const totalSkillPoints = Object.values(skills).reduce((sum, s) => sum + s.points, 0)
  
  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🌟</span>
            <span>Your Skills</span>
          </h3>
          <div className="text-right">
            <div className="text-sm text-white/60">Total Skill Points</div>
            <div className="text-2xl font-bold gradient-text">{totalSkillPoints}</div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(skills).map((skill, index) => (
          <motion.div
            key={skill.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <SkillMeter
              skill={skill.type}
              points={skill.points}
              showLevel={true}
            />
          </motion.div>
        ))}
      </div>
      
      {/* Motivational tip */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
        <div className="flex items-center gap-3">
          <span className="text-3xl">💡</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white mb-1">
              Pro Tip
            </p>
            <p className="text-xs text-white/70">
              Complete different types of tasks to become a well-rounded financial expert!
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
