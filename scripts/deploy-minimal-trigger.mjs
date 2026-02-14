// Use Supabase Management API to execute SQL
const SUPABASE_ACCESS_TOKEN = 'sbp_61e5d078f0490b667801e67ac2adaed2e5ba8533';
const PROJECT_REF = 'kxqrsdicrayblwpczxsy';

const migration = `
-- TRULY MINIMAL TRIGGER
DROP TRIGGER IF EXISTS gamification_trigger ON transactions;

CREATE OR REPLACE FUNCTION transaction_gamification_trigger()
RETURNS TRIGGER AS $$
DECLARE
  total INTEGER;
  new_level TEXT;
BEGIN
  IF NEW.amount > 0 THEN
    SELECT COALESCE(SUM(amount), 0) INTO total
    FROM transactions
    WHERE kid_id = NEW.kid_id AND amount > 0;
    
    IF total >= 500 THEN
      new_level := 'gold';
    ELSIF total >= 200 THEN
      new_level := 'silver';
    ELSE
      new_level := 'bronze';
    END IF;
    
    UPDATE kids 
    SET 
      total_earned = total,
      level = new_level
    WHERE id = NEW.kid_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER gamification_trigger
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION transaction_gamification_trigger();
`;

try {
  console.log('🚀 Deploying truly minimal trigger via Management API...');
  
  const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: migration
    })
  });
  
  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`API error: ${JSON.stringify(result)}`);
  }
  
  console.log('✅ Migration deployed successfully!');
  console.log('');
  console.log('The trigger now ONLY updates:');
  console.log('  - kids.total_earned');
  console.log('  - kids.level');
  console.log('');
  console.log('NO achievement logic, NO duplicate key errors.');
  console.log('Achievements are handled by achievement-checker.mjs cron job.');
} catch (err) {
  console.error('❌ Error:', err.message);
  process.exit(1);
}
