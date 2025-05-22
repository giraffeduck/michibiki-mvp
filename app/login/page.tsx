// /app/login/page.tsx
'use client'

import { createClient } from '@supabase/supabase-js'

export default function LoginPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'strava',
      options: {
        redirectTo: 'http://localhost:3000/api/auth/callback'
      }
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <button onClick={handleLogin} className="px-6 py-2 bg-orange-500 text-white rounded-xl">
        Stravaでログイン
      </button>
    </div>
  )
}
