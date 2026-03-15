import { useFocusEffect, useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import ActivityGraph, { EpochDataPoint } from '../components/ActivityGraph';
import CaloriesCard from '../components/CaloriesCard';
import GoalProgressCard from '../components/GoalProgressCard';
import SessionItem from '../components/SessionItem';
import TopSessionCard from '../components/TopSessionCard';
import { startMotionTracking, setOnEpochRecorded, getEpochHistory, clearEpochHistory, initEpochHistory } from '../services/motionService';
import { setOnActiveCaloriesUpdated, setOnSessionSaved } from '../services/sessionManager';
import { clearAllSessions, getTodaySessions, getWeeklyActiveDays } from '../storage/sessionStorage';
import { getGoals } from '../storage/settingsStorage';
import { ActivityType, Session, UserGoals } from '../types';

export default function HomeScreen() {
  // Keep screen awake while this screen is mounted
  useKeepAwake();

  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [liveActivity, setLiveActivity] = useState<ActivityType | null>(null);
  const [liveCalories, setLiveCalories] = useState(0);
  const [epochHistory, setEpochHistory] = useState<EpochDataPoint[]>([]);
  const [goals, setGoals] = useState<UserGoals | null>(null);
  const [weeklyActiveDays, setWeeklyActiveDays] = useState(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const trackingStarted = useRef(false);

  const loadSessions = useCallback(async () => {
    const [today, userGoals, activeDays] = await Promise.all([
      getTodaySessions(),
      getGoals(),
      getWeeklyActiveDays(),
    ]);
    setSessions(today);
    setGoals(userGoals);
    setWeeklyActiveDays(activeDays);
  }, []);

  // Reload sessions whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions]),
  );

  // Auto-start tracking on mount — runs once
  useEffect(() => {
    if (trackingStarted.current) return;
    trackingStarted.current = true;



    setOnSessionSaved(async () => {
      await loadSessions();
      setLiveCalories(0);
    });
    setOnActiveCaloriesUpdated(setLiveCalories);
    setOnEpochRecorded(setEpochHistory);

    // Load persisted epoch history, then start tracking
    initEpochHistory().then((history) => {
      setEpochHistory(history);
      startMotionTracking((activity, _met) => setLiveActivity(activity));
    });
  }, [loadSessions]);

  // Reload sessions when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appStateRef.current !== 'active' && next === 'active') {
        loadSessions();
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [loadSessions]);

  async function handleClear() {
    await clearAllSessions();
    await clearEpochHistory();
    setSessions([]);
    setLiveCalories(0);
    setEpochHistory([]);
  }

  const totalCalories = Math.round(sessions.reduce((sum, s) => sum + s.calories, 0) + liveCalories);
  const topSession = sessions.reduce<Session | null>(
    (best, s) => (!best || s.calories > best.calories ? s : best),
    null,
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.heading}>Activity Tracker</Text>

        {/* Calories summary */}
        <CaloriesCard totalCalories={totalCalories} isTracking={true} />

        {/* Goal progress */}
        {goals && (
          <GoalProgressCard
            goals={goals}
            currentCalories={totalCalories}
            currentActiveMinutes={sessions.reduce((sum, s) => sum + s.durationMinutes, 0)}
            currentActiveDays={weeklyActiveDays}
          />
        )}

        {/* Live status */}
        {liveActivity !== null && (
          <View style={styles.liveBar}>
            <Text style={styles.liveText}>
              {liveActivity === 'low'
                ? '🧍 Low activity'
                : liveActivity === 'moderate'
                  ? '🚶 Moderate activity'
                  : '🏃 Intense activity'}
            </Text>
          </View>
        )}

        {/* Activity graph */}
        <ActivityGraph data={epochHistory} />

        {/* Top session */}
        {topSession && <TopSessionCard session={topSession} />}

        {/* Today's sessions list */}
        <Text style={styles.sectionTitle}>Today's Activity</Text>

        {sessions.length === 0 ? (
          <Text style={styles.empty}>
            Keep moving — sessions appear here once detected.
          </Text>
        ) : (
          sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              onPress={() => router.push(`/session/${session.id}`)}
            />
          ))
        )}

        {/* Clear button */}
        {sessions.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={handleClear} activeOpacity={0.7}>
            <Text style={styles.clearButtonText}>Clear All Sessions</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scroll: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  liveBar: {
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  liveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  empty: {
    color: '#636366',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 22,
  },
  clearButton: {
    marginTop: 20,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF453A',
  },
  clearButtonText: {
    color: '#FF453A',
    fontSize: 14,
    fontWeight: '600',
  },
});
