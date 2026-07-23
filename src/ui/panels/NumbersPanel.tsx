import { useEffect, useState } from "react";
import { ACHIEVEMENTS, ACH_MULT_EACH } from "../../game/constants";
import { fmt, fmtDuration, fmtRate } from "../../game/format";
import type { GameState } from "../../game/types";

export function NumbersPanel(props: {
  s: GameState;
  pps: number;
  pressValue: number;
  onDeleteSave: () => void;
}) {
  const { s } = props;
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 3000);
    return () => window.clearTimeout(t);
  }, [armed]);

  function handleDelete() {
    if (!armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    props.onDeleteSave();
  }

  const rows: [string, string][] = [
    ["Points", fmt(s.points)],
    ["Points per second", fmtRate(props.pps)],
    ["Points per press", fmt(Math.floor(props.pressValue))],
    ["Points this run", fmt(s.runEarned)],
    ["Points, ever", fmt(s.everEarned)],
    ["Button presses", fmt(s.presses)],
    ["Things owned", fmt(s.gens.reduce((a, b) => a + b, 0))],
    ["Resets", fmt(s.resets)],
    ["Time played", fmtDuration(s.playedMs)],
    ["Games named this", "1"],
  ];

  return (
    <div>
      <div className="panel-title">
        <span>The numbers</span>
      </div>
      <div className="stats">
        {rows.map(([k, v]) => (
          <div className="stat" key={k}>
            <span className="k">{k}</span>
            <span className="v">{v}</span>
          </div>
        ))}
      </div>
      <div className="panel-title">
        <span>Achievements</span>
        <span>
          {s.achievements.length}/{ACHIEVEMENTS.length}, each +
          {Math.round(ACH_MULT_EACH * 100)}% points
        </span>
      </div>
      <div className="achlist">
        {ACHIEVEMENTS.map((a) =>
          s.achievements.includes(a.id) ? (
            <div className="ach" key={a.id}>
              {"\u2014 "}
              {a.name}
            </div>
          ) : (
            <div className="ach no" key={a.id}>
              {"\u2014 ???"}
            </div>
          )
        )}
      </div>
      <div className="panel-title">
        <span>The save</span>
        <span>Automatic.</span>
      </div>
      <div className="row">
        <div className="info">
          <div className="name">Delete save</div>
          <div className="blurb">Everything, gone. Forever.</div>
        </div>
        <button className={"smallact" + (armed ? " armed" : "")} onClick={handleDelete}>
          {armed ? "Really delete" : "Delete"}
        </button>
      </div>
      <div className="colophon">
        Generic Idle Game 1 · A game where a number goes up
      </div>
    </div>
  );
}
