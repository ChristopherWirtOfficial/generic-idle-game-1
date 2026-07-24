import { useEffect, useRef } from "react";
import { GLOW_PERIOD_S, TIER_HUES } from "../game/constants";
import { period, scen, throughput, tierCost, tierKnown, unitValue, visibleTiers } from "../game/logic";
import { fmt, fmtRate, fmtVal } from "../game/format";
import type { GameState } from "../game/types";

export function hue(i: number): string {
  return `hsl(${TIER_HUES[i] ?? 0}, 62%, 62%)`;
}

interface Props {
  state: GameState;
  sel: number;
  onSelect: (i: number) => void;
  /** performance.now() stamp of the last economy step — lets wheels extrapolate between ticks. */
  tickedAt: { current: number };
}

const WHEEL_R = 16;
const WHEEL_C = 2 * Math.PI * WHEEL_R;

/**
 * The arc attribute is owned by the rAF loop below, not by React: the economy
 * ticks at 10Hz, but the sweep renders at display refresh, extrapolated from
 * the live phase. React only mounts the elements and toggles classes.
 */
function Wheel({ color, arcRef }: { color: string; arcRef: (el: SVGCircleElement | null) => void }): JSX.Element {
  return (
    <span className="wheel">
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
        <circle className="ghost" cx="20" cy="20" r={WHEEL_R} fill="none" strokeWidth="3" />
        <circle
          ref={arcRef}
          className="arc" cx="20" cy="20" r={WHEEL_R} fill="none"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          transform="rotate(-90 20 20)"
        />
      </svg>
    </span>
  );
}

/** No dial: a tier that has never existed here is just a slot you can open. */
function AddSlot(): JSX.Element {
  const r = 16;
  return (
    <span className="wheel">
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r={r} fill="none" strokeWidth="2" stroke="currentColor"
          strokeDasharray="3 5" opacity="0.5" />
        <path d="M20 14 v12 M14 20 h12" stroke="currentColor" strokeWidth="2" opacity="0.7" />
      </svg>
    </span>
  );
}

export function Rail({ state, sel, onSelect, tickedAt }: Props): JSX.Element {
  const live = useRef(state);
  live.current = state;
  const arcs = useRef(new Map<number, SVGCircleElement>());

  useEffect(() => {
    if (typeof requestAnimationFrame === "undefined") return;
    let raf = 0;
    const draw = () => {
      const s = live.current;
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
        el.setAttribute("stroke-dasharray", `${Math.max(0.001, p) * WHEEL_C} ${WHEEL_C}`);
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
    const T = period(state, i);
    const live = Math.floor(st.count) >= 1;
    const glowing = T < GLOW_PERIOD_S && live;
    const known = tierKnown(state, i);
    const targetName = def.target < 0 ? "score" : String(def.target + 1);
    rows.push(
      known ? (
        <button
          key={i}
          className={`node${sel === i ? " sel" : ""}${glowing ? " glowing" : ""}${live ? "" : " locked"}`}
          style={{ ["--tc" as string]: hue(i) } as Record<string, string>}
          onClick={() => onSelect(i)}
        >
          <Wheel color={hue(i)} arcRef={(el) => { if (el) arcs.current.set(i, el); else arcs.current.delete(i); }} />
          <span className="ncount">{fmt(Math.floor(st.count))}</span>
          <span className="nmeta">
            {def.baseValue <= 0
              ? "dead link"
              : live
                ? <>→ {targetName} · <b>{fmtRate(throughput(state, i))}</b>/s · {fmtVal(unitValue(state, i))} × {fmt(Math.floor(st.count))}</>
                : <>holding phase · pays {targetName}</>}
          </span>
          <span className="ntag">{i + 1}</span>
        </button>
      ) : (
        <button
          key={i}
          className={`node addnode${sel === i ? " sel" : ""}`}
          onClick={() => onSelect(i)}
        >
          <AddSlot />
          <span className="ncount">{fmt(tierCost(state, i, 1))}</span>
          <span className="nmeta">add tier {i + 1}{def.baseValue <= 0 ? " · dead link" : ` · pays ${targetName}`}</span>
          <span className="ntag">{i + 1}</span>
        </button>
      ),
    );
    if (i > 0) rows.push(<span key={`l${i}`} className="link" style={{ ["--tc" as string]: hue(i) } as Record<string, string>} />);
  }
  return <div className="rail">{rows}</div>;
}
