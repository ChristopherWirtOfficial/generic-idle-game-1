import { useCallback, useEffect, useRef, useState } from "react";
import { OFFLINE_MIN_MS, SAVE_INTERVAL_MS, SCENARIOS, TICK_MS } from "./game/constants";
import { applyPick, buyTier, doReset, prog, rollDraw, scen, scoreRate, step, switchScenario } from "./game/logic";
import { applyOffline, eraseSave, loadGame, persist } from "./game/save";
import { freshState } from "./game/state";
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
  const [, setFrame] = useState(0);
  const bump = useCallback(() => setFrame((f) => (f + 1) % 1_000_000), []);

  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<TabId>("buy");
  const [sel, setSel] = useState(0);
  const [amount, setAmount] = useState<BuyAmount>(1);
  const [offer, setOffer] = useState<DrawOffer | null>(null);
  const [offline, setOffline] = useState<OfflineReport | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const beatenShown = useRef<Set<string>>(new Set());
  const bannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hiddenAt = useRef<number>(0);

  // ---- load
  useEffect(() => {
    let alive = true;
    void loadGame().then(({ state, offline: report }) => {
      if (!alive) return;
      stateRef.current = state;
      for (const [id, p] of Object.entries(state.progress)) {
        if (p.beaten) beatenShown.current.add(id);
      }
      setOffline(report);
      setReady(true);
    });
    return () => { alive = false; };
  }, []);

  const showBanner = useCallback((text: string) => {
    setBanner(text);
    if (bannerTimer.current) clearTimeout(bannerTimer.current);
    bannerTimer.current = setTimeout(() => setBanner(null), 6000);
  }, []);

  // ---- tick
  useEffect(() => {
    if (!ready) return;
    let last = Date.now();
    const id = setInterval(() => {
      const s = stateRef.current;
      if (!s) return;
      const now = Date.now();
      const dt = Math.min(2000, Math.max(0, now - last)) / 1000;
      last = now;
      step(s, dt);
      const p = prog(s);
      if (p.beaten && !beatenShown.current.has(s.scenario)) {
        beatenShown.current.add(s.scenario);
        const idx = SCENARIOS.findIndex((sc) => sc.id === s.scenario);
        const next = SCENARIOS[idx + 1];
        showBanner(next
          ? `goal ${fmt(scen(s).goal)} met — scenario ${next.name} is open`
          : `goal ${fmt(scen(s).goal)} met — that was the last one`);
      }
      bump();
    }, TICK_MS);
    return () => clearInterval(id);
  }, [ready, bump, showBanner]);

  // ---- autosave + visibility
  useEffect(() => {
    if (!ready) return;
    const save = () => { const s = stateRef.current; if (s) void persist(s); };
    const id = setInterval(save, SAVE_INTERVAL_MS);
    const onVis = () => {
      const s = stateRef.current;
      if (!s) return;
      if (document.visibilityState === "hidden") {
        hiddenAt.current = Date.now();
        void persist(s);
      } else if (hiddenAt.current > 0) {
        const away = Date.now() - hiddenAt.current;
        hiddenAt.current = 0;
        if (away >= OFFLINE_MIN_MS) {
          const report = applyOffline(s, away);
          if (report.bankedGained > 0 || report.trickle >= 1) setOffline(report);
          void persist(s);
          bump();
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", save);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", save);
    };
  }, [ready, bump]);

  // ---- handlers
  const onSelect = useCallback((i: number) => { setSel(i); setTab("buy"); }, []);

  const onBuy = useCallback((i: number, n: number) => {
    const s = stateRef.current;
    if (!s) return;
    if (buyTier(s, i, n)) { void persist(s); bump(); }
  }, [bump]);

  const onReset = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    setOffer(rollDraw(s, Math.random));
  }, []);

  const onCeremonyDone = useCallback((picked: Card[]) => {
    const s = stateRef.current;
    if (!s) return;
    for (const c of picked) applyPick(s, c);
    doReset(s);
    setOffer(null);
    setTab("buy");
    setSel(0);
    void persist(s);
    bump();
  }, [bump]);

  const onSwitch = useCallback((id: string) => {
    const s = stateRef.current;
    if (!s) return;
    switchScenario(s, id);
    setSel(0);
    setTab("buy");
    void persist(s);
    bump();
  }, [bump]);

  const onErase = useCallback(() => {
    void eraseSave();
    stateRef.current = freshState();
    beatenShown.current = new Set();
    setOffer(null);
    setSel(0);
    setTab("buy");
    bump();
  }, [bump]);

  // ---- render
  const s = stateRef.current;
  if (!ready || !s) {
    return (
      <div className="app">
        <style>{CSS}</style>
        <div style={{ margin: "auto", color: "#8B8E96", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 13 }}>
          warming the wheels…
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <style>{CSS}</style>
      <div className="display">
        <Rail state={s} sel={sel} onSelect={onSelect} />
        <div className="scoreblock">
          <div className="scorenum">{fmt(s.score)}</div>
          <div className="scoresub">
            <span><b>{fmtRate(scoreRate(s))}</b>/s</span>
            <span>run <b>{fmt(s.runScore)}</b></span>
          </div>
        </div>
      </div>
      <div className="deck" style={{ position: "relative" }}>
        {banner && <div className="banner" style={{ pointerEvents: "none" }}>{banner}</div>}
        {tab === "buy" && (
          <BuyPanel state={s} sel={sel} setSel={setSel} amount={amount} setAmount={setAmount} onBuy={onBuy} />
        )}
        {tab === "reset" && <ResetPanel state={s} onReset={onReset} />}
        {tab === "more" && <MorePanel state={s} onSwitch={onSwitch} onErase={onErase} />}
        <TabBar tab={tab} setTab={setTab} />
      </div>
      {offer && <CardsOverlay offer={offer} onDone={onCeremonyDone} />}
      {offline && !offer && <OfflineModal report={offline} onClose={() => setOffline(null)} />}
    </div>
  );
}
