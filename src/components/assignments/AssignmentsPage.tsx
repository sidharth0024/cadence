// src/components/assignments/AssignmentsPage.tsx
// Execution engine for real-world actions
// Domain-agnostic architecture: Search, multi-facet filtering, status machine, Current Focus.

import React, { useState, useEffect } from 'react';
import { Assignment } from '../../types';
import { api } from '../../services/api';
import { useCadence } from '../../context/CadenceContext';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Filter,
  Play,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  HelpCircle,
  Tag,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface Props {
  onOpenCreate: () => void;
}

export const AssignmentsPage: React.FC<Props> = ({ onOpenCreate }) => {
  const { user } = useAuth();
  const { currentFocus, startExecution } = useCadence();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDifficulty, setFilterDifficulty] = useState('ALL');
  const [filterOrigin, setFilterOrigin] = useState('ALL');
  const [selectedDetail, setSelectedDetail] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isCommander = user?.operatingMode === 'COMMANDER';

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (filterStatus !== 'ALL') params.status = filterStatus;
      if (filterDifficulty !== 'ALL') params.difficulty = filterDifficulty;
      if (filterOrigin !== 'ALL') params.origin = filterOrigin;

      const list = await api.getAssignments(params);
      setAssignments(list);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [search, filterStatus, filterDifficulty, filterOrigin]);

  // Group assignments by date status
  const todayAssignments = assignments.filter(a => a.status === 'AVAILABLE' || a.status === 'IN_PROGRESS');
  const completedAssignments = assignments.filter(a => a.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-brand)]">
            EXECUTION ENGINE
          </span>
          <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)]">
            Assignments
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Turn intention into action. Every completed action produces server-verified progression.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenCreate}
            className="flex items-center space-x-1.5 rounded-lg border border-[var(--color-brand)] bg-[var(--color-brand)] px-4 py-2 text-xs font-bold text-[#06080A] hover:bg-[var(--color-brand-highlight)] transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create Assignment</span>
          </button>
        </div>
      </div>

      {/* Prominent Current Focus Card */}
      {currentFocus && (
        <div className="rounded-2xl border border-[var(--color-border-gold)] bg-[var(--color-surface)] p-6 shadow-lg">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-[var(--color-brand)] animate-ping" />
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--color-brand)]">
                CURRENT FOCUS · {currentFocus.origin === 'ADAPTIVE' ? 'ADAPTIVE SELECTION' : 'USER DIRECTED'}
              </span>
            </div>
            <span className="font-mono text-xs text-[var(--color-text-tertiary)]">
              {currentFocus.difficulty}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className="flex items-center space-x-2 font-mono text-[11px] text-[var(--color-text-tertiary)]">
                <span>{currentFocus.domain}</span>
                <span>·</span>
                <span>{currentFocus.subject}</span>
              </div>
              <h3 className="mt-1 font-display text-2xl font-bold text-[var(--color-text-primary)]">
                {currentFocus.title}
              </h3>
              <p className="mt-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {currentFocus.description}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <span className="flex items-center space-x-1 rounded bg-[var(--color-surface-elevated)] px-2.5 py-1 font-mono text-[11px] text-[var(--color-text-primary)]">
                  <Clock className="h-3 w-3 text-[var(--color-brand)]" />
                  <span>{currentFocus.estimatedDuration} MIN</span>
                </span>
                {currentFocus.capabilityImpacts && Object.entries(currentFocus.capabilityImpacts).map(([k, v]) => {
                  if (!v) return null;
                  return (
                    <span key={k} className="rounded bg-[var(--color-surface-elevated)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-brand)]">
                      {k.toUpperCase()} +{v}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-3 lg:col-span-4 lg:border-l lg:border-[var(--color-border)] lg:pl-6">
              <button
                onClick={() => startExecution(currentFocus)}
                className="flex items-center justify-center space-x-2 rounded-xl border border-[var(--color-brand)] bg-[var(--color-brand)] py-3 text-xs font-bold text-[#06080A] hover:bg-[var(--color-brand-highlight)] transition-colors shadow-md"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>BEGIN ASSIGNMENT</span>
              </button>

              {currentFocus.whySelected && (
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/80 p-3 text-[11px] text-[var(--color-text-secondary)]">
                  <span className="font-mono text-[10px] uppercase text-[var(--color-brand)] block mb-0.5">
                    WHY THIS ASSIGNMENT
                  </span>
                  {currentFocus.whySelected}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search assignments by title, keyword, subject, domain..."
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] pl-9 pr-4 py-1.5 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-brand)] focus:outline-none"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-xs text-[var(--color-text-secondary)] focus:border-[var(--color-brand)] focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="SKIPPED">Skipped</option>
          </select>

          <select
            value={filterDifficulty}
            onChange={e => setFilterDifficulty(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-xs text-[var(--color-text-secondary)] focus:border-[var(--color-brand)] focus:outline-none"
          >
            <option value="ALL">All Difficulties</option>
            <option value="ROUTINE">Routine</option>
            <option value="STANDARD">Standard</option>
            <option value="ADVANCED">Advanced</option>
            <option value="CHALLENGE">Challenge</option>
          </select>

          <select
            value={filterOrigin}
            onChange={e => setFilterOrigin(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-xs text-[var(--color-text-secondary)] focus:border-[var(--color-brand)] focus:outline-none"
          >
            <option value="ALL">All Origins</option>
            <option value="USER">User (Manual)</option>
            <option value="ADAPTIVE">Adaptive (AI)</option>
          </select>
        </div>
      </div>

      {/* Assignment Rows List */}
      <div className="space-y-4">
        <h3 className="font-mono text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
          ALL ASSIGNMENTS ({assignments.length})
        </h3>

        {assignments.length === 0 ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-12 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-[var(--color-text-tertiary)]" />
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">No assignments match your search or filter criteria.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {assignments.map(asg => {
              const isCompleted = asg.status === 'COMPLETED';
              const isInProgress = asg.status === 'IN_PROGRESS';
              return (
                <div
                  key={asg.id}
                  onClick={() => setSelectedDetail(asg)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all hover:border-[var(--color-border-gold)] ${
                    isCompleted
                      ? 'border-[var(--color-border-subtle)] bg-[var(--color-surface)]/50 opacity-80'
                      : isInProgress
                      ? 'border-[var(--color-brand)] bg-[var(--color-surface-elevated)] shadow-md'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                  }`}
                >
                  <div className="flex items-start space-x-3.5 pr-4">
                    <div className="mt-0.5">
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-[var(--color-status-success)]" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border border-[var(--color-border-gold)]" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 font-mono text-[10px] text-[var(--color-text-tertiary)] uppercase">
                        <span>{asg.domain}</span>
                        <span>·</span>
                        <span>{asg.subject}</span>
                        <span>·</span>
                        <span className="text-[var(--color-brand)]">{asg.origin}</span>
                      </div>
                      <h4 className={`text-sm font-semibold ${isCompleted ? 'text-[var(--color-text-secondary)] line-through' : 'text-[var(--color-text-primary)]'}`}>
                        {asg.title}
                      </h4>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-mono text-[var(--color-text-tertiary)]">
                        <span>{asg.estimatedDuration} MIN EST</span>
                        {asg.actualDuration && <span>· {asg.actualDuration} MIN ACTUAL</span>}
                        <span>· {asg.difficulty}</span>
                        {asg.keywords?.slice(0, 3).map(kw => (
                          <span key={kw} className="rounded bg-[var(--color-bg)] px-1.5 py-0.5 text-[var(--color-text-muted)]">
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {!isCompleted && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          startExecution(asg);
                        }}
                        className="flex items-center space-x-1 rounded-lg border border-[var(--color-brand)]/40 bg-[var(--color-brand)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--color-brand-highlight)] hover:bg-[var(--color-brand)] hover:text-[#06080A] transition-colors"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>{isInProgress ? 'Resume' : 'Begin'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assignment Detail Drawer */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm">
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <span className="font-mono text-xs uppercase text-[var(--color-brand)]">ASSIGNMENT DETAIL</span>
              <button onClick={() => setSelectedDetail(null)} className="rounded p-1 text-[var(--color-text-tertiary)] hover:text-white">
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <span className="font-mono text-[10px] uppercase text-[var(--color-text-tertiary)]">
                  {selectedDetail.domain} · {selectedDetail.subject}
                </span>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)]">{selectedDetail.title}</h3>
                <p className="mt-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {selectedDetail.description}
                </p>
              </div>

              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-xs">
                <span className="font-mono text-[10px] uppercase text-[var(--color-brand)] block mb-1">
                  CRITERIA FOR COMPLETION
                </span>
                <p className="text-[var(--color-text-secondary)]">{selectedDetail.completionCriteria}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="rounded border border-[var(--color-border)] p-2.5">
                  <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase block">DIFFICULTY</span>
                  <span className="font-bold text-[var(--color-text-primary)]">{selectedDetail.difficulty}</span>
                </div>
                <div className="rounded border border-[var(--color-border)] p-2.5">
                  <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase block">ESTIMATED EFFORT</span>
                  <span className="font-bold text-[var(--color-brand)]">{selectedDetail.estimatedDuration} MINUTES</span>
                </div>
              </div>

              {selectedDetail.status !== 'COMPLETED' && (
                <button
                  onClick={() => {
                    const toStart = selectedDetail;
                    setSelectedDetail(null);
                    startExecution(toStart);
                  }}
                  className="mt-6 flex w-full items-center justify-center space-x-2 rounded-xl border border-[var(--color-brand)] bg-[var(--color-brand)] py-3 text-xs font-bold text-[#06080A] hover:bg-[var(--color-brand-highlight)] shadow-lg"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>START EXECUTION SESSION</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
