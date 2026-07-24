import { useState } from "react";
import { CHANGELOG, KIND_LABEL } from "./changelog";

/**
 * Notes from Claude, read one at a time.
 *
 * Same interaction as the rail: everything is a headline until you open it, and
 * only one thing is open at once. That keeps the whole log scannable in a
 * single screen instead of turning into a wall you have to read top to bottom.
 */
export function LogPanel(): JSX.Element {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="panel">
      <div className="scrollarea">
        <div className="sectionlabel">notes · newest first</div>
        {CHANGELOG.map((e, i) => {
          const isOpen = open === i;
          return (
            <div key={e.title} className={`logentry${isOpen ? " open" : ""} k-${e.kind}`}>
              <button
                className="loghead"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                <span className="logdot" aria-hidden />
                <span className="logtitle">{e.title}</span>
                <span className="logkind">{KIND_LABEL[e.kind]}</span>
              </button>
              <div className="logbody">
                <div className="logbodyin">
                  <div className="logbodypad">
                    {e.body.map((line, k) => (
                      <p key={k}>{line}</p>
                    ))}
                    <span className="logwhen">{e.when}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
