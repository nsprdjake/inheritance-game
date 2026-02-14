import { SkillType, SkillLevel, AgeTier, Kid } from '../types/database'

// Skill level thresholds
export const SKILL_LEVELS = {
  BRONZE: 0,
  SILVER: 100,
  GOLD: 200,
}

// Get skill level from points
export function getSkillLevel(points: number): SkillLevel {
  if (points >= SKILL_LEVELS.GOLD) return 'gold'
  if (points >= SKILL_LEVELS.SILVER) return 'silver'
  return 'bronze'
}

// Get progress to next level
export function getSkillProgress(points: number): {
  current: SkillLevel
  next: SkillLevel | null
  progress: number // 0-100
  pointsNeeded: number
} {
  const current = getSkillLevel(points)
  
  if (current === 'gold') {
    return {
      current: 'gold',
      next: null,
      progress: 100,
      pointsNeeded: 0,
    }
  }
  
  if (current === 'silver') {
    const pointsNeeded = SKILL_LEVELS.GOLD - points
    const progress = ((points - SKILL_LEVELS.SILVER) / (SKILL_LEVELS.GOLD - SKILL_LEVELS.SILVER)) * 100
    return {
      current: 'silver',
      next: 'gold',
      progress: Math.round(progress),
      pointsNeeded,
    }
  }
  
  // Bronze
  const pointsNeeded = SKILL_LEVELS.SILVER - points
  const progress = (points / SKILL_LEVELS.SILVER) * 100
  return {
    current: 'bronze',
    next: 'silver',
    progress: Math.round(progress),
    pointsNeeded,
  }
}

// Get skill emoji
export function getSkillEmoji(skill: SkillType): string {
  const emojis: Record<SkillType, string> = {
    earning: '💰',
    saving: '🐷',
    investing: '📈',
    budgeting: '📊',
  }
  return emojis[skill]
}

// Get skill name
export function getSkillName(skill: SkillType): string {
  const names: Record<SkillType, string> = {
    earning: 'Earning',
    saving: 'Saving',
    investing: 'Investing',
    budgeting: 'Budgeting',
  }
  return names[skill]
}

// Get skill level emoji
export function getSkillLevelEmoji(level: SkillLevel): string {
  const emojis: Record<SkillLevel, string> = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🏆',
  }
  return emojis[level]
}

// Get skill level color
export function getSkillLevelColor(level: SkillLevel): string {
  const colors: Record<SkillLevel, string> = {
    bronze: 'text-orange-400',
    silver: 'text-gray-300',
    gold: 'text-yellow-400',
  }
  return colors[level]
}

// Age tier utilities
export const AGE_TIER_INFO = {
  1: {
    name: 'Early Learner',
    emoji: '🌱',
    ageRange: '4-8',
    description: 'Parent-controlled, simple tasks',
    color: 'text-green-400',
  },
  2: {
    name: 'Young Earner',
    emoji: '⭐',
    ageRange: '9-12',
    description: 'Self-service tasks, spending requests',
    color: 'text-blue-400',
  },
  3: {
    name: 'Teen Financier',
    emoji: '🚀',
    ageRange: '13-16',
    description: 'Auto-approved tasks, simulated credit',
    color: 'text-purple-400',
  },
  4: {
    name: 'Young Adult',
    emoji: '💎',
    ageRange: '17+',
    description: 'Real-world tracking, bank linking',
    color: 'text-yellow-400',
  },
}

// Calculate age from birthdate
export function calculateAge(birthdate: string | Date): number {
  const birth = typeof birthdate === 'string' ? new Date(birthdate) : birthdate
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

// Calculate age tier from birthdate
export function calculateAgeTier(birthdate: string | Date | null | undefined): AgeTier {
  if (!birthdate) return 1
  
  const age = calculateAge(birthdate)
  
  if (age >= 17) return 4
  if (age >= 13) return 3
  if (age >= 9) return 2
  return 1
}

// Check if kid can access feature based on age tier
export function canAccessFeature(kid: Kid, minTier: AgeTier): boolean {
  const tier = kid.age_tier || calculateAgeTier(kid.birthdate)
  return tier >= minTier
}

// Get tier unlock message
export function getTierUnlockMessage(tier: AgeTier): string {
  const messages: Record<AgeTier, string> = {
    1: 'Welcome to Legacy Quest! Start earning and learning!',
    2: 'You can now claim tasks on your own and set savings goals!',
    3: 'Teen mode unlocked! Auto-approved tasks and investment simulations available!',
    4: 'Young Adult mode! Connect real accounts and start building your future!',
  }
  return messages[tier]
}

// Get all skills for a kid
export function getAllSkills(kid: Kid) {
  return {
    earning: {
      type: 'earning' as SkillType,
      points: kid.skill_earning || 0,
      level: getSkillLevel(kid.skill_earning || 0),
      emoji: '💰',
      name: 'Earning',
    },
    saving: {
      type: 'saving' as SkillType,
      points: kid.skill_saving || 0,
      level: getSkillLevel(kid.skill_saving || 0),
      emoji: '🐷',
      name: 'Saving',
    },
    investing: {
      type: 'investing' as SkillType,
      points: kid.skill_investing || 0,
      level: getSkillLevel(kid.skill_investing || 0),
      emoji: '📈',
      name: 'Investing',
    },
    budgeting: {
      type: 'budgeting' as SkillType,
      points: kid.skill_budgeting || 0,
      level: getSkillLevel(kid.skill_budgeting || 0),
      emoji: '📊',
      name: 'Budgeting',
    },
  }
}

// Calculate overall financial health score (0-100)
export function calculateFinancialHealthScore(kid: Kid): number {
  const skills = getAllSkills(kid)
  
  // Average skill level (bronze=33, silver=66, gold=100)
  const skillScores = Object.values(skills).map(skill => {
    if (skill.level === 'gold') return 100
    if (skill.level === 'silver') return 66
    return 33
  })
  
  const avgSkillScore = skillScores.reduce((sum, score) => sum + score, 0) / 4
  
  // Balance factor (up to 20 points for having points saved)
  const balance = (kid as any).balance || 0
  const balanceScore = Math.min((balance / 500) * 20, 20)
  
  // Streak factor (up to 15 points for active streak)
  const streak = (kid as any).streak?.current_streak || 0
  const streakScore = Math.min((streak / 30) * 15, 15)
  
  // Achievement factor (up to 10 points for achievements)
  const achievements = (kid as any).achievements?.length || 0
  const achievementScore = Math.min((achievements / 10) * 10, 10)
  
  // Total score (weighted: 55% skills, 20% balance, 15% streak, 10% achievements)
  const totalScore = (avgSkillScore * 0.55) + balanceScore + streakScore + achievementScore
  
  return Math.round(totalScore)
}
