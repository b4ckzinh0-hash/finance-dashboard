import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'
import { NotificationProvider } from '@/contexts/notification-context'
import { Toaster } from '@/components/ui/toaster'


export const viewport: Viewport = {
  themeColor: '#8b5cf6',
}

export const metadata: Metadata = {
  title: 'FinanceApp - Controle Financeiro Pessoal',
  description: 'Sistema completo de finanças pessoais com inteligência artificial',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Finanças',
  },
  icons: {
    apple: '/icons/icon-192x192.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="font-sans antialiased">
        <AuthProvider>
          <NotificationProvider>
            {children}
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
