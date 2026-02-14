-- Legacy Quest Phase 1: Age-Tier System, Skill Trees, Self-Service Tasks, Educational Modules
-- This migration builds the foundation for a generational wealth transfer platform

-- =======================
-- 1. ADD FIELDS TO KIDS TABLE
-- =======================

-- Add birthdate field (required for age-tier calculation)
ALTER TABLE kids ADD COLUMN IF NOT EXISTS birthdate DATE;

-- Add age_tier field (1-4, calculated from birthdate)
ALTER TABLE kids ADD COLUMN IF NOT EXISTS age_tier INTEGER DEFAULT 1 
  CHECK (age_tier >= 1 AND age_tier <= 4);

-- Add skill fields (0-300: 0-99=Bronze, 100-199=Silver, 200+=Gold)
ALTER TABLE kids ADD COLUMN IF NOT EXISTS skill_earning INTEGER DEFAULT 0;
ALTER TABLE kids ADD COLUMN IF NOT EXISTS skill_saving INTEGER DEFAULT 0;
ALTER TABLE kids ADD COLUMN IF NOT EXISTS skill_investing INTEGER DEFAULT 0;
ALTER TABLE kids ADD COLUMN IF NOT EXISTS skill_budgeting INTEGER DEFAULT 0;

-- Add index for age tier queries
CREATE INDEX IF NOT EXISTS idx_kids_age_tier ON kids(age_tier);

-- =======================
-- 2. TASK TEMPLATES TABLE (Task Pool)
-- =======================

CREATE TABLE IF NOT EXISTS task_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  points INTEGER NOT NULL CHECK (points > 0),
  skill_type TEXT CHECK (skill_type IN ('earning', 'saving', 'investing', 'budgeting')),
  min_age_tier INTEGER DEFAULT 1 CHECK (min_age_tier >= 1 AND min_age_tier <= 4),
  max_age_tier INTEGER DEFAULT 4 CHECK (max_age_tier >= 1 AND max_age_tier <= 4),
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT CHECK (recurrence_pattern IN ('daily', 'weekly', 'monthly')),
  max_claims_per_period INTEGER, -- How many times can be claimed per day/week/month
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_templates_family ON task_templates(family_id);
CREATE INDEX IF NOT EXISTS idx_task_templates_active ON task_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_task_templates_skill ON task_templates(skill_type);

-- =======================
-- 3. CLAIMED TASKS TABLE
-- =======================

CREATE TABLE IF NOT EXISTS claimed_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_template_id UUID REFERENCES task_templates(id) ON DELETE CASCADE,
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'claimed' 
    CHECK (status IN ('claimed', 'completed', 'pending_approval', 'approved', 'rejected', 'cancelled')),
  points_awarded INTEGER,
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  notes TEXT, -- Kid's notes/proof of completion
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claimed_tasks_kid ON claimed_tasks(kid_id);
CREATE INDEX IF NOT EXISTS idx_claimed_tasks_family ON claimed_tasks(family_id);
CREATE INDEX IF NOT EXISTS idx_claimed_tasks_status ON claimed_tasks(status);
CREATE INDEX IF NOT EXISTS idx_claimed_tasks_template ON claimed_tasks(task_template_id);

-- =======================
-- 4. EDUCATIONAL MODULES TABLE
-- =======================

CREATE TABLE IF NOT EXISTS educational_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB, -- Stores lessons, videos, quizzes, etc.
  skill_type TEXT CHECK (skill_type IN ('earning', 'saving', 'investing', 'budgeting', 'general')),
  min_age_tier INTEGER DEFAULT 1 CHECK (min_age_tier >= 1 AND min_age_tier <= 4),
  max_age_tier INTEGER DEFAULT 4 CHECK (max_age_tier >= 1 AND max_age_tier <= 4),
  estimated_minutes INTEGER,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  icon TEXT,
  thumbnail_url TEXT,
  points_reward INTEGER DEFAULT 0, -- Points for completing
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0, -- For sorting
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_educational_modules_skill ON educational_modules(skill_type);
CREATE INDEX IF NOT EXISTS idx_educational_modules_tier ON educational_modules(min_age_tier, max_age_tier);
CREATE INDEX IF NOT EXISTS idx_educational_modules_active ON educational_modules(is_active);

-- =======================
-- 5. MODULE PROGRESS TABLE
-- =======================

CREATE TABLE IF NOT EXISTS module_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES educational_modules(id) ON DELETE CASCADE,
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  current_lesson INTEGER DEFAULT 0,
  quiz_score INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(module_id, kid_id) -- One progress record per kid per module
);

CREATE INDEX IF NOT EXISTS idx_module_progress_kid ON module_progress(kid_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_family ON module_progress(family_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_module ON module_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_completed ON module_progress(completed_at);

-- =======================
-- 6. SAVINGS GOALS TABLE
-- =======================

CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_points INTEGER NOT NULL CHECK (target_points > 0),
  current_points INTEGER DEFAULT 0,
  icon TEXT,
  color TEXT,
  deadline DATE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_savings_goals_kid ON savings_goals(kid_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_family ON savings_goals(family_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_completed ON savings_goals(is_completed);

-- =======================
-- 7. ENABLE RLS ON NEW TABLES
-- =======================

ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE claimed_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE educational_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- =======================
-- 8. RLS POLICIES - TASK TEMPLATES
-- =======================

CREATE POLICY "task_templates_select_policy" ON task_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.family_id = task_templates.family_id
    )
  );

CREATE POLICY "task_templates_insert_policy" ON task_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.family_id = task_templates.family_id 
        AND u.role IN ('admin', 'parent')
    )
  );

CREATE POLICY "task_templates_update_policy" ON task_templates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.family_id = task_templates.family_id 
        AND u.role IN ('admin', 'parent')
    )
  );

CREATE POLICY "task_templates_delete_policy" ON task_templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.family_id = task_templates.family_id 
        AND u.role IN ('admin', 'parent')
    )
  );

-- =======================
-- 9. RLS POLICIES - CLAIMED TASKS
-- =======================

CREATE POLICY "claimed_tasks_select_policy" ON claimed_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.family_id = claimed_tasks.family_id
    )
    OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.role = 'kid' 
        AND u.kid_id = claimed_tasks.kid_id
    )
  );

CREATE POLICY "claimed_tasks_insert_policy" ON claimed_tasks
  FOR INSERT WITH CHECK (
    -- Kids can claim tasks (Tier 2+)
    EXISTS (
      SELECT 1 FROM users u 
      JOIN kids k ON k.id = u.kid_id
      WHERE u.id = auth.uid() 
        AND u.role = 'kid' 
        AND u.kid_id = claimed_tasks.kid_id
        AND k.age_tier >= 2
    )
    OR
    -- Parents can claim tasks on behalf of kids
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.family_id = claimed_tasks.family_id 
        AND u.role IN ('admin', 'parent')
    )
  );

CREATE POLICY "claimed_tasks_update_policy" ON claimed_tasks
  FOR UPDATE USING (
    -- Kids can update their own claimed tasks
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.role = 'kid' 
        AND u.kid_id = claimed_tasks.kid_id
    )
    OR
    -- Parents can update any claimed task in their family
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.family_id = claimed_tasks.family_id 
        AND u.role IN ('admin', 'parent')
    )
  );

-- =======================
-- 10. RLS POLICIES - EDUCATIONAL MODULES
-- =======================

-- Educational modules are global (not family-specific), so everyone can view them
CREATE POLICY "educational_modules_select_policy" ON educational_modules
  FOR SELECT USING (true);

-- Only admins can create/edit educational modules (for now)
CREATE POLICY "educational_modules_all_policy" ON educational_modules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- =======================
-- 11. RLS POLICIES - MODULE PROGRESS
-- =======================

CREATE POLICY "module_progress_select_policy" ON module_progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.family_id = module_progress.family_id
    )
    OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.role = 'kid' 
        AND u.kid_id = module_progress.kid_id
    )
  );

CREATE POLICY "module_progress_insert_policy" ON module_progress
  FOR INSERT WITH CHECK (
    -- Kids can create their own progress records
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.role = 'kid' 
        AND u.kid_id = module_progress.kid_id
    )
    OR
    -- Parents can create progress records for kids
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.family_id = module_progress.family_id 
        AND u.role IN ('admin', 'parent')
    )
  );

CREATE POLICY "module_progress_update_policy" ON module_progress
  FOR UPDATE USING (
    -- Kids can update their own progress
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.role = 'kid' 
        AND u.kid_id = module_progress.kid_id
    )
    OR
    -- Parents can update progress
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.family_id = module_progress.family_id 
        AND u.role IN ('admin', 'parent')
    )
  );

-- =======================
-- 12. RLS POLICIES - SAVINGS GOALS
-- =======================

CREATE POLICY "savings_goals_select_policy" ON savings_goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.family_id = savings_goals.family_id
    )
    OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.role = 'kid' 
        AND u.kid_id = savings_goals.kid_id
    )
  );

CREATE POLICY "savings_goals_all_policy" ON savings_goals
  FOR ALL USING (
    -- Kids can manage their own goals (Tier 2+)
    EXISTS (
      SELECT 1 FROM users u 
      JOIN kids k ON k.id = u.kid_id
      WHERE u.id = auth.uid() 
        AND u.role = 'kid' 
        AND u.kid_id = savings_goals.kid_id
        AND k.age_tier >= 2
    )
    OR
    -- Parents can manage all goals
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.family_id = savings_goals.family_id 
        AND u.role IN ('admin', 'parent')
    )
  );

-- =======================
-- 13. FUNCTIONS - AGE TIER CALCULATION
-- =======================

-- Function to calculate age tier from birthdate
CREATE OR REPLACE FUNCTION calculate_age_tier(birth_date DATE)
RETURNS INTEGER AS $$
DECLARE
  age INTEGER;
BEGIN
  IF birth_date IS NULL THEN
    RETURN 1; -- Default to Tier 1 if no birthdate
  END IF;
  
  age := EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date));
  
  IF age >= 17 THEN
    RETURN 4; -- Tier 4: Young Adults (17+)
  ELSIF age >= 13 THEN
    RETURN 3; -- Tier 3: Teen Financiers (13-16)
  ELSIF age >= 9 THEN
    RETURN 2; -- Tier 2: Young Earners (9-12)
  ELSE
    RETURN 1; -- Tier 1: Early Learners (4-8)
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update age tier for a kid
CREATE OR REPLACE FUNCTION update_age_tier(kid_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  birth_date DATE;
  new_tier INTEGER;
BEGIN
  SELECT birthdate INTO birth_date FROM kids WHERE id = kid_uuid;
  
  new_tier := calculate_age_tier(birth_date);
  
  UPDATE kids SET age_tier = new_tier WHERE id = kid_uuid;
  
  RETURN new_tier;
END;
$$ LANGUAGE plpgsql;

-- Function to update all kids' age tiers in a family
CREATE OR REPLACE FUNCTION update_family_age_tiers(family_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE kids 
  SET age_tier = calculate_age_tier(birthdate)
  WHERE family_id = family_uuid;
END;
$$ LANGUAGE plpgsql;

-- =======================
-- 14. FUNCTIONS - SKILL PROGRESSION
-- =======================

-- Function to award skill points
CREATE OR REPLACE FUNCTION award_skill_points(
  kid_uuid UUID,
  skill TEXT,
  points_to_add INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  new_value INTEGER;
BEGIN
  IF skill = 'earning' THEN
    UPDATE kids SET skill_earning = skill_earning + points_to_add WHERE id = kid_uuid
    RETURNING skill_earning INTO new_value;
  ELSIF skill = 'saving' THEN
    UPDATE kids SET skill_saving = skill_saving + points_to_add WHERE id = kid_uuid
    RETURNING skill_saving INTO new_value;
  ELSIF skill = 'investing' THEN
    UPDATE kids SET skill_investing = skill_investing + points_to_add WHERE id = kid_uuid
    RETURNING skill_investing INTO new_value;
  ELSIF skill = 'budgeting' THEN
    UPDATE kids SET skill_budgeting = skill_budgeting + points_to_add WHERE id = kid_uuid
    RETURNING skill_budgeting INTO new_value;
  ELSE
    RAISE EXCEPTION 'Invalid skill type: %', skill;
  END IF;
  
  RETURN new_value;
END;
$$ LANGUAGE plpgsql;

-- Function to get skill level (bronze/silver/gold)
CREATE OR REPLACE FUNCTION get_skill_level(skill_points INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF skill_points >= 200 THEN
    RETURN 'gold';
  ELSIF skill_points >= 100 THEN
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =======================
-- 15. ENHANCED TRANSACTION TRIGGER
-- =======================

-- Update the transaction gamification trigger to handle skills
CREATE OR REPLACE FUNCTION transaction_gamification_trigger()
RETURNS TRIGGER AS $$
DECLARE
  skill TEXT;
BEGIN
  -- Only process positive transactions (awards)
  IF NEW.amount > 0 THEN
    -- Update level
    PERFORM update_kid_level(NEW.kid_id);
    
    -- Check achievements
    PERFORM check_achievements(NEW.kid_id, NEW.family_id);
    
    -- Update streak
    PERFORM update_streak(NEW.kid_id, NEW.family_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =======================
-- 16. TRIGGER FOR CLAIMED TASKS
-- =======================

-- Trigger when a claimed task is approved
CREATE OR REPLACE FUNCTION claimed_task_approved_trigger()
RETURNS TRIGGER AS $$
DECLARE
  template_skill TEXT;
  template_points INTEGER;
  transaction_id UUID;
BEGIN
  -- Only trigger when status changes to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Get task template info
    SELECT skill_type, points INTO template_skill, template_points
    FROM task_templates WHERE id = NEW.task_template_id;
    
    -- Set points_awarded if not already set
    IF NEW.points_awarded IS NULL THEN
      NEW.points_awarded := template_points;
    END IF;
    
    -- Create transaction
    INSERT INTO transactions (family_id, kid_id, amount, reason, transaction_type, created_by)
    VALUES (
      NEW.family_id,
      NEW.kid_id,
      NEW.points_awarded,
      'Completed task: ' || (SELECT title FROM task_templates WHERE id = NEW.task_template_id),
      'award',
      NEW.approved_by
    )
    RETURNING id INTO transaction_id;
    
    -- Award skill points if task has a skill type
    IF template_skill IS NOT NULL THEN
      -- Award skill points (1:1 ratio with task points for now)
      PERFORM award_skill_points(NEW.kid_id, template_skill, NEW.points_awarded);
    END IF;
    
    -- Set approved_at timestamp
    NEW.approved_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS claimed_task_approved ON claimed_tasks;
CREATE TRIGGER claimed_task_approved
  BEFORE UPDATE ON claimed_tasks
  FOR EACH ROW
  EXECUTE FUNCTION claimed_task_approved_trigger();

-- =======================
-- 17. TRIGGER FOR MODULE COMPLETION
-- =======================

-- Trigger when a module is completed
CREATE OR REPLACE FUNCTION module_completion_trigger()
RETURNS TRIGGER AS $$
DECLARE
  module_skill TEXT;
  module_points INTEGER;
BEGIN
  -- Only trigger when progress reaches 100% for the first time
  IF NEW.progress_percent = 100 AND (OLD.progress_percent IS NULL OR OLD.progress_percent < 100) THEN
    
    -- Get module info
    SELECT skill_type, points_reward INTO module_skill, module_points
    FROM educational_modules WHERE id = NEW.module_id;
    
    -- Set completed_at timestamp
    NEW.completed_at := NOW();
    
    -- Create transaction for points reward
    IF module_points > 0 THEN
      INSERT INTO transactions (family_id, kid_id, amount, reason, transaction_type)
      VALUES (
        NEW.family_id,
        NEW.kid_id,
        module_points,
        'Completed module: ' || (SELECT title FROM educational_modules WHERE id = NEW.module_id),
        'award'
      );
    END IF;
    
    -- Award skill points if module has a skill type
    IF module_skill IS NOT NULL AND module_skill != 'general' THEN
      -- Award 50% of points as skill points
      PERFORM award_skill_points(NEW.kid_id, module_skill, module_points / 2);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS module_completion ON module_progress;
CREATE TRIGGER module_completion
  BEFORE UPDATE ON module_progress
  FOR EACH ROW
  EXECUTE FUNCTION module_completion_trigger();

-- =======================
-- 18. UPDATE TRIGGERS
-- =======================

CREATE TRIGGER update_task_templates_updated_at BEFORE UPDATE ON task_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_claimed_tasks_updated_at BEFORE UPDATE ON claimed_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_educational_modules_updated_at BEFORE UPDATE ON educational_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_module_progress_updated_at BEFORE UPDATE ON module_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_savings_goals_updated_at BEFORE UPDATE ON savings_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- 19. SEED DEFAULT EDUCATIONAL MODULES
-- =======================

-- Insert default educational modules for all age tiers
INSERT INTO educational_modules (title, description, skill_type, min_age_tier, max_age_tier, estimated_minutes, difficulty, icon, points_reward, order_index)
VALUES
  -- Tier 1: Early Learners (4-8)
  ('Counting Coins', 'Learn to identify and count different coins', 'earning', 1, 1, 10, 'beginner', '🪙', 10, 1),
  ('Saving is Fun!', 'Why we save money and how to do it', 'saving', 1, 1, 10, 'beginner', '🐷', 10, 2),
  ('Needs vs Wants', 'Learn the difference between things we need and things we want', 'budgeting', 1, 1, 15, 'beginner', '🛒', 15, 3),
  
  -- Tier 2: Young Earners (9-12)
  ('Making Money', 'Different ways kids can earn money', 'earning', 2, 2, 20, 'beginner', '💰', 25, 4),
  ('Setting Savings Goals', 'How to set and achieve your savings goals', 'saving', 2, 2, 20, 'beginner', '🎯', 25, 5),
  ('Budgeting Basics', 'Create your first budget', 'budgeting', 2, 2, 25, 'intermediate', '📊', 30, 6),
  ('What is Investing?', 'Introduction to growing your money', 'investing', 2, 2, 20, 'beginner', '📈', 25, 7),
  
  -- Tier 3: Teen Financiers (13-16)
  ('Earning Power', 'Jobs, side hustles, and entrepreneurship', 'earning', 3, 3, 30, 'intermediate', '💼', 40, 8),
  ('Smart Saving Strategies', 'Advanced saving techniques and accounts', 'saving', 3, 3, 25, 'intermediate', '🏦', 35, 9),
  ('Investment 101', 'Stocks, bonds, and compound interest', 'investing', 3, 3, 35, 'intermediate', '📊', 50, 10),
  ('Credit & Debt', 'Understanding credit cards and loans', 'budgeting', 3, 3, 30, 'intermediate', '💳', 40, 11),
  ('Budget Like a Pro', 'Zero-based budgeting and tracking expenses', 'budgeting', 3, 3, 30, 'intermediate', '📋', 40, 12),
  
  -- Tier 4: Young Adults (17+)
  ('Career Planning', 'Building your career and income potential', 'earning', 4, 4, 40, 'advanced', '🎓', 60, 13),
  ('Building Wealth', 'Long-term wealth strategies', 'investing', 4, 4, 45, 'advanced', '💎', 75, 14),
  ('Real Estate Basics', 'Buying your first home', 'investing', 4, 4, 40, 'advanced', '🏠', 60, 15),
  ('Tax Fundamentals', 'Understanding and filing taxes', 'budgeting', 4, 4, 35, 'advanced', '📝', 50, 16),
  ('Retirement Planning', 'Starting your retirement savings early', 'investing', 4, 4, 40, 'advanced', '🌅', 60, 17)
ON CONFLICT DO NOTHING;

-- =======================
-- 20. SEED DEFAULT TASK TEMPLATES
-- =======================

-- Note: Task templates are family-specific, so we won't seed them here
-- Parents will create their own task templates
-- This is just a comment for documentation

-- =======================
-- MIGRATION COMPLETE
-- =======================

-- Summary of changes:
-- ✅ Added birthdate and age_tier to kids table
-- ✅ Added 4 skill fields to kids table (earning, saving, investing, budgeting)
-- ✅ Created task_templates table for task pool
-- ✅ Created claimed_tasks table for self-service tasks
-- ✅ Created educational_modules table
-- ✅ Created module_progress table
-- ✅ Created savings_goals table
-- ✅ Added RLS policies for all new tables
-- ✅ Created functions for age tier calculation
-- ✅ Created functions for skill progression
-- ✅ Created triggers for task approval and module completion
-- ✅ Seeded 17 default educational modules
