import { useState } from "react";
import { SCENARIOS } from "../game/constants";
import { prog, scen, threshScale } from "../game/logic";
import { fmt, fmtDuration } from "../game/format";
import type { GameState } from "../game/types";

interface Props { state: GameState; onSwitch: (id: string) => void; onErase: () => void; }

export function MorePanel({ state, onSwitch, onErase }: Props): JSX.Element {
  const [armedErase, setArmedErase] = useState(false);
  const [armedSwitch, setArmedSwitch] = useState<string | null>(null);
  const p = prog(state);

  return (
    <div className="panel">
      <div className="scrollarea">
        <div className="sectionlabel">scenarios · beat one to open the next</div>
        {SCENARIOS.map((sc, idx) => {
          const sp = state.progress[sc.id];
          const beaten = sp?.beaten === true;
          const prevBeaten = idx === 0 || state.progress[SCENARIOS[idx - 1]?.id ?? ""]?.beaten === true;
          const active = state.scenario === sc.id;
          const locked = !prevBeaten && !active && !beaten;
          return (
            <button
              key={sc.id}
              className={`scenrow${active ? " active" : ""}${beaten ? " beat" : ""}`}
              disabled={locked}
              onClick={() => {
                if (active) return;
                if (armedSwitch === sc.id) { setArmedSwitch(null); onSwitch(sc.id); }
                else setArmedSwitch(sc.id);
              }}
            >
              <span className="sname">{sc.name}</span>
              <span className="sdiff">
                {locked ? "locked" : sc.diff}
                <br />goal: {fmt(sc.goal)} in one run
              </span>
              <span className="sflag">
                {beaten ? "BEAT" : active ? "HERE" : armedSwitch === sc.id ? "SURE?" : locked ? "—" : "GO"}
              </span>
            </button>
          );
        })}
        <button className="scenrow" disabled>
          <span className="sname">∗</span>
          <span className="sdiff">your own constitution · knobs and graph</span>
          <span className="sflag">SOON</span>
        </button>

        <div className="sectionlabel">this scenario</div>
        <div className="kv"><span>resets</span><b>{fmt(p.resets)}</b></div>
        <div className="kv"><span>picks taken</span><b>{fmt(p.picks)}</b></div>
        <div className="kv"><span>ladder factor</span><b>×{fmt(threshScale(state))}</b></div>
        <div className="kv"><span>best run</span><b>{fmt(p.bestRun)} / {fmt(scen(state).goal)}</b></div>
        <div className="kv"><span>score, all runs</span><b>{fmt(p.totalScore)}</b></div>
        <div className="kv"><span>start bonus</span><b>+{p.hotstart} · flywheel {p.flywheel ? "yes" : "no"}</b></div>
        <div className="kv"><span>watching since</span><b>{fmtDuration(Date.now() - state.startedAt)}</b></div>

        {!armedErase && <button className="dangerbtn" onClick={() => setArmedErase(true)}>ERASE EVERYTHING</button>}
        {armedErase && (
          <button className="dangerbtn armed" onClick={() => { setArmedErase(false); onErase(); }}>
            all scenarios, all tableaus, gone — really
          </button>
        )}
      </div>
    </div>
  );
}
