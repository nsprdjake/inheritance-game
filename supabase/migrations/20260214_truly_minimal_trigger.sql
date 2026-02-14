-- TRULY MINIMAL TRIGGER
-- This replaces the gamification trigger with ONLY level/total_earned updates
-- NO achievement logic, NO streak logic, NO checks
-- Achievement checker runs separately as a cron job

-- Drop the old trigger
DROP TRIGGER IF EXISTS gamification_trigger ON transactions;

-- Replace with minimal version
CREATE OR REPLACE FUNCTION transaction_gamification_trigger()
RETURNS TRIGGER AS $$
DECLARE
  total INTEGER;
  new_level TEXT;
BEGIN
  -- Only process positive transactions (awards)
  IF NEW.amount > 0 THEN
    -- Calculate total earned (inline, no function call)
    SELECT COALESCE(SUM(amount), 0) INTO total
    FROM transactions
    WHERE kid_id = NEW.kid_id AND amount > 0;
    
    -- Determine level
    IF total >= 500 THEN
      new_level := 'gold';
    ELSIF total >= 200 THEN
      new_level := 'silver';
    ELSE
      new_level := 'bronze';
    END IF;
    
    -- Single atomic UPDATE: total_earned + level
    UPDATE kids 
    SET 
      total_earned = total,
      level = new_level
    WHERE id = NEW.kid_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER gamification_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION transaction_gamification_trigger();
