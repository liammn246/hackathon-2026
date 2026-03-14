import { ActivityType } from '../types';

const GRAVITY_G = 1;
const NOISE_FLOOR = 0.015;

/**
 * Compute ENMO (Euclidean Norm Minus One) from accelerometer axes.
 * Returns the net dynamic acceleration above gravity, clamped to 0.
 */
export function computeMagnitude(x: number, y: number, z: number): number {
  const total = Math.sqrt(x * x + y * y + z * z);
  const enmo = Math.max(0, total - GRAVITY_G);
  return enmo < NOISE_FLOOR ? 0 : enmo;
}

/**
 * Classify a dynamic MET value into a labelled activity intensity.
 * Low < 2 MET, Moderate 2–5 MET, Intense > 5 MET.
 */
export function classifyActivity(met: number): ActivityType {
  if (met < 2) return 'low';
  if (met <= 5) return 'moderate';
  return 'intense';
}
