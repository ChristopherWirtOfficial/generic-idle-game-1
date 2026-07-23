import { GENERATORS } from "../../game/constants";
import { fmt, fmtRate } from "../../game/format";
import { genBulkCost, resolveBuyCount } from "../../game/logic";
import type { BuyAmount, GameState } from "../../game/types";

const AMOUNTS: { v: BuyAmount; label: string }[] = [
  { v: 1, label: "\u00d71" },
  { v: 10, label: "\u00d710" },
  { v: "max", label: "Max" },
];

export function BuyPanel(props: {
  s: GameState;
  amount: BuyAmount;
  onAmount: (a: BuyAmount) => void;
  onBuy: (i: number) => void;
}) {
  const { s, amount } = props;

  // A generator is visible once bought, once its predecessor is owned,
  // or once you are within reach. The next unknown shows as a dashed row.
  const visible = GENERATORS.map((g, i) => {
    if (i === 0) return true;
    if ((s.gens[i] ?? 0) > 0) return true;
    if ((s.gens[i - 1] ?? 0) > 0 && s.runEarned >= g.baseCost * 0.25) return true;
    return s.runEarned >= g.baseCost * 0.6;
  });
  const firstHidden = visible.indexOf(false);

  return (
    <div>
      <div className="panel-title">
        <span>Things that make points</span>
        <span className="buyamt" role="group" aria-label="Buy amount">
          {AMOUNTS.map((a) => (
            <button
              key={a.label}
              className={a.v === amount ? "on" : ""}
              onClick={() => props.onAmount(a.v)}
            >
              {a.label}
            </button>
          ))}
        </span>
      </div>
      {GENERATORS.map((g, i) => {
        if (!visible[i]) return null;
        const n = resolveBuyCount(s, i, amount);
        const cost = genBulkCost(s, i, n);
        const affordable = s.points >= cost;
        const owned = s.gens[i] ?? 0;
        return (
          <div className="row" key={g.name}>
            <div className="info">
              <div className="name">
                {g.name}
                {owned > 0 && <span className="count">{"\u00d7" + owned}</span>}
              </div>
              <div className="blurb">{g.blurb}</div>
              <div className="rate-note">{fmtRate(g.baseRate)} points/s each</div>
            </div>
            <button
              className="costbtn"
              disabled={!affordable}
              onClick={() => props.onBuy(i)}
            >
              {fmt(Math.ceil(cost))}
              <span className="n">{"buy \u00d7" + n}</span>
            </button>
          </div>
        );
      })}
      {firstHidden !== -1 && (
        <div className="row locked">
          <div className="info">
            <div className="name">?????</div>
            <div className="blurb">More points required.</div>
          </div>
        </div>
      )}
    </div>
  );
}
