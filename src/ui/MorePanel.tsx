import { useState } from "react";
import { ACHIEVEMENTS, ACH_MULT_EACH } from "../game/constants";
import { fmt, fmtDuration } from "../game/format";
import type { GameState } from "../game/types";

interface Props { state: GameState; onErase: () => void; }

export function MorePanel({ state, onErase }: Props): JSX.Element {
  const [armed, setArmed] = useState(false);
  const handBought = state.tiers.reduce((a, t) => a + t.bought, 0);
  const unlocked = state.achievements.length;

  return (
    <div className="panel">
      <div className="scrollarea">
        <div className="sectionlabel">The numbers</div>
        <div className="statrow"><span className="k">Dust, all time</span><span className="v">{fmt(state.lifetimeDust)}</span></div>
        <div className="statrow"><span className="k">Dust, this universe</span><span className="v">{fmt(state.runDust)}</span></div>
        <div className="statrow"><span className="k">Sky taps</span><span className="v">{fmt(state.presses)}</span></div>
        <div className="statrow"><span className="k">Bodies formed by hand</span><span className="v">{fmt(handBought)}</span></div>
        <div className="statrow"><span className="k">Singularities</span><span className="v">{fmt(state.singularities)}</span></div>
        <div className="statrow"><span className="k">Crunches</span><span className="v">{fmt(state.crunches)}</span></div>
        <div className="statrow"><span className="k">Watching since</span><span className="v">{fmtDuration(Date.now() - state.startedAt)}</span></div>

        <div className="sectionlabel">Marks · each +{Math.round(ACH_MULT_EACH * 100)}% production ({unlocked}/{ACHIEVEMENTS.length})</div>
        <div className="achgrid">
          {ACHIEVEMENTS.map((a) => {
            const got = state.achievements.includes(a.id);
            return (
              <div key={a.id} className={`ach${got ? "" : " locked"}`}>
                <div className="aname">{got ? a.name : "———"}</div>
                <div className="ablurb">{a.blurb}</div>
              </div>
            );
          })}
        </div>

        {!armed && <button className="dangerbtn" onClick={() => setArmed(true)}>Erase this universe</button>}
        {armed && (
          <button className="dangerbtn armed" onClick={() => { setArmed(false); onErase(); }}>
            Erase everything, including Singularities — really
          </button>
        )}
      </div>
    </div>
  );
}
