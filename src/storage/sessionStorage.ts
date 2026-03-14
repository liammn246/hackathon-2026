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

/** Clear all sessions (useful for testing). */
export async function clearAllSessions(): Promise<void> {
  await AsyncStorage.removeItem(SESSIONS_KEY);
}
