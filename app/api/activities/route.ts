// app/api/activities/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const strava_id = searchParams.get('strava_id')
  const start = searchParams.get('start') // YYYY-MM-DD
  const end = searchParams.get('end')     // YYYY-MM-DD

  if (!strava_id) {
    return NextResponse.json({ error: 'Missing strava_id' }, { status: 400 })
  }

  // クエリを組み立て
  let query = supabase
    .from('activities')
    .select('id, name, type, distance, moving_time, start_date')
    .eq('strava_id', strava_id)
    .order('start_date', { ascending: false })

  if (start) {
    query = query.gte('start_date', `${start}T00:00:00Z`)
  }

  if (end) {
    query = query.lte('start_date', `${end}T23:59:59Z`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Supabase query failed', details: error }, { status: 500 })
  }

  return NextResponse.json(data)
}
