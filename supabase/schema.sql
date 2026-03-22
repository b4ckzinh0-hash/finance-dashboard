-- ============================================================
-- Finance Dashboard - Supabase Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  avatar_url  TEXT,
  currency    TEXT NOT NULL DEFAULT 'BRL',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete" ON profiles FOR DELETE USING (auth.uid() = id);

-- ============================================================
-- ACCOUNTS
-- ============================================================
CREATE TABLE IF NOT EXISTS accounts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,
  balance     DECIMAL(15, 2) NOT NULL DEFAULT 0,
  color       TEXT NOT NULL,
  icon        TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts_select" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "accounts_insert" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "accounts_update" ON accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "accounts_delete" ON accounts FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,           -- 'expense' | 'income'
  icon        TEXT NOT NULL,
  color       TEXT NOT NULL,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  parent_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select" ON categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "categories_insert" ON categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update" ON categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "categories_delete" ON categories FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id       UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id      UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  type             TEXT NOT NULL,      -- 'income' | 'expense' | 'transfer'
  amount           DECIMAL(15, 2) NOT NULL,
  description      TEXT NOT NULL,
  date             DATE NOT NULL,
  payment_method   TEXT NOT NULL,
  notes            TEXT,
  is_recurring     BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_id     UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "transactions_delete" ON transactions FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS goals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  target_amount   DECIMAL(15, 2) NOT NULL,
  current_amount  DECIMAL(15, 2) NOT NULL DEFAULT 0,
  deadline        DATE,
  icon            TEXT NOT NULL,
  color           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active',  -- 'active' | 'completed' | 'cancelled'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_select" ON goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "goals_insert" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_update" ON goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "goals_delete" ON goals FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- RECURRING EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id     UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name            TEXT NOT NULL,
  amount          DECIMAL(15, 2) NOT NULL,
  frequency       TEXT NOT NULL,       -- 'daily' | 'weekly' | 'monthly' | 'yearly'
  next_due_date   DATE NOT NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring_expenses_select" ON recurring_expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "recurring_expenses_insert" ON recurring_expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "recurring_expenses_update" ON recurring_expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "recurring_expenses_delete" ON recurring_expenses FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL,           -- 'info' | 'warning' | 'success' | 'error'
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- DEFAULT CATEGORIES FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION create_default_categories(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Expense categories
  INSERT INTO categories (user_id, name, icon, color, type, is_default) VALUES
    (p_user_id, 'Alimentação',   '🍔', '#EF4444', 'expense', TRUE),
    (p_user_id, 'Moradia',       '🏠', '#F97316', 'expense', TRUE),
    (p_user_id, 'Transporte',    '🚗', '#EAB308', 'expense', TRUE),
    (p_user_id, 'Educação',      '📚', '#3B82F6', 'expense', TRUE),
    (p_user_id, 'Saúde',         '🏥', '#EC4899', 'expense', TRUE),
    (p_user_id, 'Lazer',         '🎮', '#8B5CF6', 'expense', TRUE),
    (p_user_id, 'Vestuário',     '👗', '#F43F5E', 'expense', TRUE),
    (p_user_id, 'Contas',        '📋', '#6B7280', 'expense', TRUE),
    (p_user_id, 'Compras',       '🛒', '#10B981', 'expense', TRUE),
    (p_user_id, 'Assinaturas',   '📱', '#06B6D4', 'expense', TRUE),
    (p_user_id, 'Pets',          '🐾', '#84CC16', 'expense', TRUE),
    (p_user_id, 'Beleza',        '💄', '#D946EF', 'expense', TRUE),
    (p_user_id, 'Outros',        '📦', '#9CA3AF', 'expense', TRUE);

  -- Income categories
  INSERT INTO categories (user_id, name, icon, color, type, is_default) VALUES
    (p_user_id, 'Salário',       '💰', '#22C55E', 'income', TRUE),
    (p_user_id, 'Freelance',     '💻', '#0EA5E9', 'income', TRUE),
    (p_user_id, 'Investimentos', '📈', '#A855F7', 'income', TRUE),
    (p_user_id, 'Presentes',     '🎁', '#F59E0B', 'income', TRUE),
    (p_user_id, 'Outros',        '➕', '#9CA3AF', 'income', TRUE);
END;
$$;

-- ============================================================
-- NEW USER TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  -- Seed default categories
  PERFORM create_default_categories(NEW.id);

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TRANSFER BETWEEN ACCOUNTS (atomic)
-- ============================================================
CREATE OR REPLACE FUNCTION transfer_between_accounts(
  p_user_id      UUID,
  p_from_account UUID,
  p_to_account   UUID,
  p_amount       DECIMAL,
  p_description  TEXT,
  p_date         DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transfer_category_id UUID;
BEGIN
  -- Verify both accounts belong to the calling user
  IF NOT EXISTS (
    SELECT 1 FROM accounts WHERE id = p_from_account AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Source account not found or access denied';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM accounts WHERE id = p_to_account AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Destination account not found or access denied';
  END IF;

  -- Pick a fallback category (first 'expense' category for this user)
  SELECT id INTO v_transfer_category_id
  FROM categories
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Debit source account
  UPDATE accounts
  SET balance = balance - p_amount
  WHERE id = p_from_account AND user_id = p_user_id;

  -- Credit destination account
  UPDATE accounts
  SET balance = balance + p_amount
  WHERE id = p_to_account AND user_id = p_user_id;

  -- Record outgoing transfer transaction
  INSERT INTO transactions
    (user_id, account_id, category_id, type, amount, description, date, payment_method)
  VALUES
    (p_user_id, p_from_account, v_transfer_category_id, 'transfer', p_amount, p_description, p_date, 'bank_transfer');

  -- Record incoming transfer transaction
  INSERT INTO transactions
    (user_id, account_id, category_id, type, amount, description, date, payment_method)
  VALUES
    (p_user_id, p_to_account, v_transfer_category_id, 'transfer', p_amount, p_description, p_date, 'bank_transfer');
END;
$$;


CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- COMPOSITE INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type_date ON transactions(user_id, type, date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_active ON accounts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_user_due ON recurring_expenses(user_id, next_due_date);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read, created_at);

-- ============================================================
-- BUDGETS
-- ============================================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  rollover BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_id, month, year)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) DEFAULT '#8B5CF6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own tags" ON tags FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- TRANSACTION TAGS (N:N)
-- ============================================================
CREATE TABLE IF NOT EXISTS transaction_tags (
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (transaction_id, tag_id)
);

ALTER TABLE transaction_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own transaction tags" ON transaction_tags FOR ALL
  USING (EXISTS (SELECT 1 FROM transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid()));

-- ============================================================
-- CREDIT CARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  limit_amount DECIMAL(12, 2) NOT NULL,
  closing_day INTEGER NOT NULL CHECK (closing_day BETWEEN 1 AND 31),
  due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  color VARCHAR(7) DEFAULT '#8B5CF6',
  icon VARCHAR(50) DEFAULT 'credit-card',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own credit cards" ON credit_cards FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON credit_cards FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- INSTALLMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS installments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  credit_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
  total_installments INTEGER NOT NULL,
  current_installment INTEGER NOT NULL,
  installment_amount DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own installments" ON installments FOR ALL
  USING (EXISTS (SELECT 1 FROM transactions t WHERE t.id = transaction_id AND t.user_id = auth.uid()));

-- ============================================================
-- NET WORTH SNAPSHOTS
-- ============================================================
CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_assets DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_liabilities DECIMAL(12, 2) NOT NULL DEFAULT 0,
  net_worth DECIMAL(12, 2) GENERATED ALWAYS AS (total_assets - total_liabilities) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own net worth snapshots" ON net_worth_snapshots FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- AUTOMATION RULES
-- ============================================================
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  condition_type VARCHAR(50) NOT NULL,
  condition_value TEXT NOT NULL,
  action_type VARCHAR(50) NOT NULL,
  action_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own automation rules" ON automation_rules FOR ALL USING (auth.uid() = user_id);
CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON automation_rules FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- IMPORT HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS import_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  filename VARCHAR(255) NOT NULL,
  format VARCHAR(10) NOT NULL,
  records_imported INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own import history" ON import_history FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- ATTACHMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own attachments" ON attachments FOR ALL USING (auth.uid() = user_id);