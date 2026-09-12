// src/components/common/QuickLogFAB.tsx
// Global Floating Action Button (FAB) & Quick Action Logging Modal
// Appears on all screens and automatically links completed actions to the active objective

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCadence } from '../../context/CadenceContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import {
  Zap,
  Plus,
  X,
  Target,
  Clock,
  Sparkles,
  CheckCircle2,
  Brain,
  Shield,
  Crosshair,
  HeartPulse,
  Dumbbell,
  Database,
  ArrowRight,
} from 'lucide-react';

const CAPABILITIES = [
  { id: 'focus', label: 'Focus', icon: Crosshair, color: '#63D99B' },
  { id: 'intellect', label: 'Intellect', icon: Brain, color: '#72B7F2' },
  { id: 'discipline', label: 'Discipline', icon: Shield, color: '#D9AD5A' },
  { id: 'creativity', label: 'Creativity', icon: Sparkles, color: '#9B72D6' },
  { id: 'resilience', label: 'Resilience', icon: HeartPulse, color: '#E56B63' },
  { id: 'strength', label: 'Strength', icon: Dumbbell, color: '#D98A3A' },
];

const QUICK_SUGGESTIONS = [
  'Deep Work Sprint',
  'Architecture & Systems Synthesis',
  'Focus Protocol Checkpoint',
  'Core Research & Technical Reading',
  'High-Friction Problem Solving',
  'Physical Conditioning Routine',
];

export const QuickLogFAB: React.FC = () => {
  const { user } = useAuth();
  const { primaryObjective, refreshAll } = useCadence();
  const [isOpen, setIsOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [dimension, setDimension] = useState('focus');
  const [duration, setDuration] = useState(25);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    xpAwarded: number;
    creditsAwarded: number;
    title: string;
    objectiveTitle?: string;
  } | null>(null);

  const isCommander = user?.operatingMode === 'COMMANDER';
  const fabBorderColor = isCommander ? 'border-[var(--color-brand)]/50' : 'border-[#72B7F2]/50';
  const fabBgGradient = isCommander
    ? 'bg-gradient-to-br from-[#2a1d12] via-[#1a140e] to-[#0c0906]'
    : 'bg-gradient-to-br from-[#10202e] via-[#0d1720] to-[#060a0e]';
  const fabTextColor = isCommander ? 'text-[var(--color-brand-highlight)]' : 'text-[#A2D2FF]';

  const estimatedXP = Math.max(50, duration * 5);
  const estimatedCredits = Math.max(25, Math.round(duration * 2.5));

  const handleOpen = () => {
    setSuccessResult(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    setSuccessResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await api.quickLogAction({
        title: title.trim(),
        dimension,
        duration: Number(duration),
        notes: notes.trim() || undefined,
      });

      setSuccessResult({
        xpAwarded: res.xpAwarded,
        creditsAwarded: res.creditsAwarded,
        title: title.trim(),
        objectiveTitle: res.linkedObjective?.title,
      });

      // Refresh global cadence context state (streaks, objectives, xp)
      refreshAll();

      // Reset fields
      setTitle('');
      setNotes('');

      setTimeout(() => {
        setIsOpen(false);
        setSuccessResult(null);
      }, 2500);
    } catch (err: any) {
      console.error('Quick log error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300, delay: 0.3 }}
      >
        <div className="relative group">
          {/* Outer Pulsing Glow */}
          <div
            className={`absolute -inset-1 rounded-full blur-md opacity-40 group-hover:opacity-75 transition duration-500 ${
              isCommander ? 'bg-[var(--color-brand)]' : 'bg-[#72B7F2]'
            }`}
          />

          <motion.button
            id="global-quick-log-fab"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleOpen}
            className={`relative flex h-14 w-14 items-center justify-center rounded-full border ${fabBorderColor} ${fabBgGradient} ${fabTextColor} shadow-[0_8px_25px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] backdrop-blur-lg focus:outline-none`}
            title="Quick Log Action (Auto-linked to active objective)"
          >
            <motion.div
              animate={{ rotate: isOpen ? 45 : 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              <Zap className="h-6 w-6 fill-current" />
            </motion.div>
          </motion.button>

          {/* Tooltip on hover */}
          <div className="pointer-events-none absolute right-16 top-1/2 -translate-y-1/2 hidden whitespace-nowrap rounded-lg border border-white/10 bg-[#0c0d10]/95 px-3 py-1.5 font-mono text-[11px] text-[var(--color-text-primary)] shadow-2xl backdrop-blur-md group-hover:block transition-all">
            <span>⚡ Quick Log Completed Action</span>
            <div className="text-[9px] text-[var(--color-text-tertiary)]">
              Auto-links to: {primaryObjective ? primaryObjective.title : 'Active Objective'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Modal Dialog Content */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.12] bg-[#101215]/95 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.08)] backdrop-blur-2xl"
            >
              {/* Header */}
              <div className="border-b border-white/[0.08] p-5 sm:p-6 pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] font-semibold tracking-widest text-[var(--color-brand)] uppercase">
                        INSTANT PROTOCOL LOG
                      </span>
                      <span className="flex items-center space-x-1 rounded-full border border-emerald-500/25 bg-emerald-950/40 px-2 py-0.5 font-mono text-[9px] text-emerald-400">
                        <Database className="h-2.5 w-2.5" />
                        <span>Supabase Synced</span>
                      </span>
                    </div>
                    <h3 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
                      Log Completed Action
                    </h3>
                  </div>

                  <button
                    onClick={handleClose}
                    className="rounded-lg p-1.5 text-[var(--color-text-tertiary)] hover:bg-white/5 hover:text-[var(--color-text-primary)] transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Active Objective Auto-Link Banner */}
                <div className="mt-3 flex items-center space-x-2.5 rounded-xl border border-[var(--color-brand)]/25 bg-[var(--color-brand)]/5 p-3 text-xs">
                  <Target className="h-4 w-4 shrink-0 text-[var(--color-brand)]" />
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-brand)] block">
                      AUTOMATICALLY LINKED TO ACTIVE OBJECTIVE
                    </span>
                    <span className="font-medium text-[var(--color-text-primary)] truncate block">
                      {primaryObjective ? primaryObjective.title : 'Primary Cadence Objective'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Body or Success Confirmation */}
              {successResult ? (
                <div className="p-8 text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-950/60 border border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.3)]"
                  >
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  </motion.div>

                  <div>
                    <h4 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
                      Action Logged & Verified!
                    </h4>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                      "{successResult.title}" was recorded and synchronized with 24/7 Supabase cloud storage.
                    </p>
                  </div>

                  <div className="flex justify-center space-x-3 font-mono text-xs">
                    <div className="rounded-lg border border-[var(--color-brand)]/30 bg-[#16120c] px-3 py-1.5 text-[var(--color-brand-highlight)]">
                      +{successResult.xpAwarded} XP
                    </div>
                    <div className="rounded-lg border border-emerald-500/30 bg-[#0c1612] px-3 py-1.5 text-emerald-400">
                      +{successResult.creditsAwarded} Credits
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
                  {/* Action Title */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                      Action Name / Completed Work *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Deployed 24/7 database, completed deep sprint..."
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)] transition"
                    />

                    {/* Quick Suggestion Chips */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {QUICK_SUGGESTIONS.slice(0, 3).map((sugg) => (
                        <button
                          key={sugg}
                          type="button"
                          onClick={() => setTitle(sugg)}
                          className="rounded-md border border-white/5 bg-white/[0.03] px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)] hover:border-white/20 hover:text-[var(--color-text-primary)] transition"
                        >
                          + {sugg}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Capability Dimension Selector */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                      Primary Capability Strengthened
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {CAPABILITIES.map((cap) => {
                        const Icon = cap.icon;
                        const isSelected = dimension === cap.id;
                        return (
                          <button
                            key={cap.id}
                            type="button"
                            onClick={() => setDimension(cap.id)}
                            className={`flex flex-col items-center justify-center rounded-xl p-2.5 transition ${
                              isSelected
                                ? 'border shadow-md'
                                : 'border border-white/[0.05] bg-white/[0.02] opacity-60 hover:opacity-100 hover:border-white/10'
                            }`}
                            style={{
                              borderColor: isSelected ? cap.color : undefined,
                              backgroundColor: isSelected ? `${cap.color}15` : undefined,
                            }}
                          >
                            <Icon className="h-4 w-4" style={{ color: cap.color }} />
                            <span
                              className="mt-1 font-mono text-[10px] font-semibold"
                              style={{ color: isSelected ? cap.color : 'inherit' }}
                            >
                              {cap.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Duration Slider */}
                  <div>
                    <div className="flex items-center justify-between font-mono text-[10px] uppercase text-[var(--color-text-secondary)] mb-1.5">
                      <span>Duration Spent</span>
                      <span className="font-bold text-[var(--color-brand-highlight)]">
                        {duration} MINUTES
                      </span>
                    </div>

                    <input
                      type="range"
                      min={10}
                      max={120}
                      step={5}
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-[var(--color-brand)]"
                    />

                    {/* Quick Duration Buttons */}
                    <div className="mt-2 flex space-x-2">
                      {[15, 25, 45, 60, 90].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setDuration(mins)}
                          className={`flex-1 rounded-lg py-1 font-mono text-[10px] transition ${
                            duration === mins
                              ? 'border border-[var(--color-brand)]/60 bg-[var(--color-brand)]/15 text-[var(--color-brand-highlight)]'
                              : 'border border-white/5 bg-white/[0.02] text-[var(--color-text-tertiary)] hover:border-white/15'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Notes (Optional) */}
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                      Notes / Key Reflection (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Brief notes, insights, or breakthroughs..."
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)] transition"
                    />
                  </div>

                  {/* Estimated Rewards Banner & Submit Button */}
                  <div className="border-t border-white/[0.08] pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-2 font-mono text-xs">
                      <span className="text-[var(--color-text-tertiary)]">ESTIMATED YIELD:</span>
                      <span className="text-[var(--color-brand-highlight)] font-bold">
                        +{estimatedXP} XP
                      </span>
                      <span>·</span>
                      <span className="text-emerald-400 font-bold">
                        +{estimatedCredits} Credits
                      </span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isSubmitting || !title.trim()}
                      className="flex items-center justify-center space-x-2 rounded-xl border border-[var(--color-brand)]/50 bg-gradient-to-r from-[#2a1d12] to-[#1a140e] px-5 py-2.5 text-xs font-bold text-[var(--color-brand-highlight)] shadow-[0_0_15px_rgba(216,170,120,0.25)] hover:border-[var(--color-brand)] disabled:opacity-50 transition"
                    >
                      {isSubmitting ? (
                        <span>Logging to Supabase...</span>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Log & Complete Action</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
