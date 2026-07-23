import { useCallback, useEffect, useRef, useState } from "react";
import { ACHIEVEMENTS, OFFLINE_CAP_MS, SAVE_EVERY_MS, TICK_MS } from "./game/constants";
import { buyGen, buyUpgrade, doPrestige, pointsPerSecond, press, pressValue, step } from "./game/logic";
import { eraseSave, load, persist } from "./game/save";
import { initialState } from "./game/state";
import type { BuyAmount, GameState, TabId } from "./game/types";
import { Counter } from "./ui/Counter";
import { OfflineModal } from "./ui/OfflineModal";
import { TabBar } from "./ui/TabBar";
import { TheButton } from "./ui/TheButton";
import { TitleBlock } from "./ui/TitleBlock";
import { Toast } from "./ui/Toast";
import { BuyPanel } from "./ui/panels/BuyPanel";
import { ImprovePanel } from "./ui/panels/ImprovePanel";
import { NumbersPanel } from "./ui/panels/NumbersPanel";
import { ResetPanel } from "./ui/panels/ResetPanel";
import { CSS } from "./ui/styles";

export default function App() {
  const [s, setS] = useState<GameState | null>(null);
  const [tab, setTab] = useState<TabId>("buy");
  const [amount, setAmount] = useState<BuyAmount>(1);
  const [offline, setOffline] = useState<{ ms: number; gained: number } | null>(null);
  const [toastQueue, setToastQueue] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const sRef = useRef<GameState | null>(null);
  sRef.current = s;
  const lastTickRef = useRef<number>(Date.now());
  const lastSaveRef = useRef<number>(Date.now());
  const achCountRef = useRef<number>(0);

  // Load once.
  useEffect(() => {
    let cancelled = false;
    void load(Date.now()).then((res) => {
      if (cancelled) return;
      achCountRef.current = res.state.achievements.length;
      lastTickRef.current = Date.now();
      setS(res.state);
      setOffline(res.offline);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Tick loop.
  useEffect(() => {
    if (s === null) return;
    const id = window.setInterval(() => {
      const now = Date.now();
      const dt = Math.min(Math.max(0, now - lastTickRef.current), OFFLINE_CAP_MS);
      lastTickRef.current = now;
      setS((prev) => (prev === null ? prev : step(prev, dt, now)));
      if (now - lastSaveRef.current >= SAVE_EVERY_MS) {
        lastSaveRef.current = now;
        const cur = sRef.current;
        if (cur !== null) void persist(cur);
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [s === null]);

  // Save when the tab hides or closes.
  useEffect(() => {
    function saveNow() {
      const cur = sRef.current;
      if (cur !== null) void persist(cur);
    }
    function onVis() {
      if (document.visibilityState === "hidden") saveNow();
    }
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", saveNow);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", saveNow);
    };
  }, []);

  // New achievements become toasts.
  useEffect(() => {
    if (s === null) return;
    if (s.achievements.length > achCountRef.current) {
      const fresh = s.achievements.slice(achCountRef.current);
      achCountRef.current = s.achievements.length;
      const names = fresh
        .map((id) => ACHIEVEMENTS.find((a) => a.id === id)?.name)
        .filter((n): n is string => typeof n === "string");
      setToastQueue((q) => [...q, ...names]);
    }
  }, [s]);

  // One toast at a time.
  useEffect(() => {
    if (toast !== null || toastQueue.length === 0) return;
    const [head, ...rest] = toastQueue;
    if (head === undefined) return;
    setToast(head);
    setToastQueue(rest);
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast, toastQueue]);

  const handlePress = useCallback(() => {
    setS((prev) => (prev === null ? prev : press(prev)));
  }, []);

  const handleBuyGen = useCallback(
    (i: number) => {
      setS((prev) => (prev === null ? prev : buyGen(prev, i, amount)));
    },
    [amount]
  );

  const handleBuyUpgrade = useCallback((id: string) => {
    setS((prev) => (prev === null ? prev : buyUpgrade(prev, id)));
  }, []);

  const handlePrestige = useCallback(() => {
    setS((prev) => {
      if (prev === null) return prev;
      const next = doPrestige(prev);
      void persist(next);
      return next;
    });
    setTab("buy");
  }, []);

  const handleDeleteSave = useCallback(() => {
    void eraseSave();
    const fresh = initialState(Date.now());
    achCountRef.current = 0;
    lastTickRef.current = Date.now();
    setToastQueue([]);
    setToast(null);
    setOffline(null);
    setTab("buy");
    setS(fresh);
  }, []);

  if (s === null) {
    return (
      <div className="gig1">
        <style>{CSS}</style>
        <div className="loading">Loading the number</div>
      </div>
    );
  }

  const pps = pointsPerSecond(s);
  const pv = pressValue(s);

  return (
    <div className="gig1">
      <style>{CSS}</style>
      <TitleBlock />
      <Counter points={s.points} pps={pps} />
      <TheButton pressValue={pv} onPress={handlePress} />
      <main className="panel">
        {tab === "buy" && (
          <BuyPanel s={s} amount={amount} onAmount={setAmount} onBuy={handleBuyGen} />
        )}
        {tab === "improve" && <ImprovePanel s={s} onBuy={handleBuyUpgrade} />}
        {tab === "reset" && <ResetPanel s={s} onPrestige={handlePrestige} />}
        {tab === "numbers" && (
          <NumbersPanel s={s} pps={pps} pressValue={pv} onDeleteSave={handleDeleteSave} />
        )}
      </main>
      <TabBar tab={tab} onSelect={setTab} />
      {toast !== null && <Toast text={toast} />}
      {offline !== null && (
        <OfflineModal
          ms={offline.ms}
          gained={offline.gained}
          onClose={() => setOffline(null)}
        />
      )}
    </div>
  );
}
