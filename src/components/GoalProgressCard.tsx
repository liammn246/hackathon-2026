import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
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
 * Bulletproof circular arc using two half-circle clips.
 *
 * All arcs start from the LEFT (9 o'clock) and sweep clockwise.
 *
 * Technique:
 * 1. A full colored border-circle sits behind two opaque half-circle masks
 *    (top mask and bottom mask) that hide it completely.
 * 2. To reveal 0–180°, we rotate the BOTTOM mask clockwise, uncovering
 *    the colored ring underneath from left → top → right.
 * 3. To reveal 180–360°, the bottom mask is fully rotated (hidden),
 *    and we rotate the TOP mask clockwise to uncover left → bottom → right.
 *
 * This produces a perfectly continuous arc with no seams.
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
  const half = size / 2;
  const trackColor = `${color}18`;

  if (clamped <= 0) {
    return (
      <View style={{ width: size, height: size, position: 'absolute' }}>
        <View style={{
          position: 'absolute', width: size, height: size,
          borderRadius: half, borderWidth: strokeWidth, borderColor: trackColor,
        }} />
      </View>
    );
  }

  if (clamped >= 1) {
    return (
      <CompletedRing size={size} strokeWidth={strokeWidth} color={color} trackColor={trackColor} />
    );
  }

  const degrees = clamped * 360;
  // How far each mask rotates (starting from its covering position)
  const bottomMaskRotation = Math.min(degrees, 180);
  const topMaskRotation = degrees > 180 ? degrees - 180 : 0;

  return (
    <View style={{ width: size, height: size, position: 'absolute' }}>
      {/* Dim track */}
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: half, borderWidth: strokeWidth, borderColor: trackColor,
      }} />

      {/* Full colored ring (sits behind the masks) */}
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: half, borderWidth: strokeWidth, borderColor: color,
      }} />

      {/* TOP mask — covers top half of the colored ring.
          Stays put for 0–180°, then rotates away for 180–360°. */}
      <View style={{
        position: 'absolute', top: 0, left: 0,
        width: size, height: half, overflow: 'hidden',
      }}>
        <View style={{
          position: 'absolute', top: 0, left: 0,
          width: size, height: size,
          borderRadius: half, backgroundColor: '#1C1C1E',
          transform: [
            { translateY: 0 },
            { rotate: `${topMaskRotation}deg` },
          ],
        }} />
      </View>

      {/* BOTTOM mask — covers bottom half of the colored ring.
          Rotates away for 0–180°. Fully gone after 180°. */}
      {degrees < 180 && (
        <View style={{
          position: 'absolute', top: half, left: 0,
          width: size, height: half, overflow: 'hidden',
        }}>
          <View style={{
            position: 'absolute', top: -half, left: 0,
            width: size, height: size,
            borderRadius: half, backgroundColor: '#1C1C1E',
            transform: [{ rotate: `${bottomMaskRotation}deg` }],
          }} />
        </View>
      )}
    </View>
  );
}

/** Completed ring with a subtle pulsing glow. */
function CompletedRing({
  size,
  strokeWidth,
  color,
  trackColor,
}: {
  size: number;
  strokeWidth: number;
  color: string;
  trackColor: string;
}) {
  const opacity = useSharedValue(1);
  const half = size / 2;

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={{ width: size, height: size, position: 'absolute' }}>
      <View style={{
        position: 'absolute', width: size, height: size,
        borderRadius: half, borderWidth: strokeWidth, borderColor: trackColor,
      }} />
      <Animated.View
        style={[
          {
            position: 'absolute', width: size, height: size,
            borderRadius: half, borderWidth: strokeWidth, borderColor: color,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

function LegendItem({
  color,
  label,
  current,
  target,
  unit,
  exceeded,
}: {
  color: string;
  label: string;
  current: number;
  target: number;
  unit: string;
  exceeded: boolean;
}) {
  const percent = target > 0 ? Math.round((current / target) * 100) : 0;

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
      <Text style={[styles.legendPercent, { color: exceeded ? '#30D158' : color }]}>
        {percent}%
      </Text>
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

  const allMet = calProgress >= 1 && minProgress >= 1 && dayProgress >= 1;

  return (
    <View style={styles.card}>
      <View style={styles.ringWrapper}>
        <View style={{ width: outerSize, height: outerSize, alignItems: 'center', justifyContent: 'center' }}>
          <ArcRing progress={calProgress} size={outerSize} strokeWidth={stroke} color={COLORS.calories} />
          <ArcRing progress={minProgress} size={midSize} strokeWidth={stroke} color={COLORS.minutes} />
          <ArcRing progress={dayProgress} size={innerSize} strokeWidth={stroke} color={COLORS.days} />

          <View style={styles.centerLabel}>
            <Text style={[styles.centerPercent, allMet && styles.centerComplete]}>
              {Math.min(Math.round(((calProgress + minProgress + dayProgress) / 3) * 100), 100)}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.legend}>
        <LegendItem
          color={COLORS.calories}
          label="Calories"
          current={currentCalories}
          target={goals.dailyCalories}
          unit="kcal"
          exceeded={calProgress > 1}
        />
        <LegendItem
          color={COLORS.minutes}
          label="Active Min"
          current={currentActiveMinutes}
          target={goals.dailyActiveMinutes}
          unit="min"
          exceeded={minProgress > 1}
        />
        <LegendItem
          color={COLORS.days}
          label="Active Days"
          current={currentActiveDays}
          target={goals.weeklyActiveDays}
          unit="/ wk"
          exceeded={dayProgress > 1}
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
