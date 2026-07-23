import type { TierDef, UpgradeDef, AchievementDef } from "./types";

export const SAVE_KEY = "gig1:save2";
export const TICK_MS = 100;
export const SAVE_INTERVAL_MS = 20_000;
export const OFFLINE_CAP_MS = 8 * 60 * 60 * 1000;
export const OFFLINE_MIN_MS = 60_000;
export const OFFLINE_SIM_STEPS = 900;

/** First milestone at N bought; each next level needs double the previous span (25, 50, 100...). */
export const MILESTONE_FIRST = 25;
export const MILESTONE_MULT = 2;
export const ACH_MULT_EACH = 0.05;
export const SINGULARITY_MULT_EACH = 0.15;
/** Total singularities = floor((log10(lifetime) - CRUNCH_LOG_START) * CRUNCH_LOG_RATE) */
export const CRUNCH_LOG_START = 12;
export const CRUNCH_LOG_RATE = 2.5;

export const TIERS: TierDef[] = [
  { id: "mote",    name: "Mote",    plural: "Motes",    blurb: "Gathers stardust.",            baseCost: 15,     costGrowth: 1.15, baseRate: 0.6,   hue: 42 },
  { id: "comet",   name: "Comet",   plural: "Comets",   blurb: "Sheds a trail of Motes.",      baseCost: 2500,   costGrowth: 1.17, baseRate: 0.05,  hue: 190 },
  { id: "moon",    name: "Moon",    plural: "Moons",    blurb: "Pulls Comets into orbit.",     baseCost: 5e5,    costGrowth: 1.19, baseRate: 0.035,  hue: 220 },
  { id: "planet",  name: "Planet",  plural: "Planets",  blurb: "Gathers Moons around itself.", baseCost: 2.5e8,    costGrowth: 1.22, baseRate: 0.025,  hue: 150 },
  { id: "star",    name: "Star",    plural: "Stars",    blurb: "Forges Planets in its disk.",  baseCost: 4e11, costGrowth: 1.25, baseRate: 0.016, hue: 48 },
  { id: "nebula",  name: "Nebula",  plural: "Nebulae",  blurb: "Condenses newborn Stars.",     baseCost: 2e15, costGrowth: 1.28, baseRate: 0.01, hue: 300 },
  { id: "galaxy",  name: "Galaxy",  plural: "Galaxies", blurb: "Spins up Nebulae.",            baseCost: 2e21,   costGrowth: 1.35, baseRate: 0.005, hue: 262 },
  { id: "cluster", name: "Cluster", plural: "Clusters", blurb: "Binds Galaxies by gravity.",   baseCost: 1e26, costGrowth: 1.42,  baseRate: 0.003,  hue: 350 },
];

export const UPGRADES: UpgradeDef[] = [
  { id: "u-press2",   name: "Firmer Press",      blurb: "Condensing yields ×3 dust.",                cost: 250,    target: "press", mult: 3 },
  { id: "u-mote2",    name: "Sticky Dust",       blurb: "Motes gather ×2 dust.",                     cost: 700,    target: 0, mult: 2 },
  { id: "u-mote3",    name: "Static Charge",     blurb: "Motes gather ×2 dust.",                     cost: 6_000,  target: 0, mult: 2 },
  { id: "u-presspct", name: "Gravity Assist",    blurb: "Condensing also yields 2% of dust/sec.",    cost: 2e4, target: "press", mult: 1, kind: "pressPercent" },
  { id: "u-comet2",   name: "Longer Tails",      blurb: "Comets shed ×2 Motes.",                     cost: 9e4, target: 1, mult: 2 },
  { id: "u-mote4",    name: "Dust Magnetism",    blurb: "Motes gather ×3 dust.",                     cost: 4e5,  target: 0, mult: 3 },
  { id: "u-global1",  name: "Thin Vacuum",       blurb: "Everything produces ×2.",                   cost: 3.5e6,    target: "global", mult: 2 },
  { id: "u-moon2",    name: "Tidal Lock",        blurb: "Moons pull ×2 Comets.",                     cost: 2.5e7,    target: 2, mult: 2 },
  { id: "u-comet3",   name: "Ice Cores",         blurb: "Comets shed ×3 Motes.",                     cost: 1.2e8,    target: 1, mult: 3 },
  { id: "u-planet2",  name: "Ring Systems",      blurb: "Planets gather ×2 Moons.",                  cost: 5e9,  target: 3, mult: 2 },
  { id: "u-global2",  name: "Cold Dark Matter",  blurb: "Everything produces ×2.",                   cost: 9e10,   target: "global", mult: 2 },
  { id: "u-star2",    name: "Heavy Elements",    blurb: "Stars forge ×2 Planets.",                   cost: 4e12,   target: 4, mult: 2 },
  { id: "u-autopress",name: "Standing Wave",     blurb: "The sky condenses itself once per second.", cost: 2e13,   target: "press", mult: 1, kind: "autoPress" },
  { id: "u-nebula2",  name: "Shockfronts",       blurb: "Nebulae condense ×2 Stars.",                cost: 4e15,   target: 5, mult: 2 },
  { id: "u-global3",  name: "Inflation Echo",    blurb: "Everything produces ×3.",                   cost: 1e17,   target: "global", mult: 2 },
  { id: "u-galaxy2",  name: "Spiral Arms",       blurb: "Galaxies spin ×2 Nebulae.",                 cost: 6e21,   target: 6, mult: 2 },
  { id: "u-cluster2", name: "Filaments",         blurb: "Clusters bind ×2 Galaxies.",                cost: 4e26,   target: 7, mult: 2 },
  { id: "u-global4",  name: "Deep Field",        blurb: "Everything produces ×3.",                   cost: 1e28,   target: "global", mult: 2 },
];

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "a-press",   name: "First Light",        blurb: "Condense the void once.",        check: (s) => s.presses >= 1 },
  { id: "a-mote",    name: "It Moves",           blurb: "Own a Mote.",                    check: (s) => (s.tiers[0]?.count ?? 0) >= 1 },
  { id: "a-comet",   name: "Dirty Snowball",     blurb: "Own a Comet.",                   check: (s) => (s.tiers[1]?.count ?? 0) >= 1 },
  { id: "a-moon",    name: "A Moon of Your Own", blurb: "Own a Moon.",                    check: (s) => (s.tiers[2]?.count ?? 0) >= 1 },
  { id: "a-planet",  name: "Pale Dot",           blurb: "Own a Planet.",                  check: (s) => (s.tiers[3]?.count ?? 0) >= 1 },
  { id: "a-star",    name: "Ignition",           blurb: "Own a Star.",                    check: (s) => (s.tiers[4]?.count ?? 0) >= 1 },
  { id: "a-nebula",  name: "Stellar Nursery",    blurb: "Own a Nebula.",                  check: (s) => (s.tiers[5]?.count ?? 0) >= 1 },
  { id: "a-galaxy",  name: "Grand Design",       blurb: "Own a Galaxy.",                  check: (s) => (s.tiers[6]?.count ?? 0) >= 1 },
  { id: "a-cluster", name: "Large Scale",        blurb: "Own a Cluster.",                 check: (s) => (s.tiers[7]?.count ?? 0) >= 1 },
  { id: "a-dust6",   name: "Millionaire",        blurb: "Hold a million dust.",           check: (s) => s.dust >= 1e6 },
  { id: "a-bought",  name: "Patron of Motes",    blurb: "Buy 100 Motes by hand.",         check: (s) => (s.tiers[0]?.bought ?? 0) >= 100 },
  { id: "a-crunch",  name: "Begin Again",        blurb: "Crunch the universe.",           check: (s) => s.crunches >= 1 },
];

/** Hard ceiling to keep math finite. */
export const DUST_CLAMP = 1e300;
