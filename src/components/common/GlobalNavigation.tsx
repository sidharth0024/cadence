// src/components/common/GlobalNavigation.tsx
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCadence } from '../../context/CadenceContext';
import {
  Compass,
  Target,
  CheckCircle2,
  Brain,
  TrendingUp,
  BookOpen,
  Trophy,
  MessageSquare,
  User as UserIcon,
  Menu,
  X,
  Zap,
  Sliders,
  Database,
} from 'lucide-react';

interface Props {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const GlobalNavigation: React.FC<Props> = ({ activeTab, onSelectTab }) => {
  const { user, toggleMode } = useAuth();
  const { progression, rankState } = useCadence();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'objectives', label: 'Objectives', icon: Target },
    { id: 'assignments', label: 'Assignments', icon: CheckCircle2 },
    { id: 'capabilities', label: 'Capabilities', icon: Brain },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'ai-chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'rank', label: 'Rank & Achievements', icon: Trophy },
  ];

  const isCommander = user?.operatingMode === 'COMMANDER';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--color-border)] bg-[#06080A]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Emblem */}
        <div className="flex items-center space-x-6">
          <button
            onClick={() => onSelectTab('home')}
            className="group flex items-center space-x-2 text-left focus:outline-none"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded border border-[var(--color-brand)]/40 bg-[var(--color-surface-elevated)] transition-colors group-hover:border-[var(--color-brand)]">
              <span className="font-display text-lg font-bold text-[var(--color-brand-highlight)]">C</span>
            </div>
            <span className="font-display text-2xl font-bold tracking-wider text-[var(--color-text-primary)]">
              CADENCE
            </span>
          </button>

          {/* Operating Mode Indicator / Switcher */}
          <div className="hidden items-center sm:flex">
            <button
              onClick={() => toggleMode(isCommander ? 'MANUAL' : 'COMMANDER')}
              className={`flex items-center space-x-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide transition-all ${
                isCommander
                  ? 'border-[var(--color-brand)]/40 bg-[var(--color-brand)]/10 text-[var(--color-brand-highlight)] shadow-[0_0_12px_rgba(216,170,120,0.15)]'
                  : 'border-[#72B7F2]/40 bg-[#72B7F2]/10 text-[#A2D2FF]'
              }`}
              title="Click to toggle operating mode between Manual and Commander"
            >
              {isCommander ? (
                <>
                  <Zap className="h-3 w-3 text-[var(--color-brand)]" />
                  <span>COMMANDER MODE</span>
                </>
              ) : (
                <>
                  <Sliders className="h-3 w-3 text-[#72B7F2]" />
                  <span>MANUAL MODE</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center space-x-1 lg:flex">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center space-x-1.5 rounded-md px-3 py-1.5 text-xs font-medium tracking-wide transition-all ${
                  active
                    ? 'border border-[var(--color-brand)]/30 bg-[var(--color-surface-elevated)] text-[var(--color-brand-highlight)] shadow-sm'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? 'text-[var(--color-brand)]' : 'text-[var(--color-text-tertiary)]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Status Pill (Level, XP, Rank, Profile) */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onSelectTab('profile')}
            className={`flex items-center space-x-3 rounded-lg border px-3 py-1.5 transition-colors ${
              activeTab === 'profile'
                ? 'border-[var(--color-brand)] bg-[var(--color-surface-elevated)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-gold)]'
            }`}
          >
            <div className="flex flex-col text-right">
              <span className="font-mono text-[10px] font-semibold text-[var(--color-brand)]">
                LVL {progression?.level || 1} · {progression?.totalXP?.toLocaleString() || 0} XP
              </span>
              <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                RANK #{rankState?.position || 1} · {rankState?.totalCredits || 0} C
              </span>
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border-gold)] bg-[var(--color-surface-elevated)] text-[var(--color-brand)]">
              <UserIcon className="h-3.5 w-3.5" />
            </div>
          </button>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] lg:hidden"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="border-b border-[var(--color-border)] bg-[#0A0D10] px-4 py-4 lg:hidden">
          <div className="mb-3 flex items-center justify-between border-b border-[var(--color-border)] pb-3">
            <span className="text-xs font-semibold text-[var(--color-text-tertiary)]">OPERATING MODE</span>
            <button
              onClick={() => toggleMode(isCommander ? 'MANUAL' : 'COMMANDER')}
              className={`flex items-center space-x-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                isCommander
                  ? 'border-[var(--color-brand)]/40 bg-[var(--color-brand)]/10 text-[var(--color-brand-highlight)]'
                  : 'border-[#72B7F2]/40 bg-[#72B7F2]/10 text-[#A2D2FF]'
              }`}
            >
              {isCommander ? <Zap className="h-3 w-3" /> : <Sliders className="h-3 w-3" />}
              <span>{isCommander ? 'COMMANDER' : 'MANUAL'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    setMobileOpen(false);
                  }}
                  className={`flex items-center space-x-2 rounded-md p-2 text-left text-xs font-medium ${
                    active
                      ? 'border border-[var(--color-brand)]/40 bg-[var(--color-surface-elevated)] text-[var(--color-brand-highlight)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4 text-[var(--color-brand)]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
