/**
 * The log Claude writes to Christopher.
 *
 * This is a communication channel, not a marketing changelog. Rules that keep
 * it useful: newest first; one line you can read at a glance; a body of a few
 * short lines, never a blog post. State decisions AND their costs — a note that
 * only reports wins is a note you stop trusting.
 */

export type LogKind = "shipped" | "choice" | "open" | "running";

export interface LogEntry {
  /** Short, specific, readable on its own. This is the only thing shown collapsed. */
  title: string;
  kind: LogKind;
  /** Grouping label, e.g. a date or a session. */
  when: string;
  /** 2-5 short lines. Kept deliberately tight. */
  body: string[];
}

export const KIND_LABEL: Record<LogKind, string> = {
  shipped: "shipped",
  choice: "call I made",
  open: "open",
  running: "in flight",
};

export const CHANGELOG: LogEntry[] = [
  {
    title: "Should the goal move? The game got ~2x faster",
    kind: "open",
    when: "now",
    body: [
      "Fixing the draw compounded through the chain. Tier 6 now lands at 47m, was 78m. Tier 7 at 96m, never reached before.",
      "1e15 now falls around 2.5h against the ~6-8h it was designed for.",
      "Every draw-side dial was swept; none buys the hours back, because the compression IS the fix working.",
      "The compensator is the scenario goal — content, not mechanism. That one's yours, so I left it alone.",
    ],
  },
  {
    title: "Picked the draw model: shaping, plus two grafts",
    kind: "choice",
    when: "now",
    body: [
      "Five agents explored. I shipped the one that fixed both your complaints at once.",
      "Odds now come from weight^0.45 with a floor and a cap, so no line can landslide and none can hit zero.",
      "The hand is drawn from a bag, so three cards are never the same card. Duplicates went 48% to 0.",
      "Cost was 90% of every offer and speed was 0.3% — a dead stat. Now roughly balanced.",
    ],
  },
  {
    title: "Why you never got the tier 1 value card",
    kind: "choice",
    when: "now",
    body: [
      "Damping was per TIER, so your ~200 tier-1 COST levels suppressed tier-1 VALUE just as hard.",
      "The starved line was being punished for the gorged one. Three of the five agents found this independently.",
      "Now it's per line: cost levels make cost rarer and leave value alone.",
    ],
  },
  {
    title: "The recommended constants were wrong — swept instead",
    kind: "choice",
    when: "now",
    body: [
      "The comparison recommended speed weight 0.75. At that value the sim collapsed to 34 resets.",
      "Swept it properly across seeds and shipped 0.5, which holds 200 resets and a balanced level mix.",
      "Worth saying plainly: shipping the recommendation unverified would have deployed a broken build.",
    ],
  },
  {
    title: "Dev server is pinned to port 5173",
    kind: "shipped",
    when: "now",
    body: [
      "Saves are stored per origin, and the port is part of the origin.",
      "A dev server falling back to 5174 shows an empty save that looks exactly like a lost one.",
      "strictPort now makes a busy port a visible error instead.",
    ],
  },
];
