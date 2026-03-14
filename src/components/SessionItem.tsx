import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Session } from '../types';
import { formatDuration, activityLabel, activityIcon, formatTime } from '../utils/format';

interface Props {
  session: Session;
  onPress?: () => void;
}

export default function SessionItem({ session, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.icon}>{activityIcon(session.type)}</Text>
      <View style={styles.info}>
        <Text style={styles.type}>{activityLabel(session.type)}</Text>
        <Text style={styles.time}>
          {formatTime(session.startTime)} – {formatTime(session.endTime)}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.duration}>{formatDuration(session.durationMinutes)}</Text>
        <Text style={styles.calories}>{session.calories} kcal</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  type: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  time: {
    fontSize: 12,
    color: '#8E8E93',
  },
  right: {
    alignItems: 'flex-end',
  },
  duration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#AEAEB2',
    marginBottom: 2,
  },
  calories: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B35',
  },
});
