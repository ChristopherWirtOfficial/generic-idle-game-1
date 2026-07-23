export type TabId = "build" | "improve" | "crunch" | "more";

const TABS: { id: TabId; label: string; glyph: string }[] = [
  { id: "build", label: "Build", glyph: "◈" },
  { id: "improve", label: "Improve", glyph: "✦" },
  { id: "crunch", label: "Crunch", glyph: "◉" },
  { id: "more", label: "More", glyph: "≡" },
];

interface Props { tab: TabId; setTab: (t: TabId) => void; }

export function TabBar({ tab, setTab }: Props): JSX.Element {
  return (
    <nav className="tabbar">
      {TABS.map((t) => (
        <button key={t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)} aria-current={tab === t.id}>
          <span className="glyph" aria-hidden>{t.glyph}</span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
