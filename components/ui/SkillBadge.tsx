import { SkillType, SkillLevel } from '@/lib/types/database'
import { getSkillEmoji, getSkillName, getSkillProgress, getSkillLevelEmoji, getSkillLevelColor } from '@/lib/utils/skills'
import { motion } from 'framer-motion'

interface Props {
  skill: SkillType
  points: number
  showProgress?: boolean
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}

export default function SkillBadge({ skill, points, showProgress = false, size = 'md', onClick }: Props) {
  const progress = getSkillProgress(points)
  const emoji = getSkillEmoji(skill)
  const name = getSkillName(skill)
  const levelEmoji = getSkillLevelEmoji(progress.current)
  const levelColor = getSkillLevelColor(progress.current)

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const iconSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.05 } : {}}
      onClick={onClick}
      className={`glass-card p-3 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className={iconSizes[size]}>{emoji}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`font-semibold text-white ${sizeClasses[size]}`}>
              {name}
            </span>
            <span className={`${iconSizes[size]}`}>{levelEmoji}</span>
          </div>
          <div className={`${levelColor} ${sizeClasses[size]} capitalize`}>
            {progress.current}
          </div>
        </div>
        <div className="text-right">
          <div className="text-white font-bold">{points}</div>
          <div className={`text-white/60 ${sizeClasses[size]}`}>pts</div>
        </div>
      </div>

      {showProgress && progress.next && (
        <div>
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>Progress to {progress.next}</span>
            <span>{progress.pointsNeeded} pts needed</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.progress}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`h-full bg-gradient-to-r ${
                progress.current === 'bronze' ? 'from-orange-400 to-orange-600' :
                progress.current === 'silver' ? 'from-gray-300 to-gray-500' :
                'from-yellow-400 to-yellow-600'
              }`}
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}
