export type ActivityType = 'idle' | 'walking' | 'running';

export interface Session {
  id: string;
  type: ActivityType;
  startTime: number; // Unix ms timestamp
  endTime: number;   // Unix ms timestamp
  durationMinutes: number;
  calories: number;
}
