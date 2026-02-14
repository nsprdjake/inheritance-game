'use client'

import { Kid } from '@/lib/types/database'
import { getAllSkills, getSkillProgress } from '@/lib/utils/skills'
import { motion } from 'framer-motion'
import SkillBadge from '@/components/ui/SkillBadge'
import Card from '@/components/ui/Card'

interface Props {
  kid: Kid
}

export default function SkillTreeView({ kid }: Props) {
  const skills = getAllSkills(kid)

  return (
    <Card>
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <span>🌳</span>
        <span>Your Skill Tree</span>
      </h3>

      <div className="space-y-4">
        {Object.values(skills).map((skill, index) => {
          const progress = getSkillProgress(skill.points)
          
          return (
            <motion.div
              key={skill.type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <SkillBadge
                skill={skill.type}
                points={skill.points}
                showProgress={true}
                size="md"
              />
            </motion.div>
          )
        })}
      </div>

      {/* Overall progress message */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="text-center">
          <p className="text-sm text-white/60 mb-2">
            Total Skill Points
          </p>
          <p className="text-3xl font-bold gradient-text">
            {Object.values(skills).reduce((sum, s) => sum + s.points, 0)}
          </p>
        </div>
      </div>

      {/* Motivation message */}
      <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
        <p className="text-sm text-white/80 text-center">
          💡 Complete tasks to level up your skills!
        </p>
      </div>
    </Card>
  )
}
