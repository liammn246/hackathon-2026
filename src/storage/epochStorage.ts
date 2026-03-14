import AsyncStorage from '@react-native-async-storage/async-storage';
import { EpochDataPoint } from '../components/ActivityGraph';

const EPOCH_KEY = 'epoch_history';

/** Load today's epoch history from storage. */
export async function loadEpochHistory(): Promise<EpochDataPoint[]> {
  try {
    const raw = await AsyncStorage.getItem(EPOCH_KEY);
    if (!raw) return [];
    const all: EpochDataPoint[] = JSON.parse(raw);

    // Filter to today only
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return all.filter(e => e.timestamp >= todayStart.getTime());
  } catch {
    return [];
  }
}

/** Append a new epoch data point and persist. */
export async function appendEpoch(point: EpochDataPoint): Promise<void> {
  const history = await loadEpochHistory();
  history.push(point);
  await AsyncStorage.setItem(EPOCH_KEY, JSON.stringify(history));
}

/** Clear all stored epoch history. */
export async function clearEpochStorage(): Promise<void> {
  await AsyncStorage.removeItem(EPOCH_KEY);
}
