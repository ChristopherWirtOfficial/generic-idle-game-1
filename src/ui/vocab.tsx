import type { BuyAmount, Stat } from "../game/types";

/**
 * One vocabulary for the whole instrument. Stats are named in words — the
 * abbreviations were only ever legible to whoever wrote them — and each carries
 * a tight geometric glyph so the same idea reads the same way everywhere it
 * appears: on a row, on a card, in the pool histogram, in the cheat panel.
 *
 * Glyphs are drawn, never emoji: this skin has one typeface and one colour ramp
 * and an emoji would import a whole foreign palette.
 */
export const STAT_NAME: Record<Stat, string> = {
  speed: "speed",
  value: "value",
  cost: "cost",
};

/** What a level in this stat actually does, in plain words. */
export const STAT_EFFECT: Record<Stat, string> = {
  speed: "cycles faster",
  value: "pays more",
  cost: "costs less",
};

/**
 * speed  ›› two chevrons: rate.
 * value  ▲  up: more comes out.
 * cost   ▼  down: less goes in.
 * Direction carries the meaning, so the three never blur together.
 */
export function StatGlyph({ stat }: { stat: Stat }): JSX.Element {
  return (
    <svg className="sglyph" viewBox="0 0 10 10" aria-hidden focusable="false">
      {stat === "speed" && (
        <path d="M1.2 2.2 L4.4 5 L1.2 7.8 M5.4 2.2 L8.6 5 L5.4 7.8" fill="none" strokeWidth="1.4"
          strokeLinecap="round" strokeLinejoin="round" />
      )}
      {stat === "value" && <path className="solid" d="M5 1.9 L8.6 7.6 L1.4 7.6 Z" strokeWidth="1.2" strokeLinejoin="round" />}
      {stat === "cost" && <path className="solid" d="M5 8.1 L1.4 2.4 L8.6 2.4 Z" strokeWidth="1.2" strokeLinejoin="round" />}
    </svg>
  );
}

/** Stat with its glyph, for inline use. */
export function StatTag({ stat }: { stat: Stat }): JSX.Element {
  return (
    <>
      <StatGlyph stat={stat} />
      {STAT_NAME[stat]}
    </>
  );
}

/** Buy quantities: full words where there is room. */
export function amountLabel(a: BuyAmount): string {
  if (a === "max") return "max";
  if (a === "milestone") return "next milestone";
  return `×${a}`;
}

/**
 * Short form for the row plate, where the label shares 132px with a count.
 * On a tier holding nothing the milestone step IS the unlock, so it says so —
 * calling it "milestone" there would name the wrong goal.
 */
export function amountShort(a: BuyAmount, unlocking = false): string {
  if (a === "max") return "max";
  if (a === "milestone") return unlocking ? "unlock" : "milestone";
  return `×${a}`;
}
