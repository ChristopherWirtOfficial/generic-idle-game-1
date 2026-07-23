import { UPGRADES } from "../../game/constants";
import { fmt } from "../../game/format";
import type { GameState } from "../../game/types";

export function ImprovePanel(props: { s: GameState; onBuy: (id: string) => void }) {
  const { s } = props;
  const owned = UPGRADES.filter((u) => s.upgrades.includes(u.id));
  const unowned = UPGRADES.filter((u) => !s.upgrades.includes(u.id));
  const shown = unowned.filter((u) => s.runEarned >= u.cost * 0.25);
  const hiddenCount = unowned.length - shown.length;

  return (
    <div>
      <div className="panel-title">
        <span>Improvements</span>
        <span>
          {owned.length}/{UPGRADES.length} owned
        </span>
      </div>
      {shown.length === 0 && hiddenCount > 0 && (
        <div className="hint">No improvements available. Get more points.</div>
      )}
      {shown.map((u) => {
        const affordable = s.points >= u.cost;
        return (
          <div className="row" key={u.id}>
            <div className="info">
              <div className="name">{u.name}</div>
              <div className="blurb">{u.blurb}</div>
            </div>
            <button
              className="costbtn"
              disabled={!affordable}
              onClick={() => props.onBuy(u.id)}
            >
              {fmt(u.cost)}
              <span className="n">buy</span>
            </button>
          </div>
        );
      })}
      {hiddenCount > 0 && shown.length > 0 && (
        <div className="hint">
          {hiddenCount} more improvement{hiddenCount === 1 ? "" : "s"} exist
          {hiddenCount === 1 ? "s" : ""}.
        </div>
      )}
      {hiddenCount === 0 && shown.length === 0 && (
        <div className="hint">Every improvement is owned. Well done.</div>
      )}
      {owned.length > 0 && (
        <div className="hint">Owned: {owned.map((u) => u.name).join(", ")}.</div>
      )}
    </div>
  );
}
