import AsyncStorage from '@react-native-async-storage/async-storage';

const WEIGHT_KEY = 'user_weight_kg';
const DEFAULT_WEIGHT_KG = 70;

export async function getWeight(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(WEIGHT_KEY);
    return raw ? parseFloat(raw) : DEFAULT_WEIGHT_KG;
  } catch {
    return DEFAULT_WEIGHT_KG;
  }
}

export async function setWeight(weightKg: number): Promise<void> {
  await AsyncStorage.setItem(WEIGHT_KEY, String(weightKg));
}
