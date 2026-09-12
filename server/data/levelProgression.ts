// server/data/levelProgression.ts
// Mathematical non-linear Level Threshold Curve for Cadence
// XP determines Level. Credits determine Rank.

export interface LevelThreshold {
  level: number;
  xpRequired: number;
  xpToNext: number;
  title: string;
  badgeId?: string;
}

export const LEVEL_TABLE: LevelThreshold[] = [
  { level: 1, xpRequired: 0, xpToNext: 100, title: 'First Step', badgeId: 'badge_lvl_1' },
  { level: 2, xpRequired: 100, xpToNext: 150, title: 'Awakened' },
  { level: 3, xpRequired: 250, xpToNext: 200, title: 'Committed', badgeId: 'badge_lvl_3' },
  { level: 4, xpRequired: 450, xpToNext: 250, title: 'Initiate' },
  { level: 5, xpRequired: 700, xpToNext: 350, title: 'Steady Hand', badgeId: 'badge_lvl_5' },
  { level: 6, xpRequired: 1050, xpToNext: 450, title: 'Practitioner' },
  { level: 7, xpRequired: 1500, xpToNext: 600, title: 'Disciplined Apprentice' },
  { level: 8, xpRequired: 2100, xpToNext: 900, title: 'Adept' },
  { level: 9, xpRequired: 3000, xpToNext: 1500, title: 'Dedicated Builder' },
  { level: 10, xpRequired: 4500, xpToNext: 1000, title: 'Disciplined Disciple', badgeId: 'badge_lvl_10' },
  { level: 11, xpRequired: 5500, xpToNext: 1000, title: 'Resolute' },
  { level: 12, xpRequired: 6500, xpToNext: 1000, title: 'Tenacious' },
  { level: 13, xpRequired: 7500, xpToNext: 1200, title: 'Persistent' },
  { level: 14, xpRequired: 8700, xpToNext: 1300, title: 'Focused Builder' },
  { level: 15, xpRequired: 10000, xpToNext: 1400, title: 'The Builder' },
  { level: 16, xpRequired: 11400, xpToNext: 1500, title: 'Architect of Habits' },
  { level: 17, xpRequired: 12900, xpToNext: 1600, title: 'Steadfast' },
  { level: 18, xpRequired: 14500, xpToNext: 1700, title: 'Unshakable' },
  { level: 19, xpRequired: 16200, xpToNext: 1800, title: 'Vanguard' },
  { level: 20, xpRequired: 18000, xpToNext: 2000, title: 'Relentless', badgeId: 'badge_lvl_20' },
  { level: 25, xpRequired: 25000, xpToNext: 2500, title: 'Veteran Practitioner' },
  { level: 30, xpRequired: 35000, xpToNext: 3000, title: 'Proven Executor', badgeId: 'badge_lvl_30' },
  { level: 40, xpRequired: 60000, xpToNext: 4000, title: 'Seasoned' },
  { level: 50, xpRequired: 95000, xpToNext: 5000, title: 'Master of Practice', badgeId: 'badge_lvl_50' },
  { level: 75, xpRequired: 160000, xpToNext: 7500, title: 'Exceptional Executor', badgeId: 'badge_lvl_75' },
  { level: 100, xpRequired: 250000, xpToNext: 0, title: 'The Exemplar', badgeId: 'badge_lvl_100' },
];

/**
 * Calculates Level and progress based on total accumulated XP
 */
export function calculateLevelFromXP(totalXP: number): {
  level: number;
  title: string;
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercent: number;
  badgeId?: string;
} {
  const safeXP = Math.max(0, Math.floor(totalXP));
  
  // Find highest level where xpRequired <= safeXP
  let currentTier = LEVEL_TABLE[0];
  let nextTier = LEVEL_TABLE[1];

  for (let i = 0; i < LEVEL_TABLE.length; i++) {
    if (safeXP >= LEVEL_TABLE[i].xpRequired) {
      currentTier = LEVEL_TABLE[i];
      nextTier = LEVEL_TABLE[i + 1] || currentTier;
    } else {
      break;
    }
  }

  // If level is between table entries (e.g. 21 to 24), calculate interpolated level
  let level = currentTier.level;
  let currentLevelBase = currentTier.xpRequired;
  let nextLevelTarget = nextTier.xpRequired > currentTier.xpRequired ? nextTier.xpRequired : currentTier.xpRequired + 1000;

  let progressPercent = 100;
  if (nextLevelTarget > currentLevelBase) {
    const xpIntoLevel = safeXP - currentLevelBase;
    const levelSpan = nextLevelTarget - currentLevelBase;
    progressPercent = Math.min(100, Math.max(0, Math.round((xpIntoLevel / levelSpan) * 100)));
  }

  return {
    level,
    title: currentTier.title,
    currentLevelXP: safeXP,
    nextLevelXP: nextLevelTarget,
    progressPercent,
    badgeId: currentTier.badgeId,
  };
}
