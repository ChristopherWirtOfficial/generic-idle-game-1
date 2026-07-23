/** The entire save. One object, no cleverness. */
export interface GameState {
  /** Save schema version. */
  v: number;
  /** Current spendable points. */
  points: number;
  /** Points earned this run (resets on prestige). */
  runEarned: number;
  /** Points earned ever (never resets). */
  everEarned: number;
  /** Button presses, ever. */
  presses: number;
  /** Owned count per generator, indexed like GENERATORS. */
  gens: number[];
  /** Ids of purchased upgrades (this run). */
  upgrades: string[];
  /** Ids of unlocked achievements (kept forever). */
  achievements: string[];
  /** Prestige points (kept forever). */
  pp: number;
  /** Times reset. */
  resets: number;
  /** Active play time in ms. */
  playedMs: number;
  /** Last tick / save timestamp, epoch ms. */
  lastSeen: number;
}

export type BuyAmount = 1 | 10 | "max";

export type TabId = "buy" | "improve" | "reset" | "numbers";

export interface GeneratorDef {
  name: string;
  blurb: string;
  baseCost: number;
  baseRate: number;
}

export type UpgradeKind =
  | { kind: "press"; mult: number }
  | { kind: "global"; mult: number }
  | { kind: "gen"; gen: number; mult: number }
  | { kind: "allGens"; mult: number }
  | { kind: "pctPress" }
  | { kind: "autoPress" };

export interface UpgradeDef {
  id: string;
  name: string;
  blurb: string;
  cost: number;
  effect: UpgradeKind;
}

export interface AchievementDef {
  id: string;
  name: string;
  test: (s: GameState) => boolean;
}
