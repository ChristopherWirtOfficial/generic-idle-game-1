import { TIERS } from "../game/constants";
import { maxAffordable, milestoneLevel, nextMilestoneAt, tierCost, tierOutput, visibleTiers } from "../game/logic";
import { fmt, fmtRate } from "../game/format";
import type { GameState } from "../game/types";
import { MILESTONE_FIRST, MILESTONE_MULT } from "../game/constants";

export type BuyAmount = 1 | 10 | "max";

interface Props {
  state: GameState;
  sel: number;
  setSel: (i: number) => void;
  amount: BuyAmount;
  setAmount: (a: BuyAmount) => void;
  onBuy: (i: number, n: number) => void;
}

export function BuildPanel({ state, sel, setSel, amount, setAmount, onBuy }: Props): JSX.Element | null {
  const visible = visibleTiers(state);
  const i = Math.min(sel, visible - 1);
  const def = TIERS[i];
  const st = state.tiers[i];
  if (!def || !st) return null;

  const hue = `hsl(${def.hue}, 72%, 66%)`;
  const owned = st.count;
  const feed = i + 1 < TIERS.length ? tierOutput(state, i + 1) : 0;
  const out = tierOutput(state, i);
  const outUnit = i === 0 ? "dust" : TIERS[i - 1]?.plural ?? "";

  const lvl = milestoneLevel(state, i);
  const nextAt = nextMilestoneAt(state, i);
  const prevAt = MILESTONE_FIRST * (Math.pow(2, lvl) - 1);
  const prog = Math.min(1, (st.bought - prevAt) / (nextAt - prevAt));

  const n = amount === "max" ? Math.max(1, maxAffordable(state, i)) : amount;
  const cost = tierCost(state, i, n);
  const can = state.dust >= cost && (amount !== "max" || maxAffordable(state, i) >= 1);

  return (
    <div className="panel" style={{ ["--tierc" as string]: hue } as Record<string, string>}>
      <div className="pager">
        <button className="chev" onClick={() => setSel(Math.max(0, i - 1))} disabled={i === 0} aria-label="Previous">‹</button>
        <div className="tiercard">
          <div className="tname">{def.name}</div>
          <div className="tblurb">{def.blurb}</div>
          <div className="towned">{fmt(Math.floor(owned))} <small>held · {fmt(st.bought)} formed by hand</small></div>
          {owned >= 1 && (
            <div className="tfeed">emits <b>{fmtRate(out)}</b> {outUnit}/s</div>
          )}
          {feed > 0 && (
            <div className="tfeed">+<b>{fmtRate(feed)}</b>/s from {TIERS[i + 1]?.plural}</div>
          )}
          {owned < 1 && feed <= 0 && <div className="tlocked">None yet. The void waits.</div>}
          <div className="milestone">
            <div className="mbar"><div className="mfill" style={{ width: `${Math.round(prog * 100)}%` }} /></div>
            <div className="mlabel">×{MILESTONE_MULT} at <b>{fmt(nextAt)}</b> formed · now ×{fmt(Math.pow(MILESTONE_MULT, lvl))}</div>
          </div>
        </div>
        <button className="chev" onClick={() => setSel(Math.min(visible - 1, i + 1))} disabled={i >= visible - 1} aria-label="Next">›</button>
      </div>
      <div className="buyrow">
        <div className="amounts">
          {([1, 10, "max"] as const).map((a) => (
            <button key={String(a)} className={a === amount ? "on" : ""} onClick={() => setAmount(a)}>
              {a === "max" ? "Max" : `×${a}`}
            </button>
          ))}
        </div>
        <button className="buyslab" disabled={!can} onClick={() => onBuy(i, n)}>
          <span className="bverb">Form {n > 1 ? `${fmt(n)} ${def.plural}` : def.name}</span>
          <span className="bcost">{can ? `${fmt(cost)} dust` : `needs ${fmt(cost)} dust — you hold ${fmt(state.dust)}`}</span>
        </button>
      </div>
    </div>
  );
}
