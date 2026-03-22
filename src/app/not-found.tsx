import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="space-y-2">
          <h1 className="text-8xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-2xl font-bold">Página não encontrada</h2>
          <p className="text-muted-foreground text-sm">
            A página que você está procurando não existe ou foi movida.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button asChild className="bg-violet-600 hover:bg-violet-700">
            <Link href="/dashboard">
              <Home className="h-4 w-4 mr-2" />
              Ir para o Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
