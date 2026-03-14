import { Accelerometer } from 'expo-sensors';
import { computeMagnitude, classifyActivity } from './activityClassifier';
import { feedActivity } from './sessionManager';
import { ActivityType } from '../types';

const SAMPLE_INTERVAL_MS = 750; // read every 750 ms
const ROLLING_WINDOW = 8; // keep last 8 samples (~6 seconds)

const magnitudeWindow: number[] = [];
let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;
let onActivityChange: ((activity: ActivityType, magnitude: number) => void) | null = null;

function rollingAverage(): number {
  if (magnitudeWindow.length === 0) return 0;
  return magnitudeWindow.reduce((a, b) => a + b, 0) / magnitudeWindow.length;
}

/** Start listening to the accelerometer. */
export function startMotionTracking(
  onChange?: (activity: ActivityType, magnitude: number) => void,
) {
  if (subscription) return; // already running

  onActivityChange = onChange ?? null;
  Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);

  subscription = Accelerometer.addListener(({ x, y, z }) => {
    const magnitude = computeMagnitude(x, y, z);

    magnitudeWindow.push(magnitude);
    if (magnitudeWindow.length > ROLLING_WINDOW) {
      magnitudeWindow.shift();
    }

    const smoothed = rollingAverage();
    const activity = classifyActivity(smoothed);

    feedActivity(activity);
    onActivityChange?.(activity, smoothed);
  });
}

/** Stop listening to the accelerometer. */
export function stopMotionTracking() {
  subscription?.remove();
  subscription = null;
  magnitudeWindow.length = 0;
}
