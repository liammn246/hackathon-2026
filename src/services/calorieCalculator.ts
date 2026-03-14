/**
 * Estimate calories burned using a dynamic MET value.
 * Formula: MET × weightKg × durationHours
 */
export function estimateCalories(
  met: number,
  durationMinutes: number,
  weightKg: number,
): number {
  const durationHours = durationMinutes / 60;
  return met * weightKg * durationHours;
}
