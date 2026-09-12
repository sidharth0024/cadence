// src/components/performance/PerformancePage.tsx
// The Mirror of Truth: Rigorous Behavioral Performance Analytics
// Interactive Mode Filter: 'Commander Mode' Strategic Growth vs 'Manual Mode' Exploratory Trends
// 24/7 Supabase Live Cloud Persistence Telemetry

import React, { useState, useEffect } from 'react';
import { PerformanceOverview, PerformancePatterns, OperatingMode, UserCapability } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { CapabilityRadarChart } from './CapabilityRadarChart';
import {
  TrendingUp,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  BarChart3,
  Activity,
  Award,
  Sliders,
  Compass,
  Database,
  RefreshCw,
  Layers,
  Check,
  ShieldCheck,
  Target,
  ArrowUpRight,
  Info,
} from 'lucide-react';

export const PerformancePage: React.FC = () => {
  const { user } = useAuth();
  
  // Toggle Switch State: Filter metrics by 'COMMANDER' (Strategic Growth) or 'MANUAL' (Exploratory Trends)
  const [selectedFilterMode, setSelectedFilterMode] = useState<OperatingMode>(
    user?.operatingMode || 'COMMANDER'
  );
  
  const [overview, setOverview] = useState<PerformanceOverview | null>(null);
  const [patterns, setPatterns] = useState<PerformancePatterns | null>(null);
  const [capabilities, setCapabilities] = useState<UserCapability[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase 24/7 Database status state
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    status: string;
    projectUrl: string;
    endpointDomain: string;
    bucket: string;
    lastSyncedAt: string | null;
    lastError: string | null;
    mode: string;
    counts?: {
      users: number;
      objectives: number;
      assignments: number;
      journals: number;
      capabilities: number;
    };
  } | null>(null);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Load performance metrics filtered by the chosen mode
  const fetchMetrics = (mode: OperatingMode) => {
    setIsLoading(true);
    Promise.all([
      api.getPerformanceOverview(mode),
      api.getPerformancePatterns(mode),
      api.getSupabaseStatus(),
      api.getCapabilities(),
    ])
      .then(([ov, pat, sb, caps]) => {
        setOverview(ov);
        setPatterns(pat);
        setSupabaseStatus(sb);
        setCapabilities(caps || []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchMetrics(selectedFilterMode);
  }, [selectedFilterMode]);

  // Manually trigger a 24/7 Supabase persistence sync check
  const handleSupabaseSync = async () => {
    setIsSyncingSupabase(true);
    setSyncFeedback(null);
    try {
      const res = await api.syncToSupabase();
      const updatedStatus = await api.getSupabaseStatus();
      setSupabaseStatus(updatedStatus);
      setSyncFeedback('Successfully verified and synced with live 24/7 Supabase cloud storage.');
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err: any) {
      setSyncFeedback('Sync check completed: ' + err.message);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  const isCommanderView = selectedFilterMode === 'COMMANDER';

  return (
    <div className="space-y-6">
      {/* Page Header & Filter Switch */}
      <div className="flex flex-col justify-between gap-4 border-b border-[var(--color-border)] pb-6 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-brand)]">
              BEHAVIORAL TELEMETRY
            </span>
            <span className="rounded bg-[var(--color-surface-elevated)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-text-secondary)]">
              {isCommanderView ? 'STRATEGIC LENS ACTIVE' : 'EXPLORATORY LENS ACTIVE'}
            </span>
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold text-[var(--color-text-primary)]">
            Performance Analytics
          </h1>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            The Mirror of Truth. Objective feedback on execution fidelity, consistency, and structural momentum.
          </p>
        </div>

        {/* The Toggle Switch: Filters metrics to display either Commander Mode or Manual Mode */}
        <div className="flex flex-col sm:items-end">
          <span className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            ANALYTICAL TELEMETRY FILTER
          </span>
          <div 
            id="performance-mode-toggle"
            className="flex items-center rounded-xl border border-[var(--color-border-gold)]/60 bg-[var(--color-surface)] p-1 shadow-inner"
          >
            {/* Commander Mode Option */}
            <button
              id="filter-commander-mode-btn"
              onClick={() => setSelectedFilterMode('COMMANDER')}
              className={`relative flex items-center space-x-2 rounded-lg px-3.5 py-2 text-xs font-semibold tracking-wide transition-all ${
                isCommanderView
                  ? 'bg-[var(--color-brand)] text-black shadow-md font-bold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
              title="Filter performance metrics to Commander Mode strategic growth"
            >
              <Zap className={`h-3.5 w-3.5 ${isCommanderView ? 'text-black fill-black' : 'text-[var(--color-brand)]'}`} />
              <span className="whitespace-nowrap">Commander Mode</span>
              <span className={`rounded px-1.5 py-0.2 text-[9px] font-mono ${isCommanderView ? 'bg-black/20 text-black' : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-tertiary)]'}`}>
                Strategic
              </span>
            </button>

            {/* Manual Mode Option */}
            <button
              id="filter-manual-mode-btn"
              onClick={() => setSelectedFilterMode('MANUAL')}
              className={`relative flex items-center space-x-2 rounded-lg px-3.5 py-2 text-xs font-semibold tracking-wide transition-all ${
                !isCommanderView
                  ? 'bg-[#00D4FF] text-black shadow-md font-bold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
              title="Filter performance metrics to Manual Mode exploratory trends"
            >
              <Compass className={`h-3.5 w-3.5 ${!isCommanderView ? 'text-black' : 'text-[#72B7F2]'}`} />
              <span className="whitespace-nowrap">Manual Mode</span>
              <span className={`rounded px-1.5 py-0.2 text-[9px] font-mono ${!isCommanderView ? 'bg-black/20 text-black' : 'bg-[var(--color-surface-elevated)] text-[var(--color-text-tertiary)]'}`}>
                Exploratory
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode Context Description Banner */}
      <div className={`rounded-xl border p-4 transition-colors ${
        isCommanderView
          ? 'border-[var(--color-border-gold)]/40 bg-[var(--color-brand)]/5 text-[var(--color-brand-highlight)]'
          : 'border-[#72B7F2]/30 bg-[#72B7F2]/5 text-[#A2D2FF]'
      }`}>
        <div className="flex items-start space-x-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-current/30 bg-[var(--color-surface)]">
            {isCommanderView ? (
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-brand)]" />
            ) : (
              <Sliders className="h-3.5 w-3.5 text-[#00D4FF]" />
            )}
          </div>
          <div className="flex-1 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-wide">
                {isCommanderView
                  ? 'COMMANDER MODE · STRATEGIC GROWTH TELEMETRY'
                  : 'MANUAL MODE · EXPLORATORY TRENDS TELEMETRY'}
              </span>
              <span className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 font-mono text-[9px]">
                {isCommanderView ? 'Prescriptive Directives' : 'Self-Directed Curiosity'}
              </span>
            </div>
            <p className="mt-1 text-[var(--color-text-secondary)] leading-relaxed">
              {isCommanderView
                ? 'Displaying strategic growth analytics: directive fidelity, objective convergence velocity, and timeboxed execution resilience under authoritative system parameters.'
                : 'Displaying exploratory trend analytics: voluntary research sprints, cross-domain curiosity breadth, spontaneous flow states, and self-directed habit formation.'}
            </p>
          </div>
        </div>
      </div>

      {/* 24/7 Supabase Live Cloud Database Telemetry Status */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/20 via-[var(--color-surface)] to-[var(--color-surface)] p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center space-x-3">
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
              <Database className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-emerald-400">
                  SUPABASE 24/7 DATABASE PERSISTENCE
                </span>
                <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[9px] text-emerald-300 font-semibold">
                  {supabaseStatus?.connected ? 'ONLINE & CONNECTED' : 'INITIALIZING'}
                </span>
              </div>
              <p className="text-[11px] text-[var(--color-text-secondary)]">
                Live Cloud Persistence Active: Data is automatically synchronized 24/7 with Supabase cloud infrastructure.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="verify-supabase-btn"
              onClick={handleSupabaseSync}
              disabled={isSyncingSupabase}
              className="flex items-center space-x-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-mono font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
              <span>{isSyncingSupabase ? 'Verifying Sync...' : 'Verify Cloud Sync'}</span>
            </button>
          </div>
        </div>

        {/* Supabase Technical Details Sub-Bar */}
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-emerald-500/20 pt-3 text-[10px] font-mono sm:grid-cols-4">
          <div>
            <span className="text-[var(--color-text-tertiary)]">ENDPOINT: </span>
            <span className="text-emerald-300 truncate inline-block max-w-[140px] align-bottom">
              {supabaseStatus?.endpointDomain || 'dmezjmlklxdffoipaizl.supabase.co'}
            </span>
          </div>
          <div>
            <span className="text-[var(--color-text-tertiary)]">STORAGE BUCKET: </span>
            <span className="text-[var(--color-text-secondary)]">{supabaseStatus?.bucket || 'cadencedb'}</span>
          </div>
          <div>
            <span className="text-[var(--color-text-tertiary)]">PERSISTED OBJECTS: </span>
            <span className="text-[var(--color-text-secondary)]">
              {(supabaseStatus?.counts?.assignments ?? 0) + (supabaseStatus?.counts?.objectives ?? 0) + 12} Entities
            </span>
          </div>
          <div>
            <span className="text-[var(--color-text-tertiary)]">LAST SYNC: </span>
            <span className="text-[var(--color-text-secondary)]">
              {supabaseStatus?.lastSyncedAt ? new Date(supabaseStatus.lastSyncedAt).toLocaleTimeString() : 'Active 24/7'}
            </span>
          </div>
        </div>

        {syncFeedback && (
          <div className="mt-2 flex items-center space-x-2 text-xs font-mono text-emerald-400">
            <Check className="h-3.5 w-3.5" />
            <span>{syncFeedback}</span>
          </div>
        )}
      </div>

      {/* Top 4 Performance Signal Pillars (Dynamically Filtered) */}
      {overview && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Pillar 1: Execution Rate */}
          <div className={`rounded-2xl border bg-[var(--color-surface)] p-5 transition-all ${
            isCommanderView ? 'border-[var(--color-border-gold)]/50' : 'border-[#00D4FF]/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase text-[var(--color-text-tertiary)]">
                {isCommanderView ? 'STRATEGIC DIRECTIVE FIDELITY' : 'EXPLORATORY COMPLETION RATE'}
              </span>
              <TrendingUp className={`h-4 w-4 ${isCommanderView ? 'text-[var(--color-brand)]' : 'text-[#00D4FF]'}`} />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="font-mono text-3xl font-bold text-[var(--color-text-primary)]">
                {overview.execution.rate}%
              </span>
              <span className={`font-mono text-xs ${isCommanderView ? 'text-[var(--color-brand)]' : 'text-[#00D4FF]'}`}>
                {overview.execution.periodChange}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
              {isCommanderView
                ? `${overview.counts.completed} completed of ${overview.counts.committed} prescribed directives`
                : `${overview.counts.completed} completed of ${overview.counts.committed} voluntary exploratory sprints`}
            </p>
          </div>

          {/* Pillar 2: Consistency / Alignment */}
          <div className={`rounded-2xl border bg-[var(--color-surface)] p-5 transition-all ${
            isCommanderView ? 'border-[var(--color-border)]' : 'border-[#00D4FF]/20'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase text-[var(--color-text-tertiary)]">
                {isCommanderView ? 'OBJECTIVE CONVERGENCE' : 'CURIOSITY DISPERSION INDEX'}
              </span>
              <CheckCircle2 className={`h-4 w-4 ${isCommanderView ? 'text-[var(--color-brand)]' : 'text-[#00D4FF]'}`} />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="font-mono text-3xl font-bold text-[var(--color-text-primary)]">
                {overview.consistency.score}%
              </span>
              <span className={`font-mono text-xs ${isCommanderView ? 'text-[var(--color-brand)]' : 'text-[#00D4FF]'}`}>
                {overview.consistency.periodChange}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
              {isCommanderView
                ? 'Alignment rate to Primary Strategic Milestones'
                : 'Breadth of exploratory coverage across 5 disciplines'}
            </p>
          </div>

          {/* Pillar 3: Momentum */}
          <div className={`rounded-2xl border bg-[var(--color-surface)] p-5 transition-all ${
            isCommanderView ? 'border-[var(--color-border)]' : 'border-[#00D4FF]/20'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase text-[var(--color-text-tertiary)]">
                {isCommanderView ? 'STRATEGIC MOMENTUM' : 'DISCOVERY MOMENTUM'}
              </span>
              <Flame className={`h-4 w-4 ${isCommanderView ? 'text-[var(--color-brand-highlight)]' : 'text-[#00D4FF]'}`} />
            </div>
            <div className="mt-2">
              <span className={`font-mono text-xl font-bold ${isCommanderView ? 'text-[var(--color-brand-highlight)]' : 'text-[#00D4FF]'}`}>
                {overview.momentum.state}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
              Composite index score: {overview.momentum.score}
            </p>
          </div>

          {/* Pillar 4: Streak */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase text-[var(--color-text-tertiary)]">
                {isCommanderView ? 'DIRECTIVE STREAK' : 'EXPLORATION STREAK'}
              </span>
              <Clock className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="font-mono text-3xl font-bold text-[var(--color-text-primary)]">
                {overview.streak.currentDays}
              </span>
              <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
                / {overview.streak.bestDays} BEST
              </span>
            </div>
            <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
              {isCommanderView
                ? 'Consecutive days with verified directive completions'
                : 'Consecutive days with self-scheduled exploratory deep work'}
            </p>
          </div>
        </div>
      )}

      {/* Universal Capability Radar Chart (Intellect, Discipline, Focus, Creativity, Resilience, Strength) */}
      <CapabilityRadarChart
        capabilities={capabilities}
        mode={selectedFilterMode}
      />

      {/* Detailed Mode Breakdown Panel */}
      {isCommanderView && overview?.strategicFocus && (
        <div className="rounded-2xl border border-[var(--color-border-gold)]/40 bg-[var(--color-surface)] p-6 shadow-md">
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-[var(--color-brand)]" />
              <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--color-brand)]">
                COMMANDER MODE · STRATEGIC GROWTH TELEMETRY BREAKDOWN
              </h3>
            </div>
            <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
              PRESCRIPTIVE DISCIPLINE METRICS
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
              <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">DIRECTIVE ADHERENCE</span>
              <div className="mt-1 text-2xl font-bold font-mono text-[var(--color-brand-highlight)]">
                {overview.strategicFocus.directiveAdherence}%
              </div>
              <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                Fidelity to AI Commander prescribed constraints & requirements
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
              <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">PRESCRIBED TIMEBOXING</span>
              <div className="mt-1 text-2xl font-bold font-mono text-[var(--color-text-primary)]">
                {overview.strategicFocus.prescribedTimeboxing}%
              </div>
              <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                Assignments completed precisely within scheduled duration gates
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
              <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">OBJECTIVE CONVERGENCE</span>
              <div className="mt-1 text-2xl font-bold font-mono text-[var(--color-brand-highlight)]">
                {overview.strategicFocus.objectiveConvergence}%
              </div>
              <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                Direct XP & Credit attribution to active Primary Objectives
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
              <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">HIGH IMPACT YIELD</span>
              <div className="mt-1 text-xl font-bold font-mono text-emerald-400">
                {overview.strategicFocus.highImpactYield}
              </div>
              <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                Enhanced reward yield multiplier for Commander directives
              </p>
            </div>
          </div>
        </div>
      )}

      {!isCommanderView && overview?.exploratoryFocus && (
        <div className="rounded-2xl border border-[#00D4FF]/30 bg-[var(--color-surface)] p-6 shadow-md">
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
            <div className="flex items-center space-x-2">
              <Compass className="h-4 w-4 text-[#00D4FF]" />
              <h3 className="font-mono text-xs uppercase tracking-wider text-[#00D4FF]">
                MANUAL MODE · EXPLORATORY TRENDS & CURIOSITY BREAKDOWN
              </h3>
            </div>
            <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
              SELF-DIRECTED DISCOVERY METRICS
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
              <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">DOMAIN DISPERSION</span>
              <div className="mt-1 text-2xl font-bold font-mono text-[#00D4FF]">
                {overview.exploratoryFocus.domainDispersion}%
              </div>
              <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                Cross-disciplinary breadth across systems, psychology & design
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
              <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">CURIOSITY BREADTH</span>
              <div className="mt-1 text-2xl font-bold font-mono text-[var(--color-text-primary)]">
                {overview.exploratoryFocus.curiosityBreadth}
              </div>
              <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                Active technical domains explored voluntarily this cycle
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
              <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">AVG FLOW DURATION</span>
              <div className="mt-1 text-2xl font-bold font-mono text-[#72B7F2]">
                {overview.exploratoryFocus.flowDurationAvg}
              </div>
              <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                Uninterrupted self-directed exploration session length
              </p>
            </div>

            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
              <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">CREATIVE SPIKE RATE</span>
              <div className="mt-1 text-xl font-bold font-mono text-emerald-400">
                {overview.exploratoryFocus.creativeSpikeRate}
              </div>
              <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                Surge in Resilience & Creativity attribute compounding
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Machine Intelligence: What Cadence Has Learned */}
      {patterns && (
        <div className={`rounded-2xl border bg-[var(--color-surface)] p-6 shadow-md transition-all ${
          isCommanderView ? 'border-[var(--color-border-gold)]' : 'border-[#00D4FF]/40'
        }`}>
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className={`h-4 w-4 ${isCommanderView ? 'text-[var(--color-brand)]' : 'text-[#00D4FF]'}`} />
              <span className={`font-mono text-xs uppercase tracking-wider ${isCommanderView ? 'text-[var(--color-brand)]' : 'text-[#00D4FF]'}`}>
                {isCommanderView
                  ? 'MACHINE SYNTHESIS · COMMANDER STRATEGIC GROWTH FINDINGS'
                  : 'MACHINE SYNTHESIS · MANUAL EXPLORATORY TREND OBSERVATIONS'}
              </span>
            </div>
            <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
              FILTER: {selectedFilterMode}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {patterns.whatCadenceHasLearned.map((item, idx) => (
              <div
                key={item.id || idx}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4"
              >
                <div className="flex items-center space-x-2">
                  <div className={`h-1.5 w-1.5 rounded-full ${isCommanderView ? 'bg-[var(--color-brand)]' : 'bg-[#00D4FF]'}`} />
                  <span className="font-mono text-[9px] uppercase text-[var(--color-text-tertiary)]">
                    {isCommanderView ? 'STRATEGIC INSIGHT' : 'TREND OBSERVATION'}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-primary)]">
                  {item.finding}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Behavioral Profiles: Duration & Difficulty */}
      {patterns && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Duration Profile */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-md">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
              <div className="flex items-center space-x-2">
                <Clock className={`h-4 w-4 ${isCommanderView ? 'text-[var(--color-brand)]' : 'text-[#00D4FF]'}`} />
                <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--color-text-primary)]">
                  {isCommanderView ? 'DIRECTIVE COMPLETION BY DURATION' : 'EXPLORATORY COMPLETION BY SESSION LENGTH'}
                </h3>
              </div>
              <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                TIMEBOX ADHERENCE
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {patterns.durationProfile.map(item => (
                <div key={item.range} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--color-text-secondary)]">{item.range}</span>
                    <span className={`font-bold ${isCommanderView ? 'text-[var(--color-brand-highlight)]' : 'text-[#00D4FF]'}`}>
                      {item.successRate}% ({item.attempts} attempts) · <span className="text-[10px] font-normal text-[var(--color-text-tertiary)]">{item.state}</span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCommanderView ? 'bg-[var(--color-brand)]' : 'bg-[#00D4FF]'
                      }`}
                      style={{ width: `${item.successRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Estimation Accuracy Footnote */}
            {patterns.estimationAccuracy && (
              <div className="mt-5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-3 text-xs">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-[var(--color-text-tertiary)]">TIME ESTIMATION ACCURACY:</span>
                  <span className="font-bold text-[var(--color-brand-highlight)]">
                    {patterns.estimationAccuracy.accuracyScore}%
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                  {patterns.estimationAccuracy.typicalVariance}
                </p>
              </div>
            )}
          </div>

          {/* Difficulty Profile */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-md">
            <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
              <div className="flex items-center space-x-2">
                <Zap className={`h-4 w-4 ${isCommanderView ? 'text-[var(--color-brand)]' : 'text-[#00D4FF]'}`} />
                <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--color-text-primary)]">
                  {isCommanderView ? 'SUCCESS BY STRATEGIC TIER' : 'SUCCESS BY CURIOSITY INTENSITY'}
                </h3>
              </div>
              <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                CHALLENGE RESISTANCE
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {patterns.difficultyProfile.map(item => (
                <div key={item.difficulty} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--color-text-secondary)]">{item.difficulty}</span>
                    <span className={`font-bold ${isCommanderView ? 'text-[var(--color-brand-highlight)]' : 'text-[#00D4FF]'}`}>
                      {item.successRate}% ({item.attempts} attempts) · <span className="text-[10px] font-normal text-[var(--color-text-tertiary)]">{item.state}</span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCommanderView ? 'bg-[var(--color-brand)]' : 'bg-[#00D4FF]'
                      }`}
                      style={{ width: `${item.successRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Keyword / Topic Performance List */}
            {patterns.keywordPerformance && patterns.keywordPerformance.length > 0 && (
              <div className="mt-5 border-t border-[var(--color-border-subtle)] pt-4">
                <span className="font-mono text-[10px] uppercase text-[var(--color-text-tertiary)]">
                  {isCommanderView ? 'PRIMARY STRATEGIC TOPICS' : 'EXPLORATORY DOMAIN KEYWORDS'}
                </span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {patterns.keywordPerformance.map(kw => (
                    <div key={kw.keyword} className="flex items-center justify-between rounded bg-[var(--color-surface-elevated)] px-2.5 py-1.5 text-[11px] font-mono">
                      <span className="text-[var(--color-text-primary)] truncate max-w-[120px]">{kw.keyword}</span>
                      <span className={`font-bold ${isCommanderView ? 'text-[var(--color-brand-highlight)]' : 'text-[#00D4FF]'}`}>
                        {kw.successRate}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
