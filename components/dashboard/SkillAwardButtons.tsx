'use client'

import { useState } from 'react'
import { SkillType } from '@/lib/types/database'
import { getSkillEmoji, getSkillName } from '@/lib/utils/skills'
import { motion } from 'framer-motion'

interface Props {
  kidId: string
  familyId: string
  userId: string
  onSuccess?: () => void
  disabled?: boolean
}

const SKILL_COLORS = {
  earning: {
    bg: 'from-green-500/20 to-emerald-600/20',
    hover: 'hover:from-green-500/30 hover:to-emerald-600/30',
    border: 'border-green-500/30',
  },
  saving: {
    bg: 'from-blue-500/20 to-cyan-600/20',
    hover: 'hover:from-blue-500/30 hover:to-cyan-600/30',
    border: 'border-blue-500/30',
  },
  investing: {
    bg: 'from-purple-500/20 to-pink-600/20',
    hover: 'hover:from-purple-500/30 hover:to-pink-600/30',
    border: 'border-purple-500/30',
  },
  budgeting: {
    bg: 'from-orange-500/20 to-red-600/20',
    hover: 'hover:from-orange-500/30 hover:to-red-600/30',
    border: 'border-orange-500/30',
  },
}

const SKILL_POINTS = {
  small: 10,
  medium: 25,
  large: 50,
}

export default function SkillAwardButtons({ kidId, familyId, userId, onSuccess, disabled }: Props) {
  const [loading, setLoading] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<SkillType | null>(null)

  const awardSkillPoints = async (skill: SkillType, points: number) => {
    setLoading(true)
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      // Create transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          family_id: familyId,
          kid_id: kidId,
          amount: points,
          reason: `${getSkillName(skill)} task completed`,
          transaction_type: 'award',
          created_by: userId,
        })

      if (transactionError) throw transactionError

      // Award skill points using the database function
      const { error: skillError } = await supabase.rpc('award_skill_points', {
        kid_uuid: kidId,
        skill: skill,
        points_to_add: points,
      })

      if (skillError) throw skillError

      onSuccess?.()
    } catch (err: any) {
      console.error('Failed to award skill points:', err)
    } finally {
      setLoading(false)
      setSelectedSkill(null)
    }
  }

  const skills: SkillType[] = ['earning', 'saving', 'investing', 'budgeting']

  if (selectedSkill) {
    // Show point amount selection
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <span className="text-2xl">{getSkillEmoji(selectedSkill)}</span>
            <span className="font-semibold">{getSkillName(selectedSkill)}</span>
          </div>
          <button
            onClick={() => setSelectedSkill(null)}
            className="text-white/60 hover:text-white text-sm"
          >
            ← Back
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(SKILL_POINTS).map(([size, points]) => (
            <button
              key={size}
              onClick={() => awardSkillPoints(selectedSkill, points)}
              disabled={loading || disabled}
              className={`py-2 rounded-lg bg-gradient-to-r ${SKILL_COLORS[selectedSkill].bg} ${SKILL_COLORS[selectedSkill].hover} border ${SKILL_COLORS[selectedSkill].border} transition-all duration-200 hover:scale-105 disabled:opacity-50`}
            >
              <div className="text-xs text-white/80 capitalize">{size}</div>
              <div className="text-lg font-bold text-white">+{points}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Show skill selection
  return (
    <div className="grid grid-cols-2 gap-2">
      {skills.map((skill) => (
        <motion.button
          key={skill}
          onClick={() => setSelectedSkill(skill)}
          disabled={loading || disabled}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`p-3 rounded-lg bg-gradient-to-r ${SKILL_COLORS[skill].bg} ${SKILL_COLORS[skill].hover} border ${SKILL_COLORS[skill].border} transition-all duration-200 disabled:opacity-50`}
        >
          <div className="text-2xl mb-1">{getSkillEmoji(skill)}</div>
          <div className="text-xs text-white/80">{getSkillName(skill)}</div>
        </motion.button>
      ))}
    </div>
  )
}
