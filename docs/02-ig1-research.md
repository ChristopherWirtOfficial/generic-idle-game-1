# The reference: "Idle Game 1" by cem

This is the taste document. Christopher: "I LOVE that game even with this
problem" and "I wanna want to play this game" — that's the north star: build
the game Christopher wants to want to play. We are NOT cloning IG1; we share
its *language and shape* with a different quintessence. Theirs is
random-boost prestige strategy; ours is the chain.

## What it is

Minimalist incremental on iOS/Android. Store copy: "A Minimalist Incremental
Game!" designed "for experienced incremental game players with special
emphasis on random upgrades… for incremental game purists and experienced
grinders." Colored generators (heat ramp), ring dials, dot-matrix numerals,
badge chips, honest labels: ALL, ADD NEXT, ×1/×M, and a CHEAT² button
(single-use paid/earned items that let you *choose* your boost instead of
rolling — gloriously honest name). Three boost types per generator color:
production value, cycle speed, cost reduction. Each prestige hands you a
random (color × boost) roll; reviewers complain about 1-in-18 odds for the
combo you want. A notorious "6th gear" wall takes weeks. Offline does NOT
earn; it charges a prestige multiplier for your next reset — an accident (or
choice) Christopher admires.

## Christopher's dissection (the important part)

**The cold-open flaw.** Every run starts at zero cash with one gen 1, which
is slow (income every 5+ seconds) and has no upgrades except what prestige
rolled. Rolls only cover generators unlocked so far across all runs — so
pushing deep dilutes the pool exactly when you need gen-1 speed most, and
every run opens with the same choiceless wait. "You see the problem? But
it's SO close to the right shape."

**The folklore lever.** If you know to reset shallow (first ~3 gens only,
over and over), the pool stays concentrated and you quickly stack gen-1
speed. "It's a strength on accident" — the strategy exists but the game
never shows you the roll table, so it's folklore, not interface. Rescue
valve: roll magnitude rises with depth/time, so one lucky deep hit erases
the bottleneck — "a blip, not a totally foundational flaw."

**Dead stats, the sin.** Speed upgrades bottom the cycle out at max rate,
where payouts become effectively continuous and the ring "just glows with
constant activity" — a moment Christopher loves — but past that floor,
further speed does NOTHING. Cost reduction likewise dies once you can buy
the max count. His principle: degeneration over time is fine, "but it
shouldn't ever be asymptotic or a piecewise function. It should still be
'eh, at least it affects my bottom line' at the upper limits."

**Ceremony.** Reset animations run 4–10s and quickly outlast the runs
between prestiges. "This is actually fine and feels fun" — because the
animation IS the information: you're watching the rolls lock in. Not a
waiting period; a reveal sized to its content. Chained
ceremony-longer-than-run play is a celebrated optimization style, not an
exploit: "Part of what's fun is feeling like you can optimize the
incremental in ways not every incremental lets you."

**Layer structure.** A "run" spans many prestiges over hours/days. Beat it
and you replay under different config — scaling laws change (geometric vs
exponential, different bases), some scenarios easier, some WAY longer. After
the ~6 prescribed scenarios you unlock "Game God": specify your own combo.
"As scenarios, the conceit works."

## What we took, what we changed

Took: raw numbered content + rich instrument chrome; the discrete→glow
graduation (renderer-only in ours); decisions-per-minute as engagement (no
tap spot — "Idle Game 1 is, in some sense of the word, management");
random-upgrade prestige density; ceremony-as-reveal; offline-as-preparation;
scenario layer with reach goals; honest labels (our CHEAT panel is direct
homage).

Changed: the pool is visible and *sculpted by behavior* (the folklore lever
moved into the interface); draws are choose-from-N, not pure rolls; no dead
stats anywhere (speed floor lives only in the renderer; no purchase caps);
runs open into a live wheel, not a choiceless wait; our layer-2 scenarios
vary topology (dead links, bridges) as well as scaling math.
