import { ActivityType, Session } from '../types';
import { estimateCalories } from './calorieCalculator';
import { saveSession } from '../storage/sessionStorage';
import { getWeight } from '../storage/settingsStorage';

// A session starts after this much continuous activity (ms)
const SESSION_START_THRESHOLD_MS = 20 * 1000; // 20 seconds

// An active session ends after this much inactivity (ms)
const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

type SessionState = 'idle' | 'warming_up' | 'active';

interface PendingSession {
  type: ActivityType;
  warmupStartMs: number;
  sessionStartMs: number;
}

let state: SessionState = 'idle';
let pending: PendingSession | null = null;
let lastActivityMs: number = 0;
let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

let onSessionSaved: ((session: Session) => void) | null = null;

/** Register a callback invoked each time a session is saved. */
export function setOnSessionSaved(cb: (session: Session) => void) {
  onSessionSaved = cb;
}

/**
 * Feed the latest classified activity into the session state machine.
 * Call this every time a new motion sample is classified.
 */
export async function feedActivity(activity: ActivityType): Promise<void> {
  const now = Date.now();

  if (activity === 'idle') {
    if (state === 'active') {
      // Start inactivity timer — do not end session yet
      if (!inactivityTimer) {
        inactivityTimer = setTimeout(() => endCurrentSession(now), INACTIVITY_TIMEOUT_MS);
      }
    } else if (state === 'warming_up') {
      // Cancel warmup — not enough sustained activity
      state = 'idle';
      pending = null;
    }
    return;
  }

  // Non-idle activity — cancel any pending inactivity timeout
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
    };
  } else if (state === 'warming_up' && pending) {
    // Update dominant activity type
    pending.type = activity;
    const elapsed = now - pending.warmupStartMs;
    if (elapsed >= SESSION_START_THRESHOLD_MS) {
      // Promote to active session
      state = 'active';
    }
  } else if (state === 'active' && pending) {
    // Keep updating the dominant type
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
    return;
  }

  const weightKg = await getWeight();
  const calories = estimateCalories(pending.type, durationMinutes, weightKg);

  const session: Session = {
    id: `${startMs}`,
    type: pending.type,
    startTime: startMs,
    endTime: endTimeMs,
    durationMinutes,
    calories,
  };

  await saveSession(session);
  onSessionSaved?.(session);

  state = 'idle';
  pending = null;
  inactivityTimer = null;
}

/** Manually flush and end any active session (e.g. app backgrounded). */
export async function flushCurrentSession(): Promise<void> {
  if (state === 'active') {
    await endCurrentSession(Date.now());
  } else {
    state = 'idle';
    pending = null;
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
  }
}
