// src/components/profile/ProfilePage.tsx
// User Profile & System Operative Credentials

import React, { useState, useEffect } from 'react';
import { ProfileResponse } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Shield,
  Zap,
  Sliders,
  LogOut,
  Tag,
  Calendar,
  CheckCircle2,
  Award,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, toggleMode, logout } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getProfile()
      .then(setProfile)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const isCommander = user?.operatingMode === 'COMMANDER';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-[var(--color-border)] pb-4">
        <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-brand)]">
          OPERATIVE DOSSIER
        </span>
        <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)]">
          Profile & System Identity
        </h1>
        <p className="text-xs text-[var(--color-text-secondary)]">
          System telemetry, credentials, earned profile tags, and operational configuration.
        </p>
      </div>

      {profile && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Identity Card (lg:col-span-5) */}
          <div className="space-y-6 lg:col-span-5">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-md">
              <div className="flex items-center space-x-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--color-border-gold)] bg-[var(--color-surface-elevated)] text-[var(--color-brand)] shadow-lg">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
                    {profile.user.displayName}
                  </h3>
                  <p className="font-mono text-xs text-[var(--color-text-tertiary)]">
                    {profile.user.email}
                  </p>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="rounded bg-[var(--color-brand)]/10 px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--color-brand-highlight)]">
                      LVL {profile.progression.level}: {profile.progression.title}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progression Summary */}
              <div className="mt-6 space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-tertiary)] uppercase">TOTAL XP</span>
                  <span className="font-bold text-[var(--color-brand-highlight)]">{profile.progression.totalXP.toLocaleString()} XP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-tertiary)] uppercase">CHALLENGE CREDITS</span>
                  <span className="font-bold text-[var(--color-brand)]">{profile.rank.totalCredits.toLocaleString()} C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-tertiary)] uppercase">GLOBAL STANDING</span>
                  <span className="font-bold text-[var(--color-text-primary)]">Rank #{profile.rank.position} ({profile.rank.tier})</span>
                </div>
              </div>

              {/* Mode Control */}
              <div className="mt-6 border-t border-[var(--color-border)] pt-4">
                <span className="font-mono text-[10px] uppercase text-[var(--color-text-tertiary)] block mb-2">
                  ACTIVE OPERATING MODE
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => toggleMode('MANUAL')}
                    className={`flex items-center justify-center space-x-1.5 rounded-lg border p-2 text-xs font-semibold ${
                      !isCommander
                        ? 'border-[#72B7F2] bg-[#72B7F2]/15 text-[#96CBF7]'
                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]'
                    }`}
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>MANUAL</span>
                  </button>

                  <button
                    onClick={() => toggleMode('COMMANDER')}
                    className={`flex items-center justify-center space-x-1.5 rounded-lg border p-2 text-xs font-semibold ${
                      isCommander
                        ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/15 text-[var(--color-brand-highlight)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]'
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    <span>COMMANDER</span>
                  </button>
                </div>
              </div>

              {/* Logout */}
              <div className="mt-6 border-t border-[var(--color-border)] pt-4">
                <button
                  onClick={() => logout()}
                  className="flex w-full items-center justify-center space-x-2 rounded-lg border border-red-900/40 bg-red-950/20 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-950/40 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>DISCONNECT SESSION</span>
                </button>
              </div>
            </div>
          </div>

          {/* Profile Tags & Evidence (lg:col-span-7) */}
          <div className="space-y-6 lg:col-span-7">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-md">
              <div className="flex items-center space-x-2 border-b border-[var(--color-border-subtle)] pb-3">
                <Tag className="h-4 w-4 text-[var(--color-brand)]" />
                <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--color-brand)]">
                  EARNED BEHAVIORAL PROFILE TAGS
                </h3>
              </div>

              <div className="mt-4 space-y-3">
                {profile.profileTags && profile.profileTags.length > 0 ? (
                  profile.profileTags.map(tag => (
                    <div
                      key={tag.id}
                      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[var(--color-brand-highlight)] uppercase">
                          {tag.name}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                          Confidence: {tag.confidence}%
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                        {tag.evidence}
                      </p>
                      <div className="mt-2 text-[10px] font-mono text-[var(--color-text-tertiary)]">
                        Awarded: {new Date(tag.earnedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[var(--color-text-secondary)] italic">
                    Complete additional high-difficulty challenges to unlock behavioral profile tags.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
