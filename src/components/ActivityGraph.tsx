import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface EpochDataPoint {
  timestamp: number; // epoch end time in ms
  met: number;
}

const BAR_COUNT = 20; // show last 20 epochs (10 minutes at 30s epochs)
const MAX_MET = 12;

const COLORS = {
  low: '#636366',      // grey
  moderate: '#FF9F0A',  // amber
  intense: '#FF453A',   // red
};

function barColor(met: number): string {
  if (met < 2) return COLORS.low;
  if (met <= 5) return COLORS.moderate;
  return COLORS.intense;
}

function formatTime(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

interface Props {
  data: EpochDataPoint[];
}

export default function ActivityGraph({ data }: Props) {
  // Take the most recent BAR_COUNT points
  const visible = data.slice(-BAR_COUNT);

  // Pad with empty slots if we have fewer than BAR_COUNT
  const padded: (EpochDataPoint | null)[] = [
    ...Array(Math.max(0, BAR_COUNT - visible.length)).fill(null),
    ...visible,
  ];

  const firstTime = visible.length > 0 ? visible[0].timestamp : null;
  const lastTime = visible.length > 0 ? visible[visible.length - 1].timestamp : null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Activity Timeline</Text>

      {/* MET threshold lines */}
      <View style={styles.chartArea}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          <Text style={styles.yLabel}>{MAX_MET}</Text>
          <Text style={styles.yLabel}>5</Text>
          <Text style={styles.yLabel}>2</Text>
          <Text style={styles.yLabel}>0</Text>
        </View>

        {/* Bars */}
        <View style={styles.barsContainer}>
          {/* Threshold lines */}
          <View style={[styles.thresholdLine, { bottom: `${(2 / MAX_MET) * 100}%` }]} />
          <View style={[styles.thresholdLine, { bottom: `${(5 / MAX_MET) * 100}%` }]} />

          <View style={styles.barsRow}>
            {padded.map((point, i) => {
              const met = point ? Math.min(point.met, MAX_MET) : 0;
              const heightPercent = (met / MAX_MET) * 100;

              return (
                <View key={i} style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${heightPercent}%`,
                        backgroundColor: point ? barColor(point.met) : '#2C2C2E',
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* X-axis time labels */}
      <View style={styles.xAxis}>
        <Text style={styles.xLabel}>{firstTime ? formatTime(firstTime) : '--:--'}</Text>
        <Text style={styles.xLabel}>{lastTime ? formatTime(lastTime) : '--:--'}</Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <LegendDot color={COLORS.low} label="Low (<2)" />
        <LegendDot color={COLORS.moderate} label="Moderate (2-5)" />
        <LegendDot color={COLORS.intense} label="Intense (5+)" />
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  chartArea: {
    flexDirection: 'row',
    height: 140,
  },
  yAxis: {
    width: 24,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  yLabel: {
    fontSize: 10,
    color: '#636366',
    fontWeight: '500',
  },
  barsContainer: {
    flex: 1,
    position: 'relative',
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  barWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 3,
    minHeight: 2,
  },
  thresholdLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#3A3A3C',
    zIndex: 1,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingLeft: 24,
  },
  xLabel: {
    fontSize: 10,
    color: '#636366',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: '#8E8E93',
  },
});
