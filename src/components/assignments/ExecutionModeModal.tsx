// src/components/assignments/ExecutionModeModal.tsx
// Distraction-free real-time Execution Mode
// Server is authoritative for timing and 50% gate; UI provides clean timer guidance.

import React, { useState, useEffect } from 'react';
import { Assignment } from '../../types';
import { api } from '../../services/api';
import { useCadence } from '../../context/CadenceContext';
import { Play, Pause, CheckCircle2, X, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';

interface Props {
  assignment: Assignment;
  onClose: () => void;
}

export const ExecutionModeModal: React.FC<Props> = ({ assignment, onClose }) => {
  const { setCompletionResult } = useCadence();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const estimatedMinutes = assignment.estimatedDuration;
  const requiredSeconds = estimatedMinutes * 30; // 50% minimum threshold
  const isOverThreshold = elapsedSeconds >= requiredSeconds;

  // Local ticker for user guidance
  useEffect(() => {
    let interval: any = null;
    if (!isPaused) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPaused]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = async () => {
    try {
      await api.pauseAssignment(assignment.id);
      setIsPaused(true);
    } catch (e: any) {
      setErrorMessage('Failed to record pause on server: ' + e.message);
    }
  };

  const handleResume = async () => {
    try {
      await api.resumeAssignment(assignment.id);
      setIsPaused(false);
    } catch (e: any) {
      setErrorMessage('Failed to resume session on server: ' + e.message);
    }
  };

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      // Server transaction enforces 50% gate, calculates XP and Credits
      const result = await api.completeAssignment(assignment.id);
      setCompletionResult(result);
      onClose();
    } catch (e: any) {
      setErrorMessage('Completion transaction failed: ' + e.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--color-border-gold)] bg-[var(--color-surface)] shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div className="flex items-center space-x-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-brand)] animate-ping" />
            <span className="font-mono text-xs tracking-widest text-[var(--color-brand)] uppercase">
              EXECUTION MODE · {assignment.difficulty}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-elevated)] hover:text-white"
            aria-label="Close execution window"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6 sm:px-8">
          {/* Assignment Title & Context */}
          <div className="mb-6 text-center">
            <span className="font-mono text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider">
              {assignment.domain} · {assignment.subject}
            </span>
            <h2 className="mt-1 font-display text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
              {assignment.title}
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
              {assignment.description}
            </p>
          </div>

          {/* Central Timer Display */}
          <div className="my-6 flex flex-col items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] py-6 px-4 shadow-inner">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
              ELAPSED EXECUTION TIME
            </span>
            <div className="font-mono text-5xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-6xl">
              {formatTime(elapsedSeconds)}
            </div>

            {/* 50% Threshold Status Bar */}
            <div className="mt-4 w-full max-w-md">
              <div className="flex justify-between text-[11px] font-mono text-[var(--color-text-tertiary)]">
                <span>0m</span>
                <span className={isOverThreshold ? 'text-[var(--color-status-success)] font-semibold' : 'text-[var(--color-brand)]'}>
                  50% Gate: {formatTime(requiredSeconds)}
                </span>
                <span>Est: {estimatedMinutes}m</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
                <div
                  className={`h-full transition-all duration-300 ${
                    isOverThreshold ? 'bg-[var(--color-status-success)]' : 'bg-[var(--color-brand)]'
                  }`}
                  style={{
                    width: `${Math.min(100, (elapsedSeconds / (estimatedMinutes * 60)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Threshold Notification Badge */}
            <div className="mt-3 flex items-center space-x-1.5 text-xs">
              {isOverThreshold ? (
                <span className="flex items-center text-[var(--color-status-success)] font-medium">
                  <ShieldCheck className="h-4 w-4 mr-1" />
                  Progression gate satisfied. Eligible for full XP & Credits on completion.
                </span>
              ) : (
                <span className="flex items-center text-[var(--color-brand)] font-medium">
                  <Clock className="h-4 w-4 mr-1" />
                  Below 50% minimum threshold ({formatTime(requiredSeconds - elapsedSeconds)} remaining for progression eligibility).
                </span>
              )}
            </div>
          </div>

          {/* Completion Criteria Verification */}
          {assignment.completionCriteria && (
            <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/60 p-3 text-xs">
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-brand)]">
                CRITERIA FOR SUCCESSFUL OUTCOME
              </span>
              <p className="mt-1 text-[var(--color-text-secondary)]">
                {assignment.completionCriteria}
              </p>
            </div>
          )}

          {/* Execution Notes / Scratchpad */}
          <div className="mb-6">
            <label className="font-mono text-[10px] uppercase text-[var(--color-text-tertiary)]">
              EXECUTION OBSERVATIONS & NOTES (OPTIONAL)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Record any friction, key insights, or variance observed during execution..."
              rows={2}
              className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-brand)] focus:outline-none"
            />
          </div>

          {errorMessage && (
            <div className="mb-4 flex items-center space-x-2 rounded-md bg-red-950/40 p-3 text-xs text-red-300 border border-red-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Buttons: Pause / Resume + Complete */}
          <div className="flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-4">
            <button
              onClick={isPaused ? handleResume : handlePause}
              className="flex items-center space-x-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 py-2.5 text-xs font-semibold text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-gold)]"
            >
              {isPaused ? (
                <>
                  <Play className="h-4 w-4 text-[var(--color-brand)]" />
                  <span>RESUME SESSION</span>
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                  <span>PAUSE SESSION</span>
                </>
              )}
            </button>

            <button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="flex items-center space-x-2 rounded-lg border border-[var(--color-brand)] bg-[var(--color-brand)] px-6 py-2.5 text-xs font-bold text-[#06080A] transition-all hover:bg-[var(--color-brand-highlight)] hover:shadow-lg disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? 'VERIFYING WITH SERVER...' : 'COMPLETE ASSIGNMENT'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
