import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Session } from '../types';
import { formatDuration, activityLabel, activityIcon } from '../utils/format';

interface Props {
  session: Session;
}

export default function TopSessionCard({ session }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.section}>Top Session</Text>
      <View style={styles.row}>
        <Text style={styles.icon}>{activityIcon(session.type)}</Text>
        <View style={styles.info}>
          <Text style={styles.type}>{activityLabel(session.type)}</Text>
          <Text style={styles.detail}>
            {formatDuration(session.durationMinutes)} · {session.calories} kcal
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  section: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 36,
    marginRight: 14,
  },
  info: {
    flex: 1,
  },
  type: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  detail: {
    fontSize: 14,
    color: '#AEAEB2',
  },
});
