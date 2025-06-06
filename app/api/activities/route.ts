// app/api/activities/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const strava_id = url.searchParams.get('strava_id')
  const start = url.searchParams.get('start')
  const end = url.searchParams.get('end')

  if (!strava_id || !start || !end) {
    return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization') ?? '',
        },
      },
    }
  )

  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('strava_id', strava_id)
    .gte('start_date', start)
    .lte('start_date', end)
    .order('start_date', { ascending: true })

  if (error) {
    console.error('GET /activities error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
