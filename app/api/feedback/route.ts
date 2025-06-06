// app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const strava_id = url.searchParams.get('strava_id')
  const week = url.searchParams.get('week')

  console.log('🟡 GET /feedback called')
  console.log('req.url:', req.url)
  console.log('Authorization header:', req.headers.get('Authorization'))
  console.log('query strava_id:', strava_id, 'week:', week)

  if (!strava_id || !week) {
    return NextResponse.json(
      { error: 'Missing required query parameters (strava_id, week)' },
      { status: 400 }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('feedback_log')
    .select('*')
    .eq('strava_id', strava_id)
    .eq('week_start', week)
    .order('week_start', { ascending: false })

  if (error) {
    console.error('❌ Supabase error (feedback):', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('✅ feedbacks fetched:', data?.length ?? 0)
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { strava_id, week_start, feedback_text } = body

  console.log('🟡 POST /feedback called')
  console.log('payload:', body)

  if (!strava_id || !week_start || !feedback_text) {
    return NextResponse.json(
      { error: 'Missing required fields (strava_id, week_start, feedback_text)' },
      { status: 400 }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const payload = { strava_id, week_start, feedback_text }

  const { data, error } = await supabase
    .from('feedback_log')
    .insert([payload])
    .select()

  if (error) {
    console.error('❌ Supabase insert error (feedback):', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('✅ feedback inserted:', data)
  return NextResponse.json(data)
}
