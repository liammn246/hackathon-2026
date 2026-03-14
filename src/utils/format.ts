import { ActivityType } from '../types';

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatTime(timestampMs: number): string {
  return new Date(timestampMs).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(timestampMs: number): string {
  return new Date(timestampMs).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function activityLabel(type: ActivityType): string {
  switch (type) {
    case 'walking':
      return 'Walk';
    case 'running':
      return 'Run';
    default:
      return 'Activity';
  }
}

export function activityIcon(type: ActivityType): string {
  switch (type) {
    case 'walking':
      return '🚶';
    case 'running':
      return '🏃';
    default:
      return '⏱️';
  }
}
