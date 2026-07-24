import { fmt, fmtDuration } from "../game/format";
import type { OfflineReport } from "../game/types";

interface Props { report: OfflineReport; onClose: () => void; }

export function OfflineModal({ report, onClose }: Props): JSX.Element {
  return (
    <div className="veil">
      <div className="modal">
        <h3>AWAY {fmtDuration(report.awayMs).toUpperCase()}</h3>
        <p>Time away is preparation, not production. Wheels kept their phase.</p>
        {report.bankedGained > 0 && <div className="mrow">+{report.bankedGained} banked draw{report.bankedGained > 1 ? "s" : ""} on your next reset</div>}
        {report.trickle >= 1 && <div className="mrow">+{fmt(report.trickle)} trickle</div>}
        <button onClick={onClose}>BACK</button>
      </div>
    </div>
  );
}
