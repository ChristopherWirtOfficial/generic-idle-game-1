# UI and chrome

## Intent

Restrained instrument skin. The plan of record was: ship mechanically
complete with only load-bearing visuals real, then hold a JOINT
art-direction session with Christopher with something playable under our
hands. **Pass 01 has now happened** (see below). Chrome may cohere; it may
never generate nouns.

Current skin: charcoal (#131519), system mono, tier hue as the only color
(TIER_HUES spectral ramp, red→violet, applied via --tc / --tch custom
properties), neutral white for interactive. No webfonts.

## Art-direction pass 01 — the self-contained row

Four independent directions were generated against written problem
statements and compared side by side (Ledger, Channel strip, Bloom,
Concentric). Christopher picked **Bloom**, with one amendment: keep the
BUY/RESET/MORE tabs rather than folding RESET/MORE into the action bar —
two stacked bottom rails is fine.

What died: the BUY tab as a one-tier detail panel, the pinned action slab,
the ▲▼ chevron selection, and the scrolling `kv` table. Buying is now
inline on the row, so the context switch that motivated all of it is gone.

Corrections Christopher made to the brief, worth keeping:
- Showing "unlock cost" for a tier you ALREADY hold is not a user story.
  Price matters in the KNOWN-BUT-EMPTY state — a new run where you've
  unlocked the tier before but hold none yet.
- Empty space above a short chain is NOT a defect; it reads as "there is
  more to unlock." Do not fill it for its own sake.
- ×1/×10/MAX all survive; →milestone is an ADDITION, not a replacement.

## Anatomy

Portrait, max-width 560. The rail owns the whole display: deepest tier at
top, tier 1 at bottom, score block beneath (thumb-adjacent). Below that,
two fixed rails: the global quantity segment (×1 / ×10 / MAX / →×N) and
the tab bar (BUY / RESET / MORE). RESET and MORE open a panel above those
rails; BUY shows no panel, giving the chain full height.

Each row is self-contained: dial, count, flow line, and its own buy plate.
Tapping a row blooms it open (one at a time) to reveal the four quantities
as real targets — each showing its COUNT and its COST — plus hand-bought
milestone progress, the stat chips, and cycle time under the dial.

**The global quantity re-prices the entire chain.** Selecting →×N makes
every row show its own cost-to-next-milestone simultaneously, so "what
would it take to double this" is a glance down the rail, not a per-tier
lookup. This is the pass's best single idea.

The dial carries two concentric arcs: the inner one is the cycle, owned by
the rAF loop so it shows true phase; the outer one is milestone progress,
which only moves when you buy by hand. The tier numeral sits in the hub.

Node three-state law (from playtesting, still in force): LIVE (count ≥ 1)
sweeps and can glow; KNOWN-BUT-EMPTY renders dim with a stopped dial
("holding phase") and its price plate is the brightest thing on the row;
NEVER-OWNED renders as a dashed slot with no live dial. Post-reset reads
as re-igniting a stack of stopped dials.

The buy plate's fill is score ÷ cost, so an unaffordable price still tells
you how close you are — quantitative, not decorative.

## Animation architecture

Economy ticks at 10Hz (TICK_MS 100). Wheels do NOT render from ticks: a
single rAF loop in Rail owns the arc attribute, extrapolating each live
wheel's phase from (now − tickedAt)/period and writing stroke-dasharray
directly — React only mounts elements and toggles classes. Details that are
deliberate: extrapolation clamps at full until the tick lands the
completion (crisp payout snap, no overshoot); frozen wheels don't
extrapolate; glow renders as a full ring with drop-shadow. jsdom guard:
loop only starts if requestAnimationFrame exists.

## Ceremony

RESET slab → rollDraw → veil with cash-out figure and the card fan →
toggle-take picks → KEEP → applyPick each → doReset → land on BUY. Cards:
tier hue band, raw text ("2 value +1"), rarity border weight. Sized to
reveal-and-choose; enrichment belongs to the art-direction session.

## CHEAT panel

MORE tab, homage to IG1's CHEAT². ± steppers per tier × stat, hotstart ±,
flywheel toggle, aria-labels `cheat {tier} {stat} +/-` (e2e hooks). Grants
levels WITHOUT pick history so the ladder holds still under testing.
