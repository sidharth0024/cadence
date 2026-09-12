// src/components/assignments/CreateAssignmentModal.tsx
// Focused manual assignment creation wizard
// Manual assignments award XP towards Level; Credits are always 0 per canonical progression rules.

import React, { useState } from 'react';
import { api } from '../../services/api';
import { useCadence } from '../../context/CadenceContext';
import { X, Plus, AlertCircle, ArrowRight } from 'lucide-react';

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export const CreateAssignmentModal: React.FC<Props> = ({ onClose, onCreated }) => {
  const { primaryObjective } = useCadence();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('Engineering');
  const [subject, setSubject] = useState('');
  const [topicsInput, setTopicsInput] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');
  const [difficulty, setDifficulty] = useState<'ROUTINE' | 'STANDARD' | 'ADVANCED' | 'CHALLENGE'>('STANDARD');
  const [estimatedDuration, setEstimatedDuration] = useState(30);
  const [completionCriteria, setCompletionCriteria] = useState('');
  const [capabilities, setCapabilities] = useState({
    intellect: 2,
    discipline: 2,
    focus: 0,
    creativity: 0,
    resilience: 0,
    strength: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const topics = topicsInput.split(',').map(s => s.trim()).filter(Boolean);
      const keywords = keywordsInput.split(',').map(s => s.trim()).filter(Boolean);

      await api.createAssignment({
        title: title.trim(),
        description: description.trim(),
        domain: domain.trim() || 'General Discipline',
        subject: subject.trim() || 'Core Focus',
        topics: topics.length > 0 ? topics : [subject.trim() || 'Practice'],
        keywords: keywords.length > 0 ? keywords : [title.split(' ')[0]],
        difficulty,
        estimatedDuration: Number(estimatedDuration) || 30,
        completionCriteria: completionCriteria.trim() || 'Complete intended session criteria with full fidelity.',
        capabilityImpacts: capabilities,
        objectiveId: primaryObjective?.id,
      });

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create assignment');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div className="flex items-center space-x-2">
            <Plus className="h-4 w-4 text-[var(--color-brand)]" />
            <span className="font-mono text-xs tracking-widest text-[var(--color-brand)] uppercase">
              CREATE MANUAL ASSIGNMENT
            </span>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[var(--color-text-tertiary)] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          {/* Progression Rule Reminder */}
          <div className="flex items-start space-x-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3 text-xs text-[var(--color-text-secondary)]">
            <AlertCircle className="h-4 w-4 text-[var(--color-brand)] shrink-0 mt-0.5" />
            <span>
              Manual assignments award XP towards Level progression (<span className="font-mono text-[var(--color-brand)]">Time × 5</span>). Credits and Rank progression are earned exclusively through qualifying AI-assigned challenges.
            </span>
          </div>

          {error && (
            <div className="rounded-md bg-red-950/40 p-3 text-xs text-red-300 border border-red-800">
              {error}
            </div>
          )}

          {/* Action Title */}
          <div>
            <label className="block font-mono text-[10px] uppercase text-[var(--color-text-tertiary)] mb-1">
              ASSIGNMENT TITLE *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Execute interval tempo scale practice / Refactor database indices"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-brand)] focus:outline-none"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-mono text-[10px] uppercase text-[var(--color-text-tertiary)] mb-1">
              DESCRIPTION
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Outline specific objectives, constraints, and instructions..."
              rows={2}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-brand)] focus:outline-none"
            />
          </div>

          {/* Domain & Subject */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] uppercase text-[var(--color-text-tertiary)] mb-1">
                DOMAIN
              </label>
              <input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="e.g. Engineering, Music, Athletics"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[var(--color-text-tertiary)] mb-1">
                SUBJECT
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Backend, Scales, Cardio"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:outline-none"
              />
            </div>
          </div>

          {/* Topics & Keywords */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] uppercase text-[var(--color-text-tertiary)] mb-1">
                TOPICS (COMMA-SEPARATED)
              </label>
              <input
                type="text"
                value={topicsInput}
                onChange={e => setTopicsInput(e.target.value)}
                placeholder="Security, Middleware"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[var(--color-text-tertiary)] mb-1">
                KEYWORDS (COMMA-SEPARATED)
              </label>
              <input
                type="text"
                value={keywordsInput}
                onChange={e => setKeywordsInput(e.target.value)}
                placeholder="JWT, Auth, Routes"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:outline-none"
              />
            </div>
          </div>

          {/* Difficulty & Estimated Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] uppercase text-[var(--color-text-tertiary)] mb-1">
                DIFFICULTY
              </label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as any)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:outline-none"
              >
                <option value="ROUTINE">Routine</option>
                <option value="STANDARD">Standard</option>
                <option value="ADVANCED">Advanced</option>
                <option value="CHALLENGE">Challenge</option>
              </select>
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase text-[var(--color-text-tertiary)] mb-1">
                ESTIMATED DURATION (MINUTES)
              </label>
              <input
                type="number"
                min={5}
                max={180}
                value={estimatedDuration}
                onChange={e => setEstimatedDuration(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:outline-none"
              />
            </div>
          </div>

          {/* Completion Criteria */}
          <div>
            <label className="block font-mono text-[10px] uppercase text-[var(--color-text-tertiary)] mb-1">
              COMPLETION CRITERIA
            </label>
            <input
              type="text"
              value={completionCriteria}
              onChange={e => setCompletionCriteria(e.target.value)}
              placeholder="What observable condition proves this action succeeded?"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-brand)] focus:outline-none"
            />
          </div>

          {/* Capability Impacts */}
          <div>
            <label className="block font-mono text-[10px] uppercase text-[var(--color-text-tertiary)] mb-1.5">
              CAPABILITY DEVELOPMENT POINTS
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['intellect', 'discipline', 'focus', 'creativity', 'resilience', 'strength'] as const).map(dim => (
                <div key={dim} className="flex items-center justify-between rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-[11px]">
                  <span className="capitalize text-[var(--color-text-secondary)]">{dim}</span>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={capabilities[dim]}
                    onChange={e => setCapabilities({ ...capabilities, [dim]: Number(e.target.value) || 0 })}
                    className="w-10 bg-transparent text-right font-mono font-bold text-[var(--color-brand)] focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-3 border-t border-[var(--color-border)] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-2 rounded-lg border border-[var(--color-brand)] bg-[var(--color-brand)] px-5 py-2 text-xs font-bold text-[#06080A] hover:bg-[var(--color-brand-highlight)] disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Creating...' : 'Create Assignment'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
