import type { TabId } from "../game/types";

const TABS: { id: TabId; label: string }[] = [
  { id: "buy", label: "Buy" },
  { id: "improve", label: "Improve" },
  { id: "reset", label: "Reset" },
  { id: "numbers", label: "Numbers" },
];

export function TabBar(props: { tab: TabId; onSelect: (t: TabId) => void }) {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={t.id === props.tab ? "on" : ""}
          onClick={() => props.onSelect(t.id)}
          aria-current={t.id === props.tab ? "page" : undefined}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
