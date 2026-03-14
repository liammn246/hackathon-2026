import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getSessionById } from '../storage/sessionStorage';
import { Session } from '../types';
import { activityIcon, activityLabel, formatDate, formatDuration, formatTime } from '../utils/format';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      getSessionById(id).then((s) => {
        setSession(s);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FF6B35" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={styles.missing}>Session not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Icon + title */}
      <View style={styles.hero}>
        <Text style={styles.icon}>{activityIcon(session.type)}</Text>
        <Text style={styles.title}>{activityLabel(session.type)} Session</Text>
        <Text style={styles.date}>{formatDate(session.startTime)}</Text>
      </View>

      {/* Stats grid */}
      <View style={styles.grid}>
        <Stat label="Start" value={formatTime(session.startTime)} />
        <Stat label="End" value={formatTime(session.endTime)} />
        <Stat label="Duration" value={formatDuration(session.durationMinutes)} />
        <Stat label="Calories" value={`${session.calories} kcal`} highlight />
      </View>
    </View>
  );
}

function Stat({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={[statStyles.value, highlight && statStyles.highlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
    paddingTop: 48,
  },
  center: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missing: {
    color: '#8E8E93',
    fontSize: 16,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  icon: {
    fontSize: 64,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  date: {
    fontSize: 14,
    color: '#8E8E93',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  value: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  highlight: {
    color: '#FF6B35',
    fontSize: 24,
  },
});
