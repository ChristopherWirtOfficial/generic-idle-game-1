export interface TierDef {
  id: string;
  name: string;
  plural: string;
  /** What this tier does, in the game's voice. */
  blurb: string;
  baseCost: number;
  costGrowth: number;
  /** Units of the tier below (or dust, for tier 0) produced per second per unit. */
  baseRate: number;
  /** Hue anchor for UI (H in HSL). */
  hue: number;
}

export interface UpgradeDef {
  id: string;
  name: string;
  blurb: string;
  cost: number;
  /** Tier index this multiplies, or "press" | "global". */
  target: number | "press" | "global";
  mult: number;
  /** Special behaviors. */
  kind?: "pressPercent" | "autoPress";
}

export interface AchievementDef {
  id: string;
  name: string;
  blurb: string;
  check: (s: GameState) => boolean;
}

export interface TierState {
  /** Total owned, including produced fractions. */
  count: number;
  /** Bought by hand — drives milestones. */
  bought: number;
}

export interface GameState {
  dust: number;
  lifetimeDust: number;
  runDust: number;
  tiers: TierState[];
  upgrades: string[];
  achievements: string[];
  singularities: number;
  crunches: number;
  presses: number;
  startedAt: number;
  lastSeen: number;
}

export interface OfflineReport {
  awayMs: number;
  creditedMs: number;
  dustGained: number;
}
