// /app/api/race-goal/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
)

// PUT: 目標の更新
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const id = context.params.id
  const body = await req.json()

  const stravaIdHeader = req.headers.get('x-strava-id')
  if (!stravaIdHeader) {
    return NextResponse.json({ error: 'Missing strava_id' }, { status: 401 })
  }
  const strava_id = parseInt(stravaIdHeader)

  const { data: existing, error: fetchError } = await supabase
    .from('race_goal_entry')
    .select('id')
    .eq('id', id)
    .eq('strava_id', strava_id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('race_goal_entry')
    .update({
      ...body,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 200 })
}

// DELETE: 目標の削除
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  const id = context.params.id
  const stravaIdHeader = req.headers.get('x-strava-id')

  if (!stravaIdHeader) {
    return NextResponse.json({ error: 'Missing strava_id' }, { status: 401 })
  }

  const strava_id = parseInt(stravaIdHeader)

  const { data: existing, error: fetchError } = await supabase
    .from('race_goal_entry')
    .select('id')
    .eq('id', id)
    .eq('strava_id', strava_id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
  }

  const { error } = await supabase
    .from('race_goal_entry')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Deleted successfully' }, { status: 200 })
}
