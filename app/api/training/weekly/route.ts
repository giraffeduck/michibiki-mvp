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

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const isoToday = today.toISOString();

  const numericStravaId = Number(stravaId);

  const { data, error } = await supabase
    .from("race_goal_entry")
    .select("*")
    .eq("strava_id", numericStravaId)
    .eq("is_a_race", true)
    .gte("race_date", isoToday)
    .order("race_date", { ascending: true })
    .limit(1);

  const goal = data?.[0];

  if (error || !goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const { race_date, training_time_weekday_hr, training_time_weekend_hr } = goal;

  const weekday = training_time_weekday_hr ?? 4; // fallback値あり
  const weekend = training_time_weekend_hr ?? 2;

  const phases = generatePhaseSchedule(race_date, isoToday);
  const plans = generateWeeklyPlans(phases, weekday, weekend);

  return NextResponse.json({ plans });
}
