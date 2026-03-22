import { createBrowserClient } from '@supabase/ssr'

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    // During SSR/build without credentials, skip client creation.
    // All callers are 'use client' components that only use the client
    // inside useEffect or event handlers — both of which run client-side only.
    if (!url || !key) return null as unknown as ReturnType<typeof createBrowserClient>
    client = createBrowserClient(url, key)
  }
  return client
}