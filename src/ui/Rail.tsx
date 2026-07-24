import { useEffect, useRef } from "react";
import { GLOW_PERIOD_S, TIER_HUES } from "../game/constants";
import {
  amountCount, milestoneLevel, milestoneProgress, nextMilestoneAt, period, scen, tableauLevels, tableauMult,
  throughput, tierCost, tierKnown, unitValue, visibleTiers,
} from "../game/logic";
import { fmt, fmtRate, fmtVal } from "../game/format";
import { STAT_NAME, StatGlyph, amountShort } from "./vocab";
import type { BuyAmount, GameState } from "../game/types";

export function hue(i: number): string {
  return `hsl(${TIER_HUES[i] ?? 0}, 62%, 62%)`;
}

/** Hue as bare channels, so CSS can build translucent variants of the tier colour. */
function hueCh(i: number): string {
  return `${TIER_HUES[i] ?? 0} 62% 62%`;
}

interface Props {
  state: GameState;
  /** Which row is bloomed open, or null. */
  open: number | null;
  setOpen: (i: number | null) => void;
  amount: BuyAmount;
  onBuy: (i: number, n: number) => void;
  /** performance.now() stamp of the last economy step — lets wheels extrapolate between ticks. */
  tickedAt: { current: number };
}

/** Exported: the flatten pipeline shares one scope, so this name lives here only. */
export const AMOUNTS: BuyAmount[] = [1, 10, "max", "milestone"];

/**
 * Two concentric arcs on one hub. The inner arc is the cycle — owned by the rAF
 * loop, never by CSS, so what it shows is the true phase. The outer arc is
 * milestone progress, which only moves when you buy by hand.
 */
function Dial({
  tier, live, glowing, known, msProg, cycle, arcRef,
}: {
  tier: number; live: boolean; glowing: boolean; known: boolean; msProg: number; cycle: string;
  arcRef: (el: SVGCircleElement | null) => void;
}): JSX.Element {
  return (
    <span className={`idcol${glowing ? " glow" : ""}`}>
      <svg viewBox="0 0 44 44" aria-hidden>
        {known ? (
          <>
            <circle className="mtrack" cx="22" cy="22" r="19" pathLength={1} />
            <circle
              className="marc" cx="22" cy="22" r="19" pathLength={1}
              strokeDasharray={`${Math.max(0.0001, msProg)} 1`}
            />
            <circle className="ctrack" cx="22" cy="22" r="15" pathLength={1} />
            <circle
              ref={arcRef}
              className={`carc${live ? "" : " frozen"}`}
              cx="22" cy="22" r="15" pathLength={1}
              strokeDasharray="0.0001 1"
            />
          </>
        ) : (
          <circle className="dash" cx="22" cy="22" r="17" pathLength={1} />
        )}
      </svg>
      <span className="hub">{tier + 1}</span>
      <span className="cyc">{cycle}</span>
    </span>
  );
}

export function Rail({ state, open, setOpen, amount, onBuy, tickedAt }: Props): JSX.Element {
  const liveState = useRef(state);
  liveState.current = state;
  const arcs = useRef(new Map<number, SVGCircleElement>());

  useEffect(() => {
    if (typeof requestAnimationFrame === "undefined") return;
    let raf = 0;
    const draw = () => {
      const s = liveState.current;
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      const sinceTick = Math.max(0, (now - tickedAt.current) / 1000);
      for (const [i, el] of arcs.current) {
        const st = s.tiers[i];
        if (!st) continue;
        const T = period(s, i);
        let p: number;
        if (Math.floor(st.count) < 1) {
          p = st.phase; // frozen wheels hold still
        } else if (T < GLOW_PERIOD_S) {
          p = 1; // glow: the ring is simply full
        } else {
          p = Math.min(1, st.phase + sinceTick / T); // hold at full until the tick lands it
        }
        el.setAttribute("stroke-dasharray", `${Math.max(0.0001, p)} 1`);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [tickedAt]);

  const defs = scen(state).tiers;
  const vis = visibleTiers(state);
  const rows: JSX.Element[] = [];

  for (let i = vis - 1; i >= 0; i--) {
    const def = defs[i];
    const st = state.tiers[i];
    if (!def || !st) continue;

    const held = Math.floor(st.count);
    const T = period(state, i);
    const isLive = held >= 1;
    const glowing = T < GLOW_PERIOD_S && isLive;
    const known = tierKnown(state, i);
    const isOpen = open === i;
    const targetName = def.target < 0 ? "score" : String(def.target + 1);
    const dead = def.baseValue <= 0;

    // The resting plate prices the globally-selected quantity for THIS tier.
    const n = amountCount(state, i, amount);
    const cost = tierCost(state, i, n);
    const can = state.score >= cost;
    const fill = Number.isFinite(cost) && cost > 0 ? Math.min(1, state.score / cost) : 0;

    rows.push(
      <div
        key={i}
        className={`row${isOpen ? " open" : ""}${known ? "" : " slot"}${known && !isLive ? " empty" : ""}`}
        style={{ ["--tch" as string]: hueCh(i) } as Record<string, string>}
      >
        <button
          className="head"
          onClick={() => setOpen(isOpen ? null : i)}
          aria-expanded={isOpen}
          aria-label={`tier ${i + 1} details`}
        >
          <Dial
            tier={i} live={isLive} glowing={glowing} known={known}
            msProg={milestoneProgress(state, i)}
            cycle={T < GLOW_PERIOD_S ? "continuous" : `${T.toFixed(2)}s`}
            arcRef={(el) => { if (el) arcs.current.set(i, el); else arcs.current.delete(i); }}
          />
          <span className="txt">
            <span className="count">{known ? fmt(held) : "—"}</span>
            <span className="flow">
              {dead ? (
                "dead link"
              ) : known ? (
                <>
                  <span className="pay">{fmtVal(unitValue(state, i))}</span>
                  {" → "}
                  <span className="tgt">{targetName}</span>
                  <span className="sep">·</span>
                  {isLive ? <span className="rate">{fmtRate(throughput(state, i))}/s</span> : "stopped"}
                </>
              ) : (
                <>→ <span className="tgt">{targetName}</span></>
              )}
            </span>
          </span>
        </button>

        <button
          className={`buy${can ? " can" : ""}`}
          disabled={!can}
          onClick={() => onBuy(i, n)}
          aria-label={`buy ${n} tier ${i + 1}`}
        >
          <span className="fill" style={{ width: `${fill * 100}%` }} />
          <span className="lab">{amountShort(amount)}{n > 1 ? ` +${fmt(n)}` : ""}</span>
          <span className="amt">{fmt(cost)}</span>
        </button>

        <div className="body">
          <div className="bodyin">
            <div className="bodypad">
              <div className="qgrid">
                {AMOUNTS.map((a) => {
                  const qn = amountCount(state, i, a);
                  const qc = tierCost(state, i, qn);
                  const qcan = state.score >= qc;
                  const qfill = Number.isFinite(qc) && qc > 0 ? Math.min(1, state.score / qc) : 0;
                  return (
                    <button
                      key={String(a)}
                      className={`q${qcan ? " can" : ""}${a === amount ? " mode" : ""}`}
                      disabled={!qcan}
                      onClick={() => onBuy(i, qn)}
                      aria-label={`buy ${qn} tier ${i + 1}`}
                    >
                      <span className="fill" style={{ width: `${qfill * 100}%` }} />
                      <span className="lab">{amountShort(a)}</span>
                      <span className="n">+{fmt(qn)}</span>
                      <span className="amt">{fmt(qc)}</span>
                    </button>
                  );
                })}
              </div>
              <div className="foot">
                <span className="ms">
                  by hand <b>{fmt(st.bought)}</b> / {fmt(nextMilestoneAt(state, i))}{" "}
                  <span className="goal">
                    → ×{fmt(Math.pow(scen(state).milestoneMult, milestoneLevel(state, i) + 1))}
                  </span>
                </span>
                <span className="chips">
                  {(["spd", "val", "cst"] as const).map((stat) => {
                    const L = tableauLevels(state, i, stat);
                    return (
                      <span key={stat} className={`chip${L > 0 ? " lit" : ""}`}>
                        <StatGlyph stat={stat} />
                        {STAT_NAME[stat]} <b>{L > 0 ? `×${fmtVal(tableauMult(state, i, stat))}` : "—"}</b>
                      </span>
                    );
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>,
    );

    if (i > 0) {
      rows.push(
        <span key={`l${i}`} className="link" style={{ ["--tc" as string]: hue(i) } as Record<string, string>} />,
      );
    }
  }

  return <div className={`rail${vis >= 6 ? " tight" : ""}`}>{rows}</div>;
}
