import { hue } from "./Rail";
import { BANK_CAP } from "../game/constants";
import { liquidationValue, pickThresholds, picksFor, poolEntries } from "../game/logic";
import { fmt } from "../game/format";
import type { GameState } from "../game/types";

interface Props { state: GameState; onReset: () => void; }

const STAT_LABEL = { val: "val", spd: "spd", cst: "cst" } as const;

export function ResetPanel({ state, onReset }: Props): JSX.Element {
  const liq = liquidationValue(state);
  const finalRun = state.runScore + liq;
  const [t1, t2, t3] = pickThresholds(state);
  const picks = picksFor(state, finalRun);
  const entries = poolEntries(state).sort((a, b) => b.w - a.w);
  const maxW = entries[0]?.w ?? 1;

  return (
    <div className="panel">
      <div className="scrollarea">
        <div className="kv"><span>this run</span><b>{fmt(state.runScore)}</b></div>
        <div className="kv"><span>+ cash-out (everything fires once)</span><b>{fmt(liq)}</b></div>
        <div className="kv"><span>= counts as</span><b>{fmt(finalRun)}</b></div>
        {state.bankedDraws > 0 && (
          <div className="kv"><span>banked draws (from time away)</span><b>+{state.bankedDraws} / {BANK_CAP}</b></div>
        )}
        <div className="sectionlabel">picks · ladder rises as you take them</div>
        <div className={`threshrow${finalRun >= t1 ? " met" : ""}`}><span>1 pick</span><b>{fmt(t1)}</b></div>
        <div className={`threshrow${finalRun >= t2 ? " met" : ""}`}><span>2 picks</span><b>{fmt(t2)}</b></div>
        <div className={`threshrow${finalRun >= t3 ? " met" : ""}`}><span>3 picks</span><b>{fmt(t3)}</b></div>
        <div className="sectionlabel">the pool · what this run wrote</div>
        <div className="hist">
          {entries.length === 0 && <div className="kv"><span>nothing yet — buy, cross milestones, watch wheels</span></div>}
          {entries.slice(0, 10).map((e) => (
            <div key={`${e.tier}-${e.stat}`} className="hrow">
              <span className="hlabel">{e.tier + 1} {STAT_LABEL[e.stat]}</span>
              <span className="hbarwrap">
                <span className="hbar" style={{ width: `${Math.max(4, (e.w / maxW) * 100)}%`, background: hue(e.tier) }} />
              </span>
            </div>
          ))}
        </div>
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
