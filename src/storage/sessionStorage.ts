import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '../types';

const SESSIONS_KEY = 'calorie_sessions';

async function loadAll(): Promise<Session[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveAll(sessions: Session[]): Promise<void> {
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

/** Persist a new session (prepend so newest is first). */
export async function saveSession(session: Session): Promise<void> {
  const all = await loadAll();
  await saveAll([session, ...all]);
}

/** Return all sessions whose startTime falls on today (local time). */
export async function getTodaySessions(): Promise<Session[]> {
  const all = await loadAll();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return all.filter((s) => s.startTime >= todayStart.getTime());
}

/** Return every stored session. */
export async function getAllSessions(): Promise<Session[]> {
  return loadAll();
}

/** Return a single session by id, or null. */
export async function getSessionById(id: string): Promise<Session | null> {
  const all = await loadAll();
  return all.find((s) => s.id === id) ?? null;
}

/** Return the number of unique days with at least one session in the current week (Mon–Sun). */
export async function getWeeklyActiveDays(): Promise<number> {
  const all = await loadAll();
  const now = new Date();
  const day = now.getDay();
  // Monday = start of week (getDay: 0=Sun, 1=Mon, ..., 6=Sat)
  const mondayOffset = day === 0 ? 6 : day - 1;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const activeDays = new Set<string>();
  for (const s of all) {
    if (s.startTime >= weekStart.getTime()) {
      const d = new Date(s.startTime);
      activeDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
  }
  return activeDays.size;
}

/** Clear all sessions (useful for testing). */
export async function clearAllSessions(): Promise<void> {
  await AsyncStorage.removeItem(SESSIONS_KEY);
}
