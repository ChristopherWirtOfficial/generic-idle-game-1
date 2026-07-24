# Generic Idle Game 1

### ▶ [Play it](https://christopherwirtofficial.github.io/generic-idle-game-1/)

A management idle game about a chain of generators. Tier N pays tier N−1;
tier 1 pays score. Nothing is named, nothing has lore — tiers are the numbers
1 to 8 and the currency is a bare score. The chrome is allowed a voice; it is
never allowed to invent a noun.

You do not tap. The only thing you spend is decisions: what to buy, how deep
to push, and when to end the run. Ending it is the real move — a reset burns
your stock and your prices, rolls a hand of upgrades shaped by *how you
actually played that run*, and lets you keep a few forever.

```
pnpm dev     # play it locally
pnpm test    # 67 of them
pnpm sim     # simulate hours of a greedy veteran, print the pacing arc
```

`pnpm sim` is the important one. Every degenerate loop this game has had was
caught there and not by a human playing it.

## If you're changing something

`docs/` is the real documentation — not API notes, but the argument behind
every decision, including the ones that were rejected and why. Start at
[docs/00-INDEX.md](docs/00-INDEX.md).

The one line that matters most, if you read nothing else: **raw content, rich
chrome.** Two complete builds were thrown away learning it.
