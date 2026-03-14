import { Accelerometer } from 'expo-sensors';
import { ActivityType } from '../types';
import { classifyActivity, computeMagnitude } from './activityClassifier';
import { feedActivity } from './sessionManager';
import { EpochDataPoint } from '../components/ActivityGraph';

const SAMPLE_INTERVAL_MS = 100; // sample at ~10 Hz for good resolution
const EPOCH_DURATION_MS = 30_000; // 30-second epoch
const MAX_EPOCH_HISTORY = 60; // keep last 60 epochs (30 minutes)

let epochSamples: number[] = [];
let epochTimer: ReturnType<typeof setInterval> | null = null;
let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;
let onActivityChange: ((activity: ActivityType, met: number) => void) | null = null;
let onEpochRecorded: ((history: EpochDataPoint[]) => void) | null = null;

/** History of completed epochs for graph display. */
const epochHistory: EpochDataPoint[] = [];

/** Get the current epoch history. */
export function getEpochHistory(): EpochDataPoint[] {
  return [...epochHistory];
}

/** Register a callback invoked each time a new epoch is recorded. */
export function setOnEpochRecorded(cb: (history: EpochDataPoint[]) => void) {
  onEpochRecorded = cb;
}

/** Process one 30-second epoch: average ENMO → MET → classify → feed. */
function processEpoch() {
  if (epochSamples.length === 0) {
    feedActivity('low' as ActivityType, 0);
    onActivityChange?.('low' as ActivityType, 0);
    return;
  }

  // Mean ENMO over the epoch (in g)
  const meanEnmo = epochSamples.reduce((a, b) => a + b, 0) / epochSamples.length;
  const sampleCount = epochSamples.length;

  // Convert to milligravity for the Hildebrand formula
  const enmoMg = meanEnmo * 1000;
  const met = enmoMg > 0 ? (1.708 * Math.pow(enmoMg, 0.442)) / 3.5 : 0;
  const activity = classifyActivity(met);

  console.log(
    `[Epoch] samples=${sampleCount}` +
    ` meanENMO=${meanEnmo.toFixed(4)}g` +
    ` (${enmoMg.toFixed(1)}mg)` +
    ` MET=${met.toFixed(3)}` +
    ` → ${activity}`
  );

  // Record to history
  epochHistory.push({ timestamp: Date.now(), met });
  if (epochHistory.length > MAX_EPOCH_HISTORY) {
    epochHistory.shift();
  }
  onEpochRecorded?.([...epochHistory]);

  feedActivity(activity, met);
  onActivityChange?.(activity, met);

  // Reset for next epoch
  epochSamples = [];
}

/** Start listening to the accelerometer with 30-second epoch aggregation. */
export function startMotionTracking(
  onChange?: (activity: ActivityType, met: number) => void,
) {
  if (subscription) return; // already running

  onActivityChange = onChange ?? null;
  epochSamples = [];

  Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);

  // Collect ENMO samples continuously
  subscription = Accelerometer.addListener(({ x, y, z }) => {
    const enmo = computeMagnitude(x, y, z);
    epochSamples.push(enmo);
  });

  // Process an epoch every 30 seconds
  epochTimer = setInterval(processEpoch, EPOCH_DURATION_MS);
}

/** Stop listening to the accelerometer. */
export function stopMotionTracking() {
  // Process any remaining samples before stopping
  if (epochSamples.length > 0) {
    processEpoch();
  }

  subscription?.remove();
  subscription = null;

  if (epochTimer) {
    clearInterval(epochTimer);
    epochTimer = null;
  }

  epochSamples = [];
}
