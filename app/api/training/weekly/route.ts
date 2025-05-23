// app/api/training/weekly/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generatePhaseSchedule } from "@/lib/periodization";
import { generateWeeklyPlans } from "@/lib/trainingPlan";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stravaId = searchParams.get("strava_id");

  if (!stravaId) {
    return NextResponse.json({ error: "strava_id is required" }, { status: 400 });
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("race_goal")
    .select("*")
    .eq("strava_id", stravaId)
    .eq("priority", "A") // 優先度Aのみ
    .gte("race_date", today) // 今日以降
    .order("race_date", { ascending: true }) // 近い順に
    .limit(1);

  const goal = data?.[0];

  if (error || !goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const { race_date, available_hours_per_week } = goal;

  const phases = generatePhaseSchedule(race_date, today);
  const plans = generateWeeklyPlans(phases, available_hours_per_week || 6);

  return NextResponse.json({ plans });
}
