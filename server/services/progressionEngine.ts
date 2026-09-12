// server/services/progressionEngine.ts
// Authoritative Progression Engine for Cadence
// Enforces 50% server execution gate, anti-reward-farming, XP formula, Credit rules,
// non-linear Level calculation, Rank recalculation, Idempotency, and Badge awarding.

import { store, AssignmentDoc, ExecutionSessionDoc, JournalEventDoc } from '../store/cadenceStore';
import { calculateLevelFromXP } from '../data/levelProgression';
import { CANONICAL_BADGES, BadgeDefinition } from '../data/badgeCatalog';

export interface CompletionResult {
  completed: boolean;
  rewardEligible: boolean;
  reasonCode?: string;
  serverElapsedSeconds: number;
  requiredSeconds: number;
  xpAwarded: number;
  creditsAwarded: number;
  levelState: {
    previousLevel: number;
    newLevel: number;
    totalXP: number;
    title: string;
    levelUp: boolean;
  };
  creditState: {
    previousCredits: number;
    newCredits: number;
    rankPosition: number;
  };
  capabilityGains: { dimension: string; amount: number; newValue: number }[];
  newlyUnlockedBadges: BadgeDefinition[];
  newlyUnlockedTags: string[];
}

export function completeAssignmentTransaction(
  assignmentId: string,
  userId: string
): CompletionResult {
  const assignment = store.assignments.get(assignmentId);
  if (!assignment) {
    throw new Error('Assignment not found');
  }
  if (assignment.userId !== userId) {
    throw new Error('Unauthorized assignment access');
  }

  // Idempotency: If already completed, do not re-award rewards!
  if (assignment.status === 'COMPLETED') {
    const prog = store.getProgression(userId);
    const cred = store.getCreditBalance(userId);
    const leaderboard = store.getLeaderboard();
    const rankPos = leaderboard.find(l => l.userId === userId)?.rank || 1;

    return {
      completed: true,
      rewardEligible: false,
      reasonCode: 'ALREADY_COMPLETED',
      serverElapsedSeconds: (assignment.actualDuration || 0) * 60,
      requiredSeconds: assignment.estimatedDuration * 30,
      xpAwarded: 0,
      creditsAwarded: 0,
      levelState: {
        previousLevel: prog.level,
        newLevel: prog.level,
        totalXP: prog.totalXP,
        title: prog.currentLevelTitle,
        levelUp: false,
      },
      creditState: {
        previousCredits: cred.totalCredits,
        newCredits: cred.totalCredits,
        rankPosition: rankPos,
      },
      capabilityGains: [],
      newlyUnlockedBadges: [],
      newlyUnlockedTags: [],
    };
  }

  // Retrieve or create ExecutionSession
  let session = store.executionSessions.get(assignmentId);
  const now = new Date();

  if (!session) {
    // If started without explicit start endpoint, set serverStartedAt to creation time or now
    const started = assignment.startedAt ? new Date(assignment.startedAt) : now;
    session = {
      id: `sess_${assignmentId}`,
      assignmentId,
      userId,
      serverStartedAt: started.toISOString(),
      pauseIntervals: [],
      serverElapsedSeconds: 0,
      rewardEligible: false,
    };
    store.executionSessions.set(assignmentId, session);
  }

  session.serverCompletedAt = now.toISOString();

  // Calculate total pause seconds
  let pausedSeconds = 0;
  for (const interval of session.pauseIntervals) {
    const pStart = new Date(interval.pausedAt).getTime();
    const pEnd = interval.resumedAt ? new Date(interval.resumedAt).getTime() : now.getTime();
    pausedSeconds += Math.max(0, (pEnd - pStart) / 1000);
  }

  const startMs = new Date(session.serverStartedAt).getTime();
  const rawElapsedSeconds = Math.max(0, (now.getTime() - startMs) / 1000);
  const serverElapsedSeconds = Math.max(0, Math.floor(rawElapsedSeconds - pausedSeconds));
  session.serverElapsedSeconds = serverElapsedSeconds;

  // -------------------------------------------------------------
  // 50% SERVER EXECUTION GATE
  // Minimum required: estimatedDuration (minutes) * 30 seconds
  // -------------------------------------------------------------
  const requiredSeconds = assignment.estimatedDuration * 30;
  const isRewardEligible = serverElapsedSeconds >= requiredSeconds;
  session.rewardEligible = isRewardEligible;

  let xpAwarded = 0;
  let creditsAwarded = 0;
  let reasonCode: string | undefined;

  if (!isRewardEligible) {
    xpAwarded = 0;
    creditsAwarded = 0;
    reasonCode = 'MINIMUM_EXECUTION_TIME_NOT_REACHED';
  } else {
    // -----------------------------------------------------------
    // CANONICAL XP FORMULA: clamp(estimated_minutes * 5, 10, 500)
    // -----------------------------------------------------------
    xpAwarded = Math.min(500, Math.max(10, Math.round(assignment.estimatedDuration * 5)));

    // -----------------------------------------------------------
    // CANONICAL CREDIT RULES:
    // Manual = ALWAYS 0 Credits.
    // AI/Adaptive = Credits ONLY if XP > 100.
    // Formula: CEILING(XP * 0.05). Max 25 credits.
    // -----------------------------------------------------------
    const isAiAdaptive = assignment.origin === 'ADAPTIVE' || assignment.origin === 'SYSTEM';
    if (!isAiAdaptive) {
      creditsAwarded = 0;
    } else {
      if (xpAwarded > 100) {
        creditsAwarded = Math.min(25, Math.ceil(xpAwarded * 0.05));
      } else {
        creditsAwarded = 0;
      }
    }
  }

  // Update assignment status
  const actualMinutes = Math.max(1, Math.round(serverElapsedSeconds / 60));
  assignment.status = 'COMPLETED';
  assignment.actualDuration = actualMinutes;
  assignment.completedAt = now.toISOString();
  assignment.updatedAt = now.toISOString();

  // Update Progression (XP -> Level)
  const currentProg = store.getProgression(userId);
  const prevLevel = currentProg.level;
  const prevTotalXP = currentProg.totalXP;
  const newTotalXP = prevTotalXP + xpAwarded;
  const newLevelInfo = calculateLevelFromXP(newTotalXP);

  currentProg.totalXP = newTotalXP;
  currentProg.level = newLevelInfo.level;
  currentProg.currentLevelTitle = newLevelInfo.title;
  currentProg.updatedAt = now.toISOString();

  const levelUp = newLevelInfo.level > prevLevel;

  // Update Credits & Rank
  const currentCred = store.getCreditBalance(userId);
  const prevCredits = currentCred.totalCredits;
  const newCredits = prevCredits + creditsAwarded;
  currentCred.totalCredits = newCredits;
  currentCred.updatedAt = now.toISOString();

  // Update Capabilities
  const capabilityGains: { dimension: string; amount: number; newValue: number }[] = [];
  if (isRewardEligible && assignment.capabilityImpacts) {
    for (const [dim, amount] of Object.entries(assignment.capabilityImpacts)) {
      if (amount && amount > 0) {
        const key = `${userId}_${dim}`;
        let cap = store.capabilities.get(key);
        const prevVal = cap ? cap.value : 50;
        const newVal = prevVal + amount;
        if (!cap) {
          cap = {
            id: `cap_${key}`,
            userId,
            dimension: dim as any,
            value: newVal,
            trajectory: 'GROWING',
            updatedAt: now.toISOString(),
          };
          store.capabilities.set(key, cap);
        } else {
          cap.value = newVal;
          cap.trajectory = 'GROWING';
          cap.updatedAt = now.toISOString();
        }

        store.capabilityEvents.push({
          id: `capevt_${Date.now()}_${dim}`,
          userId,
          dimension: dim as any,
          assignmentId,
          amount,
          previousValue: prevVal,
          newValue: newVal,
          reason: `Completed: ${assignment.title}`,
          createdAt: now.toISOString(),
        });

        capabilityGains.push({ dimension: dim, amount, newValue: newVal });
      }
    }
  }

  // -------------------------------------------------------------
  // BADGE ENGINE EVALUATION (Idempotent UNIQUE(userId, badgeId))
  // -------------------------------------------------------------
  const newlyUnlockedBadges: BadgeDefinition[] = [];

  for (const badge of CANONICAL_BADGES) {
    const ubKey = `${userId}_${badge.id}`;
    if (store.userBadges.has(ubKey)) continue; // already earned

    let earned = false;
    if (badge.triggerType === 'LEVEL_REACHED' && newLevelInfo.level >= badge.triggerValue) {
      earned = true;
    } else if (badge.triggerType === 'TOTAL_XP' && newTotalXP >= badge.triggerValue) {
      earned = true;
    } else if (badge.triggerType === 'TOTAL_CREDITS' && newCredits >= badge.triggerValue) {
      earned = true;
    }

    if (earned) {
      store.userBadges.set(ubKey, {
        id: `ub_${Date.now()}_${badge.id}`,
        userId,
        badgeId: badge.id,
        earnedAt: now.toISOString(),
        sourceEventId: assignmentId,
      });
      newlyUnlockedBadges.push(badge);

      // Record Journal Milestone
      store.journalEvents.push({
        id: `j_badge_${Date.now()}_${badge.id}`,
        userId,
        eventType: 'ACHIEVEMENT',
        eventSubtype: 'BADGE_UNLOCKED',
        title: `Achievement Unlocked: ${badge.name}`,
        description: badge.description,
        importance: 'MILESTONE',
        occurredAt: now.toISOString(),
        createdAt: now.toISOString(),
      });
    }
  }

  // -------------------------------------------------------------
  // PROFILE TAGS EVALUATION (Evidence-based)
  // -------------------------------------------------------------
  const newlyUnlockedTags: string[] = [];
  if (isRewardEligible) {
    if (assignment.difficulty === 'ADVANCED' || assignment.difficulty === 'CHALLENGE') {
      const tagKey = `${userId}_tag_challenge_ready`;
      if (!store.userProfileTags.has(tagKey)) {
        store.userProfileTags.set(tagKey, {
          id: `upt_ch_${Date.now()}`,
          userId,
          tagId: 'tag_challenge_ready',
          name: 'CHALLENGE READY',
          earnedAt: now.toISOString(),
          confidence: 0.94,
          evidence: `Verified completion of ${assignment.difficulty} assignment: "${assignment.title}".`,
        });
        newlyUnlockedTags.push('CHALLENGE READY');
      }
    }
  }

  // -------------------------------------------------------------
  // OBJECTIVE & MILESTONE ADVANCEMENT
  // -------------------------------------------------------------
  if (assignment.objectiveId) {
    const obj = store.objectives.get(assignment.objectiveId);
    if (obj) {
      obj.progress = Math.min(100, obj.progress + 2);
      obj.updatedAt = now.toISOString();
    }
  }

  // -------------------------------------------------------------
  // CHRONOLOGICAL JOURNAL EVENTS (Immutable)
  // -------------------------------------------------------------
  store.journalEvents.push({
    id: `j_asg_${Date.now()}`,
    userId,
    eventType: 'ASSIGNMENT',
    eventSubtype: 'COMPLETED',
    title: assignment.title,
    description: isRewardEligible
      ? `${assignment.estimatedDuration} MIN ESTIMATED · ${actualMinutes} MIN ACTUAL. +${xpAwarded} XP · +${creditsAwarded} CREDITS.`
      : `${assignment.estimatedDuration} MIN ESTIMATED · ${actualMinutes} MIN ACTUAL. Completed before 50% minimum threshold (0 XP / 0 Credits).`,
    assignmentId,
    objectiveId: assignment.objectiveId,
    importance: isRewardEligible ? (assignment.difficulty === 'ADVANCED' || assignment.difficulty === 'CHALLENGE' ? 'IMPORTANT' : 'NORMAL') : 'LOW',
    xpDelta: xpAwarded,
    creditDelta: creditsAwarded,
    occurredAt: now.toISOString(),
    createdAt: now.toISOString(),
  });

  if (levelUp) {
    store.journalEvents.push({
      id: `j_lvl_${Date.now()}`,
      userId,
      eventType: 'PROGRESSION',
      eventSubtype: 'LEVEL_ADVANCEMENT',
      title: `Level Advancement: Level ${newLevelInfo.level} — ${newLevelInfo.title}`,
      description: `Crossed ${newLevelInfo.currentLevelXP} XP milestone. A new stage of your journey is unlocked.`,
      importance: 'MILESTONE',
      metadata: { previousLevel: prevLevel, newLevel: newLevelInfo.level },
      occurredAt: now.toISOString(),
      createdAt: now.toISOString(),
    });
  }

  const leaderboard = store.getLeaderboard();
  const rankPos = leaderboard.find(l => l.userId === userId)?.rank || 1;

  return {
    completed: true,
    rewardEligible: isRewardEligible,
    reasonCode,
    serverElapsedSeconds,
    requiredSeconds,
    xpAwarded,
    creditsAwarded,
    levelState: {
      previousLevel: prevLevel,
      newLevel: newLevelInfo.level,
      totalXP: newTotalXP,
      title: newLevelInfo.title,
      levelUp,
    },
    creditState: {
      previousCredits: prevCredits,
      newCredits,
      rankPosition: rankPos,
    },
    capabilityGains,
    newlyUnlockedBadges,
    newlyUnlockedTags,
  };
}
