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
.display { flex: 11 1 0; min-height: 0; display: flex; flex-direction: column; padding: 10px 14px 4px; }
.rail { flex: 1; min-height: 0; display: flex; flex-direction: column; justify-content: flex-end; gap: 2px; overflow: hidden; }
.node {
  display: flex; align-items: center; gap: 12px;
  padding: 2px 4px; border-radius: 10px;
  min-height: 0; flex: 1 1 0; max-height: 64px;
  text-align: left;
}
.node.sel { background: #FFFFFF0A; }
.node .wheel { flex: none; position: relative; width: 40px; height: 40px; }
.node .wheel svg { display: block; }
.node .wheel .ghost { stroke: #FFFFFF1A; }
.node .wheel .arc { transition: none; }
.node.glowing .wheel { filter: drop-shadow(0 0 6px var(--tc)); }
.node .ncount { font-size: 16px; font-weight: 700; letter-spacing: 0.02em; min-width: 76px; }
.node .nmeta { flex: 1; font-size: 11px; color: var(--dim); line-height: 1.5; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.node .nmeta b { color: var(--text); font-weight: 400; }
.node .ntag { flex: none; font-size: 11px; color: var(--tc); }
.node.locked { opacity: 0.4; }
.link { flex: none; width: 2px; height: 8px; margin-left: 23px; background: var(--tc, var(--faint)); opacity: 0.35; }

.scoreblock { flex: none; padding: 8px 4px 6px; border-top: 1px solid var(--edge); }
.scorenum { font-size: clamp(30px, 9vw, 42px); font-weight: 700; letter-spacing: 0.01em; }
.scoresub { font-size: 12px; color: var(--dim); display: flex; justify-content: space-between; gap: 12px; }
.scoresub b { color: var(--text); font-weight: 400; }

/* ---------- Deck ---------- */
.deck {
  flex: 10 1 0; min-height: 0; display: flex; flex-direction: column;
  background: var(--panel); border-top: 1px solid var(--edge);
  border-radius: 16px 16px 0 0;
}
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

.chips { display: flex; gap: 6px; flex-wrap: wrap; padding: 6px 0 2px; }
.chip { font-size: 11px; padding: 3px 8px; border: 1px solid var(--edge); border-radius: 99px; color: var(--dim); }
.chip.lit { color: var(--tc); border-color: var(--tc); }

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
.hist { display: flex; flex-direction: column; gap: 5px; padding: 8px 0; }
.hrow { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--dim); }
.hrow .hlabel { flex: none; width: 56px; text-align: right; }
.hrow .hbarwrap { flex: 1; height: 8px; background: #0D0F12; border-radius: 99px; overflow: hidden; }
.hrow .hbar { height: 100%; border-radius: 99px; }
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
.dangerbtn { width: 100%; border: 1px solid #C86A6A55; color: #D89E9E; border-radius: 12px; padding: 12px; font-size: 13px; margin-top: 12px; }
.dangerbtn.armed { background: #3A2222; }

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

@media (prefers-reduced-motion: reduce) {
  .mfill { transition: none; }
  .slab:active { transform: none; }
}
`;
