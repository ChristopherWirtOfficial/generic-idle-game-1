import { fmt, fmtDuration } from "../game/format";

export function OfflineModal(props: {
  ms: number;
  gained: number;
  onClose: () => void;
}) {
  return (
    <div className="backdrop" onClick={props.onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>While you were gone</h2>
        <p>{fmtDuration(props.ms)} passed. The game continued.</p>
        <div className="gained">+{fmt(Math.floor(props.gained))}</div>
        <p>points</p>
        <button className="bigaction" onClick={props.onClose}>
          OK
        </button>
      </div>
    </div>
  );
}
