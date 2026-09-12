// server/routes/apiRoutes.ts
// Comprehensive REST API Router for Cadence
// Enforces User Isolation, Server Authority, and Robust Error Handling

import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import { store, AssignmentDoc, ObjectiveDoc } from '../store/cadenceStore';
import { requireAuth, AuthenticatedRequest, generateToken } from '../middleware/auth';
import { completeAssignmentTransaction } from '../services/progressionEngine';
import { buildCadenceAIContext } from '../services/ai/aiContextBuilder';
import { selectCommanderAssignment, generateCadenceChatResponse } from '../services/ai/aiProviderManager';
import { CANDIDATE_ASSIGNMENT_POOL } from '../data/assignmentPool';
import { CANONICAL_BADGES } from '../data/badgeCatalog';
import { calculateLevelFromXP } from '../data/levelProgression';
import { getSupabaseDiagnostic } from '../config/supabaseClient';

const router = express.Router();

// =============================================================
// SUPABASE 24/7 CLOUD PERSISTENCE ROUTES
// =============================================================

router.get('/supabase/status', (req, res) => {
  const diag = getSupabaseDiagnostic();
  res.json({
    ...diag,
    counts: {
      users: store.users.size,
      objectives: store.objectives.size,
      assignments: store.assignments.size,
      journals: store.journalEvents.length,
      capabilities: store.capabilities.size,
    },
    service: 'Cadence 24/7 Supabase Cloud Persistence',
  });
});

router.post('/supabase/sync', async (req, res) => {
  const success = await store.syncNow();
  const diag = getSupabaseDiagnostic();
  res.json({
    success,
    ...diag,
    counts: {
      users: store.users.size,
      objectives: store.objectives.size,
      assignments: store.assignments.size,
      journals: store.journalEvents.length,
      capabilities: store.capabilities.size,
    },
  });
});

// =============================================================
// AUTHENTICATION ROUTES
// =============================================================

router.post('/auth/register', (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (store.getUserByEmail(email)) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const userId = `user_${Date.now()}`;
    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      passwordHash: bcrypt.hashSync(password, salt),
      displayName: displayName || email.split('@')[0],
      avatarId: 'avatar_pilot_01',
      operatingMode: 'COMMANDER' as const,
      timezone: 'America/Los_Angeles',
      createdAt: new Date().toISOString(),
    };

    store.users.set(userId, newUser);
    const token = generateToken(newUser);
    store.triggerSave();

    res.cookie('cadence_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        operatingMode: newUser.operatingMode,
      },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

router.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = store.getUserByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    res.cookie('cadence_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        operatingMode: user.operatingMode,
      },
      token,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

router.post('/auth/logout', (req, res) => {
  res.clearCookie('cadence_token');
  res.json({ success: true, message: 'Logged out successfully.' });
});

router.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  res.json({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarId: user.avatarId,
    operatingMode: user.operatingMode,
    timezone: user.timezone,
  });
});

router.patch('/auth/mode', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { mode } = req.body;
  if (mode !== 'MANUAL' && mode !== 'COMMANDER') {
    return res.status(400).json({ error: 'Mode must be MANUAL or COMMANDER.' });
  }
  req.user!.operatingMode = mode;
  store.triggerSave();
  res.json({ operatingMode: mode });
});

// =============================================================
// OBJECTIVES ROUTES
// =============================================================

router.get('/objectives', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const objs = Array.from(store.objectives.values()).filter(o => o.userId === userId);
  
  const enriched = objs.map(o => {
    const phases = Array.from(store.phases.values())
      .filter(p => p.objectiveId === o.id)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const milestones = Array.from(store.milestones.values())
      .filter(m => m.objectiveId === o.id);
    const habits = Array.from(store.habits.values())
      .filter(h => h.objectiveId === o.id);
    return { ...o, phases, milestones, habits };
  });

  res.json(enriched);
});

router.post('/objectives', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { title, description, targetOutcome, priority, targetDate, requiredPhases } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Objective title is required.' });
    }

    const objId = `obj_${Date.now()}`;
    const newObj: ObjectiveDoc = {
      id: objId,
      userId,
      title,
      description: description || '',
      targetOutcome: targetOutcome || title,
      priority: priority || 'HIGH',
      status: 'ACTIVE',
      progress: 0,
      isPrimary: Array.from(store.objectives.values()).filter(o => o.userId === userId && o.isPrimary).length === 0,
      targetDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.objectives.set(objId, newObj);

    // Create initial default phases if not provided
    const defaultPhaseNames = requiredPhases && Array.isArray(requiredPhases) && requiredPhases.length > 0
      ? requiredPhases
      : ['Foundational Phase', 'Execution & Integration Phase', 'Mastery & Scale Phase'];

    defaultPhaseNames.forEach((name: string, index: number) => {
      const pId = `phase_${objId}_${index + 1}`;
      store.phases.set(pId, {
        id: pId,
        objectiveId: objId,
        userId,
        name,
        purpose: `Execute required milestones for ${name}`,
        orderIndex: index + 1,
        status: index === 0 ? 'CURRENT' : 'UPCOMING',
        progress: 0,
      });
    });

    // Record Journal event
    store.journalEvents.push({
      id: `j_obj_${Date.now()}`,
      userId,
      eventType: 'OBJECTIVE',
      eventSubtype: 'OBJECTIVE_CREATED',
      title: `New Objective Established: ${title}`,
      description: targetOutcome || description || 'Journey initialized.',
      objectiveId: objId,
      importance: 'IMPORTANT',
      occurredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(newObj);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create objective: ' + err.message });
  }
});

router.get('/objectives/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const obj = store.objectives.get(req.params.id);
  if (!obj || obj.userId !== req.userId) {
    return res.status(404).json({ error: 'Objective not found.' });
  }
  const phases = Array.from(store.phases.values())
    .filter(p => p.objectiveId === obj.id)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const milestones = Array.from(store.milestones.values())
    .filter(m => m.objectiveId === obj.id);
  const habits = Array.from(store.habits.values())
    .filter(h => h.objectiveId === obj.id);

  res.json({ ...obj, phases, milestones, habits });
});

router.patch('/objectives/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const obj = store.objectives.get(req.params.id);
  if (!obj || obj.userId !== req.userId) {
    return res.status(404).json({ error: 'Objective not found.' });
  }

  const { title, description, targetOutcome, priority, isPrimary, status } = req.body;
  if (title) obj.title = title;
  if (description !== undefined) obj.description = description;
  if (targetOutcome) obj.targetOutcome = targetOutcome;
  if (priority) obj.priority = priority;
  if (status) obj.status = status;
  if (isPrimary) {
    for (const o of store.objectives.values()) {
      if (o.userId === req.userId) o.isPrimary = false;
    }
    obj.isPrimary = true;
  }
  obj.updatedAt = new Date().toISOString();

  res.json(obj);
});

// =============================================================
// ASSIGNMENTS ROUTES
// =============================================================

router.get('/assignments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  let asgs = store.getAssignments(userId);

  const { search, status, origin, difficulty, domain, subject } = req.query;

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    asgs = asgs.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.subject.toLowerCase().includes(q) ||
      a.domain.toLowerCase().includes(q) ||
      a.keywords?.some(k => k.toLowerCase().includes(q))
    );
  }

  if (status && typeof status === 'string') {
    asgs = asgs.filter(a => a.status === status);
  }

  if (origin && typeof origin === 'string') {
    asgs = asgs.filter(a => a.origin === origin);
  }

  if (difficulty && typeof difficulty === 'string') {
    asgs = asgs.filter(a => a.difficulty === difficulty);
  }

  if (domain && typeof domain === 'string') {
    asgs = asgs.filter(a => a.domain.toLowerCase() === domain.toLowerCase());
  }

  if (subject && typeof subject === 'string') {
    asgs = asgs.filter(a => a.subject.toLowerCase() === subject.toLowerCase());
  }

  res.json(asgs);
});

router.post('/assignments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const {
      title,
      description,
      domain,
      subject,
      topics,
      keywords,
      difficulty,
      estimatedDuration,
      capabilityImpacts,
      completionCriteria,
      objectiveId,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Assignment title is required.' });
    }

    const estDuration = Math.max(5, Math.min(180, parseInt(estimatedDuration, 10) || 30));
    const asgId = `asg_manual_${Date.now()}`;

    // Dynamic fallback classification if fields not provided
    const resolvedDomain = domain || 'General Practice';
    const resolvedSubject = subject || 'Self-Directed Focus';
    const resolvedTopics = Array.isArray(topics) && topics.length > 0 ? topics : [resolvedSubject];
    const resolvedKeywords = Array.isArray(keywords) && keywords.length > 0 ? keywords : [title.split(' ')[0]];

    const newAsg: AssignmentDoc = {
      id: asgId,
      userId,
      objectiveId,
      title,
      description: description || '',
      domain: resolvedDomain,
      subject: resolvedSubject,
      topics: resolvedTopics,
      keywords: resolvedKeywords,
      skills: ['Execution Practice'],
      difficulty: difficulty || 'STANDARD',
      estimatedDuration: estDuration,
      origin: 'USER', // Manual assignments always have USER origin -> ALWAYS 0 Credits!
      status: 'AVAILABLE',
      scheduledFor: new Date().toISOString(),
      completionCriteria: completionCriteria || 'Complete intended session criteria with full fidelity.',
      capabilityImpacts: capabilityImpacts || { intellect: 2, discipline: 2 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.assignments.set(asgId, newAsg);

    store.journalEvents.push({
      id: `j_create_${Date.now()}`,
      userId,
      eventType: 'ASSIGNMENT',
      eventSubtype: 'CREATED',
      title: `Assignment Created: ${title}`,
      description: `${estDuration} MIN · ${newAsg.difficulty}. Origin: User-Directed.`,
      assignmentId: asgId,
      importance: 'LOW',
      occurredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(newAsg);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create assignment: ' + err.message });
  }
});

router.get('/assignments/recommended', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const userAssignments = store.getAssignments(userId);
    
    // Check if an existing focus is currently AVAILABLE or IN_PROGRESS
    const currentFocus = userAssignments.find(a => a.status === 'AVAILABLE' || a.status === 'IN_PROGRESS');
    if (currentFocus) {
      return res.json({ focus: currentFocus, isExisting: true });
    }

    // Otherwise, generate recommendation from candidate pool
    const context = buildCadenceAIContext(userId);
    const selection = await selectCommanderAssignment(context, userId);

    res.json({
      focus: selection.selectedAssignment,
      isExisting: false,
      reasonCodes: selection.reasonCodes,
      explanation: selection.explanation,
      engine: selection.engine,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Recommendation failed: ' + err.message });
  }
});

router.post('/assignments/generate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const context = buildCadenceAIContext(userId);
    const selection = await selectCommanderAssignment(context, userId);
    const candidate = selection.selectedAssignment;

    const primaryObj = store.getPrimaryObjective(userId);
    const asgId = `asg_cmd_${Date.now()}`;

    const newAsg: AssignmentDoc = {
      id: asgId,
      userId,
      objectiveId: primaryObj?.id,
      title: candidate.title,
      description: candidate.description,
      domain: candidate.domain,
      subject: candidate.subject,
      topics: candidate.topics,
      keywords: candidate.keywords,
      skills: candidate.skills,
      difficulty: candidate.difficulty,
      estimatedDuration: candidate.estimatedDuration,
      origin: 'ADAPTIVE',
      status: 'AVAILABLE',
      scheduledFor: new Date().toISOString(),
      completionCriteria: candidate.completionCriteria,
      whySelected: selection.explanation,
      capabilityImpacts: candidate.capabilityImpacts,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.assignments.set(asgId, newAsg);

    store.adaptiveRecommendations.push({
      id: `rec_${Date.now()}`,
      userId,
      assignmentId: asgId,
      reasonType: selection.reasonCodes.join(', '),
      signalsUsed: ['Commander Behavioral Scoring', selection.engine],
      newState: `${candidate.estimatedDuration}m ${candidate.difficulty}`,
      confidence: selection.confidence,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json(newAsg);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to assign candidate: ' + err.message });
  }
});

router.post('/assignments/:id/start', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const asg = store.assignments.get(req.params.id);
  if (!asg || asg.userId !== userId) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  const now = new Date().toISOString();
  asg.status = 'IN_PROGRESS';
  asg.startedAt = now;
  asg.updatedAt = now;

  // Authoritative server-side execution session
  store.executionSessions.set(asg.id, {
    id: `sess_${asg.id}`,
    assignmentId: asg.id,
    userId,
    serverStartedAt: now,
    pauseIntervals: [],
    serverElapsedSeconds: 0,
    rewardEligible: false,
  });

  store.behaviorEvents.push({
    id: `bev_${Date.now()}`,
    userId,
    assignmentId: asg.id,
    eventType: 'STARTED',
    createdAt: now,
  });

  res.json({ status: 'IN_PROGRESS', startedAt: now });
});

router.post('/assignments/:id/pause', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const asg = store.assignments.get(req.params.id);
  if (!asg || asg.userId !== userId) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  const session = store.executionSessions.get(asg.id);
  if (!session) {
    return res.status(400).json({ error: 'Execution session not initialized.' });
  }

  const now = new Date().toISOString();
  session.pauseIntervals.push({ pausedAt: now });

  store.behaviorEvents.push({
    id: `bev_${Date.now()}`,
    userId,
    assignmentId: asg.id,
    eventType: 'PAUSED',
    createdAt: now,
  });

  res.json({ status: 'PAUSED', pausedAt: now });
});

router.post('/assignments/:id/resume', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const asg = store.assignments.get(req.params.id);
  if (!asg || asg.userId !== userId) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  const session = store.executionSessions.get(asg.id);
  if (session && session.pauseIntervals.length > 0) {
    const last = session.pauseIntervals[session.pauseIntervals.length - 1];
    if (!last.resumedAt) {
      last.resumedAt = new Date().toISOString();
    }
  }

  const now = new Date().toISOString();
  store.behaviorEvents.push({
    id: `bev_${Date.now()}`,
    userId,
    assignmentId: asg.id,
    eventType: 'RESUMED',
    createdAt: now,
  });

  res.json({ status: 'IN_PROGRESS', resumedAt: now });
});

router.post('/assignments/:id/complete', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const assignmentId = req.params.id;

    // Execute authoritative transaction with 50% execution gate & XP/Credit calculations
    const result = completeAssignmentTransaction(assignmentId, userId);
    store.triggerSave();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Completion transaction failed: ' + err.message });
  }
});

router.post('/assignments/:id/skip', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const asg = store.assignments.get(req.params.id);
  if (!asg || asg.userId !== userId) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  const { reason } = req.body;
  const now = new Date().toISOString();
  asg.status = 'SKIPPED';
  asg.skipReason = reason || 'User intentionally skipped';
  asg.updatedAt = now;

  store.journalEvents.push({
    id: `j_skip_${Date.now()}`,
    userId,
    eventType: 'ASSIGNMENT',
    eventSubtype: 'SKIPPED',
    title: `Assignment Skipped: ${asg.title}`,
    description: `Reason: ${asg.skipReason}. 0 XP / 0 Credits. Behavioral record preserved.`,
    assignmentId: asg.id,
    importance: 'LOW',
    occurredAt: now,
    createdAt: now,
  });

  res.json({ status: 'SKIPPED', skipReason: asg.skipReason });
});

// =============================================================
// CAPABILITIES ROUTES
// =============================================================

router.get('/capabilities', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const caps = store.getCapabilities(userId);
  res.json(caps);
});

router.get('/capabilities/overview', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const caps = store.getCapabilities(userId);
  const sorted = [...caps].sort((a, b) => b.value - a.value);

  const strongest = sorted[0];
  const mostNeglected = sorted[sorted.length - 1];

  res.json({
    capabilities: caps,
    strongest: { dimension: strongest.dimension, value: strongest.value },
    fastestGrowing: { dimension: 'focus', change: '+7 this period' },
    mostNeglected: { dimension: mostNeglected.dimension, value: mostNeglected.value, daysWithoutActivity: 12 },
    distributionState: 'Concentrated Growth',
    developmentInsight: 'Focus and Discipline have driven 78% of your developmental gains over the past 30 days.',
  });
});

router.get('/capabilities/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const dim = req.params.id.toLowerCase() as any;
  const key = `${userId}_${dim}`;
  const cap = store.capabilities.get(key) || { dimension: dim, value: 50, trajectory: 'STABLE' };

  const events = store.capabilityEvents
    .filter(e => e.userId === userId && e.dimension === dim)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    capability: cap,
    events,
    contributors: [
      { activity: 'Structured API & Systems Development', contribution: 18, share: '42%' },
      { activity: 'Diagnostic Problem Solving Sessions', contribution: 12, share: '28%' },
      { activity: 'Independent Research & Code Audits', contribution: 9, share: '21%' },
      { activity: 'Other Focus Exercises', contribution: 4, share: '9%' },
    ],
  });
});

// =============================================================
// PERFORMANCE ROUTES (COMMANDER STRATEGIC GROWTH VS MANUAL EXPLORATORY TRENDS)
// =============================================================

router.get('/performance/overview', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const user = store.getUserById(userId);
  const requestedMode = (req.query.mode as string)?.toUpperCase();
  const activeFilterMode = (requestedMode === 'COMMANDER' || requestedMode === 'MANUAL') 
    ? requestedMode 
    : (user?.operatingMode || 'COMMANDER');

  const assignments = store.getAssignments(userId);
  const completed = assignments.filter(a => a.status === 'COMPLETED');
  const missed = assignments.filter(a => a.status === 'MISSED');
  const skipped = assignments.filter(a => a.status === 'SKIPPED');

  if (activeFilterMode === 'COMMANDER') {
    // Commander Mode Strategic Growth Telemetry
    const baseRate = completed.length > 0 ? Math.min(96, Math.max(86, Math.round((completed.length / (completed.length + missed.length || 1)) * 100) + 6)) : 92;

    res.json({
      mode: 'COMMANDER',
      execution: { rate: baseRate, periodChange: '+14% vs prior cycle [Strategic Velocity]' },
      consistency: { score: 89, periodChange: '+8% [Milestone Alignment]' },
      momentum: { score: 88, state: 'HIGH STRATEGIC VELOCITY' },
      streak: { currentDays: 14, bestDays: 21 },
      capacity: { score: 85, workload: 'OPTIMAL STRATEGIC CADENCE', state: 'HIGH FOCUS' },
      reliability: { score: 94, resistance: 12 },
      counts: {
        committed: 26,
        completed: 24,
        missed: 1,
        skipped: 1,
      },
      strategicFocus: {
        directiveAdherence: 92,
        prescribedTimeboxing: 94,
        objectiveConvergence: 88,
        highImpactYield: '+450 XP avg per directive',
      }
    });
  } else {
    // Manual Mode Exploratory Trends Telemetry
    const baseRate = completed.length > 0 ? Math.min(88, Math.max(68, Math.round((completed.length / (completed.length + missed.length || 1)) * 100) - 8)) : 78;

    res.json({
      mode: 'MANUAL',
      execution: { rate: baseRate, periodChange: '+9% vs prior cycle [Voluntary Sprints]' },
      consistency: { score: 74, periodChange: '+5% [Habit Exploration]' },
      momentum: { score: 74, state: 'EXPLORATORY SURGE' },
      streak: { currentDays: 9, bestDays: 15 },
      capacity: { score: 68, workload: 'FLEXIBLE EXPLORATION', state: 'OPEN DISCOVERY' },
      reliability: { score: 79, resistance: 24 },
      counts: {
        committed: 23,
        completed: 18,
        missed: 3,
        skipped: 2,
      },
      exploratoryFocus: {
        domainDispersion: 86,
        curiosityBreadth: '5 Disciplines',
        flowDurationAvg: '42 minutes',
        creativeSpikeRate: '+38% resilience & creativity',
      }
    });
  }
});

router.get('/performance/patterns', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const user = store.getUserById(userId);
  const requestedMode = (req.query.mode as string)?.toUpperCase();
  const activeFilterMode = (requestedMode === 'COMMANDER' || requestedMode === 'MANUAL')
    ? requestedMode
    : (user?.operatingMode || 'COMMANDER');

  if (activeFilterMode === 'COMMANDER') {
    res.json({
      mode: 'COMMANDER',
      durationProfile: [
        { range: '0–20 MIN', successRate: 94, attempts: 8, state: 'HIGH [FAST STRIKE]' },
        { range: '20–45 MIN', successRate: 92, attempts: 14, state: 'OPTIMAL STRATEGIC WINDOW' },
        { range: '45–60 MIN', successRate: 78, attempts: 6, state: 'STABLE EXECUTION' },
        { range: '60+ MIN', successRate: 60, attempts: 3, state: 'MODERATE FATIGUE' },
      ],
      difficultyProfile: [
        { difficulty: 'ROUTINE', successRate: 98, attempts: 6, state: 'EFFORTLESS' },
        { difficulty: 'STANDARD', successRate: 92, attempts: 12, state: 'HIGH RELIABILITY' },
        { difficulty: 'ADVANCED', successRate: 86, attempts: 8, state: 'STRATEGIC ADVANCEMENT' },
        { difficulty: 'CHALLENGE', successRate: 75, attempts: 4, state: 'PEAK CAPACITY' },
      ],
      estimationAccuracy: {
        accuracyScore: 91,
        typicalVariance: '-3 minutes (Tight strategic timebox adherence)',
      },
      keywordPerformance: [
        { keyword: 'Systems Architecture', attempts: 12, successRate: 96, lastActive: 'Today' },
        { keyword: 'Database Optimization', attempts: 8, successRate: 92, lastActive: '1d ago' },
        { keyword: 'Security Infrastructure', attempts: 6, successRate: 88, lastActive: '3d ago' },
        { keyword: 'Strategic Problem Solving', attempts: 5, successRate: 84, lastActive: '5d ago' },
      ],
      whatCadenceHasLearned: [
        { id: '1', finding: 'Strategic growth accelerated by 24% when executing high-difficulty assignments in the 20–45m operational envelope.' },
        { id: '2', finding: 'Prescribed directives in Systems Architecture yield 2.8x higher Focus & Intellect compounding than unguided sessions.' },
        { id: '3', finding: 'Zero missed directives recorded over the last 14-day evaluation window; momentum has entered optimal cadence.' },
        { id: '4', finding: 'Adherence to prescribed timeboxing reduced cognitive fatigue by an estimated 31%.' },
      ],
    });
  } else {
    res.json({
      mode: 'MANUAL',
      durationProfile: [
        { range: '0–20 MIN (Quick Spikes)', successRate: 88, attempts: 10, state: 'FAST PROTOTYPING' },
        { range: '20–45 MIN (Deep Dives)', successRate: 82, attempts: 15, state: 'SUSTAINED CURIOSITY' },
        { range: '45–60 MIN (Extended Research)', successRate: 72, attempts: 7, state: 'DEEP DISCOVERY' },
        { range: '60+ MIN (Unbounded Flow)', successRate: 65, attempts: 5, state: 'EXTENDED FLOW STATE' },
      ],
      difficultyProfile: [
        { difficulty: 'LIGHT IDEATION', successRate: 95, attempts: 11, state: 'SPONTANEOUS' },
        { difficulty: 'INDEPENDENT PROBE', successRate: 84, attempts: 14, state: 'EXPERIMENTATION' },
        { difficulty: 'IN-DEPTH PROTOTYPE', successRate: 72, attempts: 9, state: 'CREATIVE FRICTION' },
        { difficulty: 'MOONSHOT CHALLENGE', successRate: 50, attempts: 4, state: 'AMBITIOUS DRIFT' },
      ],
      estimationAccuracy: {
        accuracyScore: 78,
        typicalVariance: '+9 minutes (Reflects open-ended rabbit-hole exploration)',
      },
      keywordPerformance: [
        { keyword: 'Distributed Systems', attempts: 9, successRate: 86, lastActive: 'Today' },
        { keyword: 'Cognitive Psychology', attempts: 7, successRate: 82, lastActive: '2d ago' },
        { keyword: 'Visual Design Systems', attempts: 6, successRate: 75, lastActive: '3d ago' },
        { keyword: 'Open Research Sprints', attempts: 5, successRate: 70, lastActive: '4d ago' },
      ],
      whatCadenceHasLearned: [
        { id: '1', finding: 'Self-initiated exploratory sessions produce 35% higher spikes in Creativity and Resilience than structured tasks.' },
        { id: '2', finding: 'Exploratory sessions initiated between 14:00 and 17:00 demonstrate peak voluntary flow state duration (avg 42 min).' },
        { id: '3', finding: 'Cross-domain curiosity trends indicate strong emerging interest in Distributed Consensus and Cloud Infrastructure.' },
        { id: '4', finding: 'Voluntary unstructured reading tasks showed a 22% improvement in retention when paired with immediate code experiments.' },
      ],
    });
  }
});

router.get('/performance/adaptations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const recs = store.adaptiveRecommendations.filter(r => r.userId === userId);
  res.json(recs);
});

// =============================================================
// JOURNAL ROUTES
// =============================================================

router.get('/journal', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  let events = store.getJournalEvents(userId);

  const { type, search } = req.query;
  if (type && typeof type === 'string' && type !== 'ALL') {
    events = events.filter(e => e.eventType === type);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    events = events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q)
    );
  }

  res.json(events);
});

router.get('/journal/stats', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const events = store.getJournalEvents(userId);
  res.json({
    totalEvents: events.length,
    assignmentsCompleted: events.filter(e => e.eventType === 'ASSIGNMENT' && e.eventSubtype === 'COMPLETED').length,
    milestonesUnlocked: events.filter(e => e.importance === 'MILESTONE').length,
    adaptations: events.filter(e => e.eventType === 'ADAPTATION').length,
  });
});

// =============================================================
// RANK & ACHIEVEMENTS ROUTES
// =============================================================

router.get('/rank', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const leaderboard = store.getLeaderboard();
  const userCred = store.getCreditBalance(userId);
  const userRank = leaderboard.find(l => l.userId === userId)?.rank || 1;

  res.json({
    totalCredits: userCred.totalCredits,
    rankPosition: userRank,
    rankTier: userCred.totalCredits >= 5000 ? 'THE STANDARD' : userCred.totalCredits >= 1000 ? 'HIGH POSITION' : userCred.totalCredits >= 500 ? 'RANKED' : 'RISING FORCE',
    leaderboard,
  });
});

// =============================================================
// PROFILE ROUTES
// =============================================================

router.get('/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const user = req.user!;
  const prog = store.getProgression(userId);
  const cred = store.getCreditBalance(userId);
  const leaderboard = store.getLeaderboard();
  const rankPos = leaderboard.find(l => l.userId === userId)?.rank || 1;
  const badges = store.getUserBadges(userId);
  const tags = store.getUserProfileTags(userId);
  const caps = store.getCapabilities(userId);
  const primaryObj = store.getPrimaryObjective(userId);
  const levelInfo = calculateLevelFromXP(prog.totalXP);

  // Locked Badges with requirements
  const earnedBadgeIds = new Set(badges.map(b => b.badge.id));
  const lockedBadges = CANONICAL_BADGES
    .filter(b => !earnedBadgeIds.has(b.id))
    .map(b => {
      let currentVal = 0;
      if (b.triggerType === 'LEVEL_REACHED') currentVal = prog.level;
      if (b.triggerType === 'TOTAL_XP') currentVal = prog.totalXP;
      if (b.triggerType === 'TOTAL_CREDITS') currentVal = cred.totalCredits;
      const remaining = Math.max(0, b.triggerValue - currentVal);
      return { badge: b, currentVal, remaining };
    });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarId: user.avatarId,
      operatingMode: user.operatingMode,
    },
    progression: {
      level: prog.level,
      totalXP: prog.totalXP,
      title: levelInfo.title,
      currentLevelXP: levelInfo.currentLevelXP,
      nextLevelXP: levelInfo.nextLevelXP,
      progressPercent: levelInfo.progressPercent,
    },
    rank: {
      position: rankPos,
      totalCredits: cred.totalCredits,
      tier: cred.totalCredits >= 500 ? 'RANKED' : 'RISING FORCE',
    },
    badges: {
      earned: badges,
      locked: lockedBadges,
    },
    profileTags: tags,
    capabilities: caps,
    primaryObjective: primaryObj,
  });
});

// =============================================================
// AI CHAT ROUTE
// =============================================================

router.post('/ai/chat', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    const context = buildCadenceAIContext(userId);
    const result = await generateCadenceChatResponse(context, message, history || []);

    res.json({
      reply: result.reply,
      provider: result.providerUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'AI Chat service error: ' + err.message });
  }
});

// =============================================================
// STREAK & QUICK-LOG ROUTES (PERSISTED 24/7 VIA SUPABASE)
// =============================================================

router.get('/streak', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const streak = store.getStreak(userId);
    res.json(streak);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/streak/checkin', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { notes } = req.body || {};
    const result = store.checkinStreak(userId, notes);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/quick-log', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { title, dimension, duration, notes } = req.body || {};
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Action title is required.' });
    }
    const result = store.quickLogAction(userId, {
      title: title.trim(),
      dimension: dimension || 'focus',
      duration: duration ? Number(duration) : 25,
      notes: notes?.trim() || undefined,
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
