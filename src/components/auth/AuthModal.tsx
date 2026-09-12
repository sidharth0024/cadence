// src/components/auth/AuthModal.tsx
// Dignified authentication interface with demo quick-start

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Lock, Mail, User, ShieldCheck } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('demo@cadence.io');
  const [password, setPassword] = useState('cadence123');
  const [displayName, setDisplayName] = useState('Operative Alpha');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, displayName);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      await login('demo@cadence.io', 'cadence123');
    } catch (_) {
      try {
        await register('demo@cadence.io', 'cadence123', 'Operative Alpha');
      } catch (err: any) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06080A] p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--color-border-gold)] bg-[var(--color-surface)] p-8 shadow-2xl">
        {/* Emblem */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-brand)]/50 bg-[var(--color-surface-elevated)] shadow-md">
            <span className="font-display text-2xl font-bold text-[var(--color-brand-highlight)]">C</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-wider text-[var(--color-text-primary)]">
            CADENCE
          </h1>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            Cinematic real-life RPG & adaptive behavior progression system
          </p>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-800 bg-red-950/40 p-3 text-xs text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {isRegister && (
            <div>
              <label className="block font-mono text-[10px] uppercase text-[var(--color-text-tertiary)] mb-1">
                OPERATIVE CALLSIGN
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Operative Name"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] py-2 pl-9 pr-3 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-mono text-[10px] uppercase text-[var(--color-text-tertiary)] mb-1">
              EMAIL ADDRESS
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="operative@domain.com"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] py-2 pl-9 pr-3 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] uppercase text-[var(--color-text-tertiary)] mb-1">
              SECURITY CIPHER
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] py-2 pl-9 pr-3 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:outline-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center space-x-2 rounded-xl border border-[var(--color-brand)] bg-[var(--color-brand)] py-2.5 text-xs font-bold text-[#06080A] hover:bg-[var(--color-brand-highlight)] transition-colors shadow-lg disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : isRegister ? 'INITIALIZE OPERATIVE' : 'SYNCHRONIZE SESSION'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-4 text-center">
          <button
            type="button"
            onClick={handleQuickDemo}
            disabled={loading}
            className="flex w-full items-center justify-center space-x-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] py-2 text-xs font-semibold text-[var(--color-text-secondary)] hover:border-[var(--color-border-gold)] hover:text-white transition-colors"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-brand)]" />
            <span>INSTANT DEMO ACCESS (ONE-CLICK)</span>
          </button>
        </div>

        {/* Switch Login / Register */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="font-mono text-[11px] text-[var(--color-brand)] hover:underline"
          >
            {isRegister ? 'Already registered? Synchronize existing session' : 'New operative? Initialize credentials'}
          </button>
        </div>
      </div>
    </div>
  );
};
