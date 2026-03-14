import { ActivityType } from '../types';

const MET: Record<ActivityType, number> = {
  idle: 1.0,
  walking: 3.5,
  running: 8.0,
};

/**
 * Estimate calories burned.
 * Formula: MET × weightKg × durationHours
 */
export function estimateCalories(
  activityType: ActivityType,
  durationMinutes: number,
  weightKg: number,
): number {
  const met = MET[activityType];
  const durationHours = durationMinutes / 60;
  return Math.round(met * weightKg * durationHours);
}
