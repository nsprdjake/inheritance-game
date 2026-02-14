-- First, clean up any existing duplicate achievements
DELETE FROM achievements a
USING achievements b
WHERE a.id > b.id 
  AND a.kid_id = b.kid_id 
  AND a.achievement_type = b.achievement_type;

-- The unique constraint already exists, no need to recreate it
-- Just verify it's there (it should be from the earlier migration)

-- Verify the trigger function has proper ON CONFLICT handling
-- (This should already be there but let's be explicit)
CREATE OR REPLACE FUNCTION process_transaction_gamification()
RETURNS TRIGGER AS $$
DECLARE
  kid_total INTEGER;
  kid_family_id UUID;
  activity_date DATE;
  streak_record RECORD;
  transaction_count INTEGER;
  spending_total INTEGER;
BEGIN
  IF NEW.kid_id IS NOT NULL THEN
    -- Get kid's family_id
    SELECT family_id INTO kid_family_id FROM kids WHERE id = NEW.kid_id;
    
    -- Count total transactions
    SELECT COUNT(*) INTO transaction_count
    FROM transactions
    WHERE kid_id = NEW.kid_id;
    
    -- EARNING ACHIEVEMENTS (positive amounts)
    IF NEW.amount > 0 THEN
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

      -- Award achievements (with explicit ON CONFLICT handling)
      
      -- Getting started (first transaction)
      INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
      VALUES (NEW.kid_id, kid_family_id, 'getting_started', 'Getting Started!', 'Complete your first task', '🎯')
      ON CONFLICT (kid_id, achievement_type) DO NOTHING;

      -- First steps (10+)
      IF kid_total >= 10 THEN
        INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
        VALUES (NEW.kid_id, kid_family_id, 'first_points', 'First Steps!', 'Earn your first 10 points', '🌟')
        ON CONFLICT (kid_id, achievement_type) DO NOTHING;
      END IF;

      -- Half century (50+)
      IF kid_total >= 50 THEN
        INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
        VALUES (NEW.kid_id, kid_family_id, 'half_century', 'Half Century!', 'Earn 50 total points', '⭐')
        ON CONFLICT (kid_id, achievement_type) DO NOTHING;
      END IF;

      -- Century club (100+)
      IF kid_total >= 100 THEN
        INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
        VALUES (NEW.kid_id, kid_family_id, 'century_club', 'Century Club!', 'Earn 100 total points', '💯')
        ON CONFLICT (kid_id, achievement_type) DO NOTHING;
      END IF;

      -- Silver status (200+)
      IF kid_total >= 200 THEN
        INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
        VALUES (NEW.kid_id, kid_family_id, 'silver_status', 'Silver Status!', 'Reach silver level', '🥈')
        ON CONFLICT (kid_id, achievement_type) DO NOTHING;
      END IF;

      -- High roller (500+)
      IF kid_total >= 500 THEN
        INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
        VALUES (NEW.kid_id, kid_family_id, 'high_roller', 'High Roller!', 'Earn 500 total points', '🏆')
        ON CONFLICT (kid_id, achievement_type) DO NOTHING;
      END IF;

      -- Elite (1000+)
      IF kid_total >= 1000 THEN
        INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
        VALUES (NEW.kid_id, kid_family_id, 'elite', 'Elite Status!', 'Earn 1000 total points', '👑')
        ON CONFLICT (kid_id, achievement_type) DO NOTHING;
      END IF;

      -- Legend (2500+)
      IF kid_total >= 2500 THEN
        INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
        VALUES (NEW.kid_id, kid_family_id, 'legend', 'Living Legend!', 'Earn 2500 total points', '🌟')
        ON CONFLICT (kid_id, achievement_type) DO NOTHING;
      END IF;

      -- Big task (single transaction 50+)
      IF NEW.amount >= 50 THEN
        INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
        VALUES (NEW.kid_id, kid_family_id, 'big_task', 'Big Task Master!', 'Complete a 50+ point task', '💪')
        ON CONFLICT (kid_id, achievement_type) DO NOTHING;
      END IF;

      -- Huge task (single transaction 100+)
      IF NEW.amount >= 100 THEN
        INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
        VALUES (NEW.kid_id, kid_family_id, 'huge_task', 'Huge Achievement!', 'Complete a 100+ point task', '🔥')
        ON CONFLICT (kid_id, achievement_type) DO NOTHING;
      END IF;

      -- Update streaks (only for earning)
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
          
          -- Streak milestones
          IF streak_record.current_streak + 1 = 3 THEN
            INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
            VALUES (NEW.kid_id, kid_family_id, 'streak_3', '3-Day Streak!', 'Earn points 3 days in a row', '🔥')
            ON CONFLICT (kid_id, achievement_type) DO NOTHING;
          END IF;
          
          IF streak_record.current_streak + 1 = 7 THEN
            INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
            VALUES (NEW.kid_id, kid_family_id, 'streak_7', 'Week Warrior!', 'Earn points 7 days in a row', '🔥🔥')
            ON CONFLICT (kid_id, achievement_type) DO NOTHING;
          END IF;
          
          IF streak_record.current_streak + 1 = 30 THEN
            INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
            VALUES (NEW.kid_id, kid_family_id, 'streak_30', 'Month Master!', 'Earn points 30 days in a row', '🔥🔥🔥')
            ON CONFLICT (kid_id, achievement_type) DO NOTHING;
          END IF;
        ELSIF streak_record.last_activity_date < activity_date THEN
          UPDATE streaks
          SET current_streak = 1,
              last_activity_date = activity_date,
              updated_at = NOW()
          WHERE kid_id = NEW.kid_id;
        END IF;
      END IF;
    END IF;
    
    -- SPENDING ACHIEVEMENTS (negative amounts - redemptions)
    IF NEW.amount < 0 THEN
      -- Calculate total spending
      SELECT SUM(ABS(amount)) INTO spending_total
      FROM transactions
      WHERE kid_id = NEW.kid_id AND amount < 0;
      
      -- First redemption
      INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
      VALUES (NEW.kid_id, kid_family_id, 'first_redemption', 'First Reward!', 'Redeem your first reward', '🎁')
      ON CONFLICT (kid_id, achievement_type) DO NOTHING;
      
      -- Big spender (single redemption 100+)
      IF ABS(NEW.amount) >= 100 THEN
        INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
        VALUES (NEW.kid_id, kid_family_id, 'big_spender', 'Big Spender!', 'Redeem 100+ points at once', '💸')
        ON CONFLICT (kid_id, achievement_type) DO NOTHING;
      END IF;
    END IF;
    
    -- ACTIVITY MILESTONES (any transaction type)
    IF transaction_count >= 10 THEN
      INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
      VALUES (NEW.kid_id, kid_family_id, 'active_10', 'Active Kid!', 'Complete 10 transactions', '📊')
      ON CONFLICT (kid_id, achievement_type) DO NOTHING;
    END IF;
    
    IF transaction_count >= 50 THEN
      INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
      VALUES (NEW.kid_id, kid_family_id, 'active_50', 'Super Active!', 'Complete 50 transactions', '📈')
      ON CONFLICT (kid_id, achievement_type) DO NOTHING;
    END IF;
    
    IF transaction_count >= 100 THEN
      INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
      VALUES (NEW.kid_id, kid_family_id, 'active_100', 'Transaction Pro!', 'Complete 100 transactions', '🎯')
      ON CONFLICT (kid_id, achievement_type) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Gamification trigger error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
