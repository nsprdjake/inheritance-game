import { AgeTier } from '@/lib/types/database'
import { AGE_TIER_INFO } from '@/lib/utils/skills'

interface Props {
  tier: AgeTier
  showDescription?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function AgeTierBadge({ tier, showDescription = false, size = 'md' }: Props) {
  const info = AGE_TIER_INFO[tier]

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }

  return (
    <div className="inline-flex items-center gap-2">
      <div className={`glass-card ${sizeClasses[size]} inline-flex items-center gap-2`}>
        <span className="text-lg">{info.emoji}</span>
        <div>
          <div className={`${info.color} font-semibold`}>
            Tier {tier}
          </div>
          {showDescription && (
            <div className="text-white/60 text-xs">
              {info.name} ({info.ageRange})
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
