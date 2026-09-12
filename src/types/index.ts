// src/types/index.ts
// Comprehensive TypeScript Data Types for Cadence Frontend

export type OperatingMode = 'MANUAL' | 'COMMANDER';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarId: string;
  operatingMode: OperatingMode;
  timezone?: string;
}

export interface UserProgression {
  level: number;
  totalXP: number;
  title: string;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercent: number;
}

export interface CreditState {
  position: number;
  totalCredits: number;
  tier: string;
}

export interface ObjectivePhase {
  id: string;
  objectiveId: string;
  name: string;
  purpose: string;
  orderIndex: number;
  status: 'UPCOMING' | 'CURRENT' | 'COMPLETED';
  progress: number;
}

export interface Milestone {
  id: string;
  objectiveId: string;
  phaseId: string;
  title: string;
  description: string;
  completionCriteria: string;
  required: boolean;
  status: 'PENDING' | 'COMPLETED';
  completedAt?: string;
}

export interface Habit {
  id: string;
  objectiveId?: string;
  title: string;
  frequencyPerWeek: number;
  currentAdherence: number;
  streak: number;
}

export interface Objective {
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
  phases?: ObjectivePhase[];
  milestones?: Milestone[];
  habits?: Habit[];
  createdAt: string;
  updatedAt: string;
}

export interface CapabilityImpacts {
  intellect?: number;
  discipline?: number;
  focus?: number;
  creativity?: number;
  resilience?: number;
  strength?: number;
}

export interface Assignment {
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
  estimatedDuration: number; // minutes
  actualDuration?: number; // minutes
  origin: 'USER' | 'ADAPTIVE' | 'HABIT' | 'SYSTEM';
  status: 'DRAFT' | 'SCHEDULED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'SKIPPED' | 'CANCELLED';
  scheduledFor: string;
  startedAt?: string;
  completedAt?: string;
  completionCriteria: string;
  whySelected?: string;
  capabilityImpacts: CapabilityImpacts;
  notes?: string;
  skipReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCapability {
  id: string;
  userId: string;
  dimension: 'intellect' | 'discipline' | 'focus' | 'creativity' | 'resilience' | 'strength';
  value: number;
  trajectory: 'GROWING' | 'STABLE' | 'NEGLECTED' | 'DECLINING';
  updatedAt: string;
}

export interface CapabilityOverviewData {
  capabilities: UserCapability[];
  strongest: { dimension: string; value: number };
  fastestGrowing: { dimension: string; change: string };
  mostNeglected: { dimension: string; value: number; daysWithoutActivity: number };
  distributionState: string;
  developmentInsight: string;
}

export interface PerformanceOverview {
  mode?: OperatingMode;
  execution: { rate: number; periodChange: string };
  consistency: { score: number; periodChange: string };
  momentum: { score: number; state: string };
  streak: { currentDays: number; bestDays: number };
  capacity: { score: number; workload: string; state: string };
  reliability: { score: number; resistance: number };
  counts: {
    committed: number;
    completed: number;
    missed: number;
    skipped: number;
  };
  strategicFocus?: {
    directiveAdherence: number;
    prescribedTimeboxing: number;
    objectiveConvergence: number;
    highImpactYield: string;
  };
  exploratoryFocus?: {
    domainDispersion: number;
    curiosityBreadth: string;
    flowDurationAvg: string;
    creativeSpikeRate: string;
  };
}

export interface PerformancePatterns {
  mode?: OperatingMode;
  durationProfile: { range: string; successRate: number; attempts: number; state: string }[];
  difficultyProfile: { difficulty: string; successRate: number; attempts: number; state: string }[];
  estimationAccuracy: { accuracyScore: number; typicalVariance: string };
  keywordPerformance: { keyword: string; attempts: number; successRate: number; lastActive: string }[];
  whatCadenceHasLearned: { id: string; finding: string }[];
}

export interface JournalEvent {
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

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  badgeType: 'LEVEL' | 'XP' | 'CREDIT';
  triggerType: 'LEVEL_REACHED' | 'TOTAL_XP' | 'TOTAL_CREDITS';
  triggerValue: number;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  displayOrder: number;
}

export interface UserProfileTag {
  id: string;
  tagId: string;
  name: string;
  earnedAt: string;
  confidence: number;
  evidence: string;
}

export interface ProfileResponse {
  user: User;
  progression: UserProgression;
  rank: CreditState;
  badges: {
    earned: { badge: BadgeDefinition; earnedAt: string }[];
    locked: { badge: BadgeDefinition; currentVal: number; remaining: number }[];
  };
  profileTags: UserProfileTag[];
  capabilities: UserCapability[];
  primaryObjective?: Objective;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  totalCredits: number;
  level: number;
  totalXP: number;
}

export interface CompletionResponse {
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

export interface StreakCheckinResponse {
  streak: UserStreakDoc;
  xpAwarded: number;
  newlyCompleted: boolean;
}

export interface QuickLogResponse {
  assignment: Assignment;
  progression: UserProgression;
  creditBalance: { totalCredits: number };
  streak: UserStreakDoc;
  linkedObjective: { id: string; title: string } | null;
  xpAwarded: number;
  creditsAwarded: number;
}

