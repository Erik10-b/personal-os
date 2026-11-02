import type { ShareCardData } from "@/lib/shareCard";
import type { WorkoutSessionWithExercises } from "@/lib/services/training";
import type { MatchRow } from "@/lib/types";
import { formatDelta, formatVolume } from "@/lib/trainingInsights";
import type { SessionInsights } from "@/lib/trainingInsights";

const longDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const slug = (text: string) =>
  text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "karte";

export function sessionShareCard(session: WorkoutSessionWithExercises, insights: SessionInsights): ShareCardData {
  const volume = formatVolume(insights.volumeKg);
  const title = session.title || "Training";
  const badge = insights.prs.length
    ? insights.prs.length === 1 ? `Neue Bestleistung · ${insights.prs[0]}` : `${insights.prs.length} neue Bestleistungen`
    : insights.volumeDelta !== null ? `${formatDelta(insights.volumeDelta)} Volumen ggü. letztem Mal` : undefined;

  return {
    kicker: "Training",
    title,
    date: longDate(session.session_date),
    hero: insights.volumeKg > 0
      ? { value: volume.value, unit: volume.unit, label: "bewegtes Gewicht" }
      : { value: String(insights.reps), unit: "Wdh.", label: "Wiederholungen" },
    stats: [
      { label: "Übungen", value: String(session.exercises.length) },
      { label: "Sätze", value: String(insights.sets) },
      insights.durationMin !== null
        ? { label: "Dauer", value: `${insights.durationMin} min` }
        : { label: "Wiederholungen", value: String(insights.reps) },
    ],
    rows: insights.top.map(t => ({ label: t.name, value: t.best })),
    badge,
    fileName: `training-${slug(title)}-${session.session_date}`,
  };
}

export function matchShareCard(
  match: MatchRow,
  season: { played: number; wins: number; draws: number; losses: number; ownGoals: number }
): ShareCardData {
  const result = match.goals_for > match.goals_against ? "Sieg" : match.goals_for < match.goals_against ? "Niederlage" : "Unentschieden";
  return {
    kicker: "Spieltag",
    title: `gegen ${match.opponent}`,
    date: longDate(match.played_on),
    hero: { value: `${match.goals_for}:${match.goals_against}`, label: result },
    stats: [
      { label: "Eigene Tore", value: String(match.own_goals) },
      { label: "Bilanz S/U/N", value: `${season.wins}/${season.draws}/${season.losses}` },
      { label: "Tore Saison", value: String(season.ownGoals) },
    ],
    rows: match.note ? [{ label: match.note, value: "" }] : [],
    badge: match.own_goals > 0 ? (match.own_goals === 1 ? "1 Tor erzielt" : `${match.own_goals} Tore erzielt`) : undefined,
    fileName: `spiel-${slug(match.opponent)}-${match.played_on}`,
  };
}
