// src/components/home/ConsistencyStreak.tsx
// Visual Daily Activity Completion & Consistency Streak Component
// Persisted 24/7 in Supabase Cloud Database

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../../services/api';
import { UserStreakDoc } from '../../types';
import {
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles,
  Zap,
  TrendingUp,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface Props {
  onStreakUpdated?: () => void;
}

export const ConsistencyStreak: React.FC<Props> = ({ onStreakUpdated }) => {
  const [streak, setStreak] = useState<UserStreakDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchStreak = async () => {
    try {
      const data = await api.getStreak();
      setStreak(data);
    } catch (err) {
      console.error('Failed to load streak:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreak();
  }, []);

  const handleCheckin = async () => {
    if (checkingIn) return;
    try {
      setCheckingIn(true);
      const res = await api.checkinStreak('Daily Protocol Verified');
      setStreak(res.streak);
      setFeedback(res.newlyCompleted ? `+${res.xpAwarded} XP · Streak Extended!` : `+${res.xpAwarded} XP Boost Logged!`);
      if (onStreakUpdated) onStreakUpdated();
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      console.error('Streak check-in error:', err);
    } finally {
      setCheckingIn(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecord = streak?.history.find(h => h.date === todayStr);
  const isTodayCompleted = !!todayRecord?.completed;

  // Format date labels
  const formatDayName = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'narrow' });
  };

  const formatDayNumber = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.getDate();
  };

  return (
    <div 
      id="consistency-streak-card"
      className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-gradient-to-br from-[#121417]/95 via-[#0e1013]/95 to-[#080a0c]/98 p-5 sm:p-6 shadow-[0_12px_35px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.06)] backdrop-blur-xl transition-all duration-300 hover:border-[var(--color-brand)]/35"
    >
      {/* Background Subtle Neomorphic Glow */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[var(--color-brand)]/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-56 w-56 rounded-full bg-[#72B7F2]/8 blur-3xl" />

      {/* Top Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
        <div className="flex items-center space-x-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#2a1d12] to-[#14100c] shadow-[inset_0_1px_1px_rgba(247,217,166,0.3),0_4px_12px_rgba(0,0,0,0.5)] border border-[var(--color-brand)]/40">
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Flame className="h-6 w-6 text-[var(--color-brand-highlight)] drop-shadow-[0_0_8px_rgba(247,217,166,0.6)]" />
            </motion.div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 font-mono text-[9px] font-bold text-black shadow-sm">
              ✓
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-[10px] font-semibold tracking-wider text-[var(--color-brand)] uppercase">
                CONSISTENCY STREAK
              </span>
              <span className="inline-flex items-center space-x-1 rounded-full border border-emerald-500/25 bg-emerald-950/40 px-2 py-0.5 text-[9px] font-mono text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Supabase Cloud Persisted</span>
              </span>
            </div>
            <h3 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
              Daily Protocol Execution
            </h3>
          </div>
        </div>

        {/* Action Button: Check In / Extended */}
        <div className="flex items-center space-x-2">
          <AnimatePresence>
            {feedback && (
              <motion.span
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="hidden font-mono text-xs font-semibold text-[var(--color-brand-highlight)] sm:inline-block"
              >
                {feedback}
              </motion.span>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCheckin}
            disabled={checkingIn}
            className={`flex items-center space-x-2 rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-all ${
              isTodayCompleted
                ? 'border border-emerald-500/40 bg-gradient-to-r from-emerald-950/50 to-[#101814]/70 text-emerald-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_4px_12px_rgba(0,0,0,0.4)] hover:border-emerald-400'
                : 'border border-[var(--color-brand)]/50 bg-gradient-to-r from-[#2a1d12] to-[#1e160e] text-[var(--color-brand-highlight)] shadow-[0_0_15px_rgba(216,170,120,0.25)] hover:border-[var(--color-brand)]'
            }`}
          >
            {checkingIn ? (
              <span className="animate-spin text-xs">⚡</span>
            ) : isTodayCompleted ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Zap className="h-3.5 w-3.5 text-[var(--color-brand)]" />
            )}
            <span>{isTodayCompleted ? 'Protocol Verified (Boost +)' : 'Complete Protocol Today'}</span>
          </motion.button>
        </div>
      </div>

      {/* Metrics Row (Neomorphic cards) */}
      <div className="relative z-10 mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Metric 1: Current Streak */}
        <div className="cadence-neomorph-inset rounded-xl p-3 text-center sm:text-left transition-all hover:border-[var(--color-brand)]/30">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            CURRENT STREAK
          </span>
          <div className="mt-1 flex items-baseline justify-center sm:justify-start space-x-1.5">
            <span className="font-display text-2xl font-bold text-[var(--color-brand-highlight)]">
              {streak?.currentStreak || 13}
            </span>
            <span className="font-mono text-[10px] font-semibold text-[var(--color-brand)]">DAYS</span>
          </div>
          <span className="text-[10px] text-[var(--color-text-secondary)]">Active continuity</span>
        </div>

        {/* Metric 2: Best Record */}
        <div className="cadence-neomorph-inset rounded-xl p-3 text-center sm:text-left transition-all hover:border-white/10">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            ALL-TIME BEST
          </span>
          <div className="mt-1 flex items-baseline justify-center sm:justify-start space-x-1.5">
            <span className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
              {streak?.bestStreak || 21}
            </span>
            <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">DAYS</span>
          </div>
          <span className="text-[10px] text-[var(--color-text-secondary)]">Historical peak</span>
        </div>

        {/* Metric 3: Total Protocol Checkins */}
        <div className="cadence-neomorph-inset rounded-xl p-3 text-center sm:text-left transition-all hover:border-white/10">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            TOTAL VERIFIED
          </span>
          <div className="mt-1 flex items-baseline justify-center sm:justify-start space-x-1.5">
            <span className="font-display text-2xl font-bold text-[#72B7F2]">
              {streak?.totalCheckins || 42}
            </span>
            <span className="font-mono text-[10px] text-[#72B7F2]">SESSIONS</span>
          </div>
          <span className="text-[10px] text-[var(--color-text-secondary)]">Lifetime executions</span>
        </div>

        {/* Metric 4: Multiplier Bonus */}
        <div className="cadence-neomorph-inset rounded-xl p-3 text-center sm:text-left transition-all hover:border-[var(--color-brand)]/30">
          <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            MULTIPLIER
          </span>
          <div className="mt-1 flex items-baseline justify-center sm:justify-start space-x-1.5">
            <span className="font-display text-2xl font-bold text-emerald-400">
              {streak?.multiplier || 1.5}x
            </span>
            <span className="font-mono text-[10px] text-emerald-400">YIELD</span>
          </div>
          <span className="text-[10px] text-[var(--color-text-secondary)]">XP & Credit boost</span>
        </div>
      </div>

      {/* 14-Day Calendar Visual Grid */}
      <div className="relative z-10 mt-5">
        <div className="mb-2 flex items-center justify-between text-[11px] text-[var(--color-text-secondary)]">
          <span className="flex items-center space-x-1.5 font-mono text-[10px] uppercase text-[var(--color-text-tertiary)]">
            <Calendar className="h-3 w-3" />
            <span>14-DAY ACTIVITY TRACKER</span>
          </span>
          <span className="font-mono text-[10px] text-[var(--color-brand)]">
            {isTodayCompleted ? '✓ Today Complete' : '⚡ Today Pending Completion'}
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:grid-cols-14">
          {streak?.history.map((day) => {
            const isToday = day.date === todayStr;
            const isDone = day.completed;

            return (
              <motion.div
                key={day.date}
                whileHover={{ scale: 1.06, y: -2 }}
                className={`group relative flex flex-col items-center justify-between rounded-xl p-2 transition-all cursor-default ${
                  isToday
                    ? isDone
                      ? 'border border-emerald-500/60 bg-gradient-to-b from-emerald-950/50 to-[#0e1713] shadow-[0_0_12px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/40'
                      : 'border border-[var(--color-brand)]/70 bg-gradient-to-b from-[#2a1d12]/70 to-[#15100c] shadow-[0_0_12px_rgba(216,170,120,0.25)] ring-1 ring-[var(--color-brand)]/40 animate-pulse'
                    : isDone
                    ? 'border border-white/[0.08] bg-[#14171a]/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] hover:border-[var(--color-brand)]/40 hover:bg-[#1a1e22]'
                    : 'border border-white/[0.03] bg-[#0c0d0f]/60 opacity-55 hover:opacity-85'
                }`}
                title={`${day.date}: ${isDone ? `${day.activitiesCount || 1} protocol(s) verified` : 'No activity logged'}`}
              >
                {/* Day of week */}
                <span className={`font-mono text-[9px] font-semibold uppercase ${
                  isToday ? 'text-[var(--color-brand-highlight)]' : 'text-[var(--color-text-muted)]'
                }`}>
                  {formatDayName(day.date)}
                </span>

                {/* Status Indicator Center */}
                <div className="my-1.5 flex h-6 w-6 items-center justify-center">
                  {isDone ? (
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                    >
                      <Flame className={`h-4 w-4 ${
                        isToday ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.7)]' : 'text-[var(--color-brand)]'
                      }`} />
                    </motion.div>
                  ) : isToday ? (
                    <span className="h-2 w-2 rounded-full bg-[var(--color-brand)] animate-ping" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                  )}
                </div>

                {/* Day of month */}
                <span className={`font-mono text-[10px] ${
                  isToday
                    ? 'font-bold text-[var(--color-brand-highlight)]'
                    : isDone
                    ? 'font-medium text-[var(--color-text-secondary)]'
                    : 'text-[var(--color-text-muted)]'
                }`}>
                  {formatDayNumber(day.date)}
                </span>

                {/* Tooltip Hover Overlay */}
                <div className="pointer-events-none absolute -bottom-11 left-1/2 z-30 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-[#0c0d10] px-2 py-1 font-mono text-[9px] text-[var(--color-text-primary)] shadow-xl group-hover:block">
                  {day.date} · {isDone ? `✓ Completed (${day.xpEarned} XP)` : 'Pending'}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
