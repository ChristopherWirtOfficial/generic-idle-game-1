import { useRef, useState } from "react";
import { fmt } from "../game/format";

interface Mark {
  id: number;
  x: number;
  y: number;
  rot: number;
  text: string;
}

export function TheButton(props: { pressValue: number; onPress: () => void }) {
  const [marks, setMarks] = useState<Mark[]>([]);
  const nextId = useRef(0);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  function handlePress(e: React.PointerEvent<HTMLButtonElement>) {
    props.onPress();
    const btn = btnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const inBounds =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    const x = inBounds ? e.clientX - rect.left : rect.width / 2;
    const y = inBounds ? e.clientY - rect.top : rect.height / 2;
    const mark: Mark = {
      id: nextId.current++,
      x: x + (Math.random() * 24 - 12),
      y: y - 6,
      rot: Math.random() * 14 - 7,
      text: "+" + fmt(Math.floor(props.pressValue)),
    };
    setMarks((m) => [...m.slice(-24), mark]);
    window.setTimeout(() => {
      setMarks((m) => m.filter((mk) => mk.id !== mark.id));
    }, 720);
  }

  return (
    <div className="presswrap">
      <button
        ref={btnRef}
        className="pressbtn"
        onPointerDown={handlePress}
        onClick={(e) => {
          if (e.detail === 0) props.onPress(); // keyboard activation
        }}
        onContextMenu={(e) => e.preventDefault()}
        aria-label="The Button. Press to get points."
      >
        <span className="label">The Button</span>
        <span className="sub">Press to get points.</span>
        {marks.map((m) => (
          <span
            key={m.id}
            className="floatmark"
            style={
              {
                left: m.x,
                top: m.y,
                "--rot": m.rot + "deg",
              } as React.CSSProperties
            }
          >
            {m.text}
          </span>
        ))}
      </button>
    </div>
  );
}
