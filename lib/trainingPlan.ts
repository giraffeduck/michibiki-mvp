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

export function generateWeeklyPlans(
  schedule: WeeklyPhaseSchedule[],
  availableHoursPerWeek: number
): WeeklyTrainingPlan[] {
  return schedule.map((weekInfo) => {
    const baseMinutes = availableHoursPerWeek * 60;
    const restRatio = weekInfo.phase === "Taper" ? 0.4 : 0.15;
    const trainingMinutes = Math.floor(baseMinutes * (1 - restRatio));
    const sessionMinutes = Math.floor(trainingMinutes / 6); // 6日トレーニング想定

    const sessions: TrainingSession[] = days.map((day, idx) => {
      if (weekInfo.phase === "Taper" && (day === "Friday" || day === "Monday")) {
        return { day, sport: "Rest", intensity: "Z1", durationMin: 0, notes: "Rest day" };
      }

      const sport = ["Swim", "Bike", "Run", "Strength"][idx % 4];
      const intensity =
        weekInfo.phase === "Build" ? (idx % 3 === 0 ? "Z4" : "Z2") :
        weekInfo.phase === "Peak" ? (idx % 2 === 0 ? "Z3" : "Z4") :
        "Z2";

      return {
        day,
        sport,
        intensity,
        durationMin: sessionMinutes,
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
