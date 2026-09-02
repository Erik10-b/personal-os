"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PadelSet } from "@/lib/types";

const DEFAULT_NAMES = ["Erik", "Tim", "Dennish", "Luis", "Giason", "Jones", "Bent", "Jannik"];

export interface RoundInput {
  matches: {
    team1: [string, string];
    team2: [string, string];
  }[];
}

export async function renamePadelPlayer(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  const supabase = await createClient();
  const { error } = await supabase.from("padel_players").update({ name: trimmed }).eq("id", id);
  if (error) throw error;
  revalidatePath("/padel");
}

export async function resetPadelNames() {
  const supabase = await createClient();
  await Promise.all(
    DEFAULT_NAMES.map((name, i) =>
      supabase.from("padel_players").update({ name }).eq("slot", i + 1)
    )
  );
  revalidatePath("/padel");
}

export async function createPadelRound(input: RoundInput) {
  const supabase = await createClient();

  const { data: allMatches, error: matchesCheckError } = await supabase
    .from("padel_matches")
    .select("id, sets");
  if (matchesCheckError) throw matchesCheckError;
  const hasPending = (allMatches ?? []).some((m) => !m.sets || m.sets.length === 0);
  if (hasPending) throw new Error("Es gibt bereits eine offene Runde ohne Ergebnis.");

  const { data: existing, error: countError } = await supabase
    .from("padel_rounds")
    .select("round_number")
    .order("round_number", { ascending: false })
    .limit(1);
  if (countError) throw countError;

  const nextNumber = (existing?.[0]?.round_number ?? 0) + 1;

  const { data: round, error: roundError } = await supabase
    .from("padel_rounds")
    .insert({ round_number: nextNumber })
    .select()
    .single();
  if (roundError) throw roundError;

  const rows = input.matches.map((m, i) => ({
    round_id: round.id,
    match_number: i + 1,
    team1_player1: m.team1[0],
    team1_player2: m.team1[1],
    team2_player1: m.team2[0],
    team2_player2: m.team2[1],
    sets: [] as PadelSet[],
  }));

  const { error: insertMatchesError } = await supabase.from("padel_matches").insert(rows);
  if (insertMatchesError) throw insertMatchesError;

  revalidatePath("/padel");
}

export async function submitPadelMatchSets(matchId: string, sets: PadelSet[]) {
  const supabase = await createClient();
  const { error } = await supabase.from("padel_matches").update({ sets }).eq("id", matchId);
  if (error) throw error;
  revalidatePath("/padel");
}

export async function resetPadelTournament() {
  const supabase = await createClient();
  const { error: matchesError } = await supabase.from("padel_matches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (matchesError) throw matchesError;
  const { error: roundsError } = await supabase.from("padel_rounds").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (roundsError) throw roundsError;
  const { error: tournamentError } = await supabase.from("padel_tournament").update({ finished: false }).eq("id", true);
  if (tournamentError) throw tournamentError;
  revalidatePath("/padel");
}

export async function setPadelFinished(finished: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("padel_tournament").update({ finished }).eq("id", true);
  if (error) throw error;
  revalidatePath("/padel");
}
