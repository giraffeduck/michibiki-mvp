// /app/api/strava/sync/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const STRAVA_API = 'https://www.strava.com/api/v3/athlete/activities'

// POST: 固定 strava_id で同期（本番向け）
export async function POST(req: NextRequest) {
  const strava_id = '20828320'
  return syncStravaActivities(strava_id)
}

// GET: 手動同期テスト用（strava_id をクエリで受け取る）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const strava_id = searchParams.get('strava_id')
  if (!strava_id) {
    console.error('❌ strava_id is missing in GET request')
    return NextResponse.json({ error: 'strava_id is required' }, { status: 400 })
  }
  return syncStravaActivities(strava_id)
}

async function syncStravaActivities(strava_id: string) {
  console.log(`🚴 同期開始 for strava_id: ${strava_id}`)

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('access_token')
    .eq('strava_id', strava_id)
    .single()

  if (profileError || !profile?.access_token) {
    console.error('❌ Access token 取得失敗:', profileError)
    return NextResponse.json({ error: 'Access token not found' }, { status: 401 })
  }

  const { data: latest, error: latestError } = await supabase
    .from('activities')
    .select('start_date')
    .eq('strava_id', strava_id)
    .order('start_date', { ascending: false })
    .limit(1)
    .single()

  if (latestError) {
    console.error('⚠️ 最新アクティビティ取得失敗:', latestError)
  }

  const after = latest?.start_date
    ? Math.floor(new Date(latest.start_date).getTime() / 1000)
    : 0

  console.log(`📅 最新 after=${after} (UNIX)`)

  const res = await fetch(`${STRAVA_API}?per_page=100&after=${after}`, {
    headers: {
      Authorization: `Bearer ${profile.access_token}`,
    },
  })

  const activities = await res.json()

  if (!Array.isArray(activities)) {
    console.error('❌ Strava API が配列を返しませんでした:', activities)
    return NextResponse.json({ error: 'Invalid Strava response', details: activities }, { status: 500 })
  }

  console.log(`✅ ${activities.length} 件のアクティビティを取得`)

  const upsertData = activities.map((act) => ({
    id: act.id,
    strava_id: Number(strava_id),
    name: act.name,
    type: act.type,
    start_date: act.start_date,
    distance: act.distance,
    moving_time: act.moving_time,
    elapsed_time: act.elapsed_time,
    total_elevation_gain: act.total_elevation_gain,
    average_speed: act.average_speed,
    max_speed: act.max_speed,
    average_heartrate: act.average_heartrate,
    max_heartrate: act.max_heartrate,
    average_watts: act.average_watts,
    max_watts: act.max_watts,
    cadence: act.cadence,
    workout_type: act.workout_type,
    raw: act,
  }))

  const { error: upsertError } = await supabase
    .from('activities')
    .upsert(upsertData, { onConflict: 'id' })

  if (upsertError) {
    console.error('❌ Supabase upsert 失敗:', upsertError)
    return NextResponse.json({ error: 'Failed to upsert', details: upsertError }, { status: 500 })
  }

  console.log(`🎉 同期完了: ${upsertData.length} 件 upsert`)

  return NextResponse.json({ message: 'Synced successfully', count: upsertData.length })
}
