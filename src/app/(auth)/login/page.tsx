import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            FinanceApp
          </h1>
          <p className="text-muted-foreground mt-2">Controle suas finanças com inteligência</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
