import { saveSession } from '../storage/sessionStorage';
import { getWeight } from '../storage/settingsStorage';
import { ActivityType, Session } from '../types';
import { estimateCalories } from './calorieCalculator';

// A session starts after this much continuous activity (ms)
const SESSION_START_THRESHOLD_MS = 20 * 1000; // 20 seconds

// An active session ends after this much inactivity (ms)
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

type SessionState = 'idle' | 'warming_up' | 'active';

interface PendingSession {
  type: ActivityType;
  warmupStartMs: number;
  sessionStartMs: number;
  accumulatedMetHours: number; // running sum of met * elapsedHours
}

let state: SessionState = 'idle';
let pending: PendingSession | null = null;
let lastActivityMs: number = 0;
let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

let onSessionSaved: ((session: Session) => void) | null = null;
let onActiveCaloriesUpdated: ((calories: number) => void) | null = null;
let cachedWeightKg = 70;

// Pre-load the user's weight so we can compute live calories synchronously
getWeight().then(w => { if (w) cachedWeightKg = w; });

/** Register a callback invoked each time a session is saved. */
export function setOnSessionSaved(cb: (session: Session) => void) {
  onSessionSaved = cb;
}

/** Register a callback invoked each time the active session calorie count changes. */
export function setOnActiveCaloriesUpdated(cb: (calories: number) => void) {
  onActiveCaloriesUpdated = cb;
}

/** Returns the live calorie burn for the in-progress session. */
export function getActiveSessionCalories(): number {
  if (!pending) return 0;
  return pending.accumulatedMetHours * cachedWeightKg;
}

/**
 * Feed the latest classified activity + dynamic MET into the session state machine.
 * Call this every time a new motion sample is classified.
 */
export async function feedActivity(activity: ActivityType, met: number): Promise<void> {
  const now = Date.now();

  // Accumulate MET·hours for any pending session
  if (pending && lastActivityMs > 0) {
    const elapsedHours = (now - lastActivityMs) / 3_600_000;
    pending.accumulatedMetHours += met * elapsedHours;
    onActiveCaloriesUpdated?.(getActiveSessionCalories());
  }

  if (activity === 'low') {
    if (state === 'active') {
      if (!inactivityTimer) {
        inactivityTimer = setTimeout(() => endCurrentSession(now), INACTIVITY_TIMEOUT_MS);
      }
    } else if (state === 'warming_up') {
      state = 'idle';
      pending = null;
    }
    lastActivityMs = now;
    return;
  }

  // Non-low activity — cancel any pending inactivity timeout
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }

  lastActivityMs = now;

  if (state === 'idle') {
    state = 'warming_up';
    pending = {
      type: activity,
      warmupStartMs: now,
      sessionStartMs: now,
      accumulatedMetHours: 0,
    };
  } else if (state === 'warming_up' && pending) {
    pending.type = activity;
    const elapsed = now - pending.warmupStartMs;
    if (elapsed >= SESSION_START_THRESHOLD_MS) {
      state = 'active';
    }
  } else if (state === 'active' && pending) {
    pending.type = activity;
  }
}

async function endCurrentSession(endTimeMs: number): Promise<void> {
  if (state !== 'active' || !pending) {
    state = 'idle';
    pending = null;
    inactivityTimer = null;
    return;
  }

  const startMs = pending.sessionStartMs;
  const durationMinutes = Math.round((endTimeMs - startMs) / 60000);

  if (durationMinutes < 1) {
    // Too short — discard
    state = 'idle';
    pending = null;
    inactivityTimer = null;
    lastActivityMs = 0;
    onActiveCaloriesUpdated?.(0);
    return;
  }

  const weightKg = await getWeight();
  // Use accumulated MET·hours × weight for precise calorie total
  const calories = estimateCalories(
    pending.accumulatedMetHours > 0
      ? pending.accumulatedMetHours / (durationMinutes / 60) // average MET
      : 1,
    durationMinutes,
    weightKg,
  );

  const session: Session = {
    id: `${startMs}`,
    type: pending.type,
    startTime: startMs,
    endTime: endTimeMs,
    durationMinutes,
    calories: Math.round(calories),
  };

  await saveSession(session);
  onSessionSaved?.(session);

  state = 'idle';
  pending = null;
  inactivityTimer = null;
  lastActivityMs = 0;
  onActiveCaloriesUpdated?.(0);
}

/** Manually flush and end any active session (e.g. app backgrounded). */
export async function flushCurrentSession(): Promise<void> {
  if (state === 'active') {
    await endCurrentSession(Date.now());
  } else {
    state = 'idle';
    pending = null;
    lastActivityMs = 0;
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
  }
}
