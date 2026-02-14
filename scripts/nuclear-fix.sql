-- NUCLEAR OPTION: Remove ALL achievement logic from trigger

-- Drop everything
DROP TRIGGER IF EXISTS transaction_gamification_trigger ON transactions CASCADE;
DROP FUNCTION IF EXISTS process_transaction_gamification() CASCADE;

-- Create minimal trigger - ONLY points and levels
CREATE OR REPLACE FUNCTION process_transaction_gamification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update points and levels, NO achievements
  IF NEW.amount > 0 AND NEW.kid_id IS NOT NULL THEN
    UPDATE kids 
    SET total_earned = COALESCE(total_earned, 0) + NEW.amount,
        level = CASE
          WHEN COALESCE(total_earned, 0) + NEW.amount >= 500 THEN 'gold'
          WHEN COALESCE(total_earned, 0) + NEW.amount >= 200 THEN 'silver'
          ELSE 'bronze'
        END
    WHERE id = NEW.kid_id;
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never fail the transaction
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger
CREATE TRIGGER transaction_gamification_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION process_transaction_gamification();

-- Verify
SELECT 'Nuclear fix complete - NO achievement logic in trigger' as status;
