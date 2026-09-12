# CADENCE — Master Architecture & Implementation Plan

## 1. System Overview & Product Definition
Cadence is a cinematic real-life RPG and behavior-adaptive progression system. It bridges intentional commitment and real-world execution by recording, evaluating, and transforming completed actions into measurable capability and status progression.

### Core Philosophy
1. **Domain-Agnostic Execution Engine**: Cadence does not hard-code assumptions about programming, fitness, academic study, or creative work. Domains, subjects, topics, and keywords are dynamically classified.
2. **Server-Authoritative Truth**: Neither the browser nor an AI model may determine XP, Credits, Level, Rank, Badges, or Capabilities. The server verifies execution times, enforces anti-farming gates, calculates progression, and records immutable historical events.
3. **AI as Interpreter & Selector, Not Author**: AI never creates new assignments, questions, tests, or rewards. It evaluates existing candidate assignments from Cadence's structured library or interprets stored behavioral history.
4. **Three-Provider Resilient AI Layer**: Automatic transparent failover across Gemini → OpenRouter → Groq → Deterministic Fallback Engine.
5. **Two Operating Modes, Equal Prominence**: Manual Mode (user-directed action, Cadence-processed) vs. Commander Mode (Cadence-recommended action based on behavioral modeling).

---

## 2. Contradiction Resolution & Locked Specifications Audit

| Area | Older / Superseded Spec | Final Locked Rule (This Implementation) | Resolution Rationale |
| :--- | :--- | :--- | :--- |
| **Collection / Shop** | Collection page with item purchases, cosmetics, gear, skins | **COMPLETELY REMOVED.** Replaced with **RANK & ACHIEVEMENTS** page. | Cadence has no merchandise economy, character cosmetics, or avatar gear. Progression is reflected via Level, Rank, Badges, Profile Tags, and Capabilities. |
| **XP Multipliers** | Difficulty or streak modifiers to XP | **XP = clamp(estimated_minutes × 5, 10, 500).** Whole integers only. | XP measures personal progression strictly derived from estimated duration, preventing timer manipulation. |
| **Credit Eligibility** | Credits awarded on any completed task | **AI/Adaptive origin ONLY, earned XP > 100, verified completion >= 50% elapsed time.** Manual assignments ALWAYS award 0 Credits. | Credits are scarce and strictly govern Rank/competitive standing. Maximum credit cap per assignment is 25. |
| **Timing & Farming** | Trust client timer or reward on immediate complete | **Server-authoritative 50% minimum execution threshold.** If `elapsedExecutionSeconds < estimatedDurationMinutes * 30`, XP = 0 and Credits = 0. | Prevents instant clicking or timer manipulation. Server calculates elapsed time excluding pauses. |
| **Badges** | Category/habit/domain badges | **Progression badges depend EXCLUSIVELY on Level, Lifetime XP, and Lifetime Credits.** | 23 universal progression badges that apply equally to an athlete, coder, musician, or scholar. Profile Tags handle behavioral traits. |
| **Visual Themes** | Time-of-day / weather theme switching | **EXACTLY TWO mode-based themes: MANUAL vs. COMMANDER.** No time-of-day theme switches. | Visual identity remains focused on the Living World and decision authority. |
| **World Independence** | Coordinates bound to background graphic pixels | **Independent DOM/UI World Layers.** Functional UI markers exist in standalone layer. | Background images can change, scale, or fail without impairing interactive landmarks. |

---

## 3. Database Architecture (CadenceDB & Mongoose)

### 3.1 Connection Layer (`server/config/db_conn.js`)
- Standard Mongoose connection targeting database `CadenceDB`.
- Configured with reconnection logic, unified topology, index building, and a high-fidelity in-memory fallback adapter that mirrors Mongoose collection operations if a local standalone MongoDB daemon is absent in sandboxed dev environments.

### 3.2 Core Schemas & Models
1. **User**: Authentication, email, display name, avatar identifier, operating mode (`MANUAL` | `COMMANDER`), onboarding status, timezone.
2. **UserProgression**: `userId`, `level`, `totalXP`, `currentLevelTitle`, `updatedAt`.
3. **CreditBalance**: `userId`, `totalCredits`, `updatedAt`.
4. **Objective**: `userId`, `title`, `description`, `targetOutcome`, `priority` (`LOW` | `NORMAL` | `HIGH` | `CRITICAL`), `status` (`DRAFT` | `ACTIVE` | `PAUSED` | `COMPLETED` | `ARCHIVED`), `progress` (0–100), `isPrimary`, `targetDate`.
5. **ObjectivePhase**: `objectiveId`, `userId`, `name`, `purpose`, `orderIndex`, `status`, `progress`, `milestonesCount`.
6. **Milestone**: `objectiveId`, `phaseId`, `userId`, `title`, `description`, `completionCriteria`, `status`, `completedAt`.
7. **Habit**: `userId`, `objectiveId`, `title`, `frequencyPerWeek`, `currentAdherence`, `streak`.
8. **Assignment**: `userId`, `objectiveId`, `phaseId`, `habitId`, `title`, `description`, `domain`, `subject`, `topics`, `keywords`, `difficulty` (`ROUTINE` | `STANDARD` | `ADVANCED` | `CHALLENGE`), `estimatedDuration` (minutes), `actualDuration` (minutes), `origin` (`USER` | `ADAPTIVE` | `HABIT` | `SYSTEM`), `status` (`DRAFT` | `SCHEDULED` | `AVAILABLE` | `IN_PROGRESS` | `COMPLETED` | `MISSED` | `SKIPPED` | `CANCELLED`), `completionCriteria`, `whySelected`, `capabilityImpacts` (`intellect`, `discipline`, `focus`, `creativity`, `resilience`, `strength`).
9. **ExecutionSession**: `assignmentId`, `userId`, `serverStartedAt`, `serverCompletedAt`, `pauseIntervals` (`[{ pausedAt, resumedAt }]`), `serverElapsedSeconds`, `rewardEligible`.
10. **UserCapability**: `userId`, `dimension` (`intellect`, `discipline`, `focus`, `creativity`, `resilience`, `strength`), `value` (whole number, baseline 50), `trajectory` (`GROWING` | `STABLE` | `NEGLECTED` | `DECLINING`), `updatedAt`.
11. **CapabilityEvent**: `userId`, `dimension`, `assignmentId`, `amount`, `previousValue`, `newValue`, `reason`, `createdAt`.
12. **BehaviorEvent**: `userId`, `assignmentId`, `eventType` (`STARTED` | `COMPLETED` | `MISSED` | `SKIPPED` | `PAUSED` | `RESUMED`), `metadata`, `createdAt`.
13. **JournalEvent**: Chronological log with `importance` (`LOW` | `NORMAL` | `IMPORTANT` | `MILESTONE`), `eventType` (`ASSIGNMENT` | `PROGRESSION` | `CAPABILITY` | `OBJECTIVE` | `HABIT` | `ADAPTATION` | `ACHIEVEMENT` | `SYSTEM`), `title`, `description`, `metadata`, `occurredAt`.
14. **PerformanceSnapshot**: Aggregate execution rate, consistency, momentum (0–100 & state), streak, capacity, reliability, duration profiles, difficulty profiles.
15. **AdaptiveRecommendation**: `userId`, `assignmentId`, `reasonType`, `signalsUsed`, `previousState`, `newState`, `confidence`.
16. **Badge** & **UserBadge**: 23 canonical progression badges (Level, XP, Credit milestones) with `UNIQUE(userId, badgeId)`.
17. **ProfileTag** & **UserProfileTag**: Evidence-backed behavioral tags.
18. **UserRanking**: Computed leaderboard view ordered by `totalCredits`.
19. **AssignmentPool**: Server-side candidate library for Commander Mode selection.

---

## 4. Authoritative Progression & Reward Formulas

### 4.1 XP Calculation
- Formula: `XP = Math.min(500, Math.max(10, Math.round(estimatedMinutes * 5)))`.
- Always an integer. Based purely on `estimatedDuration`, never actual elapsed duration.

### 4.2 50% Server Execution Gate
- Server calculates `serverElapsedSeconds = (serverCompletedAt - serverStartedAt) - totalPausedSeconds`.
- Required minimum seconds: `requiredSeconds = estimatedDurationMinutes * 30`.
- If `serverElapsedSeconds < requiredSeconds`:
  - `rewardEligible = false`
  - `xpAwarded = 0`
  - `creditsAwarded = 0`
  - Reason: `MINIMUM_EXECUTION_TIME_NOT_REACHED`
- If `serverElapsedSeconds >= requiredSeconds`:
  - `rewardEligible = true`
  - XP calculated normally.

### 4.3 Credit Calculation
- Manual assignment: `credits = 0` ALWAYS.
- Adaptive/AI assignment:
  - If `earnedXP <= 100`: `credits = 0`.
  - If `earnedXP > 100`: `credits = Math.ceil(earnedXP * 0.05)`.
- Maximum credits per assignment = 25.

### 4.4 Non-Linear Level Curve
Levels defined via mathematical milestone curve:
- Lvl 1: 0 XP (The First Step)
- Lvl 2: 100 XP (The Awakening)
- Lvl 3: 250 XP (The Commitment)
- Lvl 4: 450 XP
- Lvl 5: 700 XP (Steady Hand)
- Lvl 6: 1,050 XP
- Lvl 7: 1,500 XP
- Lvl 8: 2,100 XP
- Lvl 9: 3,000 XP
- Lvl 10: 4,500 XP (Disciplined Disciple)
- Lvl 15: 10,000 XP (The Builder)
- Lvl 20: 18,000 XP (Relentless)
- Lvl 30: 35,000 XP (Proven Executor)
- Lvl 40: 60,000 XP (Seasoned)
- Lvl 50: 95,000 XP (Master of Practice)
- Lvl 75: 160,000 XP (Exceptional Executor)
- Lvl 100: 250,000 XP (The Exemplar)

---

## 5. Three-Provider AI Failover Architecture

```
User Request / Commander Selection
                │
                ▼
        AI Provider Manager
                │
         [Provider 1: Gemini] ──── Success ───► Validate Schema ──► Return
                │ (Fail: timeout/rate/auth)
                ▼
      [Provider 2: OpenRouter] ─── Success ───► Validate Schema ──► Return
                │ (Fail: error/quota)
                ▼
         [Provider 3: Groq] ────── Success ───► Validate Schema ──► Return
                │ (Fail: all unavailable)
                ▼
    [Deterministic Cadence Engine]
(Domain-agnostic weighted heuristic:
 30% Objective Need + 25% Success Probability + 20% Priority + 15% Momentum + 10% Difficulty)
```

- Keys stored server-only in environment variables (`GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `GROQ_API_KEY`).
- Circuit breaker & cooldown: failing providers are placed in a 60-second cooldown window before retrying.
- Strict response validation: JSON responses are sanitized and verified against the existing assignment pool IDs.

---

## 6. API Architecture (RESTful Express Routes)

- `/api/auth`: `register`, `login`, `logout`, `me`, `mode`
- `/api/objectives`: CRUD, phase management, milestone completion, health assessment
- `/api/assignments`: CRUD, search, filter, recommended focus
- `/api/assignments/:id/start`: Server records `startedAt` in execution session
- `/api/assignments/:id/pause`: Server records pause timestamp
- `/api/assignments/:id/resume`: Server records resume timestamp
- `/api/assignments/:id/complete`: Authoritative transaction (50% gate, XP, credits, capabilities, level, rank, badges, journal)
- `/api/assignments/:id/skip`: Records skip reason, updates reliability
- `/api/assignments/recommend`: Commander engine selects existing candidate
- `/api/capabilities`: Dimension states, history, contributors, signals
- `/api/performance`: Overview, momentum breakdown, duration profiles, difficulty profiles, keyword performance, learned insights
- `/api/journal`: Paginated timeline, event details, filters, statistics
- `/api/profile`: Identity, level progress, rank status, 23 progression badges, profile tags, journey log
- `/api/rank`: Leaderboard, tiers, credit standings
- `/api/ai/chat`: Context-grounded conversation explaining behavioral history

---

## 7. Frontend UI Architecture & Global Design Tokens

### 7.1 Design Tokens (`src/styles/globals.css`)
- Colors:
  - Canvas: `#06080A` (Obsidian)
  - Surface: `#111213` (Charcoal)
  - Elevated: `#191B1D` (Elevated Charcoal)
  - Warm Graphite: `#2C2825`
  - Text Primary: `#F7F0E4` (Ivory)
  - Text Secondary: `#ABA8AA` (Stone)
  - Text Tertiary: `#7C8995` (Slate)
  - Accent / Progression: `#D8AA78` (Antique Gold)
  - Gold Highlight: `#F7D9A6`
  - Capabilities: Intellect `#72B7F2`, Discipline `#D9AD5A`, Focus `#63D99B`, Creativity `#9B72D6`, Resilience `#E56B63`, Strength `#D98A3A`
- Mode Themes: `theme-manual` vs `theme-commander` applied to the root container.

### 7.2 Core Views
1. **Home**: Living World visualization with independent landmarks, Current Objective journey state, Today's Focus, Upcoming, Capabilities overview, System Insight, Execution summary.
2. **Objectives**: Journey path, phase stepper, milestones, required capabilities, habit linkage, health state.
3. **Assignments**: Current focus banner, search & multi-facet filters, date-grouped list, manual creation modal, execution mode with server timer.
4. **Capabilities**: Radar/hexagonal distribution, selected dimension profile, historical trajectory, activity contributors.
5. **Performance**: Behavioral intelligence dashboard, momentum score, capacity vs resistance, duration/difficulty matrix, what Cadence learned, adaptation history.
6. **Journal**: Chronological archive, date clusters, importance badges, event detail drawer.
7. **Rank & Achievements**: Leaderboard position, credit progress, 23 badges (earned & locked with remaining requirements), evidence-based profile tags.
8. **Profile**: Progression identity summary, level milestone title, journey records.
9. **AI Chat**: Direct conversational intelligence grounded in real behavioral history.

---

## 8. Verification & Test Strategy
- Authentication & JWT token security (HTTP-only cookies + header fallback).
- Execution gate tests: <50% elapsed time yields 0 XP / 0 Credits; >=50% yields formula calculation.
- Origin distinction: Manual produces 0 credits; AI produces `CEILING(XP * 0.05)` when XP > 100.
- Level-up calculation across non-linear thresholds.
- Idempotency test: repeating complete request cannot duplicate rewards.
- AI failover test: simulates provider outages and verifies graceful fallback.
- Mobile responsiveness, ARIA labels, and WCAG AA color contrast audit.
