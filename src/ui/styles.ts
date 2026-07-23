export const CSS = String.raw`
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap');

:root {
  --void: #0B0A1A;
  --veil: #15132B;
  --deck: #1C1938;
  --card: #242051;
  --edge: #35306388;
  --starlight: #F2EFFF;
  --dim: #9A93C4;
  --faint: #635D8F;
  --dust: #F5C86B;
  --dust-deep: #C89339;
  --danger: #FF7A85;
  --sg: "Space Grotesk", system-ui, sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html, body { height: 100%; }
body {
  background: var(--void);
  color: var(--starlight);
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
}
button { font: inherit; color: inherit; background: none; border: none; cursor: pointer; touch-action: manipulation; }
button:focus-visible { outline: 2px solid var(--dust); outline-offset: 2px; }

.app {
  height: 100dvh;
  display: flex;
  flex-direction: column;
  max-width: 560px;
  margin: 0 auto;
}

/* ---------- Sky ---------- */
.sky {
  position: relative;
  flex: 11 1 0;
  min-height: 0;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}
.sky canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.sky .readout {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  pointer-events: none;
  padding-bottom: 8vh;
}
.sky .dustnum {
  font-family: var(--sg);
  font-weight: 700;
  font-size: clamp(34px, 11vw, 52px);
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
  color: var(--dust);
  text-shadow: 0 0 24px #F5C86B44, 0 2px 0 #00000066;
}
.sky .dustlabel {
  font-family: var(--sg);
  font-size: 13px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--dim);
}
.sky .rate { font-variant-numeric: tabular-nums; font-size: 15px; color: var(--starlight); opacity: 0.85; }
.sky .rate b { color: var(--dust); font-weight: 600; }
.sky .singchip {
  margin-top: 10px;
  font-family: var(--sg);
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #D9B7FF;
  background: #2A1E4DCC;
  border: 1px solid #6C4FA455;
  border-radius: 999px;
  padding: 4px 12px;
}
.sky .hint {
  position: absolute;
  bottom: 12px;
  width: 100%;
  text-align: center;
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--faint);
  pointer-events: none;
  animation: hintpulse 2.4s ease-in-out infinite;
}
@keyframes hintpulse { 0%,100% { opacity: 0.45; } 50% { opacity: 0.9; } }

.floaty {
  position: absolute;
  font-family: var(--sg);
  font-weight: 500;
  font-size: 15px;
  color: var(--dust);
  text-shadow: 0 0 10px #F5C86B66;
  pointer-events: none;
  animation: floatup 0.9s ease-out forwards;
  transform: translate(-50%, 0);
  white-space: nowrap;
}
@keyframes floatup {
  from { opacity: 1; translate: 0 0; }
  to { opacity: 0; translate: 0 -46px; }
}

/* ---------- Deck ---------- */
.deck {
  flex: 10 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--veil), var(--deck));
  border-top: 1px solid var(--edge);
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -12px 40px #05040E99;
}
.panel { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.scrollarea { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 14px 14px 8px; }

/* Build */
.pager { flex: 1; min-height: 0; display: flex; align-items: stretch; padding: 10px 4px 0; }
.chev {
  width: 52px;
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--sg);
  font-size: 26px;
  color: var(--dim);
  border-radius: 14px;
}
.chev:active { background: #ffffff10; }
.chev:disabled { opacity: 0.2; }
.tiercard {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 7px;
  padding: 10px 6px;
  text-align: center;
}
.tiercard .tname {
  font-family: var(--sg);
  font-weight: 700;
  font-size: 26px;
  letter-spacing: 0.02em;
  color: var(--tierc, var(--starlight));
  text-shadow: 0 0 18px color-mix(in srgb, var(--tierc, #fff) 35%, transparent);
}
.tiercard .tblurb { font-size: 13px; color: var(--dim); }
.tiercard .towned {
  font-family: var(--sg);
  font-variant-numeric: tabular-nums;
  font-size: 19px;
}
.tiercard .towned small { font-size: 12px; color: var(--dim); font-family: system-ui; }
.tiercard .tfeed { font-size: 12px; color: var(--dim); font-variant-numeric: tabular-nums; }
.tiercard .tfeed b { color: var(--tierc, var(--starlight)); font-weight: 600; }
.tiercard .tlocked {
  font-family: var(--sg);
  font-size: 15px;
  color: var(--faint);
  letter-spacing: 0.12em;
}

.milestone { display: flex; flex-direction: column; gap: 4px; margin-top: 2px; }
.milestone .mbar {
  height: 6px;
  border-radius: 999px;
  background: #100E24;
  border: 1px solid var(--edge);
  overflow: hidden;
}
.milestone .mfill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, color-mix(in srgb, var(--tierc) 60%, transparent), var(--tierc));
  transition: width 0.25s ease;
}
.milestone .mlabel { font-size: 11px; color: var(--faint); font-variant-numeric: tabular-nums; }
.milestone .mlabel b { color: var(--dim); }

.buyrow { flex: none; padding: 4px 14px 10px; display: flex; flex-direction: column; gap: 8px; }
.amounts { display: flex; gap: 8px; justify-content: center; }
.amounts button {
  font-family: var(--sg);
  font-size: 13px;
  letter-spacing: 0.06em;
  color: var(--dim);
  border: 1px solid var(--edge);
  border-radius: 999px;
  padding: 7px 16px;
  min-width: 62px;
}
.amounts button.on { color: var(--void); background: var(--dim); border-color: var(--dim); }
.buyslab {
  width: 100%;
  min-height: 68px;
  border-radius: 16px;
  font-family: var(--sg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--tierc, #888) 32%, var(--card)), var(--card));
  border: 1px solid color-mix(in srgb, var(--tierc, #888) 45%, transparent);
  box-shadow: 0 6px 22px color-mix(in srgb, var(--tierc, #000) 18%, transparent);
}
.buyslab:active { transform: translateY(1px); }
.buyslab .bverb { font-weight: 700; font-size: 17px; letter-spacing: 0.03em; }
.buyslab .bcost { font-size: 13px; color: var(--dim); font-variant-numeric: tabular-nums; }
.buyslab:disabled { opacity: 0.55; box-shadow: none; }
.buyslab:disabled .bverb { color: var(--dim); }

/* Improve / lists */
.slab {
  width: 100%;
  border-radius: 14px;
  background: var(--card);
  border: 1px solid var(--edge);
  padding: 13px 14px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
}
.slab .grow { flex: 1; min-width: 0; }
.slab .sname { font-family: var(--sg); font-weight: 500; font-size: 15px; }
.slab .sblurb { font-size: 12.5px; color: var(--dim); margin-top: 2px; }
.slab .scost {
  flex: none;
  font-family: var(--sg);
  font-variant-numeric: tabular-nums;
  font-size: 14px;
  color: var(--dust);
}
.slab.can { border-color: #F5C86B66; box-shadow: 0 0 16px #F5C86B18; }
.slab.can:active { transform: translateY(1px); }
.slab:disabled { opacity: 0.5; }
.slab.owneddone { opacity: 0.55; }
.slab.owneddone .scost { color: var(--faint); }

.empty { text-align: center; color: var(--faint); font-size: 13.5px; padding: 26px 20px; line-height: 1.5; }

/* Crunch */
.crunchwrap { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 14px; padding: 16px 18px; text-align: center; }
.crunchwrap h2 { font-family: var(--sg); font-weight: 700; font-size: 22px; color: #D9B7FF; }
.crunchwrap p { font-size: 13.5px; color: var(--dim); line-height: 1.55; max-width: 34ch; margin: 0 auto; }
.crunchwrap .pending { font-family: var(--sg); font-size: 17px; font-variant-numeric: tabular-nums; }
.crunchwrap .pending b { color: #D9B7FF; }
.crunchslab {
  min-height: 62px;
  border-radius: 16px;
  font-family: var(--sg);
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.04em;
  background: linear-gradient(180deg, #4A3580, #33245C);
  border: 1px solid #7C5BC966;
  box-shadow: 0 6px 24px #4A358055;
}
.crunchslab:disabled { opacity: 0.45; box-shadow: none; }
.crunchslab.armed { background: linear-gradient(180deg, #8A3E5C, #5C2A44); border-color: #FF7A8577; }

/* More */
.statrow { display: flex; justify-content: space-between; gap: 12px; padding: 9px 2px; border-bottom: 1px solid #ffffff0d; font-size: 13.5px; }
.statrow .k { color: var(--dim); }
.statrow .v { font-variant-numeric: tabular-nums; font-family: var(--sg); }
.achgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 12px; }
.ach {
  border: 1px solid var(--edge);
  border-radius: 12px;
  padding: 10px 11px;
  background: var(--card);
}
.ach .aname { font-family: var(--sg); font-size: 13px; font-weight: 500; }
.ach .ablurb { font-size: 11.5px; color: var(--dim); margin-top: 2px; }
.ach.locked { opacity: 0.38; }
.ach.locked .aname { color: var(--dim); }
.sectionlabel {
  font-family: var(--sg);
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--faint);
  margin: 16px 2px 8px;
}
.dangerbtn {
  width: 100%;
  border: 1px solid #FF7A8544;
  color: var(--danger);
  border-radius: 12px;
  padding: 12px;
  font-size: 14px;
  margin-top: 14px;
}
.dangerbtn.armed { background: #5C2A2A; }

/* Tab bar */
.tabbar {
  flex: none;
  display: flex;
  border-top: 1px solid var(--edge);
  background: #100E22;
  padding-bottom: env(safe-area-inset-bottom);
}
.tabbar button {
  flex: 1;
  padding: 12px 0 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  color: var(--faint);
  font-family: var(--sg);
  font-size: 11.5px;
  letter-spacing: 0.1em;
}
.tabbar button .glyph { font-size: 17px; line-height: 1; }
.tabbar button.on { color: var(--dust); }

/* Toast + modal */
.toast {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(100% + 10px);
  background: #241F49F0;
  border: 1px solid #F5C86B55;
  border-radius: 14px;
  padding: 10px 16px;
  width: max-content;
  max-width: 88vw;
  text-align: center;
  box-shadow: 0 8px 28px #00000088;
  animation: toastin 0.3s ease;
}
.toast .tt { font-family: var(--sg); font-weight: 700; font-size: 14px; color: var(--dust); }
.toast .tb { font-size: 12px; color: var(--dim); margin-top: 1px; }
@keyframes toastin { from { opacity: 0; translate: 0 8px; } to { opacity: 1; translate: 0 0; } }

.veilshade {
  position: fixed;
  inset: 0;
  background: #05040ECC;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 40;
}
.modal {
  background: var(--deck);
  border: 1px solid var(--edge);
  border-radius: 20px;
  padding: 24px 22px;
  max-width: 340px;
  width: 100%;
  text-align: center;
}
.modal h3 { font-family: var(--sg); font-size: 19px; margin-bottom: 8px; }
.modal .mgain { font-family: var(--sg); font-size: 26px; font-weight: 700; color: var(--dust); margin: 10px 0 2px; }
.modal p { font-size: 13.5px; color: var(--dim); line-height: 1.5; }
.modal button {
  margin-top: 18px;
  width: 100%;
  min-height: 52px;
  border-radius: 14px;
  background: var(--card);
  border: 1px solid var(--edge);
  font-family: var(--sg);
  font-size: 15px;
}

@media (prefers-reduced-motion: reduce) {
  .floaty, .toast { animation: none; }
  .sky .hint { animation: none; opacity: 0.6; }
  .milestone .mfill { transition: none; }
}
`;
