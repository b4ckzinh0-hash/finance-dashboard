# FinançasPRO — Dashboard de Finanças Pessoais

Dashboard completo de finanças pessoais construído com **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase** e **Chart.js**.

## ✨ Funcionalidades

- 🔐 **Autenticação** — Login e cadastro via Supabase Auth
- 📊 **Dashboard** — Visão geral financeira com cards de saldo, receitas e despesas
- 💸 **Transações** — Criação, edição e exclusão via modal
- 📈 **Gráficos** — Rosca por categoria + Linha de saldo ao longo do tempo
- 🔍 **Filtros** — Por mês e categoria
- ⚡ **Tempo real** — Sincronização via Supabase Realtime
- 🇧🇷 **i18n PT-BR** — Interface em português, moeda R$ (BRL), datas dd/mm/aaaa

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 14 (App Router) |
| Linguagem | TypeScript |
| Estilos | Tailwind CSS (dark mode padrão) |
| Banco / Auth | Supabase |
| Gráficos | Chart.js + react-chartjs-2 |
| Deploy | Vercel |

## 🚀 Configuração

### 1. Clone e instale as dependências

```bash
git clone <repo-url>
cd finance-dashboard
npm install
```

### 2. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha com suas credenciais do Supabase:

```bash
cp .env.local.example .env.local
```

Edite `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

> Encontre esses valores em: **Supabase Dashboard → Settings → API**

### 3. Crie as tabelas no Supabase

No painel do Supabase, acesse **SQL Editor** e execute o conteúdo do arquivo:

```
supabase/schema.sql
```

Isso irá:
- Criar a tabela `transactions` com RLS habilitado
- Configurar políticas de segurança por usuário
- Habilitar o Realtime na tabela

### 4. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
├── app/
│   ├── layout.tsx          # Layout raiz (dark mode)
│   ├── page.tsx            # Redireciona para /dashboard
│   ├── login/page.tsx      # Página de login
│   ├── register/page.tsx   # Página de cadastro
│   └── dashboard/page.tsx  # Dashboard principal (protegido)
├── components/
│   ├── Header.tsx          # Cabeçalho com logo e logout
│   ├── SummaryCards.tsx    # Cards: saldo, receitas, despesas
│   ├── TransactionList.tsx # Lista de transações com ações
│   ├── TransactionModal.tsx# Modal para criar/editar transação
│   ├── CategoryChart.tsx   # Gráfico rosca por categoria
│   ├── BalanceChart.tsx    # Gráfico de linha do saldo
│   ├── Filters.tsx         # Filtros de mês e categoria
│   └── ProtectedRoute.tsx  # HOC de proteção de rotas
├── lib/
│   └── supabase.ts         # Cliente Supabase + tipos + constantes
├── supabase/
│   └── schema.sql          # SQL para criar tabelas
├── styles/
│   └── globals.css         # Estilos globais + Tailwind
└── .env.local.example      # Exemplo de variáveis de ambiente
```

## 🏗️ Deploy na Vercel

1. Conecte o repositório na [Vercel](https://vercel.com)
2. Adicione as variáveis de ambiente no painel da Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Clique em **Deploy**

## 🗄️ Schema do Banco de Dados

```sql
transactions (
  id          uuid PRIMARY KEY,
  user_id     uuid REFERENCES auth.users,
  amount      numeric NOT NULL CHECK (amount > 0),
  type        text CHECK (type IN ('income', 'expense')),
  category    text NOT NULL,
  date        date NOT NULL,
  description text,
  created_at  timestamptz DEFAULT now()
)
```

Row Level Security (RLS) está habilitado — cada usuário acessa apenas suas próprias transações.

## 📋 Categorias Disponíveis

Alimentação · Aluguel · Transporte · Lazer · Saúde · Educação · Salário · Freelance · Outros

## 🧑‍💻 Scripts

```bash
npm run dev    # Servidor de desenvolvimento
npm run build  # Build de produção
npm run start  # Iniciar servidor de produção
npm run lint   # Verificar lint
```
