// app/api/route.ts

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Supabaseクライアント初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  const { data, error } = await supabase
    .from('race')
    .select('*')
    .order('date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const {
    name,
    date,
    swim_distance_km,
    bike_distance_km,
    run_distance_km,
    result_url,
    notes,
  } = body

  const { data, error } = await supabase.from('race').insert([
    {
      name,
      date,
      swim_distance_km,
      bike_distance_km,
      run_distance_km,
      result_url,
      notes,
    },
  ])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data, { status: 201 })
}
