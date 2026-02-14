-- Drop existing tables
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS streaks CASCADE;
DROP TRIGGER IF EXISTS transaction_gamification_trigger ON transactions;
DROP FUNCTION IF EXISTS process_transaction_gamification();

-- Create achievements table matching TypeScript types
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID REFERENCES kids(id) ON DELETE CASCADE NOT NULL,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kid_id, achievement_type)
);

-- Create streaks table matching TypeScript types
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID REFERENCES kids(id) ON DELETE CASCADE NOT NULL,
  family_id UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kid_id)
);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

-- RLS policies for achievements
CREATE POLICY "Users can view achievements in their family"
  ON achievements FOR SELECT
  USING (
    kid_id IN (
      SELECT id FROM kids WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert achievements"
  ON achievements FOR INSERT
  WITH CHECK (true);

-- RLS policies for streaks
CREATE POLICY "Users can view streaks in their family"
  ON streaks FOR SELECT
  USING (
    kid_id IN (
      SELECT id FROM kids WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage streaks"
  ON streaks FOR ALL
  USING (true)
  WITH CHECK (true);

-- Gamification trigger function with proper achievement details
CREATE OR REPLACE FUNCTION process_transaction_gamification()
RETURNS TRIGGER AS $$
DECLARE
  kid_total INTEGER;
  kid_family_id UUID;
  activity_date DATE;
  streak_record RECORD;
BEGIN
  IF NEW.amount > 0 AND NEW.kid_id IS NOT NULL THEN
    -- Get kid's family_id
    SELECT family_id INTO kid_family_id FROM kids WHERE id = NEW.kid_id;
    
    -- Update total_earned
    UPDATE kids 
    SET total_earned = COALESCE(total_earned, 0) + NEW.amount
    WHERE id = NEW.kid_id
    RETURNING total_earned INTO kid_total;

    -- Update level based on total
    UPDATE kids
    SET level = CASE
      WHEN kid_total >= 500 THEN 'gold'
      WHEN kid_total >= 200 THEN 'silver'
      ELSE 'bronze'
    END
    WHERE id = NEW.kid_id;

    -- Award achievements with full details
    -- Getting started (first transaction)
    INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
    VALUES (NEW.kid_id, kid_family_id, 'getting_started', 'Getting Started! 🎯', 'Complete your first task', '🎯')
    ON CONFLICT (kid_id, achievement_type) DO NOTHING;

    -- First points (10+)
    IF kid_total >= 10 THEN
      INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
      VALUES (NEW.kid_id, kid_family_id, 'first_points', 'First Steps! 🌟', 'Earn your first 10 points', '🌟')
      ON CONFLICT (kid_id, achievement_type) DO NOTHING;
    END IF;

    -- Century club (100+)
    IF kid_total >= 100 THEN
      INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
      VALUES (NEW.kid_id, kid_family_id, 'century_club', 'Century Club! 💯', 'Earn 100 total points', '💯')
      ON CONFLICT (kid_id, achievement_type) DO NOTHING;
    END IF;

    -- High roller (500+)
    IF kid_total >= 500 THEN
      INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
      VALUES (NEW.kid_id, kid_family_id, 'high_roller', 'High Roller! 🏆', 'Earn 500 total points', '🏆')
      ON CONFLICT (kid_id, achievement_type) DO NOTHING;
    END IF;

    -- Update streaks
    activity_date := CURRENT_DATE;
    
    SELECT * INTO streak_record
    FROM streaks
    WHERE kid_id = NEW.kid_id;

    IF streak_record IS NULL THEN
      INSERT INTO streaks (kid_id, family_id, current_streak, longest_streak, last_activity_date)
      VALUES (NEW.kid_id, kid_family_id, 1, 1, activity_date);
    ELSE
      IF streak_record.last_activity_date = activity_date - INTERVAL '1 day' THEN
        UPDATE streaks
        SET current_streak = current_streak + 1,
            longest_streak = GREATEST(longest_streak, current_streak + 1),
            last_activity_date = activity_date,
            updated_at = NOW()
        WHERE kid_id = NEW.kid_id;
      ELSIF streak_record.last_activity_date < activity_date THEN
        UPDATE streaks
        SET current_streak = 1,
            last_activity_date = activity_date,
            updated_at = NOW()
        WHERE kid_id = NEW.kid_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER transaction_gamification_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION process_transaction_gamification();
