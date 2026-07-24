# The graveyard and the parking lot

## Rejected (do not resurrect without new arguments)

**Capacity gating.** Bought count as pipe width; production above capacity
pools as backlog. Christopher: "How is anything above t1 useful if it only
pumps into a backlog… That's stupid." Precisely why: produced units become
strictly redundant — purchased width is already fully productive, so the
entire chain above tier 1 contributes nothing. "I deleted the game's
founding mechanic in order to balance it." The correct governor was the
reset all along. The salvageable instinct became automation-as-content
(machine buyers, deferred below).

**Tap/press mechanic.** Dead. Engagement currency is decisions per minute,
not inputs per minute. IG1 is management; midgame choice density needs no
clicker.

**Flat per-reset global multiplier.** All power flows through picks. A
side-channel multiplier would dilute the draw as the whole story.

**bestRun-coupled reset thresholds** (threshold = bestRun/50). Self-scaling
and raw, but deep pushes would raise your chain floor retroactively —
punishing exploration. The picks-ladder is monotone in earned power, not in
exploration choices.

**Multiplicative tableau stacking.** Overflowed to Infinity. Additive
levels replaced it (see 03).

**Payout flooring for integer production.** Rejected because floor makes a
fresh val pick do nothing for a small holder — a dead stat at the exact
moment of the pick. Integer POTENCY instead.

**Full dot-matrix/pixel cloning of IG1's skin.** "Wears their clothes."
Also the general pattern: don't let any chrome theme become the game.

**CSS-transition arc animation.** Considered for the stutter fix; rejected
for rAF ownership: transitions tween the wrap-around backwards and mush the
payout snap. The snap at completion is honest chrome.

## Deferred forks (live, revisit deliberately)

**Deckbuilder-adjacent picks.** Christopher: "A deckbuilder adjacent idea
could be SICK but we'll find our way somewhere and see if it happens to be
there or not." Cards are a PLACEHOLDER concept for multi-choice upgrade.
The literal version — picks form a deck, runs draw an active hand, dead
picks dilute — is the more original, riskier game; it fights
permanence-comfort. Current implicit-sculpting pool is deckbuilder-adjacent
(you build the distribution, not the hand). Watch whether the game drifts
toward wanting the literal version.

**Machine buyers (automation as earned content).** Designed, unbuilt: pool
exotics that spend real income against the real price curve to hand-buy a
tier. Price geometry brakes them naturally; they make cst immortal (cheaper
units → machines buy faster, forever). Strong-version risk already known:
if machine-buying were the ONLY growth engine, price curves damp growth to
log-of-log sludge — it must sit ON the free-running chain, never replace it.

**Fork topology.** Two tiers feeding one, or one feeding two. TierDef's
target/efficiency covers dead links and bridges (s4) but not multi-target.
Data-model change; scenario content when wanted.

**Hot-start as run-opening commitment.** The original "seed 2": run opens
WITH a binding choice (prime a generator / accept a constraint for richer
yield). Partially absorbed into the hotstart exotic + warm phases;
Christopher: "I like the idea of the hot start but we'll have to refine
what works… it still can't be the only way to not have the cycle based
problems." The full commitment-choice opening remains unexplored.

**CUSTOM scenario (Game God).** Locked "SOON" slot exists. Vision: knobs
over the scenario config (growth, spans, periods, goals) and possibly
topology. Unlock after beating s5.

## Waffles and uncertainties (honest state)

- **Tier 1 (2s) → tier 2 (10s) is a 5× period step** where every other rung
  is 2×. Might read as workhorse-vs-first-era; might feel like a gap.
  Tier 2 comes down to 6–8s easily if Christopher feels it.
- **s3–s5 goals are set with margin, not sim-verified.** s2 spot-checked
  (first reset ~18.5m, harsher by design). Goals may need moving after real
  play.
- **Early chain spin-up** (resets 2–5 after the first) still has multi-minute
  gaps before picks compound. Sim says it tightens by ~30m; nobody has
  played it honestly yet.
- **Histogram placement.** Strategy surface lives on the RESET tab only. A
  persistent mini-strip was considered and parked for the art-direction
  session.
- **Ladder feel at very high pick counts.** The (1+0.12P)² treadmill is
  sim-stable but treadmills can FEEL bad; watch for it in real late-game.
- **Score glyph.** None, by default-approval. Revisit only if Christopher
  raises it.
- **Pool-question provenance.** The implicit-sculpting pool was Claude's
  recommended fork; Christopher approved the direction wholesale ("you've
  got all the vibes") without individually picking it over explicit deck
  editing. It's shipped and working, but it's approved-by-default, not
  independently chosen — relevant if the deckbuilder fork ever reopens.
- **Save migration.** Key is gig1:save3; revive is hardened but there's no
  cross-version migration policy. Old saves keep old mid-run states (e.g. a
  pre-freebie run stays unit-less until its next reset) — that's by design
  (never mutate saves) but caused one confused playtest; see 07 on artifact
  staleness forensics.
- **Reduced motion.** rAF wheels ignore prefers-reduced-motion; CSS handles
  only bar transitions. Unaddressed.
