-- =======================
-- PHASE 2: LEGACY MODE - GENERATIONAL WEALTH TRANSFER
-- =======================
-- Transform LYNE from family allowance to legacy platform
-- This migration creates the foundation for benefactor → beneficiary wealth transfer

-- =======================
-- 1. EXTEND USERS TABLE FOR ACCOUNT TYPES
-- =======================

-- Add account_type to users (family, legacy, or both)
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'family' 
  CHECK (account_type IN ('family', 'legacy', 'both'));

-- Add legacy-specific fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_benefactor BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_beneficiary BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_trustee BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_benefactor ON users(is_benefactor) WHERE is_benefactor = true;

-- =======================
-- 2. LEGACY ACCOUNTS TABLE
-- =======================

CREATE TABLE IF NOT EXISTS legacy_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  benefactor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  estate_name TEXT, -- Optional name for the estate/legacy
  estate_value_cents BIGINT, -- Total estate value in cents (optional for now)
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  welcome_message TEXT, -- Intro message to beneficiaries
  completion_message TEXT, -- Message shown when all quests completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legacy_accounts_benefactor ON legacy_accounts(benefactor_id);
CREATE INDEX IF NOT EXISTS idx_legacy_accounts_status ON legacy_accounts(status);

-- =======================
-- 3. BENEFICIARIES TABLE
-- =======================

CREATE TABLE IF NOT EXISTS beneficiaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_account_id UUID NOT NULL REFERENCES legacy_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL until they accept invite
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  relationship TEXT, -- e.g., "grandson", "daughter", "niece"
  invitation_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (invitation_status IN ('pending', 'accepted', 'declined')),
  invitation_token TEXT UNIQUE, -- For email invite flow
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_beneficiaries_legacy_account ON beneficiaries(legacy_account_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_user ON beneficiaries(user_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_email ON beneficiaries(email);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_invitation_token ON beneficiaries(invitation_token);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_status ON beneficiaries(invitation_status);

-- =======================
-- 4. LEGACY QUESTS TABLE
-- =======================

CREATE TABLE IF NOT EXISTS legacy_quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_account_id UUID NOT NULL REFERENCES legacy_accounts(id) ON DELETE CASCADE,
  beneficiary_id UUID NOT NULL REFERENCES beneficiaries(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  total_value_cents BIGINT NOT NULL DEFAULT 0, -- Total $ unlockable in this quest
  status TEXT NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  order_index INTEGER DEFAULT 0, -- For sorting multiple quests
  intro_message TEXT, -- Intro message for this specific quest
  completion_message TEXT, -- Message when quest is completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legacy_quests_account ON legacy_quests(legacy_account_id);
CREATE INDEX IF NOT EXISTS idx_legacy_quests_beneficiary ON legacy_quests(beneficiary_id);
CREATE INDEX IF NOT EXISTS idx_legacy_quests_status ON legacy_quests(status);

-- =======================
-- 5. LEGACY MILESTONES TABLE (Achievements in a quest)
-- =======================

CREATE TABLE IF NOT EXISTS legacy_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quest_id UUID NOT NULL REFERENCES legacy_quests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  milestone_type TEXT NOT NULL DEFAULT 'custom'
    CHECK (milestone_type IN (
      'custom',           -- Custom achievement
      'education',        -- Complete education
      'financial',        -- Financial goal (credit score, savings, etc.)
      'career',           -- Career milestone
      'life_event',       -- Life event (marriage, home purchase, etc.)
      'community',        -- Community service
      'skill',            -- Learn a skill
      'course'            -- Complete a course
    )),
  unlock_value_cents BIGINT NOT NULL DEFAULT 0, -- $ amount unlocked on completion
  verification_type TEXT NOT NULL DEFAULT 'manual'
    CHECK (verification_type IN ('manual', 'automatic', 'document', 'photo')),
  verification_instructions TEXT, -- Instructions for trustee verification
  order_index INTEGER DEFAULT 0, -- Order in the quest chain
  status TEXT NOT NULL DEFAULT 'locked' 
    CHECK (status IN ('locked', 'unlocked', 'in_progress', 'pending_verification', 'completed', 'rejected')),
  is_required BOOLEAN DEFAULT true, -- Must be completed to unlock next milestone
  prerequisites JSONB DEFAULT '[]', -- Array of milestone IDs that must be completed first
  completion_criteria JSONB, -- Structured criteria (for future automation)
  completed_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES users(id) ON DELETE SET NULL, -- Trustee who verified
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legacy_milestones_quest ON legacy_milestones(quest_id);
CREATE INDEX IF NOT EXISTS idx_legacy_milestones_status ON legacy_milestones(status);
CREATE INDEX IF NOT EXISTS idx_legacy_milestones_type ON legacy_milestones(milestone_type);

-- =======================
-- 6. LEGACY MEDIA TABLE (Videos, Letters, Photos)
-- =======================

CREATE TABLE IF NOT EXISTS legacy_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_account_id UUID NOT NULL REFERENCES legacy_accounts(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES legacy_milestones(id) ON DELETE CASCADE, -- NULL if general media
  media_type TEXT NOT NULL CHECK (media_type IN ('video', 'letter', 'photo', 'audio', 'document')),
  storage_path TEXT NOT NULL, -- Path in Supabase Storage or S3
  thumbnail_path TEXT, -- For videos/photos
  title TEXT,
  content TEXT, -- For letters, stored as text
  unlock_condition TEXT DEFAULT 'milestone_complete' 
    CHECK (unlock_condition IN ('immediate', 'milestone_complete', 'quest_complete', 'manual')),
  is_unlocked BOOLEAN DEFAULT false,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER, -- For video/audio
  file_size_bytes BIGINT,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legacy_media_account ON legacy_media(legacy_account_id);
CREATE INDEX IF NOT EXISTS idx_legacy_media_milestone ON legacy_media(milestone_id);
CREATE INDEX IF NOT EXISTS idx_legacy_media_type ON legacy_media(media_type);
CREATE INDEX IF NOT EXISTS idx_legacy_media_unlocked ON legacy_media(is_unlocked);

-- =======================
-- 7. TRUSTEES TABLE
-- =======================

CREATE TABLE IF NOT EXISTS legacy_trustees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_account_id UUID NOT NULL REFERENCES legacy_accounts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL until they accept
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role_description TEXT, -- e.g., "Financial Advisor", "Family Attorney"
  permissions JSONB DEFAULT '{"can_verify": true, "can_edit": false, "can_view_all": true}',
  invitation_status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (invitation_status IN ('pending', 'accepted', 'declined', 'removed')),
  invitation_token TEXT UNIQUE,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legacy_trustees_account ON legacy_trustees(legacy_account_id);
CREATE INDEX IF NOT EXISTS idx_legacy_trustees_user ON legacy_trustees(user_id);
CREATE INDEX IF NOT EXISTS idx_legacy_trustees_status ON legacy_trustees(invitation_status);

-- =======================
-- 8. MILESTONE EVIDENCE TABLE
-- =======================

CREATE TABLE IF NOT EXISTS milestone_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID NOT NULL REFERENCES legacy_milestones(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  evidence_type TEXT CHECK (evidence_type IN ('text', 'photo', 'document', 'link')),
  content TEXT, -- Text description or link
  storage_path TEXT, -- For uploaded files
  file_name TEXT,
  mime_type TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestone_evidence_milestone ON milestone_evidence(milestone_id);
CREATE INDEX IF NOT EXISTS idx_milestone_evidence_submitted_by ON milestone_evidence(submitted_by);

-- =======================
-- 9. AUDIT LOG TABLE
-- =======================

CREATE TABLE IF NOT EXISTS legacy_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  legacy_account_id UUID REFERENCES legacy_accounts(id) ON DELETE CASCADE,
  quest_id UUID REFERENCES legacy_quests(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES legacy_milestones(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'created', 'updated', 'verified', 'rejected', etc.
  entity_type TEXT NOT NULL, -- 'quest', 'milestone', 'media', etc.
  old_value JSONB,
  new_value JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legacy_audit_account ON legacy_audit_log(legacy_account_id);
CREATE INDEX IF NOT EXISTS idx_legacy_audit_user ON legacy_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_legacy_audit_created ON legacy_audit_log(created_at DESC);

-- =======================
-- 10. ENABLE RLS ON ALL LEGACY TABLES
-- =======================

ALTER TABLE legacy_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_trustees ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestone_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_audit_log ENABLE ROW LEVEL SECURITY;

-- =======================
-- 11. RLS POLICIES - LEGACY ACCOUNTS
-- =======================

-- Benefactors can view/manage their own legacy accounts
CREATE POLICY "legacy_accounts_benefactor_all" ON legacy_accounts
  FOR ALL USING (benefactor_id = auth.uid());

-- Trustees can view accounts they're assigned to
CREATE POLICY "legacy_accounts_trustee_select" ON legacy_accounts
  FOR SELECT USING (
    id IN (
      SELECT legacy_account_id FROM legacy_trustees 
      WHERE user_id = auth.uid() AND invitation_status = 'accepted'
    )
  );

-- Beneficiaries can view accounts they're part of
CREATE POLICY "legacy_accounts_beneficiary_select" ON legacy_accounts
  FOR SELECT USING (
    id IN (
      SELECT legacy_account_id FROM beneficiaries 
      WHERE user_id = auth.uid() AND invitation_status = 'accepted'
    )
  );

-- =======================
-- 12. RLS POLICIES - BENEFICIARIES
-- =======================

CREATE POLICY "beneficiaries_benefactor_all" ON beneficiaries
  FOR ALL USING (
    legacy_account_id IN (
      SELECT id FROM legacy_accounts WHERE benefactor_id = auth.uid()
    )
  );

CREATE POLICY "beneficiaries_self_select" ON beneficiaries
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "beneficiaries_self_update" ON beneficiaries
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "beneficiaries_trustee_select" ON beneficiaries
  FOR SELECT USING (
    legacy_account_id IN (
      SELECT legacy_account_id FROM legacy_trustees 
      WHERE user_id = auth.uid() AND invitation_status = 'accepted'
    )
  );

-- =======================
-- 13. RLS POLICIES - LEGACY QUESTS
-- =======================

CREATE POLICY "legacy_quests_benefactor_all" ON legacy_quests
  FOR ALL USING (
    legacy_account_id IN (
      SELECT id FROM legacy_accounts WHERE benefactor_id = auth.uid()
    )
  );

CREATE POLICY "legacy_quests_beneficiary_select" ON legacy_quests
  FOR SELECT USING (
    beneficiary_id IN (
      SELECT id FROM beneficiaries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "legacy_quests_trustee_all" ON legacy_quests
  FOR ALL USING (
    legacy_account_id IN (
      SELECT legacy_account_id FROM legacy_trustees 
      WHERE user_id = auth.uid() AND invitation_status = 'accepted'
    )
  );

-- =======================
-- 14. RLS POLICIES - LEGACY MILESTONES
-- =======================

CREATE POLICY "legacy_milestones_benefactor_all" ON legacy_milestones
  FOR ALL USING (
    quest_id IN (
      SELECT lq.id FROM legacy_quests lq
      JOIN legacy_accounts la ON la.id = lq.legacy_account_id
      WHERE la.benefactor_id = auth.uid()
    )
  );

CREATE POLICY "legacy_milestones_beneficiary_select" ON legacy_milestones
  FOR SELECT USING (
    quest_id IN (
      SELECT id FROM legacy_quests 
      WHERE beneficiary_id IN (
        SELECT id FROM beneficiaries WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "legacy_milestones_beneficiary_update" ON legacy_milestones
  FOR UPDATE USING (
    quest_id IN (
      SELECT id FROM legacy_quests 
      WHERE beneficiary_id IN (
        SELECT id FROM beneficiaries WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "legacy_milestones_trustee_all" ON legacy_milestones
  FOR ALL USING (
    quest_id IN (
      SELECT lq.id FROM legacy_quests lq
      WHERE lq.legacy_account_id IN (
        SELECT legacy_account_id FROM legacy_trustees 
        WHERE user_id = auth.uid() AND invitation_status = 'accepted'
      )
    )
  );

-- =======================
-- 15. RLS POLICIES - LEGACY MEDIA
-- =======================

CREATE POLICY "legacy_media_benefactor_all" ON legacy_media
  FOR ALL USING (
    legacy_account_id IN (
      SELECT id FROM legacy_accounts WHERE benefactor_id = auth.uid()
    )
  );

CREATE POLICY "legacy_media_beneficiary_select" ON legacy_media
  FOR SELECT USING (
    legacy_account_id IN (
      SELECT legacy_account_id FROM beneficiaries WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "legacy_media_trustee_select" ON legacy_media
  FOR SELECT USING (
    legacy_account_id IN (
      SELECT legacy_account_id FROM legacy_trustees 
      WHERE user_id = auth.uid() AND invitation_status = 'accepted'
    )
  );

-- =======================
-- 16. RLS POLICIES - TRUSTEES
-- =======================

CREATE POLICY "legacy_trustees_benefactor_all" ON legacy_trustees
  FOR ALL USING (
    legacy_account_id IN (
      SELECT id FROM legacy_accounts WHERE benefactor_id = auth.uid()
    )
  );

CREATE POLICY "legacy_trustees_self_all" ON legacy_trustees
  FOR ALL USING (user_id = auth.uid());

-- =======================
-- 17. RLS POLICIES - MILESTONE EVIDENCE
-- =======================

CREATE POLICY "milestone_evidence_benefactor_select" ON milestone_evidence
  FOR SELECT USING (
    milestone_id IN (
      SELECT lm.id FROM legacy_milestones lm
      JOIN legacy_quests lq ON lq.id = lm.quest_id
      JOIN legacy_accounts la ON la.id = lq.legacy_account_id
      WHERE la.benefactor_id = auth.uid()
    )
  );

CREATE POLICY "milestone_evidence_beneficiary_all" ON milestone_evidence
  FOR ALL USING (
    milestone_id IN (
      SELECT lm.id FROM legacy_milestones lm
      JOIN legacy_quests lq ON lq.id = lm.quest_id
      WHERE lq.beneficiary_id IN (
        SELECT id FROM beneficiaries WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "milestone_evidence_trustee_select" ON milestone_evidence
  FOR SELECT USING (
    milestone_id IN (
      SELECT lm.id FROM legacy_milestones lm
      JOIN legacy_quests lq ON lq.id = lm.quest_id
      WHERE lq.legacy_account_id IN (
        SELECT legacy_account_id FROM legacy_trustees 
        WHERE user_id = auth.uid() AND invitation_status = 'accepted'
      )
    )
  );

-- =======================
-- 18. RLS POLICIES - AUDIT LOG
-- =======================

CREATE POLICY "legacy_audit_benefactor_select" ON legacy_audit_log
  FOR SELECT USING (
    legacy_account_id IN (
      SELECT id FROM legacy_accounts WHERE benefactor_id = auth.uid()
    )
  );

CREATE POLICY "legacy_audit_trustee_select" ON legacy_audit_log
  FOR SELECT USING (
    legacy_account_id IN (
      SELECT legacy_account_id FROM legacy_trustees 
      WHERE user_id = auth.uid() AND invitation_status = 'accepted'
    )
  );

-- System can insert audit logs
CREATE POLICY "legacy_audit_insert" ON legacy_audit_log
  FOR INSERT WITH CHECK (true);

-- =======================
-- 19. FUNCTIONS - MILESTONE MANAGEMENT
-- =======================

-- Function to unlock milestone when prerequisites are met
CREATE OR REPLACE FUNCTION check_milestone_unlock(milestone_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  prereq_ids JSONB;
  prereq_id UUID;
  all_completed BOOLEAN := true;
BEGIN
  -- Get prerequisites
  SELECT prerequisites INTO prereq_ids 
  FROM legacy_milestones 
  WHERE id = milestone_uuid;
  
  -- If no prerequisites, can unlock
  IF prereq_ids IS NULL OR jsonb_array_length(prereq_ids) = 0 THEN
    RETURN true;
  END IF;
  
  -- Check each prerequisite is completed
  FOR prereq_id IN SELECT jsonb_array_elements_text(prereq_ids)::UUID
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM legacy_milestones 
      WHERE id = prereq_id AND status = 'completed'
    ) THEN
      all_completed := false;
      EXIT;
    END IF;
  END LOOP;
  
  RETURN all_completed;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-unlock next milestones when one completes
CREATE OR REPLACE FUNCTION unlock_next_milestones_trigger()
RETURNS TRIGGER AS $$
DECLARE
  next_milestone RECORD;
BEGIN
  -- Only trigger when milestone is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    
    -- Find milestones in the same quest that have this as a prerequisite
    FOR next_milestone IN 
      SELECT id 
      FROM legacy_milestones 
      WHERE quest_id = NEW.quest_id 
        AND status = 'locked'
        AND prerequisites @> jsonb_build_array(NEW.id::TEXT)
    LOOP
      -- Check if all prerequisites are met
      IF check_milestone_unlock(next_milestone.id) THEN
        UPDATE legacy_milestones 
        SET status = 'unlocked' 
        WHERE id = next_milestone.id;
      END IF;
    END LOOP;
    
    -- Unlock associated media
    UPDATE legacy_media
    SET is_unlocked = true, unlocked_at = NOW()
    WHERE milestone_id = NEW.id 
      AND unlock_condition = 'milestone_complete'
      AND is_unlocked = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS unlock_next_milestones ON legacy_milestones;
CREATE TRIGGER unlock_next_milestones
  AFTER UPDATE ON legacy_milestones
  FOR EACH ROW
  EXECUTE FUNCTION unlock_next_milestones_trigger();

-- =======================
-- 20. FUNCTIONS - AUDIT LOGGING
-- =======================

CREATE OR REPLACE FUNCTION log_legacy_change()
RETURNS TRIGGER AS $$
DECLARE
  account_id UUID;
  entity_type TEXT;
BEGIN
  -- Determine entity type from table name
  entity_type := TG_TABLE_NAME;
  
  -- Get legacy_account_id based on table
  IF TG_TABLE_NAME = 'legacy_accounts' THEN
    account_id := NEW.id;
  ELSIF TG_TABLE_NAME = 'legacy_quests' THEN
    account_id := NEW.legacy_account_id;
  ELSIF TG_TABLE_NAME = 'legacy_milestones' THEN
    SELECT legacy_account_id INTO account_id 
    FROM legacy_quests WHERE id = NEW.quest_id;
  END IF;
  
  -- Log the change
  IF TG_OP = 'INSERT' THEN
    INSERT INTO legacy_audit_log (
      legacy_account_id, entity_type, action, new_value, user_id
    ) VALUES (
      account_id, entity_type, 'created', to_jsonb(NEW), auth.uid()
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO legacy_audit_log (
      legacy_account_id, entity_type, action, old_value, new_value, user_id
    ) VALUES (
      account_id, entity_type, 'updated', to_jsonb(OLD), to_jsonb(NEW), auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add audit triggers to key tables
DROP TRIGGER IF EXISTS audit_legacy_accounts ON legacy_accounts;
CREATE TRIGGER audit_legacy_accounts
  AFTER INSERT OR UPDATE ON legacy_accounts
  FOR EACH ROW EXECUTE FUNCTION log_legacy_change();

DROP TRIGGER IF EXISTS audit_legacy_quests ON legacy_quests;
CREATE TRIGGER audit_legacy_quests
  AFTER INSERT OR UPDATE ON legacy_quests
  FOR EACH ROW EXECUTE FUNCTION log_legacy_change();

DROP TRIGGER IF EXISTS audit_legacy_milestones ON legacy_milestones;
CREATE TRIGGER audit_legacy_milestones
  AFTER INSERT OR UPDATE ON legacy_milestones
  FOR EACH ROW EXECUTE FUNCTION log_legacy_change();

-- =======================
-- 21. UPDATE TRIGGERS
-- =======================

CREATE TRIGGER update_legacy_accounts_updated_at BEFORE UPDATE ON legacy_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beneficiaries_updated_at BEFORE UPDATE ON beneficiaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legacy_quests_updated_at BEFORE UPDATE ON legacy_quests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legacy_milestones_updated_at BEFORE UPDATE ON legacy_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legacy_media_updated_at BEFORE UPDATE ON legacy_media
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legacy_trustees_updated_at BEFORE UPDATE ON legacy_trustees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- 22. SEED ACHIEVEMENT TEMPLATES
-- =======================

-- Achievement templates for benefactors to use
CREATE TABLE IF NOT EXISTS legacy_achievement_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL, -- 'education', 'financial', 'career', 'life', 'community'
  title TEXT NOT NULL,
  description TEXT,
  suggested_value_cents BIGINT, -- Suggested unlock amount
  verification_type TEXT DEFAULT 'manual',
  verification_instructions TEXT,
  icon TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard', 'epic')),
  estimated_time_months INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE legacy_achievement_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can view templates
CREATE POLICY "achievement_templates_select_all" ON legacy_achievement_templates
  FOR SELECT USING (true);

-- Insert default templates
INSERT INTO legacy_achievement_templates (category, title, description, suggested_value_cents, verification_type, icon, difficulty, estimated_time_months, verification_instructions)
VALUES
  -- Education
  ('education', 'Complete High School', 'Graduate from high school or obtain GED', 500000, 'document', '🎓', 'medium', 48, 'Upload diploma or GED certificate'),
  ('education', 'Complete Bachelors Degree', 'Earn a 4-year college degree', 1000000, 'document', '🎓', 'hard', 48, 'Upload degree certificate'),
  ('education', 'Complete Trade Certification', 'Obtain professional trade certification', 500000, 'document', '🔧', 'medium', 12, 'Upload certification'),
  ('education', 'Complete Masters Degree', 'Earn graduate degree', 2000000, 'document', '📚', 'epic', 24, 'Upload degree certificate'),
  
  -- Financial
  ('financial', 'Build Emergency Fund', 'Save 6 months of expenses', 300000, 'manual', '🏦', 'medium', 12, 'Provide bank statement showing savings balance'),
  ('financial', 'Credit Score 700+', 'Achieve credit score of 700 or higher', 200000, 'manual', '📊', 'medium', 6, 'Upload credit report'),
  ('financial', 'Start Retirement Account', 'Open and fund IRA or 401k', 500000, 'manual', '📈', 'easy', 1, 'Provide account statement'),
  ('financial', 'Debt Free', 'Pay off all consumer debt', 1000000, 'manual', '💳', 'hard', 24, 'Provide debt-free verification'),
  ('financial', 'Save 20% Down Payment', 'Save 20% for home purchase', 1500000, 'manual', '🏠', 'hard', 36, 'Bank statement showing savings'),
  
  -- Career
  ('career', 'Maintain Employment (1 Year)', 'Hold steady job for 12 months', 300000, 'manual', '💼', 'easy', 12, 'Employer verification letter'),
  ('career', 'Get Professional License', 'Obtain professional license in your field', 500000, 'document', '📜', 'medium', 12, 'Upload license certificate'),
  ('career', 'Start a Business', 'Launch and operate business for 6 months', 1000000, 'manual', '🚀', 'hard', 6, 'Business registration and revenue proof'),
  ('career', 'Reach Salary Milestone', 'Achieve $50k+ annual salary', 500000, 'manual', '💰', 'medium', 24, 'W2 or pay stub'),
  
  -- Life Events
  ('life', 'Purchase First Home', 'Buy your first property', 2000000, 'document', '🏡', 'epic', 36, 'Upload closing documents'),
  ('life', 'Get Married', 'Enter into marriage', 500000, 'document', '💍', 'easy', 0, 'Upload marriage certificate'),
  ('life', 'Have First Child', 'Welcome first child', 1000000, 'document', '👶', 'medium', 0, 'Upload birth certificate'),
  ('life', 'Purchase Reliable Vehicle', 'Own a dependable car (paid off)', 300000, 'document', '🚗', 'easy', 12, 'Upload title/registration'),
  
  -- Community
  ('community', 'Volunteer 100 Hours', 'Complete 100 hours community service', 200000, 'manual', '❤️', 'easy', 6, 'Organization verification letter'),
  ('community', 'Mentor Someone', 'Formally mentor another person for 6 months', 300000, 'manual', '🤝', 'medium', 6, 'Mentee and program verification'),
  ('community', 'Lead Community Project', 'Organize and lead community initiative', 500000, 'manual', '🌟', 'hard', 6, 'Project documentation and impact report'),
  
  -- Skills
  ('skill', 'Learn Financial Literacy', 'Complete comprehensive finance course', 100000, 'manual', '📖', 'easy', 3, 'Course completion certificate'),
  ('skill', 'Learn a Trade Skill', 'Develop proficiency in practical trade', 300000, 'manual', '🔨', 'medium', 6, 'Skill demonstration or certification'),
  ('skill', 'Complete Investment Course', 'Master investment fundamentals', 200000, 'manual', '💹', 'medium', 3, 'Course certificate');

-- =======================
-- MIGRATION COMPLETE
-- =======================

-- Summary:
-- ✅ Extended users table with account types
-- ✅ Created legacy_accounts table (benefactor estates)
-- ✅ Created beneficiaries table (heirs + invitations)
-- ✅ Created legacy_quests table (quest chains)
-- ✅ Created legacy_milestones table (achievements)
-- ✅ Created legacy_media table (videos, letters, photos)
-- ✅ Created legacy_trustees table (verification oversight)
-- ✅ Created milestone_evidence table (proof uploads)
-- ✅ Created legacy_audit_log table (full audit trail)
-- ✅ Added comprehensive RLS policies
-- ✅ Created milestone unlock automation
-- ✅ Created audit logging triggers
-- ✅ Seeded 23 achievement templates
