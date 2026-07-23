import { useEffect, useRef } from "react";
import { TIERS } from "../game/constants";
import type { GameState } from "../game/types";

export interface Floaty { id: number; x: number; y: number; text: string; }

interface Props {
  state: GameState;
  floaties: Floaty[];
  onPress: (x: number, y: number) => void;
  children?: import("react").ReactNode;
}

/** Deterministic PRNG so the field is stable between frames. */
function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Sky({ state, floaties, onPress, children }: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = 1;
    const fit = () => {
      dpr = Math.min(2, globalThis.devicePixelRatio || 1);
      w = wrap.clientWidth; h = wrap.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
    };
    fit();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    ro?.observe(wrap);

    const draw = (t: number) => {
      const s = stateRef.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Haze tinted by the highest tier you hold.
      let hi = -1;
      for (let i = TIERS.length - 1; i >= 0; i--) {
        if ((s.tiers[i]?.count ?? 0) >= 1) { hi = i; break; }
      }
      if (hi >= 0) {
        const def = TIERS[hi];
        if (def) {
          const g = ctx.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.42, Math.max(w, h) * 0.7);
          g.addColorStop(0, `hsla(${def.hue}, 70%, 55%, 0.10)`);
          g.addColorStop(1, "hsla(0, 0%, 0%, 0)");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        }
      }

      // Base starfield densifies with lifetime dust.
      const lg = s.lifetimeDust > 0 ? Math.log10(s.lifetimeDust + 1) : 0;
      const n = Math.min(200, 36 + Math.floor(lg * 13));
      const rand = mulberry(97);
      for (let i = 0; i < n; i++) {
        const x = rand() * w, y = rand() * h;
        const r = 0.5 + rand() * 1.1;
        const phase = rand() * Math.PI * 2;
        const tw = reduced ? 0.75 : 0.55 + 0.45 * Math.sin(t / 900 + phase);
        ctx.globalAlpha = 0.28 + 0.5 * tw * rand();
        ctx.fillStyle = "#E9E4FF";
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }

      // One glowing body per tier held, in that tier's color, growing with count.
      for (let i = 0; i < TIERS.length; i++) {
        const def = TIERS[i];
        const count = s.tiers[i]?.count ?? 0;
        if (!def || count < 1) continue;
        const trand = mulberry(300 + i * 71);
        const bodies = Math.min(5, 1 + Math.floor(Math.log10(count + 1)));
        for (let b = 0; b < bodies; b++) {
          const x = (0.1 + 0.8 * trand()) * w;
          const y = (0.08 + 0.62 * trand()) * h;
          const r = 1.6 + i * 0.7 + b * 0.5;
          const pulse = reduced ? 1 : 0.9 + 0.1 * Math.sin(t / 1400 + i + b);
          ctx.globalAlpha = 0.9;
          const g2 = ctx.createRadialGradient(x, y, 0, x, y, r * 4 * pulse);
          g2.addColorStop(0, `hsla(${def.hue}, 85%, 72%, 0.9)`);
          g2.addColorStop(0.35, `hsla(${def.hue}, 80%, 60%, 0.35)`);
          g2.addColorStop(1, "hsla(0,0%,0%,0)");
          ctx.fillStyle = g2;
          ctx.beginPath(); ctx.arc(x, y, r * 4 * pulse, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < 110) return; // ~9fps is plenty for a sky
      last = t;
      draw(t);
    };
    if (reduced) {
      draw(0);
      const iv = setInterval(() => draw(0), 1500);
      return () => { clearInterval(iv); ro?.disconnect(); };
    }
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro?.disconnect(); };
  }, []);

  return (
    <div
      className="sky"
      ref={wrapRef}
      onPointerDown={(e: { clientX: number; clientY: number; currentTarget: { getBoundingClientRect(): DOMRect } }) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Number.isFinite(e.clientX) ? e.clientX - rect.left : rect.width / 2;
        const y = Number.isFinite(e.clientY) ? e.clientY - rect.top : rect.height / 2;
        onPress(x, y);
      }}
      role="button"
      aria-label="Condense stardust"
    >
      <canvas ref={canvasRef} />
      <div className="readout">{children}</div>
      {floaties.map((f) => (
        <span key={f.id} className="floaty" style={{ left: f.x, top: f.y }}>{f.text}</span>
      ))}
      <div className="hint">Tap the sky</div>
    </div>
  );
}
