import { useCallback, useEffect, useRef, useState } from "react";
import { SAVE_INTERVAL_MS, TICK_MS } from "./game/constants";
import { applyPick, buyTier, doReset, prog, rollDraw, scen, scoreRate, step, switchScenario } from "./game/logic";
import { freshState } from "./game/state";
import { eraseSave, loadGame, persist } from "./game/save";
import { fmt, fmtRate } from "./game/format";
import type { Card, DrawOffer, GameState, OfflineReport } from "./game/types";
import { CSS } from "./ui/styles";
import { Rail } from "./ui/Rail";
import { BuyPanel, type BuyAmount } from "./ui/BuyPanel";
import { ResetPanel } from "./ui/ResetPanel";
import { CardsOverlay } from "./ui/CardsOverlay";
import { MorePanel } from "./ui/MorePanel";
import { TabBar, type TabId } from "./ui/TabBar";
import { OfflineModal } from "./ui/OfflineModal";

export default function App(): JSX.Element {
  const stateRef = useRef<GameState | null>(null);
  const [ready, setReady] = useState(false);
  const [, setFrame] = useState(0);
  const bump = useCallback(() => setFrame((f) => (f + 1) % 1_000_000), []);

  const [tab, setTab] = useState<TabId>("buy");
  const [sel, setSel] = useState(0);
  const [amount, setAmount] = useState<BuyAmount>(1);
  const [offer, setOffer] = useState<DrawOffer | null>(null);
  const [offline, setOffline] = useState<OfflineReport | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const bannerTimer = useRef<number | null>(null);
  const beatenSeen = useRef(false);

  const toast = useCallback((msg: string) => {
    setBanner(msg);
    if (bannerTimer.current !== null) window.clearTimeout(bannerTimer.current);
    bannerTimer.current = window.setTimeout(() => setBanner(null), 4200);
  }, []);

  useEffect(() => {
    let alive = true;
    void loadGame().then(({ state, offline: rep }) => {
      if (!alive) return;
      stateRef.current = state;
      beatenSeen.current = prog(state).beaten;
      if (rep) setOffline(rep);
      setReady(true);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const s = stateRef.current;
      if (!s) return;
      const now = performance.now();
      const dt = Math.min(2, (now - last) / 1000);
      last = now;
      step(s, dt);
      if (!beatenSeen.current && prog(s).beaten) {
        beatenSeen.current = true;
        toast(`SCENARIO ${scen(s).name} BEAT — ${fmt(scen(s).goal)} in one run. Next opened.`);
      }
      bump();
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [ready, bump, toast]);

  useEffect(() => {
    if (!ready) return;
    const save = (): void => { const s = stateRef.current; if (s) void persist(s); };
    const id = window.setInterval(save, SAVE_INTERVAL_MS);
    const onVis = (): void => { if (document.visibilityState === "hidden") save(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", save);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", save);
    };
  }, [ready]);

  const onBuy = useCallback((i: number, n: number) => {
    const s = stateRef.current;
    if (!s) return;
    if (buyTier(s, i, n)) { void persist(s); bump(); }
  }, [bump]);

  const onReset = useCallback(() => {
    const s = stateRef.current;
    if (!s || offer) return;
    setOffer(rollDraw(s, Math.random));
  }, [offer]);

  const onCeremonyDone = useCallback((picked: Card[]) => {
    const s = stateRef.current;
    if (!s) { setOffer(null); return; }
    for (const c of picked) applyPick(s, c);
    doReset(s);
    setOffer(null);
    setSel(0);
    setTab("buy");
    void persist(s);
    bump();
  }, [bump]);

  const onSwitch = useCallback((id: string) => {
    const s = stateRef.current;
    if (!s) return;
    switchScenario(s, id);
    beatenSeen.current = prog(s).beaten;
    setSel(0);
    setTab("buy");
    void persist(s);
    bump();
  }, [bump]);

  const onErase = useCallback(() => {
    void eraseSave().then(() => {
      const s = freshState();
      stateRef.current = s;
      beatenSeen.current = false;
      setSel(0);
      setTab("buy");
      setOffer(null);
      bump();
    });
  }, [bump]);

  const s = stateRef.current;
  if (!ready || !s) {
    return (
      <>
        <style>{CSS}</style>
        <div className="app" style={{ alignItems: "center", justifyContent: "center", color: "#8B8E96", fontSize: 13 }}>
          warming the wheels…
        </div>
      </>
    );
  }

  const p = prog(s);
  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <div className="display">
          <Rail state={s} sel={sel} onSelect={(i) => { setSel(i); setTab("buy"); }} />
          <div className="scoreblock">
            <div className="scorenum">{fmt(s.score)}</div>
            <div className="scoresub">
              <span><b>{fmtRate(scoreRate(s))}</b>/s</span>
              <span>run <b>{fmt(s.runScore)}</b></span>
              <span>best <b>{fmt(p.bestRun)}</b></span>
            </div>
          </div>
        </div>
        <div className="deck" style={{ position: "relative" }}>
          {banner && <div className="banner"><b>{banner.split(" — ")[0]}</b>{banner.includes(" — ") ? banner.slice(banner.indexOf(" — ") + 3) : ""}</div>}
          {tab === "buy" && (
            <BuyPanel state={s} sel={sel} setSel={setSel} amount={amount} setAmount={setAmount} onBuy={onBuy} />
          )}
          {tab === "reset" && <ResetPanel state={s} onReset={onReset} />}
          {tab === "more" && <MorePanel state={s} onSwitch={onSwitch} onErase={onErase} />}
          <TabBar tab={tab} setTab={setTab} />
        </div>
      </div>
      {offer && <CardsOverlay offer={offer} onDone={onCeremonyDone} />}
      {offline && <OfflineModal report={offline} onClose={() => setOffline(null)} />}
    </>
  );
}
