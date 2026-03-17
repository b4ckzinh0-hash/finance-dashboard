-- Schema SQL para criar as tabelas no Supabase
-- Execute este SQL no Editor SQL do Supabase

-- Criar tabela de transações
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  type text not null check (type in ('income', 'expense')),
  category text not null,
  date date not null,
  description text,
  created_at timestamptz default now() not null
);

-- Habilitar RLS
alter table public.transactions enable row level security;

-- Policy: usuários só veem suas próprias transações
create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

-- Policy: usuários só inserem suas próprias transações
create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

-- Policy: usuários só atualizam suas próprias transações
create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

-- Policy: usuários só deletam suas próprias transações
create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- Índice para performance
create index if not exists idx_transactions_user_date
  on public.transactions (user_id, date desc);

-- Habilitar Realtime
alter publication supabase_realtime add table public.transactions;
