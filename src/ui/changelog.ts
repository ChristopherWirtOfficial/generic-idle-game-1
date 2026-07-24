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
