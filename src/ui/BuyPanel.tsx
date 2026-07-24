import { hue } from "./Rail";
import { scen, maxAffordable, milestoneLevel, nextMilestoneAt, period, tableauLevels, tierCost, unitValue, visibleTiers } from "../game/logic";
import { fmt } from "../game/format";
import type { GameState } from "../game/types";

export type BuyAmount = 1 | 10 | "max";

interface Props {
  state: GameState;
  sel: number;
  setSel: (i: number) => void;
  amount: BuyAmount;
  setAmount: (a: BuyAmount) => void;
  onBuy: (i: number, n: number) => void;
}

export function BuyPanel({ state, sel, setSel, amount, setAmount, onBuy }: Props): JSX.Element | null {
  const vis = visibleTiers(state);
  const i = Math.min(sel, vis - 1);
  const def = scen(state).tiers[i];
  const st = state.tiers[i];
  if (!def || !st) return null;
  const tc = hue(i);

  const scenDef = scen(state);
  const lvl = milestoneLevel(state, i);
  const nextAt = nextMilestoneAt(state, i);
  const prevAt = scenDef.milestoneFirst * (Math.pow(2, lvl) - 1);
  const prg = Math.min(1, (st.bought - prevAt) / (nextAt - prevAt));

  const n = amount === "max" ? Math.max(1, maxAffordable(state, i)) : amount;
  const cost = tierCost(state, i, n);
  const can = state.score >= cost;
  const targetName = def.target < 0 ? "score" : `tier ${def.target + 1}`;

  const chips = (["spd", "val", "cst"] as const).map((stat) => {
    const L = tableauLevels(state, i, stat);
    return <span key={stat} className={`chip${L > 0 ? " lit" : ""}`}>{stat} L{L}</span>;
  });

  return (
    <div className="panel" style={{ ["--tc" as string]: tc } as Record<string, string>}>
      <div className="deckhead">
        <span className="htier">TIER {i + 1}</span>
        <span className="hsub">of {scenDef.tiers.length}</span>
        <span className="hspace" />
        <button className="chev" disabled={i >= vis - 1} onClick={() => setSel(Math.min(vis - 1, i + 1))} aria-label="Deeper">▲</button>
        <button className="chev" disabled={i === 0} onClick={() => setSel(Math.max(0, i - 1))} aria-label="Shallower">▼</button>
      </div>
      <div className="scrollarea">
        <div className="kv"><span>held / bought by hand</span><b>{fmt(Math.floor(st.count))} / {fmt(st.bought)}</b></div>
        <div className="kv"><span>each pays, per cycle</span><b><span className="tcol">{fmt(unitValue(state, i))}</span> → {targetName}</b></div>
        <div className="kv"><span>cycle</span><b>{period(state, i) < 0.3 ? "continuous" : `${period(state, i).toFixed(2)}s`}</b></div>
        <div className="kv"><span>×{scenDef.milestoneMult} at {fmt(nextAt)} bought</span><b>now ×{fmt(Math.pow(scenDef.milestoneMult, lvl))}</b></div>
        <div className="mbar"><div className="mfill" style={{ width: `${Math.round(prg * 100)}%` }} /></div>
        <div className="chips">{chips}</div>
      </div>
      <div className="buyrow">
        <div className="amounts">
          {([1, 10, "max"] as const).map((a) => (
            <button key={String(a)} className={a === amount ? "on" : ""} onClick={() => setAmount(a)}>
              {a === "max" ? "MAX" : `×${a}`}
            </button>
          ))}
        </div>
        <button className="slab" disabled={!can} onClick={() => onBuy(i, n)}>
          <span className="sv">BUY {n > 1 ? `${fmt(n)} × ` : ""}TIER {i + 1}</span>
          <span className="sc">{can ? fmt(cost) : `${fmt(cost)} — have ${fmt(state.score)}`}</span>
        </button>
      </div>
    </div>
  );
}
