-- Fix achievement RLS blocking issue
-- The trigger runs as the user creating the transaction (parent), but RLS blocks achievement insertion
-- Solution: Make check_achievements() run with SECURITY DEFINER (bypasses RLS)

CREATE OR REPLACE FUNCTION check_achievements(kid_uuid UUID, family_uuid UUID)
RETURNS VOID 
SECURITY DEFINER -- This makes it run with the function owner's permissions, bypassing RLS
SET search_path = public
AS $$
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
  
  -- Use INSERT ... ON CONFLICT DO NOTHING to prevent duplicates
  
  -- First Points (10+)
  IF total_earned >= 10 THEN
    INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
    VALUES (kid_uuid, family_uuid, 'first_points', 'First Steps! 🌟', 'Earned your first 10 points', '🌟')
    ON CONFLICT (kid_id, achievement_type) DO NOTHING;
  END IF;
  
  -- Century Club (100+)
  IF total_earned >= 100 THEN
    INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
    VALUES (kid_uuid, family_uuid, 'century_club', 'Century Club! 💯', 'Earned 100 total points', '💯')
    ON CONFLICT (kid_id, achievement_type) DO NOTHING;
  END IF;
  
  -- High Roller (500+)
  IF total_earned >= 500 THEN
    INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
    VALUES (kid_uuid, family_uuid, 'high_roller', 'High Roller! 🏆', 'Earned 500 total points', '🏆')
    ON CONFLICT (kid_id, achievement_type) DO NOTHING;
  END IF;
  
  -- Getting Started
  IF transaction_count = 1 THEN
    INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
    VALUES (kid_uuid, family_uuid, 'getting_started', 'Getting Started! 🎯', 'Completed your first task', '🎯')
    ON CONFLICT (kid_id, achievement_type) DO NOTHING;
  END IF;
  
  -- Saver Badge (saved 50% of balance)
  IF balance >= 50 AND total_earned >= 100 AND balance::float / total_earned::float >= 0.5 THEN
    INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
    VALUES (kid_uuid, family_uuid, 'saver', 'Smart Saver! 🐷', 'Saved 50% of earnings', '🐷')
    ON CONFLICT (kid_id, achievement_type) DO NOTHING;
  END IF;
  
  -- Big Spender (spent 100+)
  DECLARE
    total_spent INTEGER;
  BEGIN
    SELECT COALESCE(SUM(ABS(amount)), 0) INTO total_spent
    FROM transactions WHERE kid_id = kid_uuid AND amount < 0;
    
    IF total_spent >= 100 THEN
      INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
      VALUES (kid_uuid, family_uuid, 'big_spender', 'Big Spender! 💸', 'Spent 100+ points on rewards', '💸')
      ON CONFLICT (kid_id, achievement_type) DO NOTHING;
    END IF;
  END;
  
  -- Consistent Earner (10+ transactions)
  IF transaction_count >= 10 THEN
    INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
    VALUES (kid_uuid, family_uuid, 'consistent_earner', 'Consistent Earner! ⭐', 'Completed 10+ tasks', '⭐')
    ON CONFLICT (kid_id, achievement_type) DO NOTHING;
  END IF;
  
  -- Mega Earner (1000+)
  IF total_earned >= 1000 THEN
    INSERT INTO achievements (kid_id, family_id, achievement_type, title, description, icon)
    VALUES (kid_uuid, family_uuid, 'mega_earner', 'Mega Earner! 💎', 'Earned 1000 total points', '💎')
    ON CONFLICT (kid_id, achievement_type) DO NOTHING;
  END IF;
  
END;
$$ LANGUAGE plpgsql;
