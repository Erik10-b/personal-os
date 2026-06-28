import { getEvents } from "@/lib/services/events";
import { EventsPageClient } from "@/components/events/EventsPageClient";

export default async function TerminePage() {
  const events = await getEvents("allgemein");

  return (
    <EventsPageClient
      area="allgemein"
      title="Termine"
      description="Alle allgemeinen Termine, chronologisch sortiert."
      events={events}
    />
  );
}
