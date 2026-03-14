import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface EpochDataPoint {
  timestamp: number; // epoch end time in ms
  met: number;
}

const VISUAL_BARS = 48; // max visual columns
const MAX_MET = 12;

const COLORS = {
  low: '#636366',       // grey
  moderate: '#FF9F0A',  // amber
  intense: '#FF453A',   // red
  empty: '#2C2C2E',     // dark fill for empty buckets
};

function barColor(met: number): string {
  if (met < 2) return COLORS.low;
  if (met <= 5) return COLORS.moderate;
  return COLORS.intense;
}

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Pick a human-readable label for the bucket size. */
function bucketLabel(bucketMs: number): string {
  const mins = Math.round(bucketMs / 60_000);
  if (mins < 60) return `${mins}m intervals`;
  const hrs = (mins / 60).toFixed(1).replace(/\.0$/, '');
  return `${hrs}h intervals`;
}

interface Bucket {
  startMs: number;
  endMs: number;
  avgMet: number;
  count: number; // 0 = no data in this bucket
}

function bucketize(data: EpochDataPoint[], numBuckets: number): Bucket[] {
  if (data.length === 0) return [];

  const minTs = data[0].timestamp;
  const maxTs = data[data.length - 1].timestamp;
  const span = maxTs - minTs;

  // If all data is within a tiny range, just show raw points
  if (span <= 0 || data.length <= numBuckets) {
    return data.map(d => ({
      startMs: d.timestamp,
      endMs: d.timestamp,
      avgMet: d.met,
      count: 1,
    }));
  }

  const bucketWidth = span / numBuckets;
  const buckets: Bucket[] = [];

  for (let i = 0; i < numBuckets; i++) {
    const start = minTs + i * bucketWidth;
    const end = start + bucketWidth;
    const points = data.filter(d => d.timestamp >= start && d.timestamp < end);

    buckets.push({
      startMs: start,
      endMs: end,
      avgMet: points.length > 0
        ? points.reduce((s, p) => s + p.met, 0) / points.length
        : 0,
      count: points.length,
    });
  }

  return buckets;
}

interface Props {
  data: EpochDataPoint[];
}

export default function ActivityGraph({ data }: Props) {
  const buckets = useMemo(() => bucketize(data, VISUAL_BARS), [data]);

  if (buckets.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Activity Timeline</Text>
        <Text style={styles.emptyText}>Collecting data — first bar appears after 30s</Text>
      </View>
    );
  }

  const firstTime = buckets[0].startMs;
  const lastTime = buckets[buckets.length - 1].endMs;
  const spanMs = lastTime - firstTime;

  const firstLabel = formatTime(buckets[0].startMs);
  const lastLabel = buckets.length > 1
    ? formatTime(buckets[buckets.length - 1].startMs)
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Activity Timeline</Text>
        {spanMs > 60_000 && (
          <Text style={styles.subtitle}>
            {buckets.length < data.length
              ? bucketLabel(spanMs / buckets.length)
              : '30s epochs'}
          </Text>
        )}
      </View>

      {/* Chart */}
      <View style={styles.chartArea}>
        {/* Y-axis */}
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
            {buckets.map((bucket, i) => {
              const met = Math.min(bucket.avgMet, MAX_MET);
              const heightPercent = bucket.count > 0 ? (met / MAX_MET) * 100 : 0;

              return (
                <View key={i} style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${Math.max(heightPercent, bucket.count > 0 ? 1.5 : 0)}%`,
                        backgroundColor: bucket.count > 0 ? barColor(bucket.avgMet) : COLORS.empty,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* X-axis */}
      <View style={styles.xAxis}>
        <Text style={styles.xLabel}>{firstLabel}</Text>
        {lastLabel && <Text style={styles.xLabel}>{lastLabel}</Text>}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <LegendDot color={COLORS.low} label="Low (<2)" />
        <LegendDot color={COLORS.moderate} label="Mod (2-5)" />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 11,
    color: '#8E8E93',
  },
  emptyText: {
    color: '#636366',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 30,
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
    gap: 1,
  },
  barWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '100%',
    borderRadius: 2,
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
    marginLeft: 24,
  },
  xLabel: {
    fontSize: 10,
    color: '#636366',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
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
