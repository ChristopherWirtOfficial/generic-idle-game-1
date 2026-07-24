# Process: how this collaboration works

## Sentiment over prescription

Christopher's standing instruction, from the first rejection onward:
"ignore my prescription and try to find and hear my sentiments." When he
gives numbers ("start at 5… more like .5/s… scale the cost accordingly
idk"), the numbers are anchors and the "idk" is real license — implement
the felt target, then sim-verify the whole arc still holds. When he
describes a problem ("Instantly I'm turned off and confused…"), diagnose
the underlying principle violation, not just the pixel. He is
descriptivist/effect-oriented: reviews arrive as felt experience from
playing on his phone, often with screenshots. Screenshots are forensic
evidence — read the numbers in them carefully (one screenshot's "0.53/s"
proved a mechanic worked while its display lied; another's "score 5"
proved a stale artifact).

## Design conversations are peer conversations

The v3 design emerged from dialogue, not spec-taking: Claude proposes forks
with a stated lean, Christopher vetoes or blesses. "Assuming I still know
better than you, what questions do you have for me" — bring discriminating
questions, not laundry lists. A vetoed idea gets a precise post-mortem
("it's worth being precise about WHY it's stupid"), not a defense. Ideas
are "thoughts, not ideas per se" until blessed.

## Ship rhythm

Mechanically-complete stabs, restrained visuals, then iterate on felt
problems from play. Every economy change: run the sim, eyeball the whole
arc (docs/05 checklist). Every change: tsc, smoke, build, flatten, SSR
smoke, dom e2e (twice if anything touched timing/randomness — two flakes
have been caught by double-running), commit with a message that states the
principle, ship the flattened artifact AND refresh the zip. The dom e2e
must exit explicitly (live intervals hang node) and uses seeded Math.random
(real randomness made HOTSTART picks flake an assertion ~10% of runs).

## The honest-instrument standard

Three shipped bugs were the display lying (floored prices, floored 1.75
value, sweeping unowned wheels). Treat any divergence between shown and
true as a bug of the same severity as an economy error. New displays: ask
"is this exactly true?" before "is this pretty?"

## Artifact-vs-repo forensics

The chat-artifact pipeline can serve stale bundles and old saves persist
old mid-run states. When "the fix didn't work": check whether the visible
state is one the current code can even produce (the score-5 tell). This
ambiguity is why the project moved to Claude Code + this repo.

## Standing constraints

Mobile-first replies and thumb-first UI. This is a personal creative
project of Christopher's ("I wanna want to play this game") — the player
base is him, veteran incremental taste, and design calls default to his
felt experience over genre convention.
