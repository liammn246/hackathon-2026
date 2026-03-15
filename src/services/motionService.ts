import { Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';
import { ActivityType } from '../types';
import { classifyActivity, computeMagnitude } from './activityClassifier';
import { feedActivity } from './sessionManager';
import { EpochDataPoint } from '../components/ActivityGraph';
import { loadEpochHistory, appendEpoch, clearEpochStorage } from '../storage/epochStorage';

const SAMPLE_INTERVAL_MS = 100; // sample at ~10 Hz for good resolution
const EPOCH_DURATION_MS = 30_000; // 30-second epoch
const MAX_EPOCH_HISTORY = 2880; // full day at 30s epochs

let epochSamples: number[] = [];
let epochTimer: ReturnType<typeof setInterval> | null = null;
let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;
let onActivityChange: ((activity: ActivityType, met: number) => void) | null = null;
let onEpochRecorded: ((history: EpochDataPoint[]) => void) | null = null;

/** In-memory history of completed epochs for graph display. */
let epochHistory: EpochDataPoint[] = [];
let historyLoaded = false;

/** Load persisted epoch history from storage into memory. */
export async function initEpochHistory(): Promise<EpochDataPoint[]> {
  epochHistory = await loadEpochHistory();
  historyLoaded = true;
  return [...epochHistory];
}

/** Get the current epoch history (in-memory). */
export function getEpochHistory(): EpochDataPoint[] {
  return [...epochHistory];
}

/** Clear all recorded epoch history (memory + storage). */
export async function clearEpochHistory(): Promise<void> {
  epochHistory = [];
  await clearEpochStorage();
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

  // Record to history (memory + persist to storage)
  const point: EpochDataPoint = { timestamp: Date.now(), met };
  epochHistory.push(point);
  if (epochHistory.length > MAX_EPOCH_HISTORY) {
    epochHistory.shift();
  }
  appendEpoch(point); // fire-and-forget persist
  onEpochRecorded?.([...epochHistory]);

  feedActivity(activity, met);
  onActivityChange?.(activity, met);

  // Reset for next epoch
  epochSamples = [];
}

/** Start listening to the accelerometer with 30-second epoch aggregation. */
export async function startMotionTracking(
  onChange?: (activity: ActivityType, met: number) => void,
) {
  if (subscription) return; // already running

  // Load persisted history on first start
  if (!historyLoaded) {
    await initEpochHistory();
  }

  onActivityChange = onChange ?? null;
  epochSamples = [];

  // Accelerometer is not available on web
  if (Platform.OS === 'web') {
    console.warn('[MotionService] Accelerometer not available on web — tracking disabled.');
    return;
  }

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
