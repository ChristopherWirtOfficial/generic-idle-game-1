/**
 * "The wireframe that shipped."
 * Paper white, near-black ink, one ballpoint-blue annotation color.
 * system-ui for prose (the default font, chosen on purpose),
 * the system mono for every numeral and label.
 */
export const CSS = String.raw`
:root {
  --paper: #FAFAF8;
  --card: #FFFFFF;
  --ink: #171715;
  --graphite: #797973;
  --rule: #DBDBD4;
  --mark: #2B49C6;
  --mono: ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, "Liberation Mono", monospace;
  --body: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

.gig1, .gig1 * {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

.gig1 {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  width: 100%;
  background: var(--paper);
  color: var(--ink);
  font-family: var(--body);
  font-size: 14px;
  line-height: 1.45;
  overflow: hidden;
}

.gig1 button {
  font: inherit;
  color: inherit;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
}

.gig1 :focus-visible {
  outline: 2px solid var(--mark);
  outline-offset: 2px;
}

/* ---------- title block ---------- */

.titleblock {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid var(--ink);
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.titleblock > div {
  padding: 7px 10px 6px;
}

.titleblock .tb-name {
  flex: 1;
  font-weight: 700;
}

.titleblock .tb-cell {
  border-left: 1px solid var(--rule);
  color: var(--graphite);
  white-space: nowrap;
}

/* ---------- counter ---------- */

.counter {
  text-align: center;
  padding: 14px 16px 4px;
  flex-shrink: 0;
}

.counter .eyebrow {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.22em;
  color: var(--graphite);
  text-transform: uppercase;
}

.counter .big {
  font-family: var(--mono);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  line-height: 1.1;
  margin: 2px 0 0;
  overflow: hidden;
  white-space: nowrap;
}

.counter .rate {
  font-family: var(--mono);
  font-size: 12px;
  color: var(--ink);
  margin-top: 2px;
}

.counter .rate .plus {
  color: var(--mark);
}

.counter .status {
  font-style: italic;
  color: var(--graphite);
  font-size: 13px;
  margin-top: 6px;
  min-height: 19px;
}

/* ---------- the button ---------- */

.presswrap {
  position: relative;
  padding: 10px 16px 14px;
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}

.pressbtn {
  position: relative;
  width: 100%;
  max-width: 320px;
  min-height: 76px;
  border: 1.5px solid var(--ink);
  background: var(--card);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  overflow: visible;
}

.pressbtn .label {
  font-family: var(--mono);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.pressbtn .sub {
  font-size: 11px;
  color: var(--graphite);
}

.pressbtn:active {
  background: var(--ink);
}

.pressbtn:active .label {
  color: var(--paper);
}

.pressbtn:active .sub {
  color: var(--rule);
}

.floatmark {
  position: absolute;
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 600;
  color: var(--mark);
  pointer-events: none;
  animation: rise 0.7s ease-out forwards;
  white-space: nowrap;
}

@keyframes rise {
  from { opacity: 1; transform: translate(-50%, 0) rotate(var(--rot)); }
  to { opacity: 0; transform: translate(-50%, -46px) rotate(var(--rot)); }
}

/* ---------- panel area ---------- */

.panel {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  border-top: 1px solid var(--ink);
  background-image: radial-gradient(var(--rule) 1px, transparent 1px);
  background-size: 16px 16px;
  padding: 14px 12px 20px;
}

.panel-title {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--graphite);
  margin: 2px 2px 10px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

/* ---------- buy amount segmented ---------- */

.buyamt {
  display: inline-flex;
  border: 1px solid var(--ink);
}

.buyamt button {
  font-family: var(--mono);
  font-size: 11px;
  padding: 3px 9px;
  color: var(--ink);
  background: var(--card);
}

.buyamt button + button {
  border-left: 1px solid var(--ink);
}

.buyamt button.on {
  background: var(--ink);
  color: var(--paper);
}

/* ---------- rows / cards ---------- */

.row {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--card);
  border: 1px solid var(--rule);
  padding: 10px 12px;
  margin-bottom: 8px;
}

.row .info {
  flex: 1;
  min-width: 0;
}

.row .name {
  font-weight: 600;
  font-size: 14px;
}

.row .name .count {
  font-family: var(--mono);
  font-weight: 600;
  font-size: 12px;
  color: var(--mark);
  margin-left: 6px;
}

.row .blurb {
  font-size: 12px;
  color: var(--graphite);
  margin-top: 1px;
}

.row .rate-note {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--graphite);
  margin-top: 3px;
}

.costbtn {
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 600;
  border: 1.5px solid var(--ink);
  background: var(--card);
  color: var(--ink);
  padding: 9px 12px;
  min-width: 92px;
  text-align: center;
  flex-shrink: 0;
}

.costbtn .n {
  display: block;
  font-size: 9px;
  font-weight: 400;
  color: var(--graphite);
  letter-spacing: 0.08em;
}

.costbtn:active:not(:disabled) {
  background: var(--ink);
  color: var(--paper);
}

.costbtn:active:not(:disabled) .n {
  color: var(--rule);
}

.costbtn:disabled {
  border-color: var(--rule);
  color: var(--graphite);
  cursor: default;
}

.row.locked {
  border-style: dashed;
  color: var(--graphite);
  background: transparent;
}

.row.locked .name {
  font-family: var(--mono);
  letter-spacing: 0.2em;
}

.hint {
  font-size: 12px;
  font-style: italic;
  color: var(--graphite);
  text-align: center;
  margin: 12px 0 4px;
}

/* ---------- reset panel ---------- */

.resetpanel {
  text-align: center;
  padding-top: 8px;
}

.resetpanel .ppnow {
  font-family: var(--mono);
  font-size: 30px;
  font-weight: 600;
  margin: 2px 0;
}

.resetpanel p {
  margin: 8px auto;
  max-width: 320px;
}

.resetpanel .fine {
  font-size: 12px;
  color: var(--graphite);
}

.bigaction {
  display: inline-block;
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border: 1.5px solid var(--ink);
  background: var(--card);
  padding: 12px 22px;
  margin-top: 10px;
}

.bigaction.armed {
  background: var(--ink);
  color: var(--paper);
}

.bigaction:disabled {
  border-color: var(--rule);
  color: var(--graphite);
}

/* ---------- numbers panel ---------- */

.stats {
  background: var(--card);
  border: 1px solid var(--rule);
  padding: 4px 12px;
  margin-bottom: 14px;
}

.stat {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px solid var(--rule);
}

.stat:last-child {
  border-bottom: none;
}

.stat .k {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--graphite);
}

.stat .v {
  font-family: var(--mono);
  font-variant-numeric: tabular-nums;
  font-size: 13px;
}

.achlist {
  background: var(--card);
  border: 1px solid var(--rule);
  padding: 8px 12px;
  margin-bottom: 14px;
}

.ach {
  font-size: 13px;
  padding: 4px 0;
}

.ach.no {
  color: var(--graphite);
  font-family: var(--mono);
  font-size: 12px;
}

.smallact {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  border: 1px solid var(--ink);
  background: var(--card);
  padding: 7px 12px;
}

.smallact.armed {
  background: var(--ink);
  color: var(--paper);
}

.colophon {
  font-family: var(--mono);
  font-size: 9px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--graphite);
  text-align: center;
  margin-top: 18px;
}

/* ---------- tab bar ---------- */

.tabbar {
  display: flex;
  border-top: 1px solid var(--ink);
  background: var(--paper);
  flex-shrink: 0;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.tabbar button {
  flex: 1;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--graphite);
  padding: 15px 0 13px;
  border-bottom: 2px solid transparent;
}

.tabbar button.on {
  color: var(--ink);
  font-weight: 700;
  border-bottom-color: var(--mark);
}

/* ---------- toast ---------- */

.toast {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 64px;
  background: var(--ink);
  color: var(--paper);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  padding: 10px 12px;
  text-align: center;
  animation: toastin 0.25s ease-out;
  pointer-events: none;
  z-index: 20;
}

.toast .t-tag {
  color: var(--rule);
}

@keyframes toastin {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ---------- offline modal ---------- */

.backdrop {
  position: absolute;
  inset: 0;
  background: rgba(23, 23, 21, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 30;
}

.modal {
  background: var(--paper);
  border: 1.5px solid var(--ink);
  padding: 20px 18px;
  max-width: 300px;
  width: 100%;
  text-align: center;
  animation: toastin 0.2s ease-out;
}

.modal h2 {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin: 0 0 8px;
}

.modal .gained {
  font-family: var(--mono);
  font-size: 26px;
  font-weight: 600;
  color: var(--mark);
  margin: 6px 0;
}

.modal p {
  margin: 6px 0;
  font-size: 13px;
  color: var(--graphite);
}

.modal .bigaction {
  margin-top: 12px;
  padding: 10px 28px;
}

/* ---------- misc ---------- */

.loading {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--graphite);
  text-transform: uppercase;
}

@media (prefers-reduced-motion: reduce) {
  .floatmark, .toast, .modal {
    animation: none;
  }
}
`;
