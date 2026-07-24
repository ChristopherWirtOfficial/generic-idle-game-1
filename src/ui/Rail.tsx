import { GLOW_PERIOD_S, TIER_HUES } from "../game/constants";
import { period, scen, throughput, tierCost, tierKnown, unitValue, visibleTiers } from "../game/logic";
import { fmt, fmtRate } from "../game/format";
import type { GameState } from "../game/types";

export function hue(i: number): string {
  return `hsl(${TIER_HUES[i] ?? 0}, 62%, 62%)`;
}

interface Props { state: GameState; sel: number; onSelect: (i: number) => void; }

function Wheel({ phase, glowing, color }: { phase: number; glowing: boolean; color: string }): JSX.Element {
  const r = 16, c = 2 * Math.PI * r;
  const dash = glowing ? c : Math.max(0.001, phase) * c;
  return (
    <span className="wheel">
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden>
        <circle className="ghost" cx="20" cy="20" r={r} fill="none" strokeWidth="3" />
        <circle
          className="arc" cx="20" cy="20" r={r} fill="none"
          stroke={color} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`} transform="rotate(-90 20 20)"
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

export function Rail({ state, sel, onSelect }: Props): JSX.Element {
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
          <Wheel phase={st.phase} glowing={glowing} color={hue(i)} />
          <span className="ncount">{fmt(Math.floor(st.count))}</span>
          <span className="nmeta">
            {def.baseValue <= 0
              ? "dead link"
              : live
                ? <>→ {targetName} · <b>{fmtRate(throughput(state, i))}</b>/s · {fmt(unitValue(state, i))} × {fmt(Math.floor(st.count))}</>
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
