// app/api/activities/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const stravaIdHeader = req.headers.get('x-strava-id')
  if (!stravaIdHeader) {
    return NextResponse.json({ error: 'Unauthorized: missing strava_id' }, { status: 401 })
  }

  const strava_id = Number(stravaIdHeader)
  if (isNaN(strava_id)) {
    return NextResponse.json({ error: 'Invalid strava_id format' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('strava_id', strava_id)
    .order('start_date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
