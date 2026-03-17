# 💰 Finance Dashboard

Dashboard de finanças pessoais construído com Next.js 14, Supabase e Chart.js.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS** (dark mode)
- **Chart.js** + react-chartjs-2
- **Supabase** (Auth + DB + Realtime)
- Deploy na **Vercel**

## Funcionalidades

- 🔐 Login/Registro com Supabase Auth
- 📊 Dashboard com 3 cards: Saldo Total, Receitas e Despesas (em R$ BRL)
- 🍩 Gráfico Doughnut (despesas por categoria)
- 📈 Gráfico de Linha (evolução do saldo)
- ➕ Modal para adicionar/editar/excluir transações
- 🔍 Filtros por mês e categoria
- 🔄 Realtime updates via Supabase
- 🌙 Dark mode profissional
- 📱 100% responsivo
- 🇧🇷 UI em português do Brasil

## Setup

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/finance-dashboard.git
cd finance-dashboard
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais do Supabase:

```bash
cp .env.local.example .env.local
```

Edite `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 4. Configure o banco de dados no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em **SQL Editor** → **New query**
3. Cole o conteúdo de `supabase/schema.sql` e clique em **Run**

### 5. Rode localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique em **Add New Project** → importe `finance-dashboard`
3. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Clique em **Deploy** 🚀

## Estrutura do Projeto

```
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Redirect para login/dashboard
│   ├── globals.css         # Estilos globais dark mode
│   ├── login/page.tsx      # Página de login
│   ├── register/page.tsx   # Página de registro
│   └── dashboard/page.tsx  # Dashboard principal
├── components/
│   ├── Header.tsx          # Cabeçalho com botão de logout
│   ├── SummaryCards.tsx    # 3 cards (saldo, receitas, despesas)
│   ├── TransactionList.tsx # Lista de transações
│   ├── TransactionModal.tsx# Modal CRUD
│   ├── CategoryChart.tsx   # Gráfico doughnut
│   ├── BalanceChart.tsx    # Gráfico de linha
│   └── Filters.tsx         # Filtros por mês e categoria
├── lib/
│   └── supabase.ts         # Client Supabase
└── supabase/
    └── schema.sql          # Schema SQL com RLS
```
