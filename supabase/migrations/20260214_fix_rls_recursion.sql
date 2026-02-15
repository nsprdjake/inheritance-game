-- Fix infinite recursion in legacy_accounts RLS policies
-- The beneficiary/trustee policies were creating circular dependencies

-- Drop existing policies
DROP POLICY IF EXISTS "legacy_accounts_benefactor_all" ON legacy_accounts;
DROP POLICY IF EXISTS "legacy_accounts_trustee_select" ON legacy_accounts;
DROP POLICY IF EXISTS "legacy_accounts_beneficiary_select" ON legacy_accounts;

-- Recreate with simpler, non-recursive policies
-- Benefactors can manage their own accounts (this is the main one)
CREATE POLICY "legacy_accounts_benefactor_all" ON legacy_accounts
  FOR ALL 
  USING (benefactor_id = auth.uid());

-- For trustees/beneficiaries, use a function to avoid recursion
CREATE OR REPLACE FUNCTION user_can_view_legacy_account(account_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is benefactor
  IF EXISTS (
    SELECT 1 FROM legacy_accounts 
    WHERE id = account_id AND benefactor_id = auth.uid()
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user is accepted trustee (without recursion)
  IF EXISTS (
    SELECT 1 FROM legacy_trustees
    WHERE legacy_account_id = account_id 
      AND user_id = auth.uid() 
      AND invitation_status = 'accepted'
  ) THEN
    RETURN true;
  END IF;
  
  -- Check if user is accepted beneficiary (without recursion)
  IF EXISTS (
    SELECT 1 FROM beneficiaries
    WHERE legacy_account_id = account_id 
      AND user_id = auth.uid() 
      AND invitation_status = 'accepted'
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply the function-based policy for SELECT
CREATE POLICY "legacy_accounts_view_allowed" ON legacy_accounts
  FOR SELECT
  USING (user_can_view_legacy_account(id));
