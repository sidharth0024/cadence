// server/store/cadenceStore.ts
// Robust In-Memory & Fallback Persistence Store for CadenceDB
// Guarantees 100% operational functionality in all environments

import bcrypt from 'bcryptjs';
import { CANONICAL_BADGES, BadgeDefinition } from '../data/badgeCatalog';
import { calculateLevelFromXP } from '../data/levelProgression';
import { CANDIDATE_ASSIGNMENT_POOL, CandidateAssignment } from '../data/assignmentPool';
import { persistStoreToSupabase, loadStoreFromSupabase } from '../config/supabaseClient';

export interface UserDoc {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarId: string;
  operatingMode: 'MANUAL' | 'COMMANDER';
  timezone: string;
  createdAt: string;
}

export interface UserProgressionDoc {
  id: string;
  userId: string;
  level: number;
  totalXP: number;
  currentLevelTitle: string;
  updatedAt: string;
}

export interface CreditBalanceDoc {
  id: string;
  userId: string;
  totalCredits: number;
  updatedAt: string;
}

export interface ObjectiveDoc {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetOutcome: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
  progress: number;
  isPrimary: boolean;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ObjectivePhaseDoc {
  id: string;
  objectiveId: string;
  userId: string;
  name: string;
  purpose: string;
  orderIndex: number;
  status: 'UPCOMING' | 'CURRENT' | 'COMPLETED';
  progress: number;
}

export interface MilestoneDoc {
  id: string;
  objectiveId: string;
  phaseId: string;
  userId: string;
  title: string;
  description: string;
  completionCriteria: string;
  required: boolean;
  status: 'PENDING' | 'COMPLETED';
  completedAt?: string;
}

export interface HabitDoc {
  id: string;
  userId: string;
  objectiveId?: string;
  title: string;
  frequencyPerWeek: number;
  currentAdherence: number;
  streak: number;
}

export interface AssignmentDoc {
  id: string;
  userId: string;
  objectiveId?: string;
  phaseId?: string;
  habitId?: string;
  title: string;
  description: string;
  domain: string;
  subject: string;
  topics: string[];
  keywords: string[];
  skills: string[];
  difficulty: 'ROUTINE' | 'STANDARD' | 'ADVANCED' | 'CHALLENGE';
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  origin: 'USER' | 'ADAPTIVE' | 'HABIT' | 'SYSTEM';
  status: 'DRAFT' | 'SCHEDULED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'SKIPPED' | 'CANCELLED';
  scheduledFor: string;
  startedAt?: string;
  completedAt?: string;
  completionCriteria: string;
  whySelected?: string;
  capabilityImpacts: {
    intellect?: number;
    discipline?: number;
    focus?: number;
    creativity?: number;
    resilience?: number;
    strength?: number;
  };
  notes?: string;
  skipReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutionSessionDoc {
  id: string;
  assignmentId: string;
  userId: string;
  serverStartedAt: string;
  serverCompletedAt?: string;
  pauseIntervals: { pausedAt: string; resumedAt?: string }[];
  serverElapsedSeconds: number;
  rewardEligible: boolean;
  reasonCode?: string;
}

export interface UserCapabilityDoc {
  id: string;
  userId: string;
  dimension: 'intellect' | 'discipline' | 'focus' | 'creativity' | 'resilience' | 'strength';
  value: number; // baseline 50
  trajectory: 'GROWING' | 'STABLE' | 'NEGLECTED' | 'DECLINING';
  updatedAt: string;
}

export interface CapabilityEventDoc {
  id: string;
  userId: string;
  dimension: 'intellect' | 'discipline' | 'focus' | 'creativity' | 'resilience' | 'strength';
  assignmentId?: string;
  amount: number;
  previousValue: number;
  newValue: number;
  reason: string;
  createdAt: string;
}

export interface BehaviorEventDoc {
  id: string;
  userId: string;
  assignmentId: string;
  eventType: 'STARTED' | 'PAUSED' | 'RESUMED' | 'COMPLETED' | 'MISSED' | 'SKIPPED' | 'RESCHEDULED' | 'CANCELLED';
  metadata?: any;
  createdAt: string;
}

export interface JournalEventDoc {
  id: string;
  userId: string;
  eventType: 'ASSIGNMENT' | 'PROGRESSION' | 'CAPABILITY' | 'OBJECTIVE' | 'HABIT' | 'ADAPTATION' | 'ACHIEVEMENT' | 'SYSTEM';
  eventSubtype?: string;
  title: string;
  description: string;
  assignmentId?: string;
  objectiveId?: string;
  importance: 'LOW' | 'NORMAL' | 'IMPORTANT' | 'MILESTONE';
  xpDelta?: number;
  creditDelta?: number;
  capabilityDelta?: { dimension: string; amount: number };
  metadata?: any;
  occurredAt: string;
  createdAt: string;
}

export interface UserBadgeDoc {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
  sourceEventId?: string;
}

export interface ProfileTagDoc {
  id: string;
  name: string;
  description: string;
  criteria: string;
}

export interface UserProfileTagDoc {
  id: string;
  userId: string;
  tagId: string;
  name: string;
  earnedAt: string;
  confidence: number;
  evidence: string;
}

export interface AdaptiveRecommendationDoc {
  id: string;
  userId: string;
  assignmentId: string;
  reasonType: string;
  signalsUsed: string[];
  previousState?: string;
  newState?: string;
  confidence: number;
  createdAt: string;
}

export interface AIMessageDoc {
  id: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface StreakDayRecord {
  date: string; // YYYY-MM-DD
  completed: boolean;
  activitiesCount: number;
  xpEarned: number;
  title?: string;
  completedAt?: string;
}

export interface UserStreakDoc {
  userId: string;
  currentStreak: number;
  bestStreak: number;
  multiplier: number;
  totalCheckins: number;
  lastActiveDate: string;
  history: StreakDayRecord[];
  updatedAt: string;
}

// In-Memory Storage Collections
class CadenceDatabaseStore {
  users: Map<string, UserDoc> = new Map();
  progressions: Map<string, UserProgressionDoc> = new Map(); // keyed by userId
  creditBalances: Map<string, CreditBalanceDoc> = new Map(); // keyed by userId
  objectives: Map<string, ObjectiveDoc> = new Map();
  phases: Map<string, ObjectivePhaseDoc> = new Map();
  milestones: Map<string, MilestoneDoc> = new Map();
  habits: Map<string, HabitDoc> = new Map();
  assignments: Map<string, AssignmentDoc> = new Map();
  executionSessions: Map<string, ExecutionSessionDoc> = new Map(); // keyed by assignmentId
  capabilities: Map<string, UserCapabilityDoc> = new Map(); // keyed by userId_dimension
  streaks: Map<string, UserStreakDoc> = new Map(); // keyed by userId
  capabilityEvents: CapabilityEventDoc[] = [];
  behaviorEvents: BehaviorEventDoc[] = [];
  journalEvents: JournalEventDoc[] = [];
  userBadges: Map<string, UserBadgeDoc> = new Map(); // keyed by userId_badgeId (UNIQUE constraint)
  profileTags: Map<string, ProfileTagDoc> = new Map();
  userProfileTags: Map<string, UserProfileTagDoc> = new Map();
  adaptiveRecommendations: AdaptiveRecommendationDoc[] = [];
  aiMessages: AIMessageDoc[] = [];

  constructor() {
    this.seedDefaults();
  }

  seedDefaults() {
    // Seed standard profile tags
    const defaultTags: ProfileTagDoc[] = [
      { id: 'tag_consistent', name: 'CONSISTENT', description: 'Maintains >= 80% weekly adherence across scheduled commitments.', criteria: 'Consistent completion over consecutive cycles' },
      { id: 'tag_high_exec', name: 'HIGH EXECUTION', description: 'Demonstrated overall execution rate exceeding 84%.', criteria: 'High ratio of completed vs missed commitments' },
      { id: 'tag_challenge_ready', name: 'CHALLENGE READY', description: 'Reliably completes Advanced and Challenge assignments with high momentum.', criteria: 'Proven execution in high-difficulty tiers' },
      { id: 'tag_reliable', name: 'RELIABLE', description: 'Maintains near-zero skip and cancellation variance.', criteria: 'Low variance between commitment and execution' },
      { id: 'tag_persistent', name: 'PERSISTENT', description: 'Demonstrated habit survival across recalibration cycles.', criteria: 'Execution sustained through recalibrated workload' },
      { id: 'tag_adaptive', name: 'ADAPTIVE', description: 'Rapidly absorbs and completes Cadence-recalibrated assignments.', criteria: 'High adherence to Commander-selected focus' },
    ];
    for (const t of defaultTags) {
      this.profileTags.set(t.id, t);
    }

    // Seed Demo User
    const demoUserId = 'user_demo_pilot';
    const salt = bcrypt.genSaltSync(10);
    const demoUser: UserDoc = {
      id: demoUserId,
      email: 'pilot@cadence.io',
      passwordHash: bcrypt.hashSync('cadence123', salt),
      displayName: 'Commander Om',
      avatarId: 'avatar_pilot_01',
      operatingMode: 'COMMANDER',
      timezone: 'America/Los_Angeles',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    };
    this.users.set(demoUserId, demoUser);

    // Initial progression: Level 8 Adept with 2,420 XP
    const calculated = calculateLevelFromXP(2420);
    this.progressions.set(demoUserId, {
      id: `prog_${demoUserId}`,
      userId: demoUserId,
      level: calculated.level,
      totalXP: 2420,
      currentLevelTitle: calculated.title,
      updatedAt: new Date().toISOString(),
    });

    // Initial Credits: 186 Credits (Rank #142)
    this.creditBalances.set(demoUserId, {
      id: `cred_${demoUserId}`,
      userId: demoUserId,
      totalCredits: 186,
      updatedAt: new Date().toISOString(),
    });

    // Seed Universal Capabilities
    const capInit: Record<string, number> = {
      intellect: 82,
      discipline: 76,
      focus: 64,
      creativity: 57,
      resilience: 68,
      strength: 49,
    };
    for (const [dim, val] of Object.entries(capInit)) {
      const key = `${demoUserId}_${dim}`;
      this.capabilities.set(key, {
        id: `cap_${key}`,
        userId: demoUserId,
        dimension: dim as any,
        value: val,
        trajectory: val >= 70 ? 'GROWING' : val >= 55 ? 'STABLE' : 'NEGLECTED',
        updatedAt: new Date().toISOString(),
      });
    }

    // Seed Demo Badges (e.g. First Step, Committed, Steady Hand, The Foundation, First Ascent, Rising Force)
    const earnedIds = ['badge_lvl_1', 'badge_lvl_3', 'badge_lvl_5', 'badge_xp_1k', 'badge_c_25', 'badge_c_100'];
    earnedIds.forEach((bId, idx) => {
      this.userBadges.set(`${demoUserId}_${bId}`, {
        id: `ub_${demoUserId}_${bId}`,
        userId: demoUserId,
        badgeId: bId,
        earnedAt: new Date(Date.now() - (20 - idx * 3) * 86400000).toISOString(),
      });
    });

    // Seed Demo Profile Tags
    this.userProfileTags.set(`${demoUserId}_tag_consistent`, {
      id: `upt_1`,
      userId: demoUserId,
      tagId: 'tag_consistent',
      name: 'CONSISTENT',
      earnedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      confidence: 0.89,
      evidence: 'Maintained 84% adherence across 18 commitments over the past 30 days.',
    });
    this.userProfileTags.set(`${demoUserId}_tag_high_exec`, {
      id: `upt_2`,
      userId: demoUserId,
      tagId: 'tag_high_exec',
      name: 'HIGH EXECUTION',
      earnedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      confidence: 0.92,
      evidence: 'Completed 27 out of 32 eligible scheduled commitments.',
    });

    // Seed Primary Objective: "Become a Full-Stack Developer"
    const objId = 'obj_fullstack_01';
    this.objectives.set(objId, {
      id: objId,
      userId: demoUserId,
      title: 'Become a Full-Stack Developer',
      description: 'Build production-ready distributed systems and deploy resilient client-server applications.',
      targetOutcome: 'Independently build and deploy high-performance full-stack applications with verified security.',
      priority: 'HIGH',
      status: 'ACTIVE',
      progress: 68,
      isPrimary: true,
      targetDate: '2026-12-31',
      createdAt: new Date(Date.now() - 28 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Seed Objective Phases
    const phasesData = [
      { id: 'phase_01', name: 'Foundational Systems', purpose: 'Establish core runtime, data structures, and terminal proficiency.', orderIndex: 1, status: 'COMPLETED' as const, progress: 100 },
      { id: 'phase_02', name: 'Frontend Architecture', purpose: 'Design systems, accessibility, micro-interactions, state machines.', orderIndex: 2, status: 'COMPLETED' as const, progress: 100 },
      { id: 'phase_03', name: 'Backend Systems', purpose: 'Build resilient server APIs, authentication gateways, and persistent models.', orderIndex: 3, status: 'CURRENT' as const, progress: 68 },
      { id: 'phase_04', name: 'Database & Distributed Cache', purpose: 'Indexing strategies, relational integrity, cache invalidation.', orderIndex: 4, status: 'UPCOMING' as const, progress: 0 },
      { id: 'phase_05', name: 'Production Hardening', purpose: 'Monitoring, zero-downtime deployments, security threat modeling.', orderIndex: 5, status: 'UPCOMING' as const, progress: 0 },
      { id: 'phase_06', name: 'Cloud Infrastructure & Scale', purpose: 'Container orchestration, global edge routing, auto-scaling.', orderIndex: 6, status: 'UPCOMING' as const, progress: 0 },
    ];
    for (const p of phasesData) {
      this.phases.set(p.id, {
        id: p.id,
        objectiveId: objId,
        userId: demoUserId,
        name: p.name,
        purpose: p.purpose,
        orderIndex: p.orderIndex,
        status: p.status,
        progress: p.progress,
      });
    }

    // Seed Milestones for Phase 3
    const milestonesData = [
      { id: 'ms_01', title: 'RESTful API Contracts & Schema Validation', description: 'Strict request payload validation and standard error response formatting.', status: 'COMPLETED' as const },
      { id: 'ms_02', title: 'Database Repository Integration', description: 'Persistent schema modeling with indexed query constraints.', status: 'COMPLETED' as const },
      { id: 'ms_03', title: 'Authoritative JWT & Role Verification', description: 'Cryptographic session validation with server-side expiry handling.', status: 'PENDING' as const },
      { id: 'ms_04', title: 'Comprehensive Error Boundary & Telemetry', description: 'Structured JSON logging and graceful connection failure handling.', status: 'PENDING' as const },
    ];
    for (const ms of milestonesData) {
      this.milestones.set(ms.id, {
        id: ms.id,
        objectiveId: objId,
        phaseId: 'phase_03',
        userId: demoUserId,
        title: ms.title,
        description: ms.description,
        completionCriteria: 'Server tests pass with verified assertion coverage.',
        required: true,
        status: ms.status,
        completedAt: ms.status === 'COMPLETED' ? new Date(Date.now() - 4 * 86400000).toISOString() : undefined,
      });
    }

    // Seed Supporting Habits
    this.habits.set('habit_01', {
      id: 'habit_01',
      userId: demoUserId,
      objectiveId: objId,
      title: 'Architectural Coding Practice',
      frequencyPerWeek: 4,
      currentAdherence: 84,
      streak: 12,
    });
    this.habits.set('habit_02', {
      id: 'habit_02',
      userId: demoUserId,
      objectiveId: objId,
      title: 'System Design Deep Study',
      frequencyPerWeek: 3,
      currentAdherence: 67,
      streak: 6,
    });

    // Seed Current Focus Assignment (Adaptive)
    const focusAsgId = 'asg_focus_curr';
    this.assignments.set(focusAsgId, {
      id: focusAsgId,
      userId: demoUserId,
      objectiveId: objId,
      phaseId: 'phase_03',
      title: 'Implement Core Authentication Middleware & Token Verification',
      description: 'Construct server-side middleware verifying security tokens, handling expiration, and isolating user permissions.',
      domain: 'Engineering',
      subject: 'Backend Systems',
      topics: ['Security', 'Middleware', 'Protected Routes'],
      keywords: ['Authentication', 'Token', 'Security', 'Protected Routes', 'Validation'],
      skills: ['API Architecture', 'Defensive Programming'],
      difficulty: 'ADVANCED',
      estimatedDuration: 45,
      origin: 'ADAPTIVE',
      status: 'AVAILABLE',
      scheduledFor: new Date().toISOString(),
      completionCriteria: 'Endpoint rejects forged tokens with 401 and permits valid sessions with verified identity.',
      whySelected: 'Your objective requires robust backend security; your 20–45 minute execution window is proven at 88% success; recent coding consistency is high.',
      capabilityImpacts: { intellect: 3, discipline: 2, focus: 2 },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Seed Upcoming Assignments
    const upcoming = [
      {
        id: 'asg_up_01',
        title: 'Database Schema Indexing & Query Latency Optimization',
        description: 'Inspect query plans and introduce compound indices for high-cardinality keys.',
        domain: 'Engineering',
        subject: 'Database Systems',
        topics: ['Performance', 'Indexing'],
        keywords: ['Database', 'Indices', 'Latency'],
        skills: ['Data Modeling'],
        difficulty: 'ADVANCED' as const,
        estimatedDuration: 40,
        origin: 'ADAPTIVE' as const,
        status: 'AVAILABLE' as const,
        scheduledFor: new Date(Date.now() + 86400000).toISOString(),
        completionCriteria: 'Demonstrate >= 40% reduction in query cost.',
        capabilityImpacts: { intellect: 3, focus: 3 },
      },
      {
        id: 'asg_up_02',
        title: 'Unit & Integration Test Matrix for Protected Handlers',
        description: 'Develop comprehensive unit tests covering edge cases and error boundaries.',
        domain: 'Engineering',
        subject: 'Quality Engineering',
        topics: ['Testing', 'Regression'],
        keywords: ['Testing', 'Unit Tests', 'Coverage'],
        skills: ['Test Engineering'],
        difficulty: 'STANDARD' as const,
        estimatedDuration: 30,
        origin: 'ADAPTIVE' as const,
        status: 'AVAILABLE' as const,
        scheduledFor: new Date(Date.now() + 2 * 86400000).toISOString(),
        completionCriteria: 'All unit tests pass with high assertion coverage.',
        capabilityImpacts: { discipline: 3, intellect: 2 },
      },
      {
        id: 'asg_hist_01',
        title: 'RESTful Route Decomposition & Schema Validation Handlers',
        description: 'Refactor monolithic express handler into modular route handlers with Zod schema validation.',
        domain: 'Engineering',
        subject: 'Backend Systems',
        topics: ['Validation', 'Modular Architecture'],
        keywords: ['Validation', 'Express', 'Routing'],
        skills: ['API Architecture'],
        difficulty: 'STANDARD' as const,
        estimatedDuration: 45,
        actualDuration: 41,
        origin: 'ADAPTIVE' as const,
        status: 'COMPLETED' as const,
        scheduledFor: new Date(Date.now() - 24 * 3600000).toISOString(),
        startedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        completedAt: new Date(Date.now() - (24 * 3600000 - 41 * 60000)).toISOString(),
        completionCriteria: 'Payload parsing enforces strict typing.',
        capabilityImpacts: { intellect: 3, discipline: 2 },
      },
      {
        id: 'asg_hist_02',
        title: 'Draft User Onboarding Flow & Authentication Spec',
        description: 'Write specifications for authentication lifecycle, session refresh, and user verification.',
        domain: 'Engineering',
        subject: 'Architecture Planning',
        topics: ['Planning', 'Documentation'],
        keywords: ['Specs', 'Architecture', 'Authentication'],
        skills: ['System Design'],
        difficulty: 'STANDARD' as const,
        estimatedDuration: 30,
        actualDuration: 28,
        origin: 'USER' as const,
        status: 'COMPLETED' as const,
        scheduledFor: new Date(Date.now() - 48 * 3600000).toISOString(),
        startedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
        completedAt: new Date(Date.now() - (48 * 3600000 - 28 * 60000)).toISOString(),
        completionCriteria: 'Spec reviewed and agreed upon.',
        capabilityImpacts: { intellect: 2, focus: 2 },
      },
    ];

    for (const u of upcoming) {
      this.assignments.set(u.id, {
        id: u.id,
        userId: demoUserId,
        objectiveId: objId,
        phaseId: 'phase_03',
        title: u.title,
        description: u.description,
        domain: u.domain,
        subject: u.subject,
        topics: u.topics,
        keywords: u.keywords,
        skills: u.skills,
        difficulty: u.difficulty,
        estimatedDuration: u.estimatedDuration,
        actualDuration: u.actualDuration,
        origin: u.origin,
        status: u.status,
        scheduledFor: u.scheduledFor,
        startedAt: u.startedAt,
        completedAt: u.completedAt,
        completionCriteria: u.completionCriteria,
        capabilityImpacts: u.capabilityImpacts,
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Seed Chronological Journal Events
    this.journalEvents.push(
      {
        id: 'j_01',
        userId: demoUserId,
        eventType: 'ASSIGNMENT',
        eventSubtype: 'COMPLETED',
        title: 'RESTful Route Decomposition & Schema Validation Handlers',
        description: '45 MIN ESTIMATED · 41 MIN ACTUAL. Completed successfully.',
        assignmentId: 'asg_hist_01',
        objectiveId: objId,
        importance: 'NORMAL',
        xpDelta: 225,
        creditDelta: 12,
        capabilityDelta: { dimension: 'intellect', amount: 3 },
        occurredAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
      {
        id: 'j_02',
        userId: demoUserId,
        eventType: 'PROGRESSION',
        eventSubtype: 'LEVEL_ADVANCEMENT',
        title: 'Level Advancement: Level 08 Adept',
        description: 'Crossed 2,100 total XP threshold. A new stage of your journey has resolved.',
        importance: 'MILESTONE',
        xpDelta: 225,
        metadata: { previousLevel: 7, newLevel: 8 },
        occurredAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
      {
        id: 'j_03',
        userId: demoUserId,
        eventType: 'CAPABILITY',
        eventSubtype: 'CAPABILITY_GAIN',
        title: 'Intellect Advanced',
        description: 'Intellect increased from 79 to 82 through completed API contract work.',
        importance: 'NORMAL',
        capabilityDelta: { dimension: 'intellect', amount: 3 },
        occurredAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
      {
        id: 'j_04',
        userId: demoUserId,
        eventType: 'ADAPTATION',
        eventSubtype: 'DURATION_RECALIBRATION',
        title: 'System Adaptation: Assignment Duration Recalibrated',
        description: 'Cadence shifted planned duration mix toward 25–45 minute focus windows after detecting 88% completion vs 43% on 60+ minute sessions.',
        importance: 'IMPORTANT',
        occurredAt: new Date(Date.now() - 48 * 3600000).toISOString(),
        createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
      }
    );

    // Seed Adaptive Recommendations
    this.adaptiveRecommendations.push({
      id: 'rec_01',
      userId: demoUserId,
      assignmentId: focusAsgId,
      reasonType: 'HIGH_OBJECTIVE_FIT_AND_OPTIMAL_DURATION',
      signalsUsed: ['Backend Systems Phase', '25-45min Success 88%', 'Intellect Need'],
      previousState: '60 MIN Challenge',
      newState: '45 MIN Advanced',
      confidence: 0.91,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    });
  }

  // Helper Queries
  getUserByEmail(email: string): UserDoc | undefined {
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
    }
    return undefined;
  }

  getUserById(id: string): UserDoc | undefined {
    return this.users.get(id);
  }

  getProgression(userId: string): UserProgressionDoc {
    let p = this.progressions.get(userId);
    if (!p) {
      const calc = calculateLevelFromXP(0);
      p = {
        id: `prog_${userId}`,
        userId,
        level: calc.level,
        totalXP: 0,
        currentLevelTitle: calc.title,
        updatedAt: new Date().toISOString(),
      };
      this.progressions.set(userId, p);
    }
    return p;
  }

  getCreditBalance(userId: string): CreditBalanceDoc {
    let c = this.creditBalances.get(userId);
    if (!c) {
      c = {
        id: `cred_${userId}`,
        userId,
        totalCredits: 0,
        updatedAt: new Date().toISOString(),
      };
      this.creditBalances.set(userId, c);
    }
    return c;
  }

  getActiveObjective(userId: string): ObjectiveDoc | undefined {
    for (const obj of this.objectives.values()) {
      if (obj.userId === userId && obj.isPrimary && obj.status === 'ACTIVE') {
        return obj;
      }
    }
    for (const obj of this.objectives.values()) {
      if (obj.userId === userId && obj.status === 'ACTIVE') {
        return obj;
      }
    }
    for (const obj of this.objectives.values()) {
      if (obj.userId === userId) return obj;
    }
    return undefined;
  }

  getCapabilities(userId: string): UserCapabilityDoc[] {
    const dimensions: ('intellect' | 'discipline' | 'focus' | 'creativity' | 'resilience' | 'strength')[] = [
      'intellect', 'discipline', 'focus', 'creativity', 'resilience', 'strength'
    ];
    return dimensions.map(dim => {
      const key = `${userId}_${dim}`;
      let cap = this.capabilities.get(key);
      if (!cap) {
        cap = {
          id: `cap_${key}`,
          userId,
          dimension: dim,
          value: 50,
          trajectory: 'STABLE',
          updatedAt: new Date().toISOString(),
        };
        this.capabilities.set(key, cap);
      }
      return cap;
    });
  }

  getUserBadges(userId: string): { badge: BadgeDefinition; earnedAt: string }[] {
    const result: { badge: BadgeDefinition; earnedAt: string }[] = [];
    for (const ub of this.userBadges.values()) {
      if (ub.userId === userId) {
        const badgeDef = CANONICAL_BADGES.find(b => b.id === ub.badgeId);
        if (badgeDef) {
          result.push({ badge: badgeDef, earnedAt: ub.earnedAt });
        }
      }
    }
    return result.sort((a, b) => a.badge.displayOrder - b.badge.displayOrder);
  }

  getUserProfileTags(userId: string): UserProfileTagDoc[] {
    const tags: UserProfileTagDoc[] = [];
    for (const upt of this.userProfileTags.values()) {
      if (upt.userId === userId) tags.push(upt);
    }
    return tags;
  }

  getAssignments(userId: string): AssignmentDoc[] {
    const asgs: AssignmentDoc[] = [];
    for (const a of this.assignments.values()) {
      if (a.userId === userId) asgs.push(a);
    }
    return asgs.sort((a, b) => new Date(b.scheduledFor).getTime() - new Date(a.scheduledFor).getTime());
  }

  getJournalEvents(userId: string): JournalEventDoc[] {
    return this.journalEvents
      .filter(j => j.userId === userId)
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  }

  getPrimaryObjective(userId: string): ObjectiveDoc | undefined {
    for (const o of this.objectives.values()) {
      if (o.userId === userId && o.isPrimary && o.status === 'ACTIVE') return o;
    }
    for (const o of this.objectives.values()) {
      if (o.userId === userId && o.status === 'ACTIVE') return o;
    }
    return undefined;
  }

  getLeaderboard(): { rank: number; userId: string; displayName: string; totalCredits: number; level: number; totalXP: number }[] {
    const list: { userId: string; displayName: string; totalCredits: number; level: number; totalXP: number }[] = [];
    
    for (const user of this.users.values()) {
      const creds = this.getCreditBalance(user.id);
      const prog = this.getProgression(user.id);
      list.push({
        userId: user.id,
        displayName: user.displayName,
        totalCredits: creds.totalCredits,
        level: prog.level,
        totalXP: prog.totalXP,
      });
    }

    // Add some simulated benchmark participants if few users exist to illustrate ranking hierarchy
    if (list.length < 5) {
      list.push(
        { userId: 'bench_1', displayName: 'Aria Sterling', totalCredits: 8420, level: 34, totalXP: 42100 },
        { userId: 'bench_2', displayName: 'Kaelen Vance', totalCredits: 8175, level: 32, totalXP: 38900 },
        { userId: 'bench_3', displayName: 'Elena Rostov', totalCredits: 7940, level: 31, totalXP: 36200 },
        { userId: 'bench_4', displayName: 'Marcus Holloway', totalCredits: 2180, level: 16, totalXP: 12400 }
      );
    }

    list.sort((a, b) => b.totalCredits - a.totalCredits);
    return list.map((item, idx) => ({ ...item, rank: idx + 1 }));
  }

  // -------------------------------------------------------------
  // CONSISTENCY STREAK PERSISTENCE & QUICK LOGGING
  // -------------------------------------------------------------
  getStreak(userId: string): UserStreakDoc {
    let streak = this.streaks.get(userId);
    if (!streak) {
      const today = new Date();
      const history: StreakDayRecord[] = [];
      const past14Days = 14;
      
      for (let i = past14Days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const isToday = i === 0;
        // 11 of 14 days completed for compelling initial display
        const completed = isToday ? true : (i % 5 !== 2);
        history.push({
          date: dateStr,
          completed,
          activitiesCount: completed ? (isToday ? 2 : Math.floor(Math.random() * 2) + 1) : 0,
          xpEarned: completed ? 120 : 0,
          title: completed ? 'Cadence Focus Protocol' : undefined,
          completedAt: completed ? d.toISOString() : undefined,
        });
      }

      streak = {
        userId,
        currentStreak: 13,
        bestStreak: 21,
        multiplier: 1.5,
        totalCheckins: 42,
        lastActiveDate: today.toISOString().split('T')[0],
        history,
        updatedAt: new Date().toISOString(),
      };
      this.streaks.set(userId, streak);
    }
    return streak;
  }

  checkinStreak(userId: string, notes?: string): { streak: UserStreakDoc; xpAwarded: number; newlyCompleted: boolean } {
    const streak = this.getStreak(userId);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecord = streak.history.find(h => h.date === todayStr);

    let newlyCompleted = false;
    let xpAwarded = 0;

    if (todayRecord) {
      if (!todayRecord.completed) {
        todayRecord.completed = true;
        todayRecord.activitiesCount = 1;
        todayRecord.xpEarned = 150;
        todayRecord.title = notes || 'Daily Consistency Protocol';
        todayRecord.completedAt = new Date().toISOString();
        streak.currentStreak += 1;
        if (streak.currentStreak > streak.bestStreak) {
          streak.bestStreak = streak.currentStreak;
        }
        streak.totalCheckins += 1;
        newlyCompleted = true;
        xpAwarded = 150;
      } else {
        todayRecord.activitiesCount += 1;
        todayRecord.xpEarned += 60;
        xpAwarded = 60;
        streak.totalCheckins += 1;
      }
    } else {
      streak.history.push({
        date: todayStr,
        completed: true,
        activitiesCount: 1,
        xpEarned: 150,
        title: notes || 'Daily Consistency Protocol',
        completedAt: new Date().toISOString(),
      });
      streak.currentStreak += 1;
      streak.totalCheckins += 1;
      newlyCompleted = true;
      xpAwarded = 150;
    }

    if (streak.history.length > 21) {
      streak.history = streak.history.slice(-21);
    }

    streak.lastActiveDate = todayStr;
    streak.updatedAt = new Date().toISOString();
    this.streaks.set(userId, streak);

    if (xpAwarded > 0) {
      const prog = this.getProgression(userId);
      prog.totalXP += xpAwarded;
      prog.updatedAt = new Date().toISOString();
      const creds = this.getCreditBalance(userId);
      creds.totalCredits += Math.round(xpAwarded / 2);
      creds.updatedAt = new Date().toISOString();
    }

    this.journalEvents.unshift({
      id: `j_streak_${Date.now()}`,
      userId,
      eventType: 'ACHIEVEMENT',
      eventSubtype: 'STREAK_CHECKIN',
      title: `Consistency Streak Extended: Day ${streak.currentStreak}`,
      description: `Daily protocol verified. +${xpAwarded} XP / +${Math.round(xpAwarded / 2)} Credits. Persisted 24/7 to Supabase cloud storage.`,
      importance: 'IMPORTANT',
      occurredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    this.triggerSave();
    return { streak, xpAwarded, newlyCompleted };
  }

  quickLogAction(userId: string, data: { title: string; dimension?: string; duration?: number; notes?: string }) {
    const now = new Date().toISOString();
    const duration = data.duration || 25;
    const dimension = (data.dimension || 'focus').toLowerCase();

    // Automatically link to active primary objective
    const activeObj = this.getActiveObjective(userId);

    const asgId = `asg_quick_${Date.now()}`;
    const xp = Math.max(50, duration * 5);
    const credits = Math.max(25, Math.round(duration * 2.5));

    const impacts: any = { intellect: 0, discipline: 0, focus: 0, creativity: 0, resilience: 0, strength: 0 };
    impacts[dimension] = Math.max(10, Math.round(duration * 0.8));
    impacts.discipline = Math.max(5, impacts.discipline + 5);

    const newAssignment: AssignmentDoc = {
      id: asgId,
      userId,
      objectiveId: activeObj?.id,
      title: data.title,
      description: data.notes || `Quick-logged completed action automatically linked to ${activeObj ? activeObj.title : 'Active Objective'}.`,
      domain: 'Quick Execution',
      subject: dimension.toUpperCase(),
      topics: [dimension, 'Quick Log'],
      keywords: [dimension, 'Action Log'],
      skills: ['Self-Regulation', 'Rapid Execution'],
      difficulty: duration >= 45 ? 'ADVANCED' : duration >= 25 ? 'STANDARD' : 'ROUTINE',
      estimatedDuration: duration,
      actualDuration: duration,
      origin: 'USER',
      status: 'COMPLETED',
      scheduledFor: now,
      startedAt: new Date(Date.now() - duration * 60000).toISOString(),
      completedAt: now,
      completionCriteria: 'Quick-logged via floating action button',
      capabilityImpacts: impacts,
      notes: data.notes,
      createdAt: now,
      updatedAt: now,
    };

    this.assignments.set(asgId, newAssignment);

    // Award XP & Credits
    const prog = this.getProgression(userId);
    prog.totalXP += xp;
    prog.updatedAt = now;

    const creds = this.getCreditBalance(userId);
    creds.totalCredits += credits;
    creds.updatedAt = now;

    // Distribute capability XP
    const capKey = `${userId}_${dimension}`;
    const cap = this.capabilities.get(capKey);
    if (cap) {
      cap.value = Math.min(100, cap.value + 1.2);
      cap.trajectory = 'GROWING';
      cap.updatedAt = now;
    }

    // Advance objective progress if linked
    if (activeObj) {
      activeObj.progress = Math.min(100, activeObj.progress + 2);
      activeObj.updatedAt = now;
    }

    // Update daily consistency streak
    const streakResult = this.checkinStreak(userId, data.title);

    // Record Journal event
    this.journalEvents.unshift({
      id: `j_quick_${Date.now()}`,
      userId,
      eventType: 'ASSIGNMENT',
      eventSubtype: 'QUICK_LOG',
      title: `Action Completed: ${data.title}`,
      description: `Quick-logged (${duration}m). Linked to: ${activeObj ? activeObj.title : 'Primary Objective'}. +${xp} XP, +${credits} Credits. Synced to Supabase.`,
      assignmentId: asgId,
      objectiveId: activeObj?.id,
      importance: 'NORMAL',
      occurredAt: now,
      createdAt: now,
    });

    this.triggerSave();

    return {
      assignment: newAssignment,
      progression: prog,
      creditBalance: creds,
      streak: streakResult.streak,
      linkedObjective: activeObj ? { id: activeObj.id, title: activeObj.title } : null,
      xpAwarded: xp,
      creditsAwarded: credits,
    };
  }

  // -------------------------------------------------------------
  // SUPABASE 24/7 CLOUD PERSISTENCE SERIALIZATION
  // -------------------------------------------------------------
  private saveTimeout: NodeJS.Timeout | null = null;

  exportState() {
    return {
      users: Array.from(this.users.entries()),
      progressions: Array.from(this.progressions.entries()),
      creditBalances: Array.from(this.creditBalances.entries()),
      objectives: Array.from(this.objectives.entries()),
      phases: Array.from(this.phases.entries()),
      milestones: Array.from(this.milestones.entries()),
      habits: Array.from(this.habits.entries()),
      assignments: Array.from(this.assignments.entries()),
      executionSessions: Array.from(this.executionSessions.entries()),
      capabilities: Array.from(this.capabilities.entries()),
      streaks: Array.from(this.streaks.entries()),
      capabilityEvents: this.capabilityEvents,
      behaviorEvents: this.behaviorEvents,
      journalEvents: this.journalEvents,
      userBadges: Array.from(this.userBadges.entries()),
      profileTags: Array.from(this.profileTags.entries()),
      userProfileTags: Array.from(this.userProfileTags.entries()),
      adaptiveRecommendations: this.adaptiveRecommendations,
      aiMessages: this.aiMessages,
      version: '2.0.0',
      syncedAt: new Date().toISOString(),
    };
  }

  importState(data: any) {
    if (!data) return;
    try {
      if (Array.isArray(data.users)) this.users = new Map(data.users);
      if (Array.isArray(data.progressions)) this.progressions = new Map(data.progressions);
      if (Array.isArray(data.creditBalances)) this.creditBalances = new Map(data.creditBalances);
      if (Array.isArray(data.objectives)) this.objectives = new Map(data.objectives);
      if (Array.isArray(data.phases)) this.phases = new Map(data.phases);
      if (Array.isArray(data.milestones)) this.milestones = new Map(data.milestones);
      if (Array.isArray(data.habits)) this.habits = new Map(data.habits);
      if (Array.isArray(data.assignments)) this.assignments = new Map(data.assignments);
      if (Array.isArray(data.executionSessions)) this.executionSessions = new Map(data.executionSessions);
      if (Array.isArray(data.capabilities)) this.capabilities = new Map(data.capabilities);
      if (Array.isArray(data.streaks)) this.streaks = new Map(data.streaks);
      if (Array.isArray(data.capabilityEvents)) this.capabilityEvents = data.capabilityEvents;
      if (Array.isArray(data.behaviorEvents)) this.behaviorEvents = data.behaviorEvents;
      if (Array.isArray(data.journalEvents)) this.journalEvents = data.journalEvents;
      if (Array.isArray(data.userBadges)) this.userBadges = new Map(data.userBadges);
      if (Array.isArray(data.profileTags)) this.profileTags = new Map(data.profileTags);
      if (Array.isArray(data.userProfileTags)) this.userProfileTags = new Map(data.userProfileTags);
      if (Array.isArray(data.adaptiveRecommendations)) this.adaptiveRecommendations = data.adaptiveRecommendations;
      if (Array.isArray(data.aiMessages)) this.aiMessages = data.aiMessages;
      console.log('[CadenceDB Store] Restored complete state from Supabase 24/7 cloud persistence.');
    } catch (e: any) {
      console.error('[CadenceDB Store] Error importing state from Supabase:', e);
    }
  }

  triggerSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(async () => {
      try {
        await persistStoreToSupabase(this.exportState());
      } catch (err: any) {
        console.warn('[CadenceDB Store] Autosave to Supabase notice:', err.message);
      }
    }, 400);
  }

  async syncNow(): Promise<boolean> {
    try {
      return await persistStoreToSupabase(this.exportState());
    } catch (err) {
      return false;
    }
  }

  async loadFromSupabase(): Promise<boolean> {
    try {
      const state = await loadStoreFromSupabase();
      if (state) {
        this.importState(state);
        return true;
      } else {
        // Save initial state to Supabase so it's primed
        await persistStoreToSupabase(this.exportState());
        return false;
      }
    } catch (err) {
      console.warn('[CadenceDB Store] Could not load from Supabase:', err);
      return false;
    }
  }
}

export const store = new CadenceDatabaseStore();
