// app/api/activities/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const strava_id = url.searchParams.get('strava_id')
  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')

  console.log('🟡 GET /activities called')
  console.log('req.url:', req.url)
  console.log('Authorization header:', req.headers.get('Authorization'))
  console.log('query strava_id:', strava_id)
  console.log('start:', start, 'end:', end)

  if (!strava_id || !start || !end) {
    return NextResponse.json(
      { error: 'Missing required query parameters (strava_id, start, end)' },
      { status: 400 }
    )
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('strava_id', strava_id)
    .gte('start_date', start)
    .lte('start_date', end)
    .order('start_date', { ascending: true })

  if (error) {
    console.error('❌ Supabase error (activities):', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('✅ activities fetched:', data?.length ?? 0)
  return NextResponse.json(data)
}
