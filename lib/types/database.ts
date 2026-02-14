export interface Family {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  family_id: string
  role: 'admin' | 'parent' | 'kid'
  kid_id?: string
  email?: string
  created_at: string
  updated_at: string
}

export interface Kid {
  id: string
  family_id: string
  name: string
  age?: number
  avatar?: string
  user_id?: string
  level?: 'bronze' | 'silver' | 'gold'
  total_earned?: number
  // Phase 1 additions
  birthdate?: string
  age_tier?: 1 | 2 | 3 | 4
  skill_earning?: number
  skill_saving?: number
  skill_investing?: number
  skill_budgeting?: number
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  family_id: string
  kid_id: string
  amount: number
  reason?: string
  transaction_type: 'award' | 'redeem' | 'adjustment'
  created_by?: string
  created_at: string
}

export interface FamilySettings {
  id: string
  family_id: string
  theme: string
  theme_colors: {
    primary: string
    secondary: string
  }
  point_values: {
    small: number
    medium: number
    large: number
  }
  conversion_rate: number
  created_at: string
  updated_at: string
}

export interface Achievement {
  id: string
  kid_id: string
  family_id: string
  achievement_type: string
  title: string
  description?: string
  icon?: string
  unlocked_at: string
  created_at: string
}

export interface Streak {
  id: string
  kid_id: string
  family_id: string
  current_streak: number
  longest_streak: number
  last_activity_date: string
  created_at: string
  updated_at: string
}

export interface KidWithBalance extends Kid {
  balance: number
}

export interface TransactionWithKid extends Transaction {
  kid?: Kid
}

export interface KidWithGameData extends KidWithBalance {
  achievements?: Achievement[]
  streak?: Streak
}

// ===========================
// Phase 1: Legacy Quest Types
// ===========================

export type SkillType = 'earning' | 'saving' | 'investing' | 'budgeting'
export type SkillLevel = 'bronze' | 'silver' | 'gold'
export type AgeTier = 1 | 2 | 3 | 4

export interface TaskTemplate {
  id: string
  family_id: string
  title: string
  description?: string
  points: number
  skill_type?: SkillType
  min_age_tier: AgeTier
  max_age_tier: AgeTier
  is_recurring: boolean
  recurrence_pattern?: 'daily' | 'weekly' | 'monthly'
  max_claims_per_period?: number
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export type ClaimedTaskStatus = 
  | 'claimed' 
  | 'completed' 
  | 'pending_approval' 
  | 'approved' 
  | 'rejected' 
  | 'cancelled'

export interface ClaimedTask {
  id: string
  task_template_id?: string
  kid_id: string
  family_id: string
  status: ClaimedTaskStatus
  points_awarded?: number
  claimed_at: string
  completed_at?: string
  approved_at?: string
  approved_by?: string
  rejection_reason?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface ClaimedTaskWithTemplate extends ClaimedTask {
  task_template?: TaskTemplate
  kid?: Kid
}

export interface EducationalModule {
  id: string
  title: string
  description?: string
  content?: any // JSONB
  skill_type?: SkillType | 'general'
  min_age_tier: AgeTier
  max_age_tier: AgeTier
  estimated_minutes?: number
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  icon?: string
  thumbnail_url?: string
  points_reward: number
  is_active: boolean
  order_index: number
  created_at: string
  updated_at: string
}

export interface ModuleProgress {
  id: string
  module_id: string
  kid_id: string
  family_id: string
  progress_percent: number
  current_lesson: number
  quiz_score?: number
  completed_at?: string
  started_at: string
  last_accessed_at: string
  created_at: string
  updated_at: string
}

export interface ModuleProgressWithModule extends ModuleProgress {
  module?: EducationalModule
}

export interface SavingsGoal {
  id: string
  kid_id: string
  family_id: string
  title: string
  description?: string
  target_points: number
  current_points: number
  icon?: string
  color?: string
  deadline?: string
  is_completed: boolean
  completed_at?: string
  created_at: string
  updated_at: string
}

// Helper types
export interface SkillProgress {
  earning: number
  saving: number
  investing: number
  budgeting: number
}

export interface SkillLevels {
  earning: SkillLevel
  saving: SkillLevel
  investing: SkillLevel
  budgeting: SkillLevel
}

export interface KidWithFullData extends KidWithGameData {
  skill_progress?: SkillProgress
  skill_levels?: SkillLevels
  claimed_tasks?: ClaimedTask[]
  module_progress?: ModuleProgress[]
  savings_goals?: SavingsGoal[]
}
