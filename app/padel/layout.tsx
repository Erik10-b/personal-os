import { ThemeToggle } from "@/components/nav/ThemeToggle";

export const metadata = {
  title: "Padel BCN",
  description: "Team-Auslosung, Ergebnisse und Rangliste für das Padel-Turnier in Barcelona.",
};

export default function PadelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="padel-scope">
      <header className="app-header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-mark">🎾</div>
            <div className="brand-block">
              <span className="brand-name">Padel BCN</span>
              <span className="brand-meta">BARCELONA · ESPAÑA</span>
            </div>
          </div>
          <div className="header-spacer" />
          <ThemeToggle />
        </div>
      </header>
      <div className="shell">
        <main>{children}</main>
      </div>
    </div>
  );
}
