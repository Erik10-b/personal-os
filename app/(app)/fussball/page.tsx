import Link from "next/link";
import { getEvents } from "@/lib/services/events";
import { EventsPageClient } from "@/components/events/EventsPageClient";

export default async function FussballPage() {
  const events = await getEvents("fussball");

  return (
    <>
      <EventsPageClient
        area="fussball"
        title="Fußball"
        description="Trainingseinheiten und Spiele."
        events={events}
      />
      <div style={{ marginTop: "var(--space-8)" }}>
        <Link href="/fussball/statistik" className="btn secondary">
          Zur Statistik →
        </Link>
      </div>
    </>
  );
}
