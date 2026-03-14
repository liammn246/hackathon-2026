import { ActivitySummary, ActivityType } from '../types';
import { getTodaySessions } from '../storage/sessionStorage';
import { getWeight } from '../storage/settingsStorage';

export async function getDailyActivitySummary(): Promise<ActivitySummary> {
  const [sessions, weightKg] = await Promise.all([
    getTodaySessions(),
    getWeight(),
  ]);

  const caloriesBurnedToday = sessions.reduce((sum, s) => sum + s.calories, 0);
  const totalWorkoutMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  const activityTypesSet = new Set<ActivityType>();
  for (const s of sessions) {
    activityTypesSet.add(s.type);
  }

  return {
    caloriesBurnedToday,
    totalWorkoutMinutes,
    activityTypes: Array.from(activityTypesSet),
    sessionCount: sessions.length,
    weightKg,
  };
}
