// src/components/home/HomePage.tsx
// Cadence Master Home Control Surface
// Combines The Living World, Current Objective, Today's Focus, Upcoming Projection,
// Capabilities Overview, System Insight, and Execution Signals.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCadence } from '../../context/CadenceContext';
import { WorldEnvironment } from '../common/WorldEnvironment';
import { Assignment } from '../../types';
import { api } from '../../services/api';
import { ConsistencyStreak } from './ConsistencyStreak';
import {
  Play,
  HelpCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Flame,
  CheckCircle2,
  ChevronRight,
  Zap,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface Props {
  onNavigate: (tab: string) => void;
  onOpenCreate: () => void;
}

export const HomePage: React.FC<Props> = ({ onNavigate, onOpenCreate }) => {
  const { user } = useAuth();
  const { primaryObjective, currentFocus, capabilities, startExecution, refreshAll } = useCadence();
  const [showWhy, setShowWhy] = useState(false);
  const [upcoming, setUpcoming] = useState<Assignment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const isCommander = user?.operatingMode === 'COMMANDER';

  useEffect(() => {
    api.getAssignments({ status: 'AVAILABLE' })
      .then(list => {
        // filter out current focus
        const filtered = list.filter(a => a.id !== currentFocus?.id).slice(0, 3);
        setUpcoming(filtered);
      })
      .catch(() => {});
  }, [currentFocus]);

  const handleRequestCommanderAssignment = async () => {
    try {
      setIsGenerating(true);
      await api.generateCommanderAssignment();
      window.location.reload(); // sync focus
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Living World Environment */}
      <WorldEnvironment onSelectCapability={() => onNavigate('capabilities')} />

      {/* 2. Consistency Streak Protocol Visual Tracker (Persisted to Supabase) */}
      <ConsistencyStreak onStreakUpdated={refreshAll} />

      {/* 3. Main 2-Column Split: Objective Journey (Left) + Today's Focus (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Current Objective & Roadmap (lg:col-span-7) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Current Objective Card */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-md transition-colors hover:border-[var(--color-border-gold)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
              <span className="font-mono text-[10px] tracking-widest text-[var(--color-brand)] uppercase">
                ACTIVE OBJECTIVE · PRIMARY DESTINATION
              </span>
              <button
                onClick={() => onNavigate('objectives')}
                className="flex items-center space-x-1 text-xs text-[var(--color-brand)] hover:text-[var(--color-brand-highlight)]"
              >
                <span>Full Journey</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {primaryObjective ? (
              <div className="mt-4">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                  <h3 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
                    {primaryObjective.title}
                  </h3>
                  <span className="font-mono text-xs font-bold text-[var(--color-brand-highlight)]">
                    {primaryObjective.progress}% Complete
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {primaryObjective.description || primaryObjective.targetOutcome}
                </p>

                {/* Trajectory Progress Bar */}
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-elevated)]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-highlight)] transition-all duration-700"
                    style={{ width: `${primaryObjective.progress}%` }}
                  />
                </div>

                {/* Objective Meta Footer */}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center space-x-1.5 text-[var(--color-text-tertiary)]">
                    <span className="font-mono text-[10px] uppercase">STATUS:</span>
                    <span className="rounded bg-[var(--color-status-success)]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--color-status-success)]">
                      ON COURSE
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[var(--color-text-tertiary)]">
                    <span className="font-mono text-[10px] uppercase">PRIORITY:</span>
                    <span className="font-mono text-[10px] text-[var(--color-brand-highlight)]">
                      {primaryObjective.priority}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-[var(--color-text-tertiary)]">
                    <span className="font-mono text-[10px] uppercase">TARGET:</span>
                    <span className="font-mono text-[10px] text-[var(--color-text-secondary)]">
                      {primaryObjective.targetDate || 'Continuous Cadence'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-xs text-[var(--color-text-secondary)]">No active primary objective set.</p>
                <button
                  onClick={() => onNavigate('objectives')}
                  className="mt-3 rounded-lg border border-[var(--color-brand)] bg-[var(--color-brand)]/10 px-4 py-1.5 text-xs font-semibold text-[var(--color-brand-highlight)]"
                >
                  Define Primary Objective
                </button>
              </div>
            )}
          </div>

          {/* System Insight Card: What Cadence Has Learned */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-md">
            <div className="flex items-center space-x-2 border-b border-[var(--color-border-subtle)] pb-3">
              <Sparkles className="h-4 w-4 text-[var(--color-brand)]" />
              <span className="font-mono text-[10px] tracking-widest text-[var(--color-brand)] uppercase">
                SYSTEM INSIGHT · BEHAVIORAL INTELLIGENCE
              </span>
            </div>
            <div className="mt-3.5 space-y-2">
              <h4 className="font-display text-lg font-bold text-[var(--color-text-primary)]">
                Your execution pattern has stabilized around 25–45 minute focus sessions.
              </h4>
              <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                Observed data shows an <span className="text-[var(--color-brand-highlight)] font-semibold">88% completion rate</span> on assignments within 20–45 minutes, compared to 42% on sessions exceeding 60 minutes. Cadence has adapted your current workload to maintain sustained momentum.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Today's Focus (lg:col-span-5) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Today's Focus Card */}
          <div className="relative rounded-2xl border border-[var(--color-border-gold)] bg-[var(--color-surface)] p-6 shadow-[0_4px_30px_rgba(216,170,120,0.08)]">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-[var(--color-brand)] animate-ping" />
                <span className="font-mono text-[10px] tracking-widest text-[var(--color-brand)] uppercase">
                  TODAY'S FOCUS · {currentFocus?.origin === 'ADAPTIVE' ? 'COMMANDER ADAPTED' : 'SELF-DIRECTED'}
                </span>
              </div>
              <span className="font-mono text-[10px] text-[var(--color-text-tertiary)] uppercase">
                {currentFocus?.difficulty || 'STANDARD'}
              </span>
            </div>

            {currentFocus ? (
              <div className="mt-4">
                <div className="flex items-center space-x-2 font-mono text-[11px] text-[var(--color-text-tertiary)]">
                  <span>{currentFocus.domain}</span>
                  <span>·</span>
                  <span>{currentFocus.subject}</span>
                </div>

                <h3 className="mt-1 font-display text-2xl font-bold text-[var(--color-text-primary)]">
                  {currentFocus.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  {currentFocus.description}
                </p>

                {/* Duration & Capability Gains Pill */}
                <div className="my-4 flex flex-wrap items-center gap-2 text-xs">
                  <span className="flex items-center space-x-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2.5 py-1 font-mono text-[11px] text-[var(--color-text-primary)]">
                    <Clock className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                    <span>{currentFocus.estimatedDuration} MIN EST</span>
                  </span>

                  {currentFocus.capabilityImpacts && Object.entries(currentFocus.capabilityImpacts).map(([k, v]) => {
                    if (!v) return null;
                    return (
                      <span key={k} className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2.5 py-1 font-mono text-[11px] text-[var(--color-brand)]">
                        {k.toUpperCase()} +{v}
                      </span>
                    );
                  })}
                </div>

                {/* Action CTA: Begin Assignment */}
                <div className="space-y-2">
                  <button
                    onClick={() => startExecution(currentFocus)}
                    className="flex w-full items-center justify-center space-x-2 rounded-xl border border-[var(--color-brand)] bg-[var(--color-brand)] py-3 text-xs font-bold text-[#06080A] transition-all hover:bg-[var(--color-brand-highlight)] shadow-lg"
                  >
                    <Play className="h-4 w-4 fill-current" />
                    <span>BEGIN ASSIGNMENT</span>
                  </button>

                  {/* Why This Assignment Toggle */}
                  <button
                    onClick={() => setShowWhy(!showWhy)}
                    className="flex w-full items-center justify-center space-x-1 py-1.5 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>{showWhy ? 'Hide Reason' : 'Why this assignment?'}</span>
                  </button>

                  {showWhy && (
                    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/80 p-3 text-xs text-[var(--color-text-secondary)] animate-in fade-in duration-200">
                      <span className="font-mono text-[10px] uppercase text-[var(--color-brand)] block mb-1">
                        DECISION REASONING
                      </span>
                      {currentFocus.whySelected ||
                        'Selected to support your primary objective requirements while staying firmly inside your optimal 20–45 minute execution success window.'}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-xs text-[var(--color-text-secondary)]">No focus assignment currently queued.</p>
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <button
                    onClick={handleRequestCommanderAssignment}
                    disabled={isGenerating}
                    className="flex items-center space-x-1.5 rounded-lg border border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-2 text-xs font-bold text-[#06080A] disabled:opacity-50"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>{isGenerating ? 'Analyzing Pool...' : 'Request Commander Focus'}</span>
                  </button>
                  <button
                    onClick={onOpenCreate}
                    className="flex items-center space-x-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-border-gold)]"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>Create Manual</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Projected Assignments */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-md">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
              <span className="font-mono text-[10px] tracking-widest text-[var(--color-text-tertiary)] uppercase">
                PROJECTED ROUTE · UPCOMING
              </span>
              <button
                onClick={() => onNavigate('assignments')}
                className="text-xs text-[var(--color-brand)] hover:underline"
              >
                View All
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {upcoming.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-3 transition-colors hover:border-[var(--color-border)]"
                >
                  <div className="pr-2">
                    <h5 className="text-xs font-medium text-[var(--color-text-primary)] line-clamp-1">
                      {item.title}
                    </h5>
                    <div className="mt-0.5 flex items-center space-x-2 font-mono text-[10px] text-[var(--color-text-tertiary)]">
                      <span>{item.estimatedDuration} MIN</span>
                      <span>·</span>
                      <span>{item.difficulty}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => startExecution(item)}
                    className="shrink-0 rounded border border-[var(--color-border)] p-1.5 text-[var(--color-brand)] hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)]/10"
                    title="Begin this assignment"
                  >
                    <Play className="h-3 w-3 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Execution Signals & Capabilities Summary */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Execution Rate Signal */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-[var(--color-text-tertiary)]">EXECUTION RATE</span>
            <TrendingUp className="h-4 w-4 text-[var(--color-status-success)]" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="font-mono text-3xl font-bold text-[var(--color-text-primary)]">84%</span>
            <span className="font-mono text-xs text-[var(--color-status-success)]">↑ 12%</span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">Commitment to completion fidelity</p>
        </div>

        {/* Consistency Score */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-[var(--color-text-tertiary)]">CONSISTENCY</span>
            <CheckCircle2 className="h-4 w-4 text-[var(--color-brand)]" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="font-mono text-3xl font-bold text-[var(--color-text-primary)]">78%</span>
            <span className="font-mono text-xs text-[var(--color-brand)]">↑ 6%</span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">Adherence across cycle periods</p>
        </div>

        {/* Momentum Indicator */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-[var(--color-text-tertiary)]">MOMENTUM</span>
            <Flame className="h-4 w-4 text-[var(--color-brand-highlight)]" />
          </div>
          <div className="mt-2">
            <span className="font-mono text-2xl font-bold text-[var(--color-brand-highlight)]">HIGH MOMENTUM</span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">Composite completion & streak score</p>
        </div>

        {/* Current Execution Streak */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase text-[var(--color-text-tertiary)]">ACTIVE STREAK</span>
            <Clock className="h-4 w-4 text-[var(--color-text-tertiary)]" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="font-mono text-3xl font-bold text-[var(--color-text-primary)]">12</span>
            <span className="font-mono text-xs text-[var(--color-text-tertiary)]">DAYS</span>
          </div>
          <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">Verified commitment continuity</p>
        </div>
      </div>
    </div>
  );
};
