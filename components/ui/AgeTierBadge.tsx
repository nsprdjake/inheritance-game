'use client'

import { AgeTier } from '@/lib/types/database'
import { AGE_TIER_INFO } from '@/lib/utils/skills'
import { motion } from 'framer-motion'

interface Props {
  tier: AgeTier
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function AgeTierBadge({ tier, showDetails = false, size = 'md' }: Props) {
  const info = AGE_TIER_INFO[tier]
  
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }
  
  const emojiSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 ${sizeClasses[size]}`}
    >
      <span className={emojiSizes[size]}>{info.emoji}</span>
      <div>
        <div className={`font-bold ${info.color}`}>
          Tier {tier}: {info.name}
        </div>
        {showDetails && (
          <div className="text-xs text-white/60">
            Ages {info.ageRange}
          </div>
        )}
      </div>
    </motion.div>
  )
}
