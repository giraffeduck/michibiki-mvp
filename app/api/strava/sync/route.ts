// app/api/strava/sync/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STRAVA_API = 'https://www.strava.com/api/v3/athlete/activities';

// GETリクエスト：手動呼び出し用（strava_id必須）
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const strava_id = searchParams.get('strava_id');
  if (!strava_id) {
    return NextResponse.json({ error: 'strava_id is required' }, { status: 400 });
  }
  return syncStravaActivities(strava_id);
}

// POSTリクエスト：自動同期用（strava_idをコード内で固定）
export async function POST(req: NextRequest) {
  const strava_id = '20828320'; // 仮に固定IDを使う（将来的にlocalStorage対応へ）
  return syncStravaActivities(strava_id);
}

// 共通処理（GET/POST両方から呼び出し可能）
async function syncStravaActivities(strava_id: string) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('access_token')
    .eq('strava_id', strava_id)
    .single();

  if (profileError || !profile?.access_token) {
    return NextResponse.json({ error: 'Access token not found for strava_id: ' + strava_id }, { status: 401 });
  }

  const { data: latest, error: latestError } = await supabase
    .from('activities')
    .select('start_date')
    .eq('strava_id', strava_id)
    .order('start_date', { ascending: false })
    .limit(1)
    .single();

  const after = latest?.start_date ? Math.floor(new Date(latest.start_date).getTime() / 1000) : 0;

  const res = await fetch(`${STRAVA_API}?per_page=100&after=${after}`, {
    headers: {
      Authorization: `Bearer ${profile.access_token}`,
    },
  });

  const activities = await res.json();

  if (!Array.isArray(activities)) {
    return NextResponse.json({ error: 'Invalid Strava response', details: activities }, { status: 500 });
  }

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
  }));

  const { error: upsertError } = await supabase
    .from('activities')
    .upsert(upsertData, { onConflict: 'id' });

  if (upsertError) {
    return NextResponse.json({ error: 'Failed to upsert', details: upsertError }, { status: 500 });
  }

  return NextResponse.json({ message: 'Synced successfully', count: upsertData.length });
}
