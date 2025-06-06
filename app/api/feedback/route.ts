// app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const strava_id = url.searchParams.get('strava_id')
  const week = url.searchParams.get('week')

  if (!strava_id || !week) {
    return NextResponse.json({ error: 'Missing query parameters' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization') ?? '',
        },
      }
    }
  )

  const { data, error } = await supabase
    .from('feedback_log')
    .select('*')
    .eq('strava_id', strava_id)
    .eq('week_start', week)
    .order('week_start', { ascending: false })

  if (error) {
    console.error('GET /feedback error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { strava_id, week_start, feedback_text } = body

  if (!strava_id || !week_start || !feedback_text) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization') ?? '',
        },
      }
    }
  )

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

  return NextResponse.json(data)
}
