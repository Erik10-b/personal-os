import { getPadelState } from "@/lib/services/padel";
import { PadelApp } from "@/components/padel/PadelApp";

export default async function PadelPage() {
  const state = await getPadelState();
  return <PadelApp initial={state} />;
}
