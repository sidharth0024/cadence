// src/components/objectives/ObjectivesPage.tsx
// Horizon & Strategic Roadmap view
// Manages Objectives, Structured Phases, Milestones, and Linked Habits.

import React, { useState, useEffect } from 'react';
import { Objective, ObjectivePhase, Milestone, Habit } from '../../types';
import { api } from '../../services/api';
import { useCadence } from '../../context/CadenceContext';
import {
  Target,
  Flag,
  CheckCircle2,
  Clock,
  Plus,
  Compass,
  ChevronRight,
  Layers,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const ObjectivesPage: React.FC = () => {
  const { primaryObjective, refreshAll } = useCadence();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New Objective form state
  const [newTitle, setNewTitle] = useState('');
  const [newOutcome, setNewOutcome] = useState('');
  const [newPriority, setNewPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [newTargetDate, setNewTargetDate] = useState('');

  const loadObjectives = async () => {
    try {
      setIsLoading(true);
      const list = await api.getObjectives();
      setObjectives(list);
      if (!selectedObjective && list.length > 0) {
        setSelectedObjective(list.find(o => o.isPrimary) || list[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadObjectives();
  }, []);

  const handleCreateObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await api.createObjective({
        title: newTitle.trim(),
        targetOutcome: newOutcome.trim(),
        priority: newPriority,
        targetDate: newTargetDate || '2026-12-31',
        isPrimary: objectives.length === 0,
      });

      setShowCreateModal(false);
      setNewTitle('');
      setNewOutcome('');
      await loadObjectives();
      await refreshAll();
    } catch (err) {
      console.error('Failed to create objective:', err);
    }
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await api.updateObjective(id, { isPrimary: true });
      await loadObjectives();
      await refreshAll();
    } catch (err) {
      console.error(err);
    }
  };

  const active = selectedObjective || primaryObjective;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-brand)]">
            STRATEGIC HORIZON
          </span>
          <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)]">
            Objectives & Roadmaps
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Define your horizon. Every phase, milestone, and daily assignment anchors to your strategic purpose.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-1.5 rounded-lg border border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-2 text-xs font-bold text-[#06080A] hover:bg-[var(--color-brand-highlight)] transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Objective</span>
        </button>
      </div>

      {/* Main Roadmap Split View */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Objectives Selector (lg:col-span-4) */}
        <div className="space-y-3 lg:col-span-4">
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
            ALL OBJECTIVES ({objectives.length})
          </span>

          <div className="space-y-2.5">
            {objectives.map(obj => {
              const isSelected = active?.id === obj.id;
              return (
                <div
                  key={obj.id}
                  onClick={() => setSelectedObjective(obj)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? 'border-[var(--color-brand)] bg-[var(--color-surface-elevated)] shadow-md'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-gold)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase text-[var(--color-brand)]">
                      {obj.isPrimary ? '★ PRIMARY OBJECTIVE' : obj.status}
                    </span>
                    <span className="font-mono text-xs font-bold text-[var(--color-brand-highlight)]">
                      {obj.progress}%
                    </span>
                  </div>

                  <h4 className="mt-1 font-display text-lg font-bold text-[var(--color-text-primary)] line-clamp-1">
                    {obj.title}
                  </h4>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)] line-clamp-2">
                    {obj.targetOutcome || obj.description}
                  </p>

                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-brand)]"
                      style={{ width: `${obj.progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Objective Detail & Phase Roadmap (lg:col-span-8) */}
        <div className="space-y-6 lg:col-span-8">
          {active ? (
            <div className="rounded-2xl border border-[var(--color-border-gold)] bg-[var(--color-surface)] p-6 shadow-lg">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--color-border)] pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <Compass className="h-4 w-4 text-[var(--color-brand)]" />
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-brand)]">
                      {active.isPrimary ? 'PRIMARY HORIZON' : 'ACTIVE OBJECTIVE'}
                    </span>
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
                    {active.title}
                  </h2>
                </div>

                {!active.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(active.id)}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-brand)]"
                  >
                    Set as Primary
                  </button>
                )}
              </div>

              <div className="mt-4">
                <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  {active.targetOutcome || active.description}
                </p>

                {/* Progress Metric */}
                <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-[var(--color-text-tertiary)] uppercase">OVERALL DESTINATION PROGRESS</span>
                    <span className="font-bold text-[var(--color-brand-highlight)]">{active.progress}%</span>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-highlight)] transition-all duration-500"
                      style={{ width: `${active.progress}%` }}
                    />
                  </div>
                </div>

                {/* Phases Journey */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Layers className="h-4 w-4 text-[var(--color-brand)]" />
                    <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--color-text-primary)]">
                      SEQUENTIAL PHASES ({active.phases?.length || 0})
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {active.phases && active.phases.length > 0 ? (
                      active.phases.map(phase => {
                        const isCurrent = phase.status === 'CURRENT';
                        const isCompleted = phase.status === 'COMPLETED';
                        return (
                          <div
                            key={phase.id}
                            className={`rounded-xl border p-4 transition-all ${
                              isCurrent
                                ? 'border-[var(--color-brand)] bg-[var(--color-surface-elevated)]'
                                : 'border-[var(--color-border)] bg-[var(--color-surface)] opacity-85'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className={`rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${
                                  isCompleted
                                    ? 'bg-[var(--color-status-success)]/10 text-[var(--color-status-success)]'
                                    : isCurrent
                                    ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand-highlight)]'
                                    : 'bg-[var(--color-bg)] text-[var(--color-text-tertiary)]'
                                }`}>
                                  PHASE {phase.orderIndex + 1} · {phase.status}
                                </span>
                              </div>
                              <span className="font-mono text-xs font-semibold text-[var(--color-brand-highlight)]">
                                {phase.progress}%
                              </span>
                            </div>

                            <h4 className="mt-1.5 text-sm font-bold text-[var(--color-text-primary)]">
                              {phase.name}
                            </h4>
                            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                              {phase.purpose}
                            </p>

                            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-bg)]">
                              <div
                                className="h-full rounded-full bg-[var(--color-brand)]"
                                style={{ width: `${phase.progress}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-[var(--color-text-tertiary)] italic">No explicit phases defined.</p>
                    )}
                  </div>
                </div>

                {/* Key Milestones */}
                {active.milestones && active.milestones.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Flag className="h-4 w-4 text-[var(--color-brand)]" />
                      <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--color-text-primary)]">
                        KEY MILESTONES
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {active.milestones.map(m => {
                        const isDone = m.status === 'COMPLETED';
                        return (
                          <div
                            key={m.id}
                            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3"
                          >
                            <div className="flex items-start space-x-2">
                              <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${isDone ? 'text-[var(--color-status-success)]' : 'text-[var(--color-text-tertiary)]'}`} />
                              <div>
                                <h5 className={`text-xs font-semibold ${isDone ? 'text-[var(--color-text-secondary)] line-through' : 'text-[var(--color-text-primary)]'}`}>
                                  {m.title}
                                </h5>
                                <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
                                  {m.completionCriteria}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
              <Compass className="mx-auto h-10 w-10 text-[var(--color-text-tertiary)]" />
              <h3 className="mt-3 font-display text-xl font-bold text-[var(--color-text-primary)]">
                No Objective Selected
              </h3>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                Select an objective from the left or create a new horizon.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Objective Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl">
            <h3 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
              Define New Horizon
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Establish a durable strategic objective that guides all adaptive and manual assignments.
            </p>

            <form onSubmit={handleCreateObjective} className="mt-4 space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase text-[var(--color-text-tertiary)] mb-1">
                  OBJECTIVE TITLE *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Master Full-Stack Systems Architecture"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-[var(--color-text-tertiary)] mb-1">
                  TARGET OUTCOME
                </label>
                <textarea
                  value={newOutcome}
                  onChange={e => setNewOutcome(e.target.value)}
                  placeholder="Describe what measurable reality exists once this is achieved..."
                  rows={3}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase text-[var(--color-text-tertiary)] mb-1">
                    PRIORITY
                  </label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-[10px] uppercase text-[var(--color-text-tertiary)] mb-1">
                    TARGET DATE
                  </label>
                  <input
                    type="date"
                    value={newTargetDate}
                    onChange={e => setNewTargetDate(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg border border-[var(--color-brand)] bg-[var(--color-brand)] px-5 py-2 text-xs font-bold text-[#06080A] hover:bg-[var(--color-brand-highlight)]"
                >
                  Create Horizon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
