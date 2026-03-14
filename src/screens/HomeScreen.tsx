import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  AppState,
  AppStateStatus,
  Platform,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Session, ActivityType } from '../types';
import { getTodaySessions } from '../storage/sessionStorage';
import { startMotionTracking, stopMotionTracking } from '../services/motionService';
import { setOnSessionSaved, flushCurrentSession } from '../services/sessionManager';
import CaloriesCard from '../components/CaloriesCard';
import TopSessionCard from '../components/TopSessionCard';
import SessionItem from '../components/SessionItem';

export default function HomeScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [liveActivity, setLiveActivity] = useState<ActivityType | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const loadSessions = useCallback(async () => {
    const today = await getTodaySessions();
    setSessions(today);
  }, []);

  // Reload sessions whenever the screen is focused (e.g. after returning from detail)
  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions]),
  );

  // Handle app state changes — flush session when backgrounded
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (
        appStateRef.current === 'active' &&
        (next === 'background' || next === 'inactive')
      ) {
        flushCurrentSession().then(loadSessions);
      }
      appStateRef.current = next;
    });
    return () => sub.remove();
  }, [loadSessions]);

  function toggleTracking() {
    if (isTracking) {
      stopMotionTracking();
      flushCurrentSession().then(loadSessions);
      setIsTracking(false);
      setLiveActivity(null);
    } else {
      setOnSessionSaved(() => loadSessions());
      startMotionTracking((activity, _mag) => {
        setLiveActivity(activity);
      });
      setIsTracking(true);
    }
  }

  const totalCalories = sessions.reduce((sum, s) => sum + s.calories, 0);
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
        <CaloriesCard totalCalories={totalCalories} isTracking={isTracking} />

        {/* Live status */}
        {isTracking && liveActivity !== null && (
          <View style={styles.liveBar}>
            <Text style={styles.liveText}>
              {liveActivity === 'idle'
                ? 'Standing still…'
                : liveActivity === 'walking'
                  ? '🚶 Walking detected'
                  : '🏃 Running detected'}
            </Text>
          </View>
        )}

        {/* Top session */}
        {topSession && <TopSessionCard session={topSession} />}

        {/* Today's sessions list */}
        <Text style={styles.sectionTitle}>Today's Activity</Text>

        {sessions.length === 0 ? (
          <Text style={styles.empty}>
            {isTracking
              ? 'Keep moving — sessions appear here once detected.'
              : 'No sessions recorded today. Tap Start to begin tracking.'}
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
      </ScrollView>

      {/* Start / Stop button */}
      <TouchableOpacity
        style={[styles.fab, isTracking && styles.fabActive]}
        onPress={toggleTracking}
        activeOpacity={0.85}>
        <Text style={styles.fabText}>{isTracking ? 'Stop' : 'Start'}</Text>
      </TouchableOpacity>
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
    paddingBottom: 120,
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
  fab: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 30,
    paddingHorizontal: 48,
    paddingVertical: 16,
    shadowColor: '#FF6B35',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabActive: {
    backgroundColor: '#636366',
    shadowColor: '#000',
  },
  fabText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
