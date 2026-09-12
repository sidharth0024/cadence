// src/components/performance/CapabilityRadarChart.tsx
// Recharts Radar Chart Visualizing the Six Universal Capabilities:
// Intellect, Discipline, Focus, Creativity, Resilience, Strength

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import { motion } from 'motion/react';
import { UserCapability } from '../../types';
import { Brain, Shield, Crosshair, Sparkles, HeartPulse, Dumbbell, TrendingUp } from 'lucide-react';

interface Props {
  capabilities: UserCapability[];
  mode?: 'COMMANDER' | 'MANUAL';
}

const CAPABILITY_META: Record<
  string,
  { label: string; icon: React.FC<{ className?: string }>; color: string; fill: string; description: string }
> = {
  intellect: {
    label: 'Intellect',
    icon: Brain,
    color: '#72B7F2',
    fill: 'rgba(114, 183, 242, 0.25)',
    description: 'Analytical depth, structured problem solving, and knowledge retention',
  },
  discipline: {
    label: 'Discipline',
    icon: Shield,
    color: '#D9AD5A',
    fill: 'rgba(217, 173, 90, 0.25)',
    description: 'Protocol adherence, routine consistency, and habit resistance',
  },
  focus: {
    label: 'Focus',
    icon: Crosshair,
    color: '#63D99B',
    fill: 'rgba(99, 217, 155, 0.25)',
    description: 'Distraction-free deep work, cognitive endurance, and single-tasking',
  },
  creativity: {
    label: 'Creativity',
    icon: Sparkles,
    color: '#9B72D6',
    fill: 'rgba(155, 114, 214, 0.25)',
    description: 'Synthesizing novel ideas, lateral thinking, and creative sprints',
  },
  resilience: {
    label: 'Resilience',
    icon: HeartPulse,
    color: '#E56B63',
    fill: 'rgba(229, 107, 99, 0.25)',
    description: 'Rapid recalibration after setbacks, cognitive friction recovery',
  },
  strength: {
    label: 'Strength',
    icon: Dumbbell,
    color: '#D98A3A',
    fill: 'rgba(217, 138, 58, 0.25)',
    description: 'High-friction throughput, physical and mental force output',
  },
};

const ORDERED_DIMENSIONS = [
  'intellect',
  'discipline',
  'focus',
  'creativity',
  'resilience',
  'strength',
];

export const CapabilityRadarChart: React.FC<Props> = ({
  capabilities,
  mode = 'COMMANDER',
}) => {
  const isCommander = mode === 'COMMANDER';
  const radarStroke = isCommander ? 'var(--color-brand)' : '#72B7F2';
  const radarFill = isCommander ? 'rgba(216, 170, 120, 0.35)' : 'rgba(114, 183, 242, 0.35)';

  // Build 6-axis dataset with defaults if empty
  const chartData = useMemo(() => {
    const map = new Map<string, UserCapability>();
    capabilities.forEach((c) => map.set(c.dimension.toLowerCase(), c));

    return ORDERED_DIMENSIONS.map((dim) => {
      const cap = map.get(dim);
      const meta = CAPABILITY_META[dim];
      const val = cap ? Math.round(cap.value) : 65;
      return {
        dimension: meta.label,
        key: dim,
        value: val,
        fullMark: 100,
        trajectory: cap?.trajectory || 'GROWING',
        color: meta.color,
      };
    });
  }, [capabilities]);

  // Find strongest and fastest developing
  const { strongest, lowest, avgScore } = useMemo(() => {
    if (chartData.length === 0) {
      return { strongest: null, lowest: null, avgScore: 0 };
    }
    const sorted = [...chartData].sort((a, b) => b.value - a.value);
    const sum = chartData.reduce((acc, c) => acc + c.value, 0);
    return {
      strongest: sorted[0],
      lowest: sorted[sorted.length - 1],
      avgScore: Math.round(sum / chartData.length),
    };
  }, [chartData]);

  // Custom Tick Label with Icon & Score
  const renderCustomAxisTick = ({ payload, x, y, textAnchor }: any) => {
    const dimName = payload.value;
    const item = chartData.find((d) => d.dimension === dimName);
    const meta = item ? CAPABILITY_META[item.key] : null;

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={textAnchor === 'middle' ? (y > 180 ? 14 : -10) : 4}
          textAnchor={textAnchor}
          fill={meta ? meta.color : '#F7F0E4'}
          fontSize={11}
          fontWeight={600}
          fontFamily="IBM Plex Mono, monospace"
        >
          {dimName.toUpperCase()} ({item?.value || 0})
        </text>
      </g>
    );
  };

  return (
    <div 
      id="capabilities-radar-card"
      className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#121417]/95 via-[#0f1114]/95 to-[#090b0d]/98 p-5 sm:p-6 shadow-[0_12px_35px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.06)] backdrop-blur-xl transition-all duration-300 hover:border-white/[0.14]"
    >
      {/* Background ambient lighting */}
      <div 
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: radarStroke }}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[10px] font-semibold tracking-widest text-[var(--color-brand)] uppercase">
              UNIVERSAL CAPABILITY EQUILIBRIUM
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] text-[var(--color-text-tertiary)]">
              RECHARTS RADAR
            </span>
          </div>
          <h3 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
            Hexagonal Capability Distribution
          </h3>
        </div>

        {/* Aggregate Badge */}
        <div className="flex items-center space-x-3">
          <div className="cadence-neomorph-inset flex items-center space-x-2 rounded-xl px-3 py-1.5 font-mono text-xs text-[var(--color-text-secondary)]">
            <span>COMPOSITE INDEX:</span>
            <span className="font-bold text-[var(--color-brand-highlight)]">{avgScore} / 100</span>
          </div>
        </div>
      </div>

      {/* Main Radar Layout: 2 Columns on Large Screens */}
      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
        {/* Left: Recharts Radar Container (7 cols) */}
        <div className="relative h-[340px] w-full lg:col-span-7 flex items-center justify-center">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-44 w-44 rounded-full border border-white/[0.03] bg-radial from-white/[0.02] to-transparent" />
          </div>

          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="72%" data={chartData}>
              <PolarGrid stroke="rgba(247, 240, 228, 0.08)" strokeDasharray="3 3" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={renderCustomAxisTick}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                stroke="rgba(247, 240, 228, 0.15)"
                tick={{ fill: 'rgba(247, 240, 228, 0.4)', fontSize: 9, fontFamily: 'monospace' }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const meta = CAPABILITY_META[data.key];
                    return (
                      <div className="rounded-xl border border-white/15 bg-[#0e1013]/95 p-3 shadow-2xl backdrop-blur-md">
                        <div className="flex items-center space-x-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: data.color }}
                          />
                          <span className="font-mono text-xs font-bold text-white">
                            {data.dimension}
                          </span>
                          <span className="font-mono text-xs font-semibold text-[var(--color-brand-highlight)]">
                            {data.value} / 100
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                          {meta?.description}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between font-mono text-[9px] text-[var(--color-text-tertiary)] border-t border-white/10 pt-1">
                          <span>TRAJECTORY:</span>
                          <span className="font-bold text-emerald-400">{data.trajectory}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Radar
                name="Capability Level"
                dataKey="value"
                stroke={radarStroke}
                strokeWidth={2.5}
                fill={radarFill}
                fillOpacity={0.5}
                dot={{
                  r: 4,
                  fill: radarStroke,
                  strokeWidth: 1,
                  stroke: '#06080A',
                }}
                activeDot={{
                  r: 6,
                  fill: '#F7D9A6',
                  strokeWidth: 2,
                  stroke: '#000',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Right: Dimension Cards Grid (5 cols) */}
        <div className="space-y-3 lg:col-span-5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Universal Capability Vectors
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2">
            {chartData.map((item) => {
              const meta = CAPABILITY_META[item.key];
              const Icon = meta.icon;
              const isPeak = strongest?.key === item.key;

              return (
                <motion.div
                  key={item.key}
                  whileHover={{ scale: 1.02, y: -1 }}
                  className={`cadence-neomorph-inset group relative rounded-xl p-3 transition-all ${
                    isPeak
                      ? 'border border-[var(--color-brand)]/40 shadow-[0_0_12px_rgba(216,170,120,0.15)]'
                      : 'border border-white/[0.04] hover:border-white/[0.12]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <Icon className="h-3.5 w-3.5" style={{ color: meta.color }} />
                      <span className="font-mono text-[11px] font-bold text-[var(--color-text-primary)]">
                        {item.dimension}
                      </span>
                    </div>
                    <span
                      className="font-mono text-xs font-bold"
                      style={{ color: meta.color }}
                    >
                      {item.value}
                    </span>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/50">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.value}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: meta.color }}
                    />
                  </div>

                  <div className="mt-1.5 flex items-center justify-between text-[9px] font-mono text-[var(--color-text-tertiary)]">
                    <span className="uppercase">{item.trajectory}</span>
                    {isPeak && (
                      <span className="font-bold text-[var(--color-brand-highlight)]">
                        ★ PEAK
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Strategic Insight Box */}
          <div className="mt-3 rounded-xl border border-white/[0.06] bg-black/40 p-3 text-xs text-[var(--color-text-secondary)]">
            <div className="flex items-center space-x-1.5 font-mono text-[10px] font-semibold text-[var(--color-brand-highlight)]">
              <TrendingUp className="h-3 w-3" />
              <span>EQUILIBRIUM OBSERVATION</span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed">
              {strongest?.dimension} represents your highest structural anchor at {strongest?.value}%.{' '}
              {lowest?.dimension} ({lowest?.value}%) presents the prime expansion vector to accelerate overall level throughput.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
