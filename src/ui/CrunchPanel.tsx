import { useState } from "react";
import { CRUNCH_LOG_RATE, CRUNCH_LOG_START, SINGULARITY_MULT_EACH } from "../game/constants";
import { pendingSingularities } from "../game/logic";
import { fmt } from "../game/format";
import type { GameState } from "../game/types";

interface Props { state: GameState; onCrunch: () => void; }

export function CrunchPanel({ state, onCrunch }: Props): JSX.Element {
  const [armed, setArmed] = useState(false);
  const pending = pendingSingularities(state);
  const after = state.singularities + pending;
  const nextThreshold = Math.pow(10, CRUNCH_LOG_START + (after + 1) / CRUNCH_LOG_RATE);

  return (
    <div className="crunchwrap">
      <h2>The Big Crunch</h2>
      <p>
        Pull everything back into a single point. Motes, Comets, worlds, upgrades — all of it, gone.
        What survives is gravity: each Singularity makes everything after produce {Math.round(SINGULARITY_MULT_EACH * 100)}% more, forever.
      </p>
      <div className="pending">
        {pending > 0
          ? <>Collapse now for <b>+{fmt(pending)}</b> {pending === 1 ? "Singularity" : "Singularities"} → ×{(1 + after * SINGULARITY_MULT_EACH).toFixed(2)} total</>
          : <>Nothing to gain yet.</>}
      </div>
      {pending === 0 && <p>Reach {fmt(nextThreshold)} lifetime dust for the next Singularity.</p>}
      {pending > 0 && !armed && (
        <button className="crunchslab" onClick={() => setArmed(true)}>Begin the Crunch</button>
      )}
      {pending > 0 && armed && (
        <>
          <button className="crunchslab armed" onClick={() => { setArmed(false); onCrunch(); }}>
            Collapse everything — really
          </button>
          <button style={{ color: "var(--dim)", fontSize: 13 }} onClick={() => setArmed(false)}>Not yet</button>
        </>
      )}
      {pending === 0 && <button className="crunchslab" disabled>Begin the Crunch</button>}
    </div>
  );
}
