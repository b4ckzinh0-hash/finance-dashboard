'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { OfflineProvider } from '@/contexts/offline-context'
import { OfflineIndicator } from '@/components/offline-indicator'
import { DataProvider } from '@/contexts/data-provider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <OfflineProvider>
      <DataProvider>
        <OfflineIndicator />
        <div className="min-h-screen bg-background flex">
          <Sidebar />
          <div className="flex-1 flex flex-col md:ml-64">
            <Header />
            <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">
              {children}
            </main>
          </div>
          <MobileNav />
        </div>
      </DataProvider>
    </OfflineProvider>
  )
}
