// src/components/common/CinematicCompletionModal.tsx
// Cinematic progression feedback sequence
// Clean, dignified, restrained antique gold progression response with server verification

import React from 'react';
import { CompletionResponse } from '../../types';
import { Award, Zap, ArrowRight, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

interface Props {
  result: CompletionResponse;
  onDismiss: () => void;
}

export const CinematicCompletionModal: React.FC<Props> = ({ result, onDismiss }) => {
  const { rewardEligible, xpAwarded, creditsAwarded, levelState, capabilityGains, newlyUnlockedBadges, serverElapsedSeconds, requiredSeconds } = result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-lg">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--color-border-gold)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-[0_0_50px_rgba(216,170,120,0.15)] text-center animate-in fade-in zoom-in-95 duration-300">
        
        {/* Subtle Ambient Light */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-[var(--color-brand)]/10 blur-3xl pointer-events-none" />

        {/* Status Header */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-border-gold)] bg-[var(--color-surface-elevated)] text-[var(--color-brand)] shadow-lg">
            {rewardEligible ? <ShieldCheck className="h-7 w-7" /> : <AlertCircle className="h-7 w-7 text-[var(--color-brand)]" />}
          </div>

          <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-brand)]">
            SERVER VERIFIED ACTION
          </span>
          <h2 className="mt-1 font-display text-3xl font-bold text-[var(--color-text-primary)]">
            Assignment Recorded
          </h2>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            The real-world commitment is completed and preserved in your immutable journey record.
          </p>
        </div>

        {/* Main Reward / Eligibility Block */}
        <div className="relative z-10 my-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
          {rewardEligible ? (
            <div className="grid grid-cols-2 gap-4 divide-x divide-[var(--color-border)]">
              <div className="flex flex-col items-center">
                <span className="font-mono text-[10px] text-[var(--color-text-tertiary)] uppercase">
                  PERSONAL PROGRESSION
                </span>
                <span className="font-mono text-3xl font-bold text-[var(--color-brand-highlight)]">
                  +{xpAwarded} XP
                </span>
                <span className="text-[11px] text-[var(--color-text-secondary)]">Level Advancement</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-mono text-[10px] text-[var(--color-text-tertiary)] uppercase">
                  AI CHALLENGE RANK
                </span>
                <span className="font-mono text-3xl font-bold text-[var(--color-brand-highlight)]">
                  +{creditsAwarded} C
                </span>
                <span className="text-[11px] text-[var(--color-text-secondary)]">
                  {creditsAwarded > 0 ? 'Competitive Standing' : 'Manual / XP <= 100'}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-2 text-center">
              <span className="font-mono text-xs font-semibold text-[var(--color-brand)]">
                50% Minimum Threshold Gate Enforced
              </span>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                Elapsed execution was {Math.floor(serverElapsedSeconds / 60)}m (Required: {Math.floor(requiredSeconds / 60)}m).
                Anti-farming protection recorded 0 XP and 0 Credits.
              </p>
            </div>
          )}
        </div>

        {/* Level Up Announcement (if applicable) */}
        {levelState.levelUp && (
          <div className="relative z-10 mb-4 rounded-xl border border-[var(--color-brand)]/60 bg-[var(--color-brand)]/10 p-3.5 text-center">
            <div className="flex items-center justify-center space-x-2 text-[var(--color-brand-highlight)]">
              <Sparkles className="h-4 w-4" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider">LEVEL ADVANCEMENT</span>
            </div>
            <p className="mt-1 font-display text-lg font-bold text-[var(--color-text-primary)]">
              LEVEL {levelState.previousLevel} → LEVEL {levelState.newLevel}: {levelState.title}
            </p>
          </div>
        )}

        {/* Newly Unlocked Badges */}
        {newlyUnlockedBadges && newlyUnlockedBadges.length > 0 && (
          <div className="relative z-10 mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 text-left">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-brand)]">
              NEW ACHIEVEMENT UNLOCKED
            </span>
            {newlyUnlockedBadges.map(b => (
              <div key={b.id} className="mt-1.5 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-1.5">
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-text-primary)]">{b.name}</h4>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">{b.description}</p>
                </div>
                <span className="rounded border border-[var(--color-border-gold)] px-2 py-0.5 font-mono text-[9px] text-[var(--color-brand)]">
                  {b.rarity}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Capability Movements */}
        {capabilityGains && capabilityGains.length > 0 && (
          <div className="relative z-10 mb-6 flex flex-wrap items-center justify-center gap-2">
            {capabilityGains.map(cg => (
              <span
                key={cg.dimension}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-1 font-mono text-[11px] text-[var(--color-text-secondary)]"
              >
                {cg.dimension.toUpperCase()} +{cg.amount} ({cg.newValue})
              </span>
            ))}
          </div>
        )}

        {/* Dismiss Button */}
        <div className="relative z-10">
          <button
            onClick={onDismiss}
            className="flex w-full items-center justify-center space-x-2 rounded-xl border border-[var(--color-brand)] bg-[var(--color-brand)] py-3 text-xs font-bold text-[#06080A] transition-all hover:bg-[var(--color-brand-highlight)] shadow-lg"
          >
            <span>CONTINUE JOURNEY</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
