export type TabId = "buy" | "reset" | "more";

interface Props { tab: TabId; setTab: (t: TabId) => void; }

export function TabBar({ tab, setTab }: Props): JSX.Element {
  return (
    <nav className="tabbar">
      {(["buy", "reset", "more"] as const).map((t) => (
        <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)} aria-current={tab === t}>
          {t.toUpperCase()}
        </button>
      ))}
    </nav>
  );
}
