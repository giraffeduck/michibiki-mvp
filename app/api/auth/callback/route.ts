// /app/api/auth/callback/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  // Strava OAuth: アクセストークンとathlete情報を取得
  const tokenRes = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code'
    })
  })

  const tokenJson = await tokenRes.json()

  if (!tokenJson || !tokenJson.athlete || !tokenJson.athlete.id) {
    return NextResponse.json({ error: 'Failed to fetch athlete from Strava' }, { status: 500 })
  }

  const athlete = tokenJson.athlete
  const strava_id = athlete.id

  // Supabase にプロフィールを upsert
  await supabase.from('profiles').upsert({
    strava_id,
    access_token: tokenJson.access_token,
    refresh_token: tokenJson.refresh_token,
    firstname: athlete.firstname,
    lastname: athlete.lastname,
    sex: athlete.sex,
    weight: athlete.weight,
    profile: athlete.profile,
    updated_at: new Date().toISOString()
  })

  // クライアントで localStorage に strava_id を保存し、ダッシュボードへ遷移
  return new NextResponse(
    `
    <script>
      localStorage.setItem('strava_id', '${strava_id}');
      window.location.href = '/dashboard';
    </script>
    `,
    {
      headers: { 'Content-Type': 'text/html' }
    }
  )
}
