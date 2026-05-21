import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { CartesianChart, Line } from 'victory-native';
import { Vital } from '@/types';

interface VitalsChartProps {
  vitals: Vital[];
}

const { width } = Dimensions.get('window');

export default function VitalsChart({ vitals }: VitalsChartProps) {
  if (!vitals || vitals.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.emoji}>❤️</Text>
        <Text style={styles.emptyText}>No vitals recorded yet.</Text>
        <Text style={styles.emptySubText}>
          Your vitals will appear here after your first visit.
        </Text>
      </View>
    );
  }

  const latestVital = vitals[vitals.length - 1];

  // Build chart data — heart rate over time
  const chartData = vitals
    .filter((v) => v.heartRate != null)
    .slice(-7)
    .map((v, i) => ({
      x: i,
      heartRate: v.heartRate ?? 0,
    }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Vitals</Text>
      <Text style={styles.subtitle}>LAST 7 READINGS</Text>

      {/* Key Metrics Strip */}
      <View style={styles.metricsRow}>
        {latestVital.heartRate != null && (
          <View style={[styles.metric, { backgroundColor: '#fef2f2' }]}>
            <Text style={[styles.metricValue, { color: '#ef4444' }]}>{latestVital.heartRate}</Text>
            <Text style={[styles.metricLabel, { color: '#fca5a5' }]}>BPM</Text>
          </View>
        )}
        {latestVital.oxygenSaturation != null && (
          <View style={[styles.metric, { backgroundColor: '#eff6ff' }]}>
            <Text style={[styles.metricValue, { color: '#3b82f6' }]}>{latestVital.oxygenSaturation}%</Text>
            <Text style={[styles.metricLabel, { color: '#93c5fd' }]}>SpO2</Text>
          </View>
        )}
        {latestVital.temperature != null && (
          <View style={[styles.metric, { backgroundColor: '#fffbeb' }]}>
            <Text style={[styles.metricValue, { color: '#f59e0b' }]}>{latestVital.temperature}°</Text>
            <Text style={[styles.metricLabel, { color: '#fcd34d' }]}>Temp</Text>
          </View>
        )}
        {latestVital.systolicBP != null && (
          <View style={[styles.metric, { backgroundColor: '#f0fdf4' }]}>
            <Text style={[styles.metricValue, { color: '#10b981', fontSize: 14 }]}>
              {latestVital.systolicBP}/{latestVital.diastolicBP}
            </Text>
            <Text style={[styles.metricLabel, { color: '#6ee7b7' }]}>BP</Text>
          </View>
        )}
      </View>

      {/* Line Chart */}
      {chartData.length > 1 && (
        <View style={{ height: 160, marginTop: 12 }}>
          <CartesianChart
            data={chartData}
            xKey="x"
            yKeys={["heartRate"]}
            domainPadding={{ top: 20, bottom: 10, left: 10, right: 10 }}
          >
            {({ points }) => (
              <Line
                points={points.heartRate}
                color="#ef4444"
                strokeWidth={3}
                animate={{ type: 'spring' }}
              />
            )}
          </CartesianChart>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 32,
    marginHorizontal: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    marginHorizontal: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metric: {
    flex: 1,
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 2,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
});
