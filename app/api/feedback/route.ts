// app/api/feedback/route.ts

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
    .from('feedback_log')
    .select('*')
    .eq('strava_id', strava_id)
    .order('week_start', { ascending: false })

  if (error) {
    console.error('GET /feedback error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const stravaIdHeader = req.headers.get('x-strava-id')
  if (!stravaIdHeader) {
    return NextResponse.json({ error: 'Unauthorized: missing strava_id' }, { status: 401 })
  }

  const strava_id = Number(stravaIdHeader)
  if (isNaN(strava_id)) {
    return NextResponse.json({ error: 'Invalid strava_id format' }, { status: 400 })
  }

  const body = await req.json()
  const { week_start, feedback_text } = body

  if (!week_start || !feedback_text) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const payload = { strava_id, week_start, feedback_text }
  console.log('insert payload:', payload)

  const { data, error } = await supabase
    .from('feedback_log')
    .insert([payload])
    .select()

  if (error) {
    console.error('POST /feedback insert error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
