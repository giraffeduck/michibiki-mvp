// /lib/trainingPlan.ts

import { WeeklyPhaseSchedule, TrainingPhase } from "./periodization";

export type TrainingSession = {
  day: string;
  sport: "Swim" | "Bike" | "Run" | "Strength" | "Rest";
  intensity: "Z1" | "Z2" | "Z3" | "Z4" | "Z5";
  durationMin: number;
  notes: string;
};

export type WeeklyTrainingPlan = {
  week: number;
  phase: TrainingPhase;
  startDate: string;
  endDate: string;
  sessions: TrainingSession[];
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const sportOptions = ["Swim", "Bike", "Run", "Strength"] as const;

export function generateWeeklyPlans(
  schedule: WeeklyPhaseSchedule[],
  weekdayHours: number,
  weekendHours: number
): WeeklyTrainingPlan[] {
  const weekdayMin = weekdayHours * 60;
  const weekendMin = weekendHours * 60;

  const dayToMinutes: Record<string, number> = {
    Monday: weekdayMin / 5,
    Tuesday: weekdayMin / 5,
    Wednesday: weekdayMin / 5,
    Thursday: weekdayMin / 5,
    Friday: weekdayMin / 5,
    Saturday: weekendMin / 2,
    Sunday: weekendMin / 2,
  };

  return schedule.map((weekInfo) => {
    const sessions: TrainingSession[] = days.map((day, idx) => {
      const isRestDay =
        weekInfo.phase === "Taper" && (day === "Monday" || day === "Friday");

      if (isRestDay) {
        return {
          day,
          sport: "Rest",
          intensity: "Z1",
          durationMin: 0,
          notes: "Rest day",
        };
      }

      const sport = sportOptions[idx % sportOptions.length];
      const intensity =
        weekInfo.phase === "Build"
          ? (idx % 3 === 0 ? "Z4" : "Z2")
          : weekInfo.phase === "Peak"
          ? (idx % 2 === 0 ? "Z3" : "Z4")
          : "Z2";

      return {
        day,
        sport,
        intensity,
        durationMin: Math.round(dayToMinutes[day]),
        notes: `${sport} ${intensity} training`,
      };
    });

    return {
      week: weekInfo.week,
      phase: weekInfo.phase,
      startDate: weekInfo.startDate,
      endDate: weekInfo.endDate,
      sessions,
    };
  });
}
