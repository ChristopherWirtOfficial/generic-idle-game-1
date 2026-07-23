import { useEffect, useState } from "react";
import { PP_BASE, PP_MULT_EACH } from "../../game/constants";
import { fmt } from "../../game/format";
import { pendingPP } from "../../game/logic";
import type { GameState } from "../../game/types";

export function ResetPanel(props: { s: GameState; onPrestige: () => void }) {
  const { s } = props;
  const pending = pendingPP(s);
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(t);
  }, [armed]);

  function handlePress() {
    if (!armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    props.onPrestige();
  }

  const bonusPct = Math.round(PP_MULT_EACH * 100);

  return (
    <div className="resetpanel">
      <div className="panel-title" style={{ justifyContent: "center" }}>
        <span>Starting over</span>
      </div>
      <p>
        Reset your points, things, and improvements in exchange for prestige
        points. Each prestige point makes all points {bonusPct}% faster,
        forever. This is how these games work.
      </p>
      <div className="stats" style={{ textAlign: "left" }}>
        <div className="stat">
          <span className="k">Prestige points</span>
          <span className="v">{fmt(s.pp)}</span>
        </div>
        <div className="stat">
          <span className="k">Current bonus</span>
          <span className="v">+{fmt(s.pp * bonusPct)}%</span>
        </div>
        <div className="stat">
          <span className="k">Gain on reset</span>
          <span className="v">+{fmt(pending)}</span>
        </div>
      </div>
      <button
        className={"bigaction" + (armed ? " armed" : "")}
        disabled={pending < 1}
        onClick={handlePress}
      >
        {armed ? "Really reset everything" : "Reset everything"}
      </button>
      {pending < 1 ? (
        <p className="fine">
          Requires {fmt(PP_BASE)} points earned this run. You have{" "}
          {fmt(s.runEarned)}.
        </p>
      ) : (
        <p className="fine">Achievements and prestige points are kept.</p>
      )}
    </div>
  );
}
