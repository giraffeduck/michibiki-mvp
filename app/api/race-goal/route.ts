// /app/api/race-goal/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: 新規レース目標の登録
export async function POST(req: NextRequest) {
  const { 
    race_name,
    race_date,
    swim_distance_km,
    bike_distance_km,
    run_distance_km,
    target_total_time,
    target_swim_time,
    target_bike_time,
    target_run_time,
    target_rank,
    goal_type,
    is_a_race,
    motivation,
    training_time_weekday_hr,
    training_time_weekend_hr,
    training_limit_comment
  } = await req.json()

  const stravaIdHeader = req.headers.get('x-strava-id')
  if (!stravaIdHeader) {
    return NextResponse.json({ error: 'Missing strava_id' }, { status: 401 })
  }

  const strava_id = parseInt(stravaIdHeader)

  const { data, error } = await supabase.from('race_goal_entry').insert({
    strava_id,
    race_name,
    race_date,
    swim_distance_km,
    bike_distance_km,
    run_distance_km,
    target_total_time,
    target_swim_time,
    target_bike_time,
    target_run_time,
    target_rank,
    goal_type,
    is_a_race,
    motivation,
    training_time_weekday_hr,
    training_time_weekend_hr,
    training_limit_comment
  }).select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

// GET: ユーザーの目標一覧取得
export async function GET(req: NextRequest) {
  const stravaIdHeader = req.headers.get('x-strava-id')
  if (!stravaIdHeader) {
    return NextResponse.json({ error: 'Missing strava_id' }, { status: 401 })
  }

  const strava_id = parseInt(stravaIdHeader)

  const { data, error } = await supabase
    .from('race_goal_entry')
    .select('*')
    .eq('strava_id', strava_id)
    .order('race_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 200 })
}
