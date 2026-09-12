// src/components/rank/RankAchievementsPage.tsx
// Two distinct progression systems: Personal Progression (Level & XP) + Rank Standing (Credits & Leaderboard)
// Plus the 23 Canonical Badges catalog.

import React, { useState, useEffect } from 'react';
import { ProfileResponse, LeaderboardEntry } from '../../types';
import { api } from '../../services/api';
import {
  Trophy,
  Award,
  Shield,
  Zap,
  Lock,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const RankAchievementsPage: React.FC = () => {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'BADGES' | 'LEADERBOARD'>('BADGES');
  const [badgeFilter, setBadgeFilter] = useState<'ALL' | 'LEVEL' | 'XP' | 'CREDIT'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getProfile(),
      api.getRank(),
    ])
      .then(([prof, rankData]) => {
        setProfile(prof);
        setLeaderboard(rankData.leaderboard || []);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const earnedBadgeIds = new Set(profile?.badges?.earned?.map(b => b.badge.id) || []);

  const allBadges = [
    ...(profile?.badges?.earned?.map(b => ({ ...b.badge, earned: true, earnedAt: b.earnedAt })) || []),
    ...(profile?.badges?.locked?.map(b => ({ ...b.badge, earned: false, currentVal: b.currentVal, remaining: b.remaining })) || []),
  ];

  const filteredBadges = allBadges.filter(b => {
    if (badgeFilter === 'ALL') return true;
    return b.badgeType === badgeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-[var(--color-border)] pb-4">
        <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-brand)]">
          PROGRESSION MATRIX
        </span>
        <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)]">
          Rank & Achievements
        </h1>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Two distinct tracks: Internal Mastery (Level & XP) and Competitive Standing (Credits & Leaderboard).
        </p>
      </div>

      {/* Track Overview Cards */}
      {profile && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Internal Mastery (Level & XP) */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-md">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase text-[var(--color-brand)]">
                TRACK 1: INTERNAL MASTERY
              </span>
              <span className="rounded bg-[var(--color-brand)]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--color-brand-highlight)]">
                PERSONAL
              </span>
            </div>

            <div className="mt-2">
              <h3 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
                Level {profile.progression.level}: {profile.progression.title}
              </h3>
              <p className="font-mono text-xs text-[var(--color-text-secondary)] mt-1">
                {profile.progression.totalXP.toLocaleString()} Total XP Accumulated
              </p>
            </div>

            {/* Level XP Progress */}
            <div className="mt-4">
              <div className="flex justify-between font-mono text-[10px] text-[var(--color-text-tertiary)]">
                <span>{profile.progression.currentLevelXP} XP</span>
                <span>Next Level: {profile.progression.nextLevelXP} XP</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
                <div
                  className="h-full rounded-full bg-[var(--color-brand)] transition-all duration-700"
                  style={{ width: `${profile.progression.progressPercent}%` }}
                />
              </div>
            </div>
            <p className="mt-3 text-[11px] text-[var(--color-text-secondary)]">
              Earned via any verified real-world completion (manual or AI).
            </p>
          </div>

          {/* Standing (Credits & Rank) */}
          <div className="rounded-2xl border border-[var(--color-border-gold)] bg-[var(--color-surface)] p-6 shadow-md">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase text-[var(--color-brand)]">
                TRACK 2: ADAPTIVE STANDING
              </span>
              <span className="rounded bg-[var(--color-brand-highlight)]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--color-brand-highlight)]">
                COMPETITIVE
              </span>
            </div>

            <div className="mt-2">
              <h3 className="font-display text-2xl font-bold text-[var(--color-brand-highlight)]">
                Rank #{profile.rank.position} · {profile.rank.tier}
              </h3>
              <p className="font-mono text-xs text-[var(--color-text-secondary)] mt-1">
                {profile.rank.totalCredits.toLocaleString()} Challenge Credits
              </p>
            </div>

            <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 text-[11px] text-[var(--color-text-secondary)]">
              Credits are awarded <span className="text-[var(--color-brand-highlight)] font-semibold">exclusively through qualifying AI-selected challenges</span> where XP &gt; 100. Manual assignments award 0 credits.
            </div>
          </div>
        </div>
      )}

      {/* Sub-Navigation Tabs: Badges vs Leaderboard */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('BADGES')}
            className={`rounded-lg px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'BADGES'
                ? 'border border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand-highlight)]'
                : 'text-[var(--color-text-secondary)] hover:text-white'
            }`}
          >
            Canonical Badges ({allBadges.length})
          </button>
          <button
            onClick={() => setActiveTab('LEADERBOARD')}
            className={`rounded-lg px-4 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider transition-colors ${
              activeTab === 'LEADERBOARD'
                ? 'border border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand-highlight)]'
                : 'text-[var(--color-text-secondary)] hover:text-white'
            }`}
          >
            Operative Leaderboard
          </button>
        </div>

        {activeTab === 'BADGES' && (
          <div className="flex items-center space-x-1.5 text-xs">
            {(['ALL', 'LEVEL', 'XP', 'CREDIT'] as const).map(f => (
              <button
                key={f}
                onClick={() => setBadgeFilter(f)}
                className={`rounded px-2.5 py-1 font-mono text-[10px] font-semibold ${
                  badgeFilter === f
                    ? 'bg-[var(--color-surface-elevated)] text-[var(--color-brand)]'
                    : 'text-[var(--color-text-tertiary)] hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab 1: Badges Catalog Grid */}
      {activeTab === 'BADGES' && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBadges.map((badge: any) => {
            const isEarned = badge.earned;
            return (
              <div
                key={badge.id}
                className={`rounded-xl border p-4 transition-all ${
                  isEarned
                    ? 'border-[var(--color-border-gold)] bg-[var(--color-surface)] shadow-md'
                    : 'border-[var(--color-border-subtle)] bg-[var(--color-surface)]/50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                        isEarned
                          ? 'border-[var(--color-border-gold)] bg-[var(--color-brand)]/10 text-[var(--color-brand)]'
                          : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-tertiary)]'
                      }`}
                    >
                      {isEarned ? <Award className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                        {badge.name}
                      </h4>
                      <span className="font-mono text-[9px] uppercase text-[var(--color-brand)]">
                        {badge.rarity} · {badge.badgeType}
                      </span>
                    </div>
                  </div>

                  {isEarned && (
                    <span className="rounded bg-[var(--color-status-success)]/10 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[var(--color-status-success)]">
                      EARNED
                    </span>
                  )}
                </div>

                <p className="mt-2.5 text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
                  {badge.description}
                </p>

                <div className="mt-3 border-t border-[var(--color-border-subtle)] pt-2 font-mono text-[10px] text-[var(--color-text-tertiary)]">
                  {isEarned ? (
                    <span className="text-[var(--color-status-success)]">Requirement Fulfilled</span>
                  ) : (
                    <span>Requirement: {badge.triggerType} ({badge.triggerValue})</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Leaderboard Table */}
      {activeTab === 'LEADERBOARD' && (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-md">
          <div className="border-b border-[var(--color-border)] px-6 py-4">
            <h3 className="font-display text-xl font-bold text-[var(--color-text-primary)]">
              Operative Standing
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Rank positions are ranked strictly by total accumulated challenge credits.
            </p>
          </div>

          <div className="divide-y divide-[var(--color-border-subtle)]">
            {leaderboard.map(entry => {
              const isCurrentUser = entry.userId === profile?.user.id;
              return (
                <div
                  key={entry.userId}
                  className={`flex items-center justify-between px-6 py-3.5 transition-colors ${
                    isCurrentUser ? 'bg-[var(--color-brand)]/5 font-semibold' : 'hover:bg-[var(--color-surface-elevated)]'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <span className={`font-mono text-sm font-bold ${entry.rank <= 3 ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-tertiary)]'}`}>
                      #{entry.rank}
                    </span>
                    <div>
                      <span className="text-xs font-medium text-[var(--color-text-primary)]">
                        {entry.displayName} {isCurrentUser && '(You)'}
                      </span>
                      <div className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                        LVL {entry.level} · {entry.totalXP.toLocaleString()} XP
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-[var(--color-brand-highlight)]">
                      {entry.totalCredits.toLocaleString()} C
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
