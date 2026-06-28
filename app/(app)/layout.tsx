import { createClient } from "@/lib/supabase/server";
import { HeaderNav } from "@/components/nav/HeaderNav";
import { BottomTabBar } from "@/components/nav/BottomTabBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase() || "??";

  return (
    <>
      <HeaderNav userInitials={initials} />
      <div className="shell">
        <main>{children}</main>
      </div>
      <BottomTabBar />
    </>
  );
}
