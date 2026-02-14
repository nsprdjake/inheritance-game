-- Gamification Migration
-- This migration adds achievements, streaks, and levels
-- AND fixes RLS policies to be non-recursive

-- First, drop the existing recursive RLS policies
DROP POLICY IF EXISTS "Users can view their own family" ON families;
DROP POLICY IF EXISTS "Users can update their own family" ON families;
DROP POLICY IF EXISTS "Users can view users in their family" ON users;
DROP POLICY IF EXISTS "Admins can manage users in their family" ON users;
DROP POLICY IF EXISTS "Users can view kids in their family" ON kids;
DROP POLICY IF EXISTS "Admins/parents can manage kids in their family" ON kids;
DROP POLICY IF EXISTS "Users can view transactions in their family" ON transactions;
DROP POLICY IF EXISTS "Kids can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins/parents can create transactions in their family" ON transactions;
DROP POLICY IF EXISTS "Users can view settings for their family" ON family_settings;
DROP POLICY IF EXISTS "Admins can update settings for their family" ON family_settings;

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_kid ON achievements(kid_id);
CREATE INDEX IF NOT EXISTS idx_achievements_family ON achievements(family_id);

-- Create streaks table (tracks consecutive days of earning points)
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kid_id UUID NOT NULL UNIQUE REFERENCES kids(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_streaks_kid ON streaks(kid_id);
CREATE INDEX IF NOT EXISTS idx_streaks_family ON streaks(family_id);

-- Add level field to kids table (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='kids' AND column_name='level'
  ) THEN
    ALTER TABLE kids ADD COLUMN level TEXT DEFAULT 'bronze';
  END IF;
END $$;

-- Add total_earned field to kids table for level calculation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='kids' AND column_name='total_earned'
  ) THEN
    ALTER TABLE kids ADD COLUMN total_earned INTEGER DEFAULT 0;
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- NON-RECURSIVE RLS Policies
-- Strategy: Use direct user lookup without subqueries to auth.uid()

-- Families policies
CREATE POLICY "family_select_policy" ON families
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.family_id = families.id
    )
  );

CREATE POLICY "family_update_policy" ON families
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.family_id = families.id 
        AND u.role IN ('admin', 'parent')
    )
  );

-- Users policies
CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.family_id = users.family_id
    )
  );

CREATE POLICY "users_all_policy" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.family_id = users.family_id 
        AND u.role = 'admin'
    )
  );

-- Kids policies
CREATE POLICY "kids_select_policy" ON kids
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.family_id = kids.family_id
    )
  );

CREATE POLICY "kids_all_policy" ON kids
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.family_id = kids.family_id 
        AND u.role IN ('admin', 'parent')
    )
  );

-- Transactions policies
CREATE POLICY "transactions_select_policy" ON transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.family_id = transactions.family_id
    )
    OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.role = 'kid' 
        AND u.kid_id = transactions.kid_id
    )
  );

CREATE POLICY "transactions_insert_policy" ON transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.family_id = transactions.family_id 
        AND u.role IN ('admin', 'parent')
    )
  );

-- Family settings policies
CREATE POLICY "settings_select_policy" ON family_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.family_id = family_settings.family_id
    )
  );

CREATE POLICY "settings_update_policy" ON family_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.family_id = family_settings.family_id 
        AND u.role = 'admin'
    )
  );

CREATE POLICY "settings_insert_policy" ON family_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.family_id = family_settings.family_id 
        AND u.role = 'admin'
    )
  );

-- Achievements policies
CREATE POLICY "achievements_select_policy" ON achievements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.family_id = achievements.family_id
    )
    OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.role = 'kid' 
        AND u.kid_id = achievements.kid_id
    )
  );

CREATE POLICY "achievements_insert_policy" ON achievements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.family_id = achievements.family_id 
        AND u.role IN ('admin', 'parent')
    )
  );

-- Streaks policies  
CREATE POLICY "streaks_select_policy" ON streaks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() AND u.family_id = streaks.family_id
    )
    OR
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.role = 'kid' 
        AND u.kid_id = streaks.kid_id
    )
  );

CREATE POLICY "streaks_all_policy" ON streaks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
        AND u.family_id = streaks.family_id 
        AND u.role IN ('admin', 'parent')
    )
  );

-- Function to update kid's level based on total_earned
CREATE OR REPLACE FUNCTION update_kid_level(kid_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  total INTEGER;
  new_level TEXT;
BEGIN
  -- Get total earned points
  SELECT COALESCE(SUM(amount), 0) INTO total
  FROM transactions
  WHERE kid_id = kid_uuid AND amount > 0;
  
  -- Update total_earned
  UPDATE kids SET total_earned = total WHERE id = kid_uuid;
  
  -- Determine level
  IF total >= 500 THEN
    new_level := 'gold';
  ELSIF total >= 200 THEN
    new_level := 'silver';
  ELSE
    new_level := 'bronze';
  END IF;
  
  -- Update level
  UPDATE kids SET level = new_level WHERE id = kid_uuid;
  
  RETURN new_level;
END;
$$ LANGUAGE plpgsql;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_achievements(kid_uuid UUID, family_uuid UUID)
RETURNS VOID AS $$
DECLARE
  balance INTEGER;
  total_earned INTEGER;
  transaction_count INTEGER;
BEGIN
  -- Get current balance and total earned
  SELECT get_kid_balance(kid_uuid) INTO balance;
  SELECT COALESCE(SUM(amount), 0) INTO total_earned
  FROM transactions WHERE kid_id = kid_uuid AND amount > 0;
  
  SELECT COUNT(*) INTO transaction_count
  FROM transactions WHERE kid_id = kid_uuid;
  
  -- First Points (10+)
  IF total_earned >= 10 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE kid_id = kid_uuid AND achievement_type = 'first_points'
  ) THEN
    INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
    VALUES (kid_uuid, family_uuid, 'first_points', 'First Steps! 🌟', 'Earned your first 10 points', '🌟');
  END IF;
  
  -- Century Club (100+)
  IF total_earned >= 100 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE kid_id = kid_uuid AND achievement_type = 'century_club'
  ) THEN
    INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
    VALUES (kid_uuid, family_uuid, 'century_club', 'Century Club! 💯', 'Earned 100 total points', '💯');
  END IF;
  
  -- High Roller (500+)
  IF total_earned >= 500 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE kid_id = kid_uuid AND achievement_type = 'high_roller'
  ) THEN
    INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
    VALUES (kid_uuid, family_uuid, 'high_roller', 'High Roller! 🏆', 'Earned 500 total points', '🏆');
  END IF;
  
  -- Getting Started
  IF transaction_count = 1 AND NOT EXISTS (
    SELECT 1 FROM achievements 
    WHERE kid_id = kid_uuid AND achievement_type = 'getting_started'
  ) THEN
    INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
    VALUES (kid_uuid, family_uuid, 'getting_started', 'Getting Started! 🎯', 'Completed your first task', '🎯');
  END IF;
  
END;
$$ LANGUAGE plpgsql;

-- Function to update streak
CREATE OR REPLACE FUNCTION update_streak(kid_uuid UUID, family_uuid UUID)
RETURNS VOID AS $$
DECLARE
  streak_record RECORD;
  today DATE := CURRENT_DATE;
  yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  -- Get or create streak record
  SELECT * INTO streak_record FROM streaks WHERE kid_id = kid_uuid;
  
  IF NOT FOUND THEN
    -- Create new streak
    INSERT INTO streaks (kid_id, family_id, current_streak, longest_streak, last_activity_date)
    VALUES (kid_uuid, family_uuid, 1, 1, today);
  ELSE
    -- Check if activity was yesterday (continue streak) or today (already counted)
    IF streak_record.last_activity_date = yesterday THEN
      -- Continue streak
      UPDATE streaks 
      SET 
        current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_activity_date = today,
        updated_at = NOW()
      WHERE kid_id = kid_uuid;
    ELSIF streak_record.last_activity_date < yesterday THEN
      -- Streak broken, reset
      UPDATE streaks 
      SET 
        current_streak = 1,
        last_activity_date = today,
        updated_at = NOW()
      WHERE kid_id = kid_uuid;
    END IF;
    -- If last_activity_date = today, do nothing (already counted)
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger on transaction insert to update gamification
CREATE OR REPLACE FUNCTION transaction_gamification_trigger()
RETURNS TRIGGER AS $$
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

DROP TRIGGER IF EXISTS gamification_trigger ON transactions;
CREATE TRIGGER gamification_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION transaction_gamification_trigger();

-- Add trigger to streaks table
CREATE TRIGGER update_streaks_updated_at BEFORE UPDATE ON streaks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
