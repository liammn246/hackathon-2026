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

/** Completed ring with a subtle pulsing glow. */
function CompletedRing({
  size,
  strokeWidth,
  color,
  track,
}: {
  size: number;
  strokeWidth: number;
  color: string;
  track: React.ReactNode;
}) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1, // infinite
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const half = size / 2;

  return (
    <View style={{ width: size, height: size, position: 'absolute' }}>
      {track}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: half,
            borderWidth: strokeWidth,
            borderColor: color,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

/**
 * Circular progress ring using the standard two-half-clip technique.
 *
 * How it works:
 * - A full border-circle is placed inside a container clipped to half the width.
 * - Rotating the inner circle reveals the colored border progressively.
 * - For 0–180° we only use the right-half clip.
 * - For 180–360° the right half is fully filled, and a second clip on the left
 *   handles the remaining arc.
 *
 * At exactly 0%: only the dim track is shown.
 * Over 100%: capped at a full ring.
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
  // Clamp between 0 and 1
  const clamped = Math.min(Math.max(progress, 0), 1);
  const half = size / 2;

  // Common track
  const track = (
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
  );

  // Nothing to fill
  if (clamped <= 0) {
    return (
      <View style={{ width: size, height: size, position: 'absolute' }}>
        {track}
      </View>
    );
  }

  // Full ring — rendered with pulse animation via wrapper
  if (clamped >= 1) {
    return (
      <CompletedRing size={size} strokeWidth={strokeWidth} color={color} track={track} />
    );
  }

  const degrees = clamped * 360;
  const firstHalfDeg = Math.min(degrees, 180);
  const showSecondHalf = degrees > 180;
  const secondHalfDeg = showSecondHalf ? degrees - 180 : 0;

  return (
    <View style={{ width: size, height: size, position: 'absolute' }}>
      {track}

      {/* RIGHT half clip — sweeps 0° to 180° */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: half,
          width: half,
          height: size,
          overflow: 'hidden',
        }}>
        {/*
          The inner circle starts with colored top border at 12 o'clock.
          Rotating it clockwise pushes that colored edge into the visible
          right-half window.
        */}
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
            transform: [{ rotate: `${firstHalfDeg}deg` }],
          }}
        />
      </View>

      {/* Once past 90°, the right quadrant is filled — paint it permanently */}
      {degrees > 90 && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: half,
            width: half,
            height: half,
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
              borderRightColor: color,
            }}
          />
        </View>
      )}

      {/* Once past 180°, the bottom-right quadrant is filled too */}
      {showSecondHalf && (
        <View
          style={{
            position: 'absolute',
            top: half,
            left: half,
            width: half,
            height: half,
            overflow: 'hidden',
          }}>
          <View
            style={{
              position: 'absolute',
              top: -half,
              left: -half,
              width: size,
              height: size,
              borderRadius: half,
              borderWidth: strokeWidth,
              borderColor: 'transparent',
              borderBottomColor: color,
            }}
          />
        </View>
      )}

      {/* LEFT half clip — sweeps 180° to 360° */}
      {showSecondHalf && (
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
              transform: [{ rotate: `${180 + secondHalfDeg}deg` }],
            }}
          />
        </View>
      )}

      {/* Once past 270°, the left quadrant is filled */}
      {degrees > 270 && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: half,
            height: half,
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
              borderLeftColor: color,
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
      {/* Concentric rings */}
      <View style={styles.ringWrapper}>
        <View style={{ width: outerSize, height: outerSize, alignItems: 'center', justifyContent: 'center' }}>
          <ArcRing progress={calProgress} size={outerSize} strokeWidth={stroke} color={COLORS.calories} />
          <ArcRing progress={minProgress} size={midSize} strokeWidth={stroke} color={COLORS.minutes} />
          <ArcRing progress={dayProgress} size={innerSize} strokeWidth={stroke} color={COLORS.days} />

          {/* Center label */}
          <View style={styles.centerLabel}>
            <Text style={[styles.centerPercent, allMet && styles.centerComplete]}>
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
