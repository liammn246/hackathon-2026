export type ActivityType = 'low' | 'moderate' | 'intense';

export interface Session {
  id: string;
  type: ActivityType;
  startTime: number; // Unix ms timestamp
  endTime: number;   // Unix ms timestamp
  durationMinutes: number;
  calories: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ActivitySummary {
  caloriesBurnedToday: number;
  totalWorkoutMinutes: number;
  activityTypes: ActivityType[];
  sessionCount: number;
  weightKg: number;
}

export interface UserGoals {
  dailyCalories: number;
  dailyActiveMinutes: number;
  weeklyActiveDays: number;
}
