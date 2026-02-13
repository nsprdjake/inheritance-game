-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Families table (tenant isolation)
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (links to Supabase auth, references family)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'parent', 'kid')),
  kid_id UUID, -- Will reference kids table, nullable for admin/parent
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Kids table
CREATE TABLE kids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INTEGER,
  avatar TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Optional: if kid has login
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key from users to kids
ALTER TABLE users
  ADD CONSTRAINT fk_users_kid
  FOREIGN KEY (kid_id) REFERENCES kids(id) ON DELETE SET NULL;

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  kid_id UUID NOT NULL REFERENCES kids(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Points (positive = earned, negative = spent)
  reason TEXT,
  transaction_type TEXT CHECK (transaction_type IN ('award', 'redeem', 'adjustment')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family settings table
CREATE TABLE family_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL UNIQUE REFERENCES families(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'modern',
  theme_colors JSONB DEFAULT '{"primary": "#6366f1", "secondary": "#ec4899"}',
  point_values JSONB DEFAULT '{"small": 10, "medium": 25, "large": 50}',
  conversion_rate DECIMAL(10,2) DEFAULT 0.01, -- Points to dollars
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_family ON users(family_id);
CREATE INDEX idx_kids_family ON kids(family_id);
CREATE INDEX idx_transactions_family ON transactions(family_id);
CREATE INDEX idx_transactions_kid ON transactions(kid_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE kids ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_settings ENABLE ROW LEVEL SECURITY;

-- Families policies
CREATE POLICY "Users can view their own family"
  ON families FOR SELECT
  USING (id IN (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own family"
  ON families FOR UPDATE
  USING (id IN (SELECT family_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'parent')));

-- Users policies
CREATE POLICY "Users can view users in their family"
  ON users FOR SELECT
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage users in their family"
  ON users FOR ALL
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Kids policies
CREATE POLICY "Users can view kids in their family"
  ON kids FOR SELECT
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins/parents can manage kids in their family"
  ON kids FOR ALL
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'parent')));

-- Transactions policies
CREATE POLICY "Users can view transactions in their family"
  ON transactions FOR SELECT
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Kids can view their own transactions"
  ON transactions FOR SELECT
  USING (kid_id IN (SELECT kid_id FROM users WHERE id = auth.uid() AND role = 'kid'));

CREATE POLICY "Admins/parents can create transactions in their family"
  ON transactions FOR INSERT
  WITH CHECK (family_id IN (SELECT family_id FROM users WHERE id = auth.uid() AND role IN ('admin', 'parent')));

-- Family settings policies
CREATE POLICY "Users can view settings for their family"
  ON family_settings FOR SELECT
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can update settings for their family"
  ON family_settings FOR UPDATE
  USING (family_id IN (SELECT family_id FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Function to get kid's current balance
CREATE OR REPLACE FUNCTION get_kid_balance(kid_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(amount), 0)
  FROM transactions
  WHERE kid_id = kid_uuid;
$$ LANGUAGE SQL STABLE;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kids_updated_at BEFORE UPDATE ON kids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_family_settings_updated_at BEFORE UPDATE ON family_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
