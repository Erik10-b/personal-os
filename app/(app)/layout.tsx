import "../health.css";

import { PageTransition } from "@/components/nav/PageTransition";
import { SideNav } from "@/components/nav/SideNav";
import { BottomTabBar } from "@/components/nav/BottomTabBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {





  return (
    <div className="os-frame">
      <SideNav />
      <div className="shell">
        <main><PageTransition>{children}</PageTransition></main>
      </div>
      <BottomTabBar />
    </div>
  );
}
