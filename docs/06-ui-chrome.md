# UI and chrome

## Intent

Restrained instrument skin, DELIBERATELY unfinished as art. The plan of
record: ship mechanically complete with only load-bearing visuals real
(rail, wheels, hue ramp, histogram), then hold a JOINT art-direction
session with Christopher with something playable under our hands. That
session has not happened. Do not unilaterally develop "the chrome's voice"
— it's a planned collaborative ritual. Chrome may cohere; it may never
generate nouns.

Current skin: charcoal (#131519), system mono, tier hue as the only color
(TIER_HUES spectral ramp, red→violet, applied via --tc custom property),
neutral white for interactive. No webfonts.

## Anatomy

Portrait, max-width 560. Top ~52%: the rail — vertical spine, deepest tier
at top, tier 1 at bottom, score block beneath (thumb-adjacent). Bottom:
deck with three tabs (BUY / RESET / MORE) and a pinned action slab in the
thumb zone. Tapping a rail node selects that tier and jumps to BUY; deck
chevrons ▲▼ also move selection.

Node three-state law (from playtesting): LIVE (count ≥ 1) sweeps and can
glow; KNOWN-BUT-EMPTY renders dim with a stopped dial ("holding phase");
NEVER-OWNED renders as a dashed ADD slot with a plus and its price — no
dial at all. Post-reset reads as re-igniting a stack of stopped dials.

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
tier hue band, raw text ("2 val +1"), rarity border weight. Sized to
reveal-and-choose; enrichment belongs to the art-direction session.

## CHEAT panel

MORE tab, homage to IG1's CHEAT². ± steppers per tier × stat, hotstart ±,
flywheel toggle, aria-labels `cheat {tier} {stat} +/-` (e2e hooks). Grants
levels WITHOUT pick history so the ladder holds still under testing.
