import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
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
 * SVG-based arc ring. Uses strokeDasharray on an SVG <Circle> to draw
 * a precise arc from 9 o'clock (left), sweeping clockwise.
 * Works perfectly at any size and any percentage.
 */
function ArcRing({
  progress,
  size,
  strokeWidth,
  color,
  completed,
}: {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  completed: boolean;
}) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * clamped;

  if (completed) {
    return (
      <CompletedRing size={size} strokeWidth={strokeWidth} color={color} />
    );
  }

  return (
    <View style={{ width: size, height: size, position: 'absolute' }}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`${color}20`}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        {clamped > 0 && (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={`${filled} ${circumference - filled}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            rotation={-90}
            origin={`${size / 2}, ${size / 2}`}
          />
        )}
      </Svg>
    </View>
  );
}

function CompletedRing({
  size, strokeWidth, color,
}: {
  size: number; strokeWidth: number; color: string;
}) {
  const opacity = useSharedValue(1);
  const radius = (size - strokeWidth) / 2;

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={{ width: size, height: size, position: 'absolute' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={`${color}20`} strokeWidth={strokeWidth} fill="none"
        />
      </Svg>
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, animatedStyle]}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2} cy={size / 2} r={radius}
            stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

function LegendItem({
  color, label, current, target, unit, exceeded,
}: {
  color: string; label: string; current: number; target: number; unit: string; exceeded: boolean;
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
  goals, currentCalories, currentActiveMinutes, currentActiveDays,
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
          <ArcRing progress={calProgress} size={outerSize} strokeWidth={stroke}
            color={COLORS.calories} completed={calProgress >= 1} />
          <ArcRing progress={minProgress} size={midSize} strokeWidth={stroke}
            color={COLORS.minutes} completed={minProgress >= 1} />
          <ArcRing progress={dayProgress} size={innerSize} strokeWidth={stroke}
            color={COLORS.days} completed={dayProgress >= 1} />
          <View style={styles.centerLabel}>
            <Text style={[styles.centerPercent, allMet && styles.centerComplete]}>
              {Math.min(Math.round(((calProgress + minProgress + dayProgress) / 3) * 100), 100)}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.legend}>
        <LegendItem color={COLORS.calories} label="Calories" current={currentCalories}
          target={goals.dailyCalories} unit="kcal" exceeded={calProgress > 1} />
        <LegendItem color={COLORS.minutes} label="Active Min" current={currentActiveMinutes}
          target={goals.dailyActiveMinutes} unit="min" exceeded={minProgress > 1} />
        <LegendItem color={COLORS.days} label="Active Days" current={currentActiveDays}
          target={goals.weeklyActiveDays} unit="/ wk" exceeded={dayProgress > 1} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1C1C1E', borderRadius: 16,
    padding: 20, marginBottom: 16, alignItems: 'center',
  },
  ringWrapper: { marginBottom: 20, marginTop: 4 },
  centerLabel: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  centerPercent: { fontSize: 22, fontWeight: '800', color: '#fff' },
  centerComplete: { color: '#30D158' },
  legend: { width: '100%', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  legendText: { flex: 1 },
  legendLabel: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  legendValue: { fontSize: 14, color: '#fff', marginTop: 1 },
  legendTarget: { color: '#636366', fontWeight: '400' },
  legendPercent: { fontSize: 16, fontWeight: '800', minWidth: 45, textAlign: 'right' },
});
