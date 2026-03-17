import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'Finance Dashboard',
  description: 'Dashboard de finanças pessoais',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="font-sans bg-gray-950 text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
