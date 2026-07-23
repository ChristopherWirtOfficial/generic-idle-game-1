import { useCallback, useEffect, useRef, useState } from "react";
import { ACHIEVEMENTS, SAVE_INTERVAL_MS, TICK_MS } from "./game/constants";
import {
  buyTier, buyUpgrade, checkAchievements, doCrunch, dustPerSecond,
  hasAutoPress, press, step,
} from "./game/logic";
import { fmt, fmtRate } from "./game/format";
import { eraseSave, loadGame, persist } from "./game/save";
import { freshState } from "./game/state";
import type { GameState, OfflineReport } from "./game/types";
import { CSS } from "./ui/styles";
import { Sky, type Floaty } from "./ui/Sky";
import { BuildPanel, type BuyAmount } from "./ui/BuildPanel";
import { ImprovePanel } from "./ui/ImprovePanel";
import { CrunchPanel } from "./ui/CrunchPanel";
import { MorePanel } from "./ui/MorePanel";
import { TabBar, type TabId } from "./ui/TabBar";
import { Toast } from "./ui/Toast";
import { OfflineModal } from "./ui/OfflineModal";

const achById = new Map(ACHIEVEMENTS.map((a) => [a.id, a]));

export default function App(): JSX.Element {
  const stateRef = useRef<GameState | null>(null);
  const [, setFrame] = useState(0);
  const bump = useCallback(() => setFrame((f) => f + 1), []);

  const [tab, setTab] = useState<TabId>("build");
  const [sel, setSel] = useState(0);
  const [amount, setAmount] = useState<BuyAmount>(1);
  const [offline, setOffline] = useState<OfflineReport | null>(null);
  const [floaties, setFloaties] = useState<Floaty[]>([]);
  const floatyId = useRef(0);
  const [toastQ, setToastQ] = useState<string[]>([]);
  const autoAcc = useRef(0);

  // Load once.
  useEffect(() => {
    let live = true;
    void loadGame().then(({ state, offline: rep }) => {
      if (!live) return;
      stateRef.current = state;
      if (rep) setOffline(rep);
      bump();
    });
    return () => { live = false; };
  }, [bump]);

  // Tick.
  useEffect(() => {
    const iv = setInterval(() => {
      const s = stateRef.current;
      if (!s) return;
      step(s, TICK_MS / 1000);
      if (hasAutoPress(s)) {
        autoAcc.current += TICK_MS / 1000;
        while (autoAcc.current >= 1) { autoAcc.current -= 1; press(s); }
      }
      const fresh = checkAchievements(s);
      if (fresh.length > 0) setToastQ((q) => [...q, ...fresh]);
      bump();
    }, TICK_MS);
    return () => clearInterval(iv);
  }, [bump]);

  // Autosave + leave handlers.
  useEffect(() => {
    const save = () => { const s = stateRef.current; if (s) void persist(s); };
    const iv = setInterval(save, SAVE_INTERVAL_MS);
    const onVis = () => { if (document.visibilityState === "hidden") save(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", save);
    return () => {
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", save);
    };
  }, []);

  // Toast queue: show head for 2.4s.
  useEffect(() => {
    if (toastQ.length === 0) return;
    const t = setTimeout(() => setToastQ((q) => q.slice(1)), 2400);
    return () => clearTimeout(t);
  }, [toastQ]);

  const onPress = useCallback((x: number, y: number) => {
    const s = stateRef.current;
    if (!s) return;
    const v = press(s);
    const id = ++floatyId.current;
    setFloaties((fs) => [...fs.slice(-11), { id, x, y, text: `+${fmt(v)}` }]);
    setTimeout(() => setFloaties((fs) => fs.filter((f) => f.id !== id)), 900);
    bump();
  }, [bump]);

  const onBuyTier = useCallback((i: number, n: number) => {
    const s = stateRef.current;
    if (!s) return;
    if (buyTier(s, i, n)) { void persist(s); bump(); }
  }, [bump]);

  const onBuyUpgrade = useCallback((id: string) => {
    const s = stateRef.current;
    if (!s) return;
    if (buyUpgrade(s, id)) { void persist(s); bump(); }
  }, [bump]);

  const onCrunch = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    if (doCrunch(s) > 0) {
      setSel(0); setTab("build"); setAmount(1);
      void persist(s);
      bump();
    }
  }, [bump]);

  const onErase = useCallback(() => {
    void eraseSave().then(() => {
      stateRef.current = freshState();
      setSel(0); setTab("build"); setAmount(1); setOffline(null); setToastQ([]);
      bump();
    });
  }, [bump]);

  const s = stateRef.current;
  if (!s) {
    return (
      <>
        <style>{CSS}</style>
        <div className="app"><div className="sky"><div className="readout"><div className="dustlabel">gathering the sky…</div></div></div></div>
      </>
    );
  }

  const dps = dustPerSecond(s);
  const headToast = toastQ[0] !== undefined ? achById.get(toastQ[0]) : undefined;

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <Sky state={s} floaties={floaties} onPress={onPress}>
          <div className="dustlabel">Stardust</div>
          <div className="dustnum">{fmt(s.dust)}</div>
          <div className="rate"><b>{fmtRate(dps)}</b> per second</div>
          {s.singularities > 0 && (
            <div className="singchip">◉ {fmt(s.singularities)} Singularit{s.singularities === 1 ? "y" : "ies"}</div>
          )}
        </Sky>
        <div className="deck" style={{ position: "relative" }}>
          {headToast && <Toast title={headToast.name} body={headToast.blurb} />}
          {tab === "build" && (
            <BuildPanel state={s} sel={sel} setSel={setSel} amount={amount} setAmount={setAmount} onBuy={onBuyTier} />
          )}
          {tab === "improve" && <ImprovePanel state={s} onBuy={onBuyUpgrade} />}
          {tab === "crunch" && <CrunchPanel state={s} onCrunch={onCrunch} />}
          {tab === "more" && <MorePanel state={s} onErase={onErase} />}
          <TabBar tab={tab} setTab={setTab} />
        </div>
      </div>
      {offline && <OfflineModal report={offline} onClose={() => setOffline(null)} />}
    </>
  );
}
