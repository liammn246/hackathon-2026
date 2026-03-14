import { ActivityType } from '../types';

const IDLE_THRESHOLD = 0.05;
const WALKING_THRESHOLD = 0.2;
const GRAVITY_G = 1;
const NOISE_FLOOR = 0.015;

/**
 * Compute the magnitude of an accelerometer reading.
 * Removes gravity in an orientation-independent way.
 */
export function computeMagnitude(x: number, y: number, z: number): number {
  // Total acceleration includes gravity. At rest this is ~1g regardless of orientation.
  const total = Math.sqrt(x * x + y * y + z * z);
  const dynamic = Math.abs(total - GRAVITY_G);

  // Ignore tiny jitter from sensor noise.
  if (dynamic < NOISE_FLOOR) {
    return 0;
  }

  return dynamic;
}

/**
 * Classify a smoothed motion magnitude into an activity type.
 */
export function classifyActivity(magnitude: number): ActivityType {
  if (magnitude < IDLE_THRESHOLD) return 'idle';
  if (magnitude < WALKING_THRESHOLD) return 'walking';
  return 'running';
}
