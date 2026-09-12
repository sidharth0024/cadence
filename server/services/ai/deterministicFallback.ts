// server/services/ai/deterministicFallback.ts
// Deterministic Cadence Fallback Recommendation Engine
// Operates domain-agnostically when all external AI providers are unavailable or fail validation

import { CANDIDATE_ASSIGNMENT_POOL, CandidateAssignment } from '../../data/assignmentPool';
import { CadenceAIContext } from './aiContextBuilder';
import { store } from '../../store/cadenceStore';

export interface SelectionResult {
  selectedAssignment: CandidateAssignment;
  reasonCodes: string[];
  explanation: string;
  confidence: number;
  engine: 'DETERMINISTIC_CADENCE_FALLBACK' | 'AI_MODEL';
}

export function rankAndSelectCandidate(
  context: CadenceAIContext,
  userId: string
): SelectionResult {
  // 1. Gather user existing assignments to filter out already active or duplicate items
  const userAssignments = store.getAssignments(userId);
  const activeTitles = new Set(
    userAssignments
      .filter(a => a.status === 'AVAILABLE' || a.status === 'IN_PROGRESS')
      .map(a => a.title.toLowerCase())
  );

  // 2. Score candidate assignments domain-agnostically
  let bestCandidate: CandidateAssignment = CANDIDATE_ASSIGNMENT_POOL[0];
  let highestScore = -Infinity;
  let bestReasonCodes: string[] = [];

  for (const candidate of CANDIDATE_ASSIGNMENT_POOL) {
    // Exclude if already in progress or available
    if (activeTitles.has(candidate.title.toLowerCase())) {
      continue;
    }

    let score = 0;
    const reasons: string[] = [];

    // Factor 1: Objective Need (30%)
    // Match keywords or domain/subject with current objective
    let objectiveFit = 0.5;
    if (context.objective) {
      const objText = `${context.objective.title} ${context.objective.phase}`.toLowerCase();
      const matchKW = candidate.keywords.some(k => objText.includes(k.toLowerCase()));
      const matchSub = objText.includes(candidate.subject.toLowerCase()) || objText.includes(candidate.domain.toLowerCase());
      if (matchKW || matchSub) {
        objectiveFit = 0.95;
        reasons.push('objective_relevance');
      }
    }
    score += objectiveFit * 0.30;

    // Factor 2: Success Probability & Optimal Duration Window (25%)
    // 20–45 min is known optimal execution window from behavioral context
    let durationFit = 0.6;
    if (candidate.estimatedDuration >= 20 && candidate.estimatedDuration <= 45) {
      durationFit = 0.95;
      reasons.push('duration_fit');
    } else if (candidate.estimatedDuration < 20) {
      durationFit = 0.8;
    } else {
      durationFit = 0.45; // High friction for 60+ min
    }
    score += durationFit * 0.25;

    // Factor 3: Priority Fit (20%)
    const priorityWeight = context.objective?.priority === 'CRITICAL' ? 1.0 : context.objective?.priority === 'HIGH' ? 0.85 : 0.6;
    score += priorityWeight * 0.20;

    // Factor 4: Momentum Fit (15%)
    let momentumFit = 0.75;
    if (context.behavior.momentum.includes('HIGH') && (candidate.difficulty === 'ADVANCED' || candidate.difficulty === 'STANDARD')) {
      momentumFit = 0.95;
      reasons.push('momentum_fit');
    }
    score += momentumFit * 0.15;

    // Factor 5: Difficulty Fit (10%)
    let diffFit = 0.7;
    if (candidate.difficulty === 'STANDARD' || candidate.difficulty === 'ADVANCED') {
      diffFit = 0.9;
      reasons.push('challenge_fit');
    }
    score += diffFit * 0.10;

    if (score > highestScore) {
      highestScore = score;
      bestCandidate = candidate;
      bestReasonCodes = reasons.length > 0 ? reasons : ['optimal_cadence_fit'];
    }
  }

  return {
    selectedAssignment: bestCandidate,
    reasonCodes: bestReasonCodes,
    explanation: `Selected ${bestCandidate.difficulty} focus in ${bestCandidate.subject} (${bestCandidate.estimatedDuration} min) to maximize objective progress within your observed 20–45 min high-completion execution window.`,
    confidence: Math.min(0.96, Math.max(0.75, highestScore)),
    engine: 'DETERMINISTIC_CADENCE_FALLBACK',
  };
}
