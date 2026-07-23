import { UPGRADES } from "../game/constants";
import { fmt } from "../game/format";
import type { GameState } from "../game/types";

interface Props { state: GameState; onBuy: (id: string) => void; }

export function ImprovePanel({ state, onBuy }: Props): JSX.Element {
  const horizon = Math.max(1000, state.lifetimeDust * 25);
  const open = UPGRADES.filter((u) => !state.upgrades.includes(u.id) && u.cost <= horizon);
  const beyond = UPGRADES.filter((u) => !state.upgrades.includes(u.id) && u.cost > horizon).length;
  const owned = UPGRADES.filter((u) => state.upgrades.includes(u.id));

  return (
    <div className="panel">
      <div className="scrollarea">
        {open.length === 0 && (
          <div className="empty">Nothing within reach right now.{beyond > 0 ? " Grow, and more will surface." : ""}</div>
        )}
        {open.map((u) => {
          const can = state.dust >= u.cost;
          return (
            <button key={u.id} className={`slab${can ? " can" : ""}`} disabled={!can} onClick={() => onBuy(u.id)}>
              <span className="grow">
                <span className="sname">{u.name}</span>
                <div className="sblurb">{u.blurb}</div>
              </span>
              <span className="scost">{fmt(u.cost)}</span>
            </button>
          );
        })}
        {beyond > 0 && open.length > 0 && (
          <div className="empty">{beyond} more further out.</div>
        )}
        {owned.length > 0 && (
          <>
            <div className="sectionlabel">Acquired</div>
            {owned.map((u) => (
              <div key={u.id} className="slab owneddone">
                <span className="grow">
                  <span className="sname">{u.name}</span>
                  <div className="sblurb">{u.blurb}</div>
                </span>
                <span className="scost">held</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
