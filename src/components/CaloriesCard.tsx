import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  totalCalories: number;
  isTracking: boolean;
}

export default function CaloriesCard({ totalCalories, isTracking }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>🔥 Calories Burned Today</Text>
      <Text style={styles.value}>{totalCalories} kcal</Text>
      {isTracking && <Text style={styles.badge}>● Tracking</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  label: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 8,
    fontWeight: '600',
  },
  value: {
    fontSize: 52,
    fontWeight: '800',
    color: '#fff',
  },
  badge: {
    marginTop: 10,
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
});
