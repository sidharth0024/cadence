// src/components/journal/JournalPage.tsx
// The Chronicle of Action: Immutable audit log of all progression events

import React, { useState, useEffect } from 'react';
import { JournalEvent } from '../../types';
import { api } from '../../services/api';
import {
  BookOpen,
  Search,
  CheckCircle2,
  TrendingUp,
  Award,
  Sparkles,
  Layers,
  Shield,
  Clock,
} from 'lucide-react';

export const JournalPage: React.FC = () => {
  const [events, setEvents] = useState<JournalEvent[]>([]);
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState<{
    totalEvents: number;
    assignmentsCompleted: number;
    milestonesUnlocked: number;
    adaptations: number;
  }>({
    totalEvents: 0,
    assignmentsCompleted: 0,
    milestonesUnlocked: 0,
    adaptations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchJournal = async () => {
    try {
      setIsLoading(true);
      const [evts, st] = await Promise.all([
        api.getJournal(filterType, search),
        api.getJournalStats(),
      ]);
      setEvents(evts);
      setStats(st);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJournal();
  }, [filterType, search]);

  const typeConfig: Record<string, { label: string; color: string; icon: any }> = {
    ASSIGNMENT: { label: 'ASSIGNMENT', color: '#63D99B', icon: CheckCircle2 },
    PROGRESSION: { label: 'PROGRESSION', color: '#D8AA78', icon: TrendingUp },
    CAPABILITY: { label: 'CAPABILITY', color: '#72B7F2', icon: Shield },
    OBJECTIVE: { label: 'OBJECTIVE', color: '#9B72D6', icon: Layers },
    ACHIEVEMENT: { label: 'ACHIEVEMENT', color: '#F7D9A6', icon: Award },
    ADAPTATION: { label: 'ADAPTATION', color: '#D9AD5A', icon: Sparkles },
    SYSTEM: { label: 'SYSTEM', color: '#ABA8AA', icon: Clock },
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-[var(--color-border)] pb-4">
        <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-brand)]">
          CHRONICLE OF ACTION
        </span>
        <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)]">
          Journal & History
        </h1>
        <p className="text-xs text-[var(--color-text-secondary)]">
          An immutable chronicle of your growth. Every action, progression threshold, and adaptation event is recorded.
        </p>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
          <span className="font-mono text-[9px] uppercase text-[var(--color-text-tertiary)]">TOTAL ENTRIES</span>
          <p className="font-mono text-xl font-bold text-[var(--color-text-primary)]">{stats.totalEvents}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
          <span className="font-mono text-[9px] uppercase text-[var(--color-text-tertiary)]">ACTIONS COMPLETED</span>
          <p className="font-mono text-xl font-bold text-[var(--color-status-success)]">{stats.assignmentsCompleted}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
          <span className="font-mono text-[9px] uppercase text-[var(--color-text-tertiary)]">MILESTONES UNLOCKED</span>
          <p className="font-mono text-xl font-bold text-[var(--color-brand-highlight)]">{stats.milestonesUnlocked}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
          <span className="font-mono text-[9px] uppercase text-[var(--color-text-tertiary)]">ADAPTATIONS</span>
          <p className="font-mono text-xl font-bold text-[#9B72D6]">{stats.adaptations}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chronicle entries..."
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] pl-9 pr-4 py-1.5 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:outline-none"
          />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] focus:border-[var(--color-brand)] focus:outline-none"
        >
          <option value="ALL">All Event Types</option>
          <option value="ASSIGNMENT">Assignments</option>
          <option value="PROGRESSION">Progression (Level/XP)</option>
          <option value="CAPABILITY">Capabilities</option>
          <option value="OBJECTIVE">Objectives & Milestones</option>
          <option value="ACHIEVEMENT">Achievements & Badges</option>
          <option value="ADAPTATION">Adaptations</option>
        </select>
      </div>

      {/* Event Timeline List */}
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-12 text-center text-xs text-[var(--color-text-secondary)]">
            No events found matching criteria.
          </div>
        ) : (
          events.map(ev => {
            const cfg = typeConfig[ev.eventType] || { label: ev.eventType, color: '#D8AA78', icon: BookOpen };
            const Icon = cfg.icon;
            const dateStr = new Date(ev.occurredAt || ev.createdAt).toLocaleString();

            return (
              <div
                key={ev.id}
                className="flex items-start justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-border-gold)]"
              >
                <div className="flex items-start space-x-3 pr-4">
                  <div
                    className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg border"
                    style={{
                      backgroundColor: `${cfg.color}15`,
                      borderColor: `${cfg.color}40`,
                      color: cfg.color,
                    }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span
                        className="rounded px-1.5 py-0.2 font-mono text-[9px] font-bold uppercase"
                        style={{ color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                      <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                        {dateStr}
                      </span>
                    </div>

                    <h4 className="mt-1 text-sm font-semibold text-[var(--color-text-primary)]">
                      {ev.title}
                    </h4>
                    <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                      {ev.description}
                    </p>
                  </div>
                </div>

                {/* Deltas: XP, Credits, Capability */}
                <div className="flex flex-col items-end space-y-1 shrink-0 font-mono text-xs">
                  {ev.xpDelta ? (
                    <span className="font-bold text-[var(--color-brand-highlight)]">
                      +{ev.xpDelta} XP
                    </span>
                  ) : null}
                  {ev.creditDelta ? (
                    <span className="font-bold text-[var(--color-brand)]">
                      +{ev.creditDelta} C
                    </span>
                  ) : null}
                  {ev.capabilityDelta ? (
                    <span className="text-[10px] text-[var(--color-capability-intellect)]">
                      +{ev.capabilityDelta.amount} {ev.capabilityDelta.dimension}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
