import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { UserGoals } from '../types';

interface GoalProgress {
  goals: UserGoals;
  currentCalories: number;
  currentActiveMinutes: number;
  currentActiveDays: number;
}

const COLORS = {
  calories: '#FF6B35',
  minutes: '#30D158',
  days: '#0A84FF',
};

/**
 * Pure-View circular progress arc using two clipped rotating half-circles.
 * At 0% progress, nothing is colored. At 100%, the full ring is filled.
 */
function ArcRing({
  progress,
  size,
  strokeWidth,
  color,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
}) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const degrees = clamped * 360;
  const half = size / 2;

  // At 0 progress, show only the track — no colored arc at all
  if (degrees === 0) {
    return (
      <View style={{ width: size, height: size, position: 'absolute' }}>
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: half,
            borderWidth: strokeWidth,
            borderColor: `${color}18`,
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ width: size, height: size, position: 'absolute' }}>
      {/* Track (dim background ring) */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: half,
          borderWidth: strokeWidth,
          borderColor: `${color}18`,
        }}
      />

      {/*
        The arc is drawn by placing a full colored border-circle inside
        clipped half-width containers, then rotating it to reveal the
        desired portion.

        First 180°: rotate a circle inside the RIGHT half container.
        The circle starts with its colored edge at 12-o'clock.
        Rotating clockwise sweeps the colored arc from 12-o'clock rightward.

        Next 180°: the right half is fully colored, and we add a second
        rotating circle in the LEFT half container for the remaining arc.
      */}

      {/* Right-side clip: handles 0–180° */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: half,
          width: half,
          height: size,
          overflow: 'hidden',
        }}>
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: -half,
            width: size,
            height: size,
            borderRadius: half,
            borderWidth: strokeWidth,
            borderColor: 'transparent',
            borderTopColor: color,
            borderRightColor: degrees >= 90 ? color : 'transparent',
            borderBottomColor: degrees >= 180 ? color : 'transparent',
            transform: [{ rotate: `${Math.min(degrees, 180)}deg` }],
          }}
        />
      </View>

      {/* Left-side clip: handles 180–360° */}
      {degrees > 180 && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: half,
            height: size,
            overflow: 'hidden',
          }}>
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: size,
              height: size,
              borderRadius: half,
              borderWidth: strokeWidth,
              borderColor: 'transparent',
              borderTopColor: color,
              borderLeftColor: (degrees - 180) >= 90 ? color : 'transparent',
              borderBottomColor: degrees >= 360 ? color : 'transparent',
              transform: [{ rotate: `${degrees - 180}deg` }],
            }}
          />
        </View>
      )}
    </View>
  );
}

function LegendItem({
  color,
  label,
  current,
  target,
  unit,
}: {
  color: string;
  label: string;
  current: number;
  target: number;
  unit: string;
}) {
  const percent = target > 0 ? Math.min(Math.round((current / target) * 100), 999) : 0;

  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <View style={styles.legendText}>
        <Text style={styles.legendLabel}>{label}</Text>
        <Text style={styles.legendValue}>
          <Text style={{ color, fontWeight: '800' }}>{current}</Text>
          <Text style={styles.legendTarget}> / {target} {unit}</Text>
        </Text>
      </View>
      <Text style={[styles.legendPercent, { color }]}>{percent}%</Text>
    </View>
  );
}

export default function GoalProgressCard({
  goals,
  currentCalories,
  currentActiveMinutes,
  currentActiveDays,
}: GoalProgress) {
  const calProgress = goals.dailyCalories > 0 ? currentCalories / goals.dailyCalories : 0;
  const minProgress = goals.dailyActiveMinutes > 0 ? currentActiveMinutes / goals.dailyActiveMinutes : 0;
  const dayProgress = goals.weeklyActiveDays > 0 ? currentActiveDays / goals.weeklyActiveDays : 0;

  const outerSize = 160;
  const stroke = 12;
  const gap = 4;
  const midSize = outerSize - (stroke + gap) * 2;
  const innerSize = midSize - (stroke + gap) * 2;

  return (
    <View style={styles.card}>
      {/* Concentric rings */}
      <View style={styles.ringWrapper}>
        <View style={{ width: outerSize, height: outerSize, alignItems: 'center', justifyContent: 'center' }}>
          <ArcRing progress={calProgress} size={outerSize} strokeWidth={stroke} color={COLORS.calories} />
          <ArcRing progress={minProgress} size={midSize} strokeWidth={stroke} color={COLORS.minutes} />
          <ArcRing progress={dayProgress} size={innerSize} strokeWidth={stroke} color={COLORS.days} />

          {/* Center label */}
          <View style={styles.centerLabel}>
            <Text style={[
              styles.centerPercent,
              calProgress >= 1 && minProgress >= 1 && dayProgress >= 1 && styles.centerComplete,
            ]}>
              {Math.min(Math.round(((calProgress + minProgress + dayProgress) / 3) * 100), 100)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <LegendItem
          color={COLORS.calories}
          label="Calories"
          current={currentCalories}
          target={goals.dailyCalories}
          unit="kcal"
        />
        <LegendItem
          color={COLORS.minutes}
          label="Active Min"
          current={currentActiveMinutes}
          target={goals.dailyActiveMinutes}
          unit="min"
        />
        <LegendItem
          color={COLORS.days}
          label="Active Days"
          current={currentActiveDays}
          target={goals.weeklyActiveDays}
          unit="/ wk"
        />
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
    alignItems: 'center',
  },
  ringWrapper: {
    marginBottom: 20,
    marginTop: 4,
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPercent: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  centerComplete: {
    color: '#30D158',
  },
  legend: {
    width: '100%',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600',
  },
  legendValue: {
    fontSize: 14,
    color: '#fff',
    marginTop: 1,
  },
  legendTarget: {
    color: '#636366',
    fontWeight: '400',
  },
  legendPercent: {
    fontSize: 16,
    fontWeight: '800',
    minWidth: 45,
    textAlign: 'right',
  },
});
