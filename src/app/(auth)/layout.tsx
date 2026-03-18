// Auth pages depend on runtime Supabase state — opt out of static generation.
export const dynamic = 'force-dynamic'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
