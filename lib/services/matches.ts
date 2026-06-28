import { createClient } from "@/lib/supabase/server";
import { MatchRow } from "@/lib/types";

export async function getMatches(): Promise<MatchRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select("*")
    .order("played_on", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export function summarizeMatches(matches: MatchRow[]) {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let ownGoals = 0;

  for (const m of matches) {
    goalsFor += m.goals_for;
    goalsAgainst += m.goals_against;
    ownGoals += m.own_goals;
    if (m.goals_for > m.goals_against) wins++;
    else if (m.goals_for < m.goals_against) losses++;
    else draws++;
  }

  return {
    played: matches.length,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    ownGoals,
  };
}
