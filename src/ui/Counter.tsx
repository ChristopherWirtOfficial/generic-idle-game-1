import { statusLine } from "../game/constants";
import { fmt, fmtRate } from "../game/format";

export function Counter(props: { points: number; pps: number }) {
  const text = fmt(props.points);
  const size =
    text.length <= 9 ? 44 : text.length <= 13 ? 36 : text.length <= 17 ? 30 : 24;
  return (
    <div className="counter">
      <div className="eyebrow">Points</div>
      <div className="big" style={{ fontSize: size }}>
        {text}
      </div>
      <div className="rate">
        <span className="plus">+</span>
        {fmtRate(props.pps)} per second
      </div>
      <div className="status">{statusLine(props.points)}</div>
    </div>
  );
}
