// TypeScript types for Legacy Mode (Phase 2)

export type AccountType = 'family' | 'legacy' | 'both';

export type LegacyAccountStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type InvitationStatus = 'pending' | 'accepted' | 'declined';
export type LegacyQuestStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type MilestoneStatus = 'locked' | 'unlocked' | 'in_progress' | 'pending_verification' | 'completed' | 'rejected';
export type MilestoneType = 'custom' | 'education' | 'financial' | 'career' | 'life_event' | 'community' | 'skill' | 'course';
export type VerificationType = 'manual' | 'automatic' | 'document' | 'photo';
export type MediaType = 'video' | 'letter' | 'photo' | 'audio' | 'document';
export type UnlockCondition = 'immediate' | 'milestone_complete' | 'quest_complete' | 'manual';
export type EvidenceType = 'text' | 'photo' | 'document' | 'link';

export interface LegacyAccount {
  id: string;
  benefactor_id: string;
  estate_name?: string;
  estate_value_cents?: number;
  status: LegacyAccountStatus;
  welcome_message?: string;
  completion_message?: string;
  created_at: string;
  updated_at: string;
}

export interface Beneficiary {
  id: string;
  legacy_account_id: string;
  user_id?: string;
  email: string;
  name: string;
  relationship?: string;
  invitation_status: InvitationStatus;
  invitation_token?: string;
  invited_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LegacyQuest {
  id: string;
  legacy_account_id: string;
  beneficiary_id: string;
  title: string;
  description?: string;
  total_value_cents: number;
  status: LegacyQuestStatus;
  order_index: number;
  intro_message?: string;
  completion_message?: string;
  created_at: string;
  updated_at: string;
}

export interface LegacyMilestone {
  id: string;
  quest_id: string;
  title: string;
  description?: string;
  milestone_type: MilestoneType;
  unlock_value_cents: number;
  verification_type: VerificationType;
  verification_instructions?: string;
  order_index: number;
  status: MilestoneStatus;
  is_required: boolean;
  prerequisites: string[]; // Array of milestone IDs
  completion_criteria?: Record<string, any>;
  completed_at?: string;
  verified_at?: string;
  verified_by?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface LegacyMedia {
  id: string;
  legacy_account_id: string;
  milestone_id?: string;
  media_type: MediaType;
  storage_path: string;
  thumbnail_path?: string;
  title?: string;
  content?: string; // For letters
  unlock_condition: UnlockCondition;
  is_unlocked: boolean;
  unlocked_at?: string;
  duration_seconds?: number;
  file_size_bytes?: number;
  mime_type?: string;
  created_at: string;
  updated_at: string;
}

export interface LegacyTrustee {
  id: string;
  legacy_account_id: string;
  user_id?: string;
  email: string;
  name: string;
  role_description?: string;
  permissions: {
    can_verify: boolean;
    can_edit: boolean;
    can_view_all: boolean;
  };
  invitation_status: InvitationStatus;
  invitation_token?: string;
  invited_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface MilestoneEvidence {
  id: string;
  milestone_id: string;
  submitted_by: string;
  evidence_type: EvidenceType;
  content?: string;
  storage_path?: string;
  file_name?: string;
  mime_type?: string;
  submitted_at: string;
  created_at: string;
}

export interface LegacyAuditLog {
  id: string;
  legacy_account_id?: string;
  quest_id?: string;
  milestone_id?: string;
  user_id?: string;
  action: string;
  entity_type: string;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  notes?: string;
  created_at: string;
}

export interface AchievementTemplate {
  id: string;
  category: 'education' | 'financial' | 'career' | 'life' | 'community' | 'skill';
  title: string;
  description?: string;
  suggested_value_cents?: number;
  verification_type: VerificationType;
  verification_instructions?: string;
  icon?: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'epic';
  estimated_time_months?: number;
  is_active: boolean;
  created_at: string;
}

// Extended types with relations
export interface LegacyQuestWithDetails extends LegacyQuest {
  beneficiary: Beneficiary;
  milestones: LegacyMilestone[];
}

export interface LegacyMilestoneWithMedia extends LegacyMilestone {
  media: LegacyMedia[];
  evidence: MilestoneEvidence[];
}

export interface LegacyAccountWithDetails extends LegacyAccount {
  beneficiaries: Beneficiary[];
  quests: LegacyQuestWithDetails[];
  trustees: LegacyTrustee[];
}

// Form types for creating/updating
export interface CreateLegacyAccountInput {
  estate_name?: string;
  estate_value_cents?: number;
  welcome_message?: string;
}

export interface CreateQuestInput {
  beneficiary_id: string;
  title: string;
  description?: string;
  intro_message?: string;
}

export interface CreateMilestoneInput {
  quest_id: string;
  title: string;
  description?: string;
  milestone_type: MilestoneType;
  unlock_value_cents: number;
  verification_type: VerificationType;
  verification_instructions?: string;
  order_index: number;
  prerequisites?: string[];
}

export interface CreateMediaInput {
  legacy_account_id: string;
  milestone_id?: string;
  media_type: MediaType;
  title?: string;
  content?: string; // For letters
  unlock_condition: UnlockCondition;
  file?: File; // For uploads
}

export interface InviteBeneficiaryInput {
  email: string;
  name: string;
  relationship?: string;
}

export interface InviteTrusteeInput {
  email: string;
  name: string;
  role_description?: string;
}

// Helper functions
export const formatCents = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

export const getMilestoneIcon = (type: MilestoneType): string => {
  const icons: Record<MilestoneType, string> = {
    custom: '⭐',
    education: '🎓',
    financial: '💰',
    career: '💼',
    life_event: '🎉',
    community: '❤️',
    skill: '🎯',
    course: '📚',
  };
  return icons[type] || '⭐';
};

export const getMilestoneStatusColor = (status: MilestoneStatus): string => {
  const colors: Record<MilestoneStatus, string> = {
    locked: 'gray',
    unlocked: 'blue',
    in_progress: 'yellow',
    pending_verification: 'orange',
    completed: 'green',
    rejected: 'red',
  };
  return colors[status] || 'gray';
};

export const getDifficultyColor = (difficulty: string): string => {
  const colors: Record<string, string> = {
    easy: 'green',
    medium: 'yellow',
    hard: 'orange',
    epic: 'purple',
  };
  return colors[difficulty] || 'gray';
};
