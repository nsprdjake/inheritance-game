-- ABSOLUTE MINIMAL TRIGGER
-- ONLY updates points and levels
-- ZERO achievement logic
-- ZERO possibility of duplicate errors

DROP TRIGGER IF EXISTS transaction_gamification_trigger ON transactions CASCADE;
DROP FUNCTION IF EXISTS process_transaction_gamification() CASCADE;

CREATE FUNCTION process_transaction_gamification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if kid_id exists and amount is positive
  IF NEW.kid_id IS NOT NULL AND NEW.amount > 0 THEN
    -- Update points and level in ONE atomic operation
    UPDATE kids 
    SET 
      total_earned = COALESCE(total_earned, 0) + NEW.amount,
      level = CASE
        WHEN COALESCE(total_earned, 0) + NEW.amount >= 500 THEN 'gold'
        WHEN COALESCE(total_earned, 0) + NEW.amount >= 200 THEN 'silver'
        ELSE 'bronze'
      END
    WHERE id = NEW.kid_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_gamification_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION process_transaction_gamification();
