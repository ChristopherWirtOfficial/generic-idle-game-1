export type TabId = "buy" | "reset" | "more" | "log";

interface Props { tab: TabId; setTab: (t: TabId) => void; }

const TABS: TabId[] = ["buy", "reset", "more", "log"];

export function TabBar({ tab, setTab }: Props): JSX.Element {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)} aria-current={tab === t}>
          {t.toUpperCase()}
        </button>
      ))}
    </nav>
  );
}
