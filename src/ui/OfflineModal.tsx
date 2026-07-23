import { fmt, fmtDuration } from "../game/format";
import type { OfflineReport } from "../game/types";

interface Props { report: OfflineReport; onClose: () => void; }

export function OfflineModal({ report, onClose }: Props): JSX.Element {
  const capped = report.creditedMs < report.awayMs;
  return (
    <div className="veilshade">
      <div className="modal">
        <h3>The sky kept going</h3>
        <p>You were away {fmtDuration(report.awayMs)}{capped ? ` — the first ${fmtDuration(report.creditedMs)} counted` : ""}.</p>
        <div className="mgain">+{fmt(report.dustGained)} dust</div>
        <button onClick={onClose}>Back to it</button>
      </div>
    </div>
  );
}
