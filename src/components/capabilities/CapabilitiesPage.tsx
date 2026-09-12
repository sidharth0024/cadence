// src/components/capabilities/CapabilitiesPage.tsx
// The Architecture of Self: 6 Universal Dimensions
// Detailed trajectory, contributor analysis, neglect alerts, and development guidance.

import React, { useState, useEffect } from 'react';
import { UserCapability, CapabilityOverviewData } from '../../types';
import { api } from '../../services/api';
import {
  Brain,
  Shield,
  Eye,
  Sparkles,
  Flame,
  Mountain,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  BarChart2,
} from 'lucide-react';

export const CapabilitiesPage: React.FC = () => {
  const [capabilities, setCapabilities] = useState<UserCapability[]>([]);
  const [overview, setOverview] = useState<CapabilityOverviewData | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<string | null>('intellect');
  const [detailData, setDetailData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const dimConfig: Record<string, { name: string; color: string; icon: any; description: string }> = {
    intellect: {
      name: 'Intellect',
      color: '#72B7F2',
      icon: Brain,
      description: 'Analytical reasoning, pattern recognition, structural architecture, and depth of comprehension.',
    },
    discipline: {
      name: 'Discipline',
      color: '#D9AD5A',
      icon: Shield,
      description: 'Execution consistency, adherence to commitments, resistance to compromise, and habit integrity.',
    },
    focus: {
      name: 'Focus',
      color: '#63D99B',
      icon: Eye,
      description: 'Depth of single-task immersion, attention span durability, and resistance to environmental distraction.',
    },
    creativity: {
      name: 'Creativity',
      color: '#9B72D6',
      icon: Sparkles,
      description: 'Generative ideation, lateral synthesis, novel solution architecture, and expressive output.',
    },
    resilience: {
      name: 'Resilience',
      color: '#E56B63',
      icon: Flame,
      description: 'Friction tolerance, recovery from setbacks, psychological endurance under load, and grit.',
    },
    strength: {
      name: 'Strength',
      color: '#D98A3A',
      icon: Mountain,
      description: 'Physical vigor, bodily conditioning, stamina, kinetic power, and somatic vitality.',
    },
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [caps, ov] = await Promise.all([
        api.getCapabilities(),
        api.getCapabilityOverview(),
      ]);
      setCapabilities(caps);
      setOverview(ov);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedDimension) {
      api.getCapabilityDetail(selectedDimension)
        .then(data => setDetailData(data))
        .catch(() => setDetailData(null));
    }
  }, [selectedDimension]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-[var(--color-border)] pb-4">
        <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-brand)]">
          INTERNAL REPOSITORY
        </span>
        <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)]">
          Capabilities
        </h1>
        <p className="text-xs text-[var(--color-text-secondary)]">
          The Architecture of Self. Six universal dimensions shaped by server-verified real-world execution.
        </p>
      </div>

      {/* Strategic Synthesis Callout Banner */}
      {overview && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Strongest Dimension */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <span className="font-mono text-[10px] uppercase text-[var(--color-text-tertiary)]">
              STRONGEST DIMENSION
            </span>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="font-display text-2xl font-bold capitalize text-[var(--color-text-primary)]">
                {overview.strongest?.dimension}
              </span>
              <span className="font-mono text-xs font-bold text-[var(--color-brand-highlight)]">
                {overview.strongest?.value} PTS
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">Dominant behavioral anchor</p>
          </div>

          {/* Fastest Growing */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <span className="font-mono text-[10px] uppercase text-[var(--color-text-tertiary)]">
              FASTEST TRAJECTORY
            </span>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="font-display text-2xl font-bold capitalize text-[var(--color-text-primary)]">
                {overview.fastestGrowing?.dimension}
              </span>
              <span className="font-mono text-xs text-[var(--color-status-success)]">
                {overview.fastestGrowing?.change}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">Recent concentration surge</p>
          </div>

          {/* Most Neglected Dimension */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase text-[var(--color-text-tertiary)]">
                ATTENTION REQUIRED
              </span>
              <AlertTriangle className="h-3.5 w-3.5 text-[var(--color-brand)]" />
            </div>
            <div className="mt-1 flex items-baseline space-x-2">
              <span className="font-display text-2xl font-bold capitalize text-[var(--color-brand-highlight)]">
                {overview.mostNeglected?.dimension}
              </span>
              <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
                {overview.mostNeglected?.daysWithoutActivity}d Idle
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">Recommend scheduling focus</p>
          </div>
        </div>
      )}

      {/* 6 Dimension Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {capabilities.map(cap => {
          const cfg = dimConfig[cap.dimension] || {
            name: cap.dimension,
            color: '#D8AA78',
            icon: Brain,
            description: '',
          };
          const Icon = cfg.icon;
          const isSelected = selectedDimension === cap.dimension;

          return (
            <div
              key={cap.id}
              onClick={() => setSelectedDimension(cap.dimension)}
              className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                isSelected
                  ? 'border-[var(--color-brand)] bg-[var(--color-surface-elevated)] shadow-lg'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-gold)]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg border"
                    style={{
                      backgroundColor: `${cfg.color}15`,
                      borderColor: `${cfg.color}40`,
                      color: cfg.color,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-[var(--color-text-primary)]">
                    {cfg.name}
                  </h3>
                </div>

                <span
                  className="rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase"
                  style={{
                    backgroundColor: `${cfg.color}15`,
                    color: cfg.color,
                  }}
                >
                  {cap.trajectory}
                </span>
              </div>

              <p className="mt-2.5 text-[11px] leading-relaxed text-[var(--color-text-secondary)] line-clamp-2">
                {cfg.description}
              </p>

              {/* Progress Bar & Value */}
              <div className="mt-4">
                <div className="flex items-baseline justify-between font-mono text-xs">
                  <span className="text-[var(--color-text-tertiary)] uppercase text-[10px]">CURRENT LEVEL</span>
                  <span className="font-bold text-[var(--color-text-primary)]">{cap.value} / 100</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${cap.value}%`,
                      backgroundColor: cfg.color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Capability Deep-Dive */}
      {selectedDimension && detailData && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-md">
          <div className="flex items-center space-x-2 border-b border-[var(--color-border-subtle)] pb-3">
            <BarChart2 className="h-4 w-4 text-[var(--color-brand)]" />
            <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--color-brand)]">
              HISTORIC CONTRIBUTORS · {selectedDimension.toUpperCase()}
            </h3>
          </div>

          <div className="mt-4 space-y-3">
            <h4 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
              Assignments Driving {dimConfig[selectedDimension]?.name} Advancement
            </h4>

            {detailData.contributors && detailData.contributors.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {detailData.contributors.map((c: any) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-3"
                  >
                    <div>
                      <h5 className="text-xs font-semibold text-[var(--color-text-primary)]">{c.title}</h5>
                      <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                        {c.domain} · {c.difficulty}
                      </span>
                    </div>
                    <span
                      className="font-mono text-xs font-bold"
                      style={{ color: dimConfig[selectedDimension]?.color }}
                    >
                      +{c.capabilityImpacts?.[selectedDimension] || 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--color-text-secondary)] italic">
                No recent assignments recorded for this dimension yet. Schedule actions targeting {selectedDimension} to accelerate development.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
