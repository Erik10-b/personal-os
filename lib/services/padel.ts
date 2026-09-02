import { createClient } from "@/lib/supabase/server";
import { PadelMatchRow, PadelPlayerRow, PadelRoundRow, PadelTournamentRow } from "@/lib/types";

export interface PadelState {
  players: PadelPlayerRow[];
  rounds: PadelRoundRow[];
  matches: PadelMatchRow[];
  tournament: PadelTournamentRow;
}

export async function getPadelState(): Promise<PadelState> {
  const supabase = await createClient();

  const [players, rounds, matches, tournament] = await Promise.all([
    supabase.from("padel_players").select("*").order("slot", { ascending: true }),
    supabase.from("padel_rounds").select("*").order("round_number", { ascending: true }),
    supabase.from("padel_matches").select("*").order("match_number", { ascending: true }),
    supabase.from("padel_tournament").select("*").eq("id", true).single(),
  ]);

  if (players.error) throw players.error;
  if (rounds.error) throw rounds.error;
  if (matches.error) throw matches.error;
  if (tournament.error) throw tournament.error;

  return {
    players: players.data ?? [],
    rounds: rounds.data ?? [],
    matches: matches.data ?? [],
    tournament: tournament.data,
  };
}
