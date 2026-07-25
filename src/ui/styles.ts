export const CSS = String.raw`
:root {
  --bg: #131519;
  --panel: #1A1D23;
  --card: #21252D;
  --edge: #FFFFFF14;
  --text: #E8E6E1;
  --dim: #8B8E96;
  --faint: #565A63;
  --mono: ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace;
  --ease: cubic-bezier(.2, .9, .25, 1);
}
* { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html, body { height: 100%; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--mono);
  overflow: hidden;
  font-variant-numeric: tabular-nums;
}
button { font: inherit; color: inherit; background: none; border: none; cursor: pointer; touch-action: manipulation; }
button:focus-visible { outline: 2px solid var(--text); outline-offset: 2px; }

.app { height: 100dvh; display: flex; flex-direction: column; max-width: 560px; margin: 0 auto; }

/* ---------- Display: the rail ---------- */
.display { flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; padding: 10px 14px 4px; }
.rail { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: flex-end; gap: 2px; overflow: hidden; }
.link { flex: none; width: 2px; height: 10px; margin-left: 29px; background: var(--tc, var(--faint)); opacity: 0.28; border-radius: 2px; }

/* A row is self-contained: dial, readout, and its own actuator. */
.row {
  --tc: hsl(var(--tch));
  /* min-height must clear the buy plate's own box (9px margin + 46px tall),
     or a shrunk row lets the plate overflow into the rail's hidden overflow. */
  flex: 0 1 64px; min-height: 56px;
  display: grid; grid-template-columns: 1fr auto; align-items: start;
  border-radius: 12px; border: 1px solid transparent;
  transition: flex-basis 0.24s var(--ease), background 0.24s var(--ease), border-color 0.24s var(--ease);
}
.row.open { flex: 0 0 auto; background: #FFFFFF06; border-color: hsl(var(--tch) / 0.22); }

.head { grid-column: 1; display: grid; grid-template-columns: 44px 1fr; column-gap: 12px; align-items: center;
  padding: 6px 0 6px 8px; height: 100%; min-width: 0; text-align: left; }
.row.open .head { height: 64px; }
.idcol { position: relative; width: 44px; height: 44px; }
.idcol svg { display: block; position: absolute; inset: 0; width: 44px; height: 44px; }
.txt { min-width: 0; }
.count { display: block; font-size: 21px; font-weight: 700; letter-spacing: 0.01em; line-height: 1.1; }
.row.empty .count { color: var(--faint); }
.row.slot .count { color: var(--faint); font-weight: 400; font-size: 15px; }
.topline { display: flex; align-items: baseline; gap: 9px; min-width: 0; }
.sub { display: flex; align-items: baseline; margin-top: 3px; min-width: 0; }
/* Full width now that levels have moved off this line — this is the number the
   owner asked to see, so it is the last thing that should be truncated. */
/* Sits beside the count, right of it, and is the only thing here allowed to
   ellipsise — levels have their own line now and never compete for this width. */
.flow { flex: 1 1 auto; min-width: 0; text-align: right; font-size: 11.5px; color: var(--dim); line-height: 1.45;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* Levels at rest: quiet enough to ignore, present enough to scan down. Zeros
   stay in place rather than collapsing, so the columns line up row to row. */
.levels { flex: none; display: flex; gap: 7px; font-size: 9.5px; line-height: 1;
  color: var(--faint); font-variant-numeric: tabular-nums; }
.lv { display: inline-flex; align-items: center; gap: 2px; opacity: 0.4; }
.lv.on { opacity: 1; color: var(--dim); }
.lv.on .sglyph { color: var(--tc); }
.lv .sglyph { width: 7px; height: 7px; margin-right: 0; }
.row.open .levels { display: none; }
.flow .pay, .flow .rate { color: var(--text); }
.flow .tgt { color: var(--tc); }
.flow .sep { color: var(--faint); padding: 0 3px; }

/* Outer arc: milestone progress. Inner arc: the cycle, owned by rAF. */
.mtrack { fill: none; stroke: #FFFFFF0F; stroke-width: 2; }
.marc { fill: none; stroke: var(--tc); stroke-width: 2; opacity: 0.62;
  transform: rotate(-90deg); transform-origin: 22px 22px; }
.ctrack { fill: none; stroke: #FFFFFF12; stroke-width: 3; }
.carc { fill: none; stroke: var(--tc); stroke-width: 3; stroke-linecap: round;
  transform: rotate(-90deg); transform-origin: 22px 22px; }
.carc.frozen { stroke: var(--faint); opacity: 0.8; }
.idcol.glow .carc { stroke-dasharray: 1 1 !important; }
.idcol.glow { filter: drop-shadow(0 0 6px var(--tc)); }
.dash { fill: none; stroke: var(--faint); stroke-width: 2; stroke-dasharray: 0.055 0.105; opacity: 0.7; }
.hub { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; color: var(--tc); letter-spacing: 0.02em; }
.row.empty .hub, .row.slot .hub { color: var(--faint); }
.cyc { position: absolute; top: 45px; left: -8px; right: -8px; text-align: center;
  font-size: 9.5px; letter-spacing: 0.06em; color: var(--faint);
  opacity: 0; transform: translateY(-3px); transition: opacity 0.2s var(--ease) 0.06s, transform 0.2s var(--ease) 0.06s; }
.row.open .cyc { opacity: 1; transform: none; }

/* The resting actuator. Its fill is how close the score is to affording it. */
.buy { grid-column: 2; position: relative; overflow: hidden;
  width: 132px; height: 46px; margin: 9px 8px 0 10px; flex: none;
  border-radius: 11px; background: var(--card); border: 1px solid var(--edge);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
  transition: width 0.24s var(--ease), opacity 0.14s var(--ease), margin 0.24s var(--ease), transform 0.12s var(--ease); }
.buy .fill { position: absolute; top: 0; bottom: 0; left: 0; background: hsl(var(--tch) / 0.11);
  box-shadow: 1px 0 0 hsl(var(--tch) / 0.45); }
.buy .lab { position: relative; font-size: 9.5px; letter-spacing: 0.14em; color: var(--faint); }
.buy .amt { position: relative; font-size: 15px; font-weight: 600; color: var(--faint); letter-spacing: 0.01em; }
.buy.can { border-color: hsl(var(--tch) / 0.42); background: hsl(var(--tch) / 0.14); }
.buy.can .lab { color: var(--tc); }
.buy.can .amt { color: var(--text); }
.buy.can:active { transform: translateY(1px); }
.row.empty .buy.can { border-color: hsl(var(--tch) / 0.72); }
.row.slot .buy { border-style: dashed; }
.row.open .buy { width: 0; margin-left: 0; margin-right: 0; opacity: 0; pointer-events: none; }

/* The bloom: four real quantities, each priced with its count. */
.body { grid-column: 1 / -1; display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.24s var(--ease); }
.row.open .body { grid-template-rows: 1fr; }
.bodyin { min-height: 0; overflow: hidden; }
.bodypad { padding: 2px 8px 10px; }
.qgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.q { position: relative; overflow: hidden; height: 64px; border-radius: 10px;
  background: var(--card); border: 1px solid var(--edge);
  display: flex; flex-direction: column; align-items: center; justify-content: center; }
.q .fill { position: absolute; top: 0; bottom: 0; left: 0; background: hsl(var(--tch) / 0.11);
  box-shadow: 1px 0 0 hsl(var(--tch) / 0.45); }
.q .lab { position: relative; font-size: 9.5px; letter-spacing: 0.14em; color: var(--faint); }
.q .n { position: relative; font-size: 10.5px; color: var(--faint); margin-top: 2px; }
.q .amt { position: relative; font-size: 15px; font-weight: 600; color: var(--faint); margin-top: 2px; }
.q.can { border-color: hsl(var(--tch) / 0.42); background: hsl(var(--tch) / 0.14); }
.q.can .lab { color: var(--tc); }
.q.can .n { color: var(--dim); }
.q.can .amt { color: var(--text); }
.q.can:active { transform: translateY(1px); }
.q.mode { border-color: hsl(var(--tch) / 0.58); }
.q.mode .lab { color: var(--tc); }
.q.mode::after { content: ""; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 22px; height: 2px; border-radius: 0 0 2px 2px; background: var(--tc); }

.foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 9px; }
.ms { font-size: 10.5px; color: var(--faint); letter-spacing: 0.04em; white-space: nowrap; }
.ms b { color: var(--dim); font-weight: 400; }
.ms .goal { color: var(--tc); }

/* When the whole chain is on screen there is no headroom for the flow line. */
.rail.tight .row:not(.open) { flex: 0 1 56px; }
.rail.tight .row:not(.open) .flow { display: none; }

.scoreblock { flex: none; padding: 8px 4px 6px; border-top: 1px solid var(--edge); }
.scorenum { font-size: clamp(30px, 9vw, 42px); font-weight: 700; letter-spacing: 0.01em; }
.scoresub { font-size: 12px; color: var(--dim); display: flex; justify-content: space-between; gap: 12px; }
.scoresub b { color: var(--text); font-weight: 400; }

/* ---------- Dock: optional panel, then two fixed rails ---------- */
.dock { flex: none; display: flex; flex-direction: column; min-height: 0; }
.deck {
  flex: 1 1 auto; min-height: 0; max-height: 52vh; display: flex; flex-direction: column;
  background: var(--panel); border-top: 1px solid var(--edge);
  border-radius: 16px 16px 0 0;
}

/* Rail one: the global quantity. Every row prices whatever is selected here. */
.qbar { flex: none; padding: 8px 14px; background: #101216; border-top: 1px solid var(--edge); }
.seg { display: flex; background: var(--card); border: 1px solid var(--edge); border-radius: 11px; padding: 3px; gap: 2px; }
.seg button { flex: 1; text-align: center; font-size: 11.5px; letter-spacing: 0.04em; color: var(--dim);
  padding: 8px 0; border-radius: 8px; white-space: nowrap; }
/* "next milestone" is words, not a glyph — give it the room words need. */
.seg button.wide { flex: 1.9; }
.seg button.on { background: var(--text); color: var(--bg); font-weight: 600; }

/* ---------- Stat vocabulary: drawn glyphs, never emoji ---------- */
.sglyph { width: 9px; height: 9px; flex: none; vertical-align: -0.5px; margin-right: 4px;
  stroke: currentColor; fill: none; }
.sglyph .solid { fill: currentColor; }
.panel { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.scrollarea { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 12px 14px 8px; }

.deckhead { display: flex; align-items: baseline; gap: 10px; padding: 12px 16px 0; }
.deckhead .htier { font-size: 20px; font-weight: 700; color: var(--tc); }
.deckhead .hsub { font-size: 11px; color: var(--dim); }
.deckhead .hspace { flex: 1; }
.deckhead .chev { font-size: 20px; color: var(--dim); padding: 2px 14px; border: 1px solid var(--edge); border-radius: 10px; }
.deckhead .chev:disabled { opacity: 0.25; }

.kv { display: flex; justify-content: space-between; gap: 10px; font-size: 12.5px; padding: 5px 2px; color: var(--dim); }
.kv b { color: var(--text); font-weight: 400; }
.kv .tcol { color: var(--tc); }

.mbar { height: 5px; border-radius: 99px; background: #0D0F12; border: 1px solid var(--edge); overflow: hidden; margin: 4px 0 2px; }
.mfill { height: 100%; background: var(--tc); opacity: 0.85; transition: width 0.2s; }

.chips { display: flex; gap: 6px; }
.chip { font-size: 10px; letter-spacing: 0.06em; color: var(--faint); border: 1px solid var(--edge);
  border-radius: 99px; padding: 3px 8px; white-space: nowrap; }
.chip b { color: var(--dim); font-weight: 400; }
.chip.lit { border-color: hsl(var(--tch) / 0.3); }
.chip.lit b { color: var(--tc); }

.buyrow { flex: none; padding: 6px 14px 10px; display: flex; flex-direction: column; gap: 8px; }
.amounts { display: flex; gap: 8px; justify-content: center; }
.amounts button { font-size: 12px; letter-spacing: 0.06em; color: var(--dim); border: 1px solid var(--edge); border-radius: 99px; padding: 7px 16px; min-width: 60px; }
.amounts button.on { color: var(--bg); background: var(--text); border-color: var(--text); }
.slab {
  width: 100%; min-height: 64px; border-radius: 14px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  background: var(--card); border: 1px solid var(--tc, var(--edge));
}
.slab:active { transform: translateY(1px); }
.slab:disabled { opacity: 0.5; }
.slab .sv { font-size: 16px; font-weight: 700; letter-spacing: 0.03em; }
.slab .sc { font-size: 12px; color: var(--dim); }

/* ---------- Reset panel ---------- */
.threshrow { display: flex; justify-content: space-between; font-size: 12.5px; padding: 5px 2px; color: var(--dim); }
.threshrow b { color: var(--text); font-weight: 400; }
.threshrow.met b { color: #9ED89E; }
.histnote { font-size: 10.5px; line-height: 1.5; color: var(--faint); padding: 2px 2px 0; }
.hist { display: flex; flex-direction: column; gap: 5px; padding: 8px 0; }
.hrow { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--dim); }
.hrow .hlabel { flex: none; width: 74px; text-align: right; white-space: nowrap; }
/* flex, so the floor and earned segments of one bar butt together and the row
   reads as a single length; position:relative anchors the even-split tick. */
.hrow .hbarwrap { position: relative; flex: 1; display: flex; height: 8px; background: #0D0F12; border-radius: 99px; overflow: hidden; }
/* display:block is load-bearing: .hbar is a span, so without it the element
   stays inline and drops width/height entirely. */
.hrow .hbar { display: block; height: 100%; flex: none; }
/* The base slice reads as underpainting, the earned part as the real bar. */
.hrow .hfloor { opacity: 0.3; }
.hrow .hearned { opacity: 0.95; }
.hrow .htick { position: absolute; top: -1px; bottom: -1px; width: 1px; background: var(--text); opacity: 0.3; }
/* A bar that reaches the end is pinned at the cap; say so in the number too. */
.hrow.capped .hbarwrap { box-shadow: inset 0 0 0 1px #FFFFFF26; }
.hrow .hpct { flex: none; width: 30px; text-align: right; font-size: 10.5px; color: var(--faint); }
.hrow.capped .hpct { color: var(--text); }
.resetslab { border-color: var(--text); }
.resetslab .sv { letter-spacing: 0.12em; }

/* ---------- Cards ceremony ---------- */
.veil { position: fixed; inset: 0; background: #0B0C0FE6; display: flex; align-items: center; justify-content: center; padding: 18px; z-index: 50; }
.ceremony { width: 100%; max-width: 420px; display: flex; flex-direction: column; gap: 14px; }
.liq { text-align: center; font-size: 14px; color: var(--dim); }
.liq b { color: var(--text); font-size: 20px; display: block; margin-top: 4px; }
.fan { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; }
.playcard {
  border: 1px solid var(--edge); border-radius: 12px; background: var(--card);
  padding: 12px 10px 10px; text-align: center; min-height: 108px;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px;
  position: relative;
}
.playcard .band { position: absolute; top: 0; left: 0; right: 0; height: 4px; border-radius: 12px 12px 0 0; background: var(--tc, var(--dim)); }
.playcard .big { font-size: 19px; font-weight: 700; color: var(--tc, var(--text)); }
.playcard .small { font-size: 11px; color: var(--dim); }
.playcard.r1 { border-color: #FFFFFF3D; }
.playcard.r2 { border-color: #FFFFFF80; }
.playcard.taken { background: var(--tc, var(--card)); }
.playcard.taken .big, .playcard.taken .small { color: var(--bg); }
.playcard:disabled { opacity: 0.45; }
.ceremony .cere-actions { display: flex; justify-content: center; gap: 12px; align-items: center; }
.ceremony .cere-count { font-size: 13px; color: var(--dim); }
.rerollbtn { padding: 12px 18px; border: 1px solid var(--edge); border-radius: 12px;
  font-size: 12px; letter-spacing: 0.06em; color: var(--dim); }
.rerollbtn b { color: var(--text); font-weight: 400; }
.rerollbtn:disabled { opacity: 0.3; }
.donebtn { padding: 12px 26px; border: 1px solid var(--text); border-radius: 12px; font-size: 14px; letter-spacing: 0.08em; }
.donebtn:disabled { opacity: 0.4; }

/* ---------- More / misc ---------- */
.scenrow { width: 100%; text-align: left; border: 1px solid var(--edge); border-radius: 12px; background: var(--card); padding: 11px 12px; margin-bottom: 8px; display: flex; gap: 12px; align-items: center; }
.scenrow .sname { font-size: 16px; font-weight: 700; min-width: 22px; }
.scenrow .sdiff { flex: 1; font-size: 11.5px; color: var(--dim); line-height: 1.45; }
.scenrow .sflag { font-size: 11px; color: var(--faint); }
.scenrow.active { border-color: var(--text); }
.scenrow.beat .sflag { color: #9ED89E; }
.scenrow:disabled { opacity: 0.4; }
.sectionlabel { font-size: 10.5px; letter-spacing: 0.2em; color: var(--faint); margin: 14px 2px 6px; text-transform: uppercase; }
.cheatrow { display: flex; align-items: center; gap: 8px; padding: 3px 0; font-size: 11px; color: var(--dim); }
.cheatrow .ctier { flex: none; width: 16px; font-size: 13px; font-weight: 700; text-align: center; }
.cheatrow .cgroup { flex: 1; display: flex; align-items: center; gap: 4px; justify-content: center; }
.cheatrow .cstat { color: var(--faint); }
.cheatrow .cl { min-width: 22px; text-align: center; color: var(--text); }
.cheatrow .cbtn { width: 30px; height: 30px; border: 1px solid var(--edge); border-radius: 8px; color: var(--dim); font-size: 14px; }
.cheatrow .cbtn:active { background: var(--card); }
.cheatrow .cwide { width: auto; padding: 0 10px; }
.dangerbtn { width: 100%; border: 1px solid #C86A6A55; color: #D89E9E; border-radius: 12px; padding: 12px; font-size: 13px; margin-top: 12px; }
.dangerbtn.armed { background: #3A2222; }

/* ---------- Log: notes, one at a time ---------- */
.logentry { border-bottom: 1px solid var(--edge); }
.logentry:last-child { border-bottom: none; }
.loghead {
  width: 100%; display: flex; align-items: center; gap: 9px;
  padding: 11px 2px; text-align: left;
}
.logdot { flex: none; width: 6px; height: 6px; border-radius: 99px; background: var(--faint); }
.k-shipped .logdot { background: #9ED89E; }
.k-choice  .logdot { background: #E8C07A; }
.k-open    .logdot { background: #C88B8B; }
.k-running .logdot { background: #8FB8D8; animation: logpulse 2s ease-in-out infinite; }
@keyframes logpulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
.logtitle { flex: 1; font-size: 12.5px; line-height: 1.45; color: var(--text); }
.logentry.open .logtitle { color: var(--text); }
.logentry:not(.open) .logtitle { color: var(--dim); }
.logkind {
  flex: none; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--faint); white-space: nowrap;
}
.logbody { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.22s var(--ease); }
.logentry.open .logbody { grid-template-rows: 1fr; }
.logbodyin { min-height: 0; overflow: hidden; }
.logbodypad { padding: 0 2px 12px 15px; display: flex; flex-direction: column; gap: 7px; }
.logbodypad p { font-size: 11.5px; line-height: 1.6; color: var(--dim); }
.logwhen { font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--faint); }

.tabbar { flex: none; display: flex; border-top: 1px solid var(--edge); background: #101216; padding-bottom: env(safe-area-inset-bottom); }
.tabbar button { flex: 1; padding: 13px 0 14px; color: var(--faint); font-size: 12px; letter-spacing: 0.14em; }
.tabbar button.on { color: var(--text); }

.banner {
  position: absolute; left: 50%; transform: translateX(-50%); bottom: calc(100% + 10px);
  background: #21252DF2; border: 1px solid var(--edge); border-radius: 12px;
  padding: 10px 16px; width: max-content; max-width: 88vw; text-align: center; font-size: 13px;
}
.banner b { display: block; font-size: 14px; }

.modal { background: var(--panel); border: 1px solid var(--edge); border-radius: 16px; padding: 22px 20px; max-width: 340px; width: 100%; text-align: center; }
.modal h3 { font-size: 16px; margin-bottom: 10px; letter-spacing: 0.04em; }
.modal p { font-size: 13px; color: var(--dim); line-height: 1.55; }
.modal .mrow { font-size: 14px; margin: 8px 0; }
.modal button { margin-top: 16px; width: 100%; min-height: 50px; border-radius: 12px; background: var(--card); border: 1px solid var(--edge); font-size: 14px; }

/* Phones: the plate was eating a third of the width, which is what forced the
   flow line to ellipsise in the first place. */
@media (max-width: 430px) {
  .buy { width: 96px; margin-left: 5px; margin-right: 2px; }
  .display { padding-left: 8px; padding-right: 8px; }
  /* Tier 1 carries both the widest count and the longest flow, so both give a
     little rather than the rate getting cut off the end. */
  .count { font-size: 18px; }
  .flow { font-size: 10.5px; letter-spacing: -0.01em; }
  .flow .sep { padding: 0 2px; }
  .topline { gap: 7px; }
}

@media (prefers-reduced-motion: reduce) {
  .mfill { transition: none; }
  .slab:active { transform: none; }
}
`;
