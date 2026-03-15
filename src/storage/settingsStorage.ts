import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserGoals } from '../types';

const WEIGHT_KEY = 'user_weight_kg';
const GOALS_KEY = 'user_goals';
const DEFAULT_WEIGHT_KG = 70;

export const DEFAULT_GOALS: UserGoals = {
  dailyCalories: 500,
  dailyActiveMinutes: 30,
  weeklyActiveDays: 5,
};

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

export async function getGoals(): Promise<UserGoals> {
  try {
    const raw = await AsyncStorage.getItem(GOALS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_GOALS;
  } catch {
    return DEFAULT_GOALS;
  }
}

export async function setGoals(goals: UserGoals): Promise<void> {
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}
