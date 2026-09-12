// src/components/common/WorldEnvironment.tsx
// Cinematic Living World Environment
// Key Architectural Rule: Independent World Objects Layer.
// Functional UI markers, capability landmarks, and destination nodes exist as independent DOM components,
// independent of background photography or imagery.

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCadence } from '../../context/CadenceContext';
import { Brain, Shield, Sparkles, Flame, Mountain, Eye, Compass, Flag } from 'lucide-react';

interface Props {
  onSelectCapability?: (dim: string) => void;
}

export const WorldEnvironment: React.FC<Props> = ({ onSelectCapability }) => {
  const { user } = useAuth();
  const { primaryObjective, capabilities, progression } = useCadence();

  const isCommander = user?.operatingMode === 'COMMANDER';
  const level = progression?.level || 1;
  const progressPercent = primaryObjective?.progress || 0;

  // Capability mapping
  const capMap: Record<string, number> = {};
  capabilities.forEach(c => { capMap[c.dimension] = c.value; });

  const landmarks = [
    {
      id: 'intellect',
      name: 'Observatory of Intellect',
      value: capMap['intellect'] || 50,
      color: '#72B7F2',
      icon: Brain,
      position: 'top-[22%] left-[12%]',
    },
    {
      id: 'discipline',
      name: 'Citadel of Discipline',
      value: capMap['discipline'] || 50,
      color: '#D9AD5A',
      icon: Shield,
      position: 'top-[30%] left-[27%]',
    },
    {
      id: 'focus',
      name: 'Spire of Focus',
      value: capMap['focus'] || 50,
      color: '#63D99B',
      icon: Eye,
      position: 'top-[18%] left-[48%]',
    },
    {
      id: 'creativity',
      name: 'Forge of Creativity',
      value: capMap['creativity'] || 50,
      color: '#9B72D6',
      icon: Sparkles,
      position: 'top-[35%] left-[64%]',
    },
    {
      id: 'resilience',
      name: 'Bastion of Resilience',
      value: capMap['resilience'] || 50,
      color: '#E56B63',
      icon: Flame,
      position: 'top-[26%] left-[78%]',
    },
    {
      id: 'strength',
      name: 'Monolith of Strength',
      value: capMap['strength'] || 50,
      color: '#D98A3A',
      icon: Mountain,
      position: 'top-[42%] left-[88%]',
    },
  ];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[#07090C] py-8 px-6 shadow-2xl transition-all duration-700">
      {/* Background Canvas Atmosphere */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-60 transition-opacity duration-700"
        style={{
          background: isCommander
            ? 'radial-gradient(ellipse at 50% 10%, rgba(216, 170, 120, 0.12) 0%, rgba(17, 18, 19, 0.95) 75%)'
            : 'radial-gradient(ellipse at 50% 10%, rgba(114, 183, 242, 0.10) 0%, rgba(17, 18, 19, 0.95) 75%)',
        }}
      />

      {/* Subtle Star / Atmospheric Particles */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px] opacity-15" />

      {/* Distant Mountain Range SVG (Vector, Non-bitmap) */}
      <div className="absolute bottom-0 left-0 right-0 h-44 pointer-events-none opacity-20">
        <svg viewBox="0 0 1200 240" fill="none" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,240 L0,160 L140,80 L280,180 L420,50 L580,170 L720,40 L880,160 L1020,70 L1200,190 L1200,240 Z" fill="#191B1D" />
          <path d="M0,240 L0,190 L180,120 L360,210 L520,110 L680,200 L840,90 L1040,190 L1200,140 L1200,240 Z" fill="#111213" />
        </svg>
      </div>

      {/* World Content Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[10px] tracking-widest text-[var(--color-brand)] uppercase">
              THE LIVING WORLD · {isCommander ? 'STRATEGIC SYNCHRONIZATION' : 'SELF-DIRECTED DOMAIN'}
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-wide text-[var(--color-text-primary)]">
            World of Cadence · Realm Level {level}
          </h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Every verified real-world completion permanently shapes your landmarks and destination path.
          </p>
        </div>

        {/* Current Destination Status */}
        {primaryObjective && (
          <div className="flex items-center space-x-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-3.5 py-2 backdrop-blur-sm">
            <Compass className="h-4 w-4 text-[var(--color-brand)]" />
            <div className="flex flex-col">
              <span className="font-mono text-[9px] uppercase text-[var(--color-text-tertiary)]">ACTIVE HORIZON</span>
              <span className="text-xs font-semibold text-[var(--color-text-primary)] truncate max-w-[200px]">
                {primaryObjective.title}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 border-l border-[var(--color-border)] pl-3">
              <Flag className="h-3.5 w-3.5 text-[var(--color-brand)]" />
              <span className="font-mono text-xs font-bold text-[var(--color-brand-highlight)]">
                {progressPercent}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Independent World Landmarks Grid */}
      <div className="relative z-10 mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {landmarks.map(lm => {
          const Icon = lm.icon;
          return (
            <button
              key={lm.id}
              onClick={() => onSelectCapability?.(lm.id)}
              className="group relative flex flex-col items-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-3.5 text-center transition-all duration-300 hover:border-[var(--color-border-gold)] hover:bg-[var(--color-surface-elevated)] hover:shadow-lg focus:outline-none"
            >
              {/* Landmark Glowing Indicator */}
              <div
                className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-lg border transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: `${lm.color}15`,
                  borderColor: `${lm.color}40`,
                  color: lm.color,
                }}
              >
                <Icon className="h-5 w-5" />
              </div>

              <span className="text-[11px] font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-brand-highlight)] line-clamp-1">
                {lm.name.split(' ')[0]}
              </span>

              <div className="mt-1 flex items-center space-x-1">
                <span className="font-mono text-xs font-bold" style={{ color: lm.color }}>
                  {lm.value}
                </span>
                <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">PTS</span>
              </div>

              {/* Development Progress Micro-Bar */}
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-elevated)]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (lm.value / 100) * 100)}%`,
                    backgroundColor: lm.color,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Living Journey Trajectory Line */}
      <div className="relative z-10 mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div className="h-2 w-2 rounded-full bg-[var(--color-brand)] animate-pulse" />
            <span className="font-mono text-[10px] tracking-wider text-[var(--color-text-secondary)] uppercase">
              JOURNEY TRAJECTORY · PHASE PROGRESSION
            </span>
          </div>
          <span className="font-mono text-xs text-[var(--color-brand-highlight)]">
            {progressPercent}% Trajectory Synchronized
          </span>
        </div>

        {/* Path Bar */}
        <div className="relative mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-elevated)]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-highlight)] transition-all duration-1000"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
