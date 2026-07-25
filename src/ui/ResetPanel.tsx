import { hue } from "./Rail";
import { BANK_CAP, POOL_CAP } from "../game/constants";
import { liquidationValue, pickThresholds, picksFor, poolEntries } from "../game/logic";
import { fmt } from "../game/format";
import { STAT_NAME, StatGlyph } from "./vocab";
import type { GameState } from "../game/types";

interface Props { state: GameState; onReset: () => void; }

export function ResetPanel({ state, onReset }: Props): JSX.Element {
  const liq = liquidationValue(state);
  const finalRun = state.runScore.plus(liq);
  const [t1, t2, t3] = pickThresholds(state);
  const picks = picksFor(state, finalRun);
  // Ordered by tier then stat, NOT by odds. The histogram is a table you learn
  // the shape of; a list that reshuffles every time the pool shifts is a list
  // you have to re-read. The bars carry the ranking on their own.
  const entries = poolEntries(state);
  const even = entries.length > 0 ? 1 / entries.length : 0;
  // Full width IS the ceiling, not the current leader. A bar scaled to the
  // longest bar rescales every time the pool shifts, so nothing on it means
  // anything twice; scaled to the cap, a full bar always means the same thing
  // — this line is pinned and cannot buy any more of the draw — and the
  // even-split tick sits at the same place forever.
  const lid = (even * Math.max(POOL_CAP, 1)) || 1;
  const pctOf = (x: number) => `${(x * 100).toFixed(x < 0.095 ? 1 : 0)}%`;

  return (
    <div className="panel">
      <div className="scrollarea">
        <div className="kv"><span>this run</span><b>{fmt(state.runScore)}</b></div>
        <div className="kv"><span>+ cash-out (everything fires once)</span><b>{fmt(liq)}</b></div>
        <div className="kv"><span>= counts as</span><b>{fmt(finalRun)}</b></div>
        {state.rerolls > 0 && (
          <div className="kv"><span>banked draws (from time away)</span><b>+{state.rerolls} / {BANK_CAP}</b></div>
        )}
        <div className="sectionlabel">picks · ladder rises as you take them</div>
        <div className={`threshrow${finalRun.gte(t1) ? " met" : ""}`}><span>1 pick</span><b>{fmt(t1)}</b></div>
        <div className={`threshrow${finalRun.gte(t2) ? " met" : ""}`}><span>2 picks</span><b>{fmt(t2)}</b></div>
        <div className={`threshrow${finalRun.gte(t3) ? " met" : ""}`}><span>3 picks</span><b>{fmt(t3)}</b></div>
        <div className="sectionlabel">the pool · the odds on every card</div>
        <div className="histnote">what this run wrote decides the bright part · the dim base is what every
          line you have opened keeps regardless · a hand never offers the same line twice</div>
        <div className="hist">
          {entries.length === 0 && <div className="kv"><span>nothing yet — buy, cross milestones, watch wheels</span></div>}
          {entries.map((e) => (
            <div key={`${e.tier}-${e.stat}`} className={`hrow${e.capped ? " capped" : ""}`}>
              <span className="hlabel">{e.tier + 1} <StatGlyph stat={e.stat} />{STAT_NAME[e.stat]}</span>
              <span className="hbarwrap">
                {/* Two segments of ONE bar, so the total length is the real
                    probability and the split shows where it came from. */}
                <span className="hbar hfloor" style={{ width: `${(Math.min(e.floor, e.w) / lid) * 100}%`, background: hue(e.tier) }} />
                <span className="hbar hearned" style={{ width: `${(e.earned / lid) * 100}%`, background: hue(e.tier) }} />
                <span className="htick" style={{ left: `${Math.min(100, (even / lid) * 100)}%` }} />
              </span>
              <span className="hpct">{pctOf(e.w)}</span>
            </div>
          ))}
        </div>
        {entries.length > 0 && (
          <div className="histnote">
            tick marks an even split ({pctOf(even)}) · a full bar is the ceiling, {POOL_CAP.toFixed(1)}× that ({pctOf(lid)})
          </div>
        )}
      </div>
      <div className="buyrow">
        <button className="slab resetslab" disabled={picks < 1} onClick={onReset}>
          <span className="sv">RESET</span>
          <span className="sc">{picks >= 1 ? `${picks} pick${picks > 1 ? "s" : ""} · stock, buys, pool → gone · phase stays` : `needs ${fmt(t1)}`}</span>
        </button>
      </div>
    </div>
  );
}
