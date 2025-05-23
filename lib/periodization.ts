// /lib/periodization.ts

export type TrainingPhase = "Build" | "Peak" | "Taper";

export type WeeklyPhaseSchedule = {
  week: number;
  startDate: string; // yyyy-mm-dd
  endDate: string;   // yyyy-mm-dd
  phase: TrainingPhase;
};

export function generatePhaseSchedule(raceDateStr: string, todayStr: string): WeeklyPhaseSchedule[] {
  const raceDate = new Date(raceDateStr);
  const today = new Date(todayStr);

  const msInWeek = 7 * 24 * 60 * 60 * 1000;
  const totalWeeks = Math.ceil((raceDate.getTime() - today.getTime()) / msInWeek);

  const buildWeeks = Math.floor(totalWeeks * 0.6);
  const peakWeeks = Math.floor(totalWeeks * 0.3);
  const taperWeeks = totalWeeks - buildWeeks - peakWeeks;

  const schedule: WeeklyPhaseSchedule[] = [];
  for (let i = 0; i < totalWeeks; i++) {
    const start = new Date(today.getTime() + i * msInWeek);
    const end = new Date(start.getTime() + msInWeek - 1);

    let phase: TrainingPhase;
    if (i < buildWeeks) {
      phase = "Build";
    } else if (i < buildWeeks + peakWeeks) {
      phase = "Peak";
    } else {
      phase = "Taper";
    }

    schedule.push({
      week: i + 1,
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      phase,
    });
  }

  return schedule;
}
