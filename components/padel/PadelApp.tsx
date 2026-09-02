"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PadelMatchRow, PadelPlayerRow, PadelRoundRow, PadelSet, PadelTournamentRow } from "@/lib/types";
import {
  createPadelRound,
  renamePadelPlayer,
  resetPadelNames,
  resetPadelTournament,
  setPadelFinished,
  submitPadelMatchSets,
} from "@/lib/actions/padel";
import type { PadelState } from "@/lib/services/padel";

type Tab = "start" | "spieler" | "runde" | "rangliste";
type TeamColor = "club" | "orange" | "blue" | "purple";
const TEAM_COLORS: TeamColor[] = ["club", "orange", "blue", "purple"];

const ICON_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const TAB_ICONS: Record<Tab, React.ReactElement> = {
  start: (
    <svg {...ICON_PROPS}>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  ),
  spieler: (
    <svg {...ICON_PROPS}>
      <circle cx="9" cy="8" r="3" />
      <path d="M2 20a7 7 0 0 1 14 0" />
      <path d="M16 4a3 3 0 0 1 0 6" />
      <path d="M17 14a5 5 0 0 1 5 5" />
    </svg>
  ),
  runde: (
    <svg {...ICON_PROPS}>
      <path d="M3 6h3.5c1.6 0 3 1 3.7 2.4" />
      <path d="M3 18h3.5c1.6 0 3-1 3.7-2.4" />
      <path d="M13 8c.7-1.4 2.1-2 3.7-2H20" />
      <path d="M13 16c.7 1.4 2.1 2 3.7 2H20" />
      <path d="M18 4l3 2-3 2" />
      <path d="M18 16l3 2-3 2" />
    </svg>
  ),
  rangliste: (
    <svg {...ICON_PROPS}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4z" />
      <path d="M8 5H5a3 3 0 0 0 3 4" />
      <path d="M16 5h3a3 3 0 0 1-3 4" />
      <path d="M12 13v3" />
      <path d="M9 20h6" />
      <path d="M10 16h4l.6 3H9.4l.6-3z" />
    </svg>
  ),
};
const TAB_LABELS: Record<Tab, string> = { start: "Start", spieler: "Spieler", runde: "Runde", rangliste: "Rangliste" };

interface Proposal {
  matches: { team1: [string, string]; team2: [string, string] }[];
}

interface SetDraft {
  a: string;
  b: string;
}

function blankMatchDraft(): SetDraft[] {
  return [{ a: "", b: "" }, { a: "", b: "" }, { a: "", b: "" }];
}
function blankRoundDraft(): Record<number, SetDraft[]> {
  return { 0: blankMatchDraft(), 1: blankMatchDraft() };
}
function setsToDraft(sets: PadelSet[]): SetDraft[] {
  const draft = blankMatchDraft();
  sets.forEach((s, i) => {
    if (i < 3) draft[i] = { a: String(s.a), b: String(s.b) };
  });
  return draft;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function pairKey(a: string, b: string) {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function setsWinner(sets: PadelSet[]): 1 | 2 {
  const won1 = sets.filter((s) => s.a > s.b).length;
  const won2 = sets.filter((s) => s.b > s.a).length;
  return won1 > won2 ? 1 : 2;
}
function setsDiff(sets: PadelSet[]): number {
  return sets.reduce((acc, s) => acc + (s.a - s.b), 0);
}

function validateMatchSets(draft: SetDraft[]): { sets: PadelSet[] } | { error: string } {
  const filled: PadelSet[] = [];
  for (let i = 0; i < draft.length; i++) {
    const { a, b } = draft[i];
    const aEmpty = a === "";
    const bEmpty = b === "";
    if (aEmpty && bEmpty) break;
    if (aEmpty || bEmpty) return { error: `Satz ${i + 1}: bitte beide Werte eintragen.` };
    const na = Number(a);
    const nb = Number(b);
    if (na === nb) return { error: `Satz ${i + 1}: kein Unentschieden möglich.` };
    filled.push({ a: na, b: nb });
  }
  if (filled.length < 2) return { error: "Bitte mindestens 2 Sätze eintragen." };
  const won1 = filled.filter((s) => s.a > s.b).length;
  const won2 = filled.filter((s) => s.b > s.a).length;
  if (won1 === won2) return { error: "Unentschieden nicht möglich — bitte Satz 3 eintragen." };
  return { sets: filled };
}

function draftWinner(draft: SetDraft[]): 1 | 2 | null {
  const filled = draft.filter((s) => s.a !== "" && s.b !== "").map((s) => ({ a: Number(s.a), b: Number(s.b) }));
  const won1 = filled.filter((s) => s.a > s.b).length;
  const won2 = filled.filter((s) => s.b > s.a).length;
  if (won1 === won2) return null;
  return won1 > won2 ? 1 : 2;
}

function buildHistory(matches: PadelMatchRow[]) {
  const partner: Record<string, number> = {};
  const opponent: Record<string, number> = {};
  matches.forEach((m) => {
    const pk1 = pairKey(m.team1_player1, m.team1_player2);
    const pk2 = pairKey(m.team2_player1, m.team2_player2);
    partner[pk1] = (partner[pk1] ?? 0) + 1;
    partner[pk2] = (partner[pk2] ?? 0) + 1;
    [m.team1_player1, m.team1_player2].forEach((a) => {
      [m.team2_player1, m.team2_player2].forEach((b) => {
        const ok = pairKey(a, b);
        opponent[ok] = (opponent[ok] ?? 0) + 1;
      });
    });
  });
  return { partner, opponent };
}

function winCounts(players: PadelPlayerRow[], matches: PadelMatchRow[]) {
  const w: Record<string, number> = {};
  players.forEach((p) => (w[p.id] = 0));
  matches.forEach((m) => {
    const winners =
      setsWinner(m.sets) === 1 ? [m.team1_player1, m.team1_player2] : [m.team2_player1, m.team2_player2];
    winners.forEach((id) => {
      if (w[id] != null) w[id]++;
    });
  });
  return w;
}

function generateProposal(players: PadelPlayerRow[], matches: PadelMatchRow[]): Proposal {
  const hist = buildHistory(matches);
  const wins = winCounts(players, matches);
  const ids = players.map((p) => p.id);
  const arrangements: [[number, number], [number, number]][] = [
    [[0, 1], [2, 3]],
    [[0, 2], [1, 3]],
    [[0, 3], [1, 2]],
  ];

  let best: Proposal | null = null;
  let bestScore = Infinity;

  for (let attempt = 0; attempt < 300; attempt++) {
    const s = shuffle(ids);
    const teams: [string, string][] = [
      [s[0], s[1]],
      [s[2], s[3]],
      [s[4], s[5]],
      [s[6], s[7]],
    ];
    let partnerPenalty = 0;
    teams.forEach((t) => {
      const c = hist.partner[pairKey(t[0], t[1])] ?? 0;
      partnerPenalty += c * c * 10;
    });

    for (const arr of arrangements) {
      const mA = { team1: teams[arr[0][0]], team2: teams[arr[0][1]] };
      const mB = { team1: teams[arr[1][0]], team2: teams[arr[1][1]] };
      let oppPenalty = 0;
      let skillPenalty = 0;
      [mA, mB].forEach((m) => {
        m.team1.forEach((x) => {
          m.team2.forEach((y) => {
            const c = hist.opponent[pairKey(x, y)] ?? 0;
            oppPenalty += c * c * 3;
          });
        });
        const w1 = m.team1.reduce((acc, id) => acc + (wins[id] ?? 0), 0);
        const w2 = m.team2.reduce((acc, id) => acc + (wins[id] ?? 0), 0);
        skillPenalty += (w1 - w2) * (w1 - w2) * 2;
      });
      const total = partnerPenalty + oppPenalty + skillPenalty;
      if (total < bestScore) {
        bestScore = total;
        best = { matches: [mA, mB] };
      }
    }
  }
  return best!;
}

function computeStats(players: PadelPlayerRow[], matches: PadelMatchRow[]) {
  const stats: Record<string, { games: number; wins: number; losses: number; diff: number }> = {};
  players.forEach((p) => (stats[p.id] = { games: 0, wins: 0, losses: 0, diff: 0 }));
  matches.forEach((m) => {
    const winnerIsTeam1 = setsWinner(m.sets) === 1;
    const team1 = [m.team1_player1, m.team1_player2];
    const team2 = [m.team2_player1, m.team2_player2];
    const diff = setsDiff(m.sets);
    const winners = winnerIsTeam1 ? team1 : team2;
    const losers = winnerIsTeam1 ? team2 : team1;
    team1.forEach((id) => {
      if (stats[id]) {
        stats[id].games++;
        stats[id].diff += diff;
      }
    });
    team2.forEach((id) => {
      if (stats[id]) {
        stats[id].games++;
        stats[id].diff -= diff;
      }
    });
    winners.forEach((id) => stats[id] && stats[id].wins++);
    losers.forEach((id) => stats[id] && stats[id].losses++);
  });
  return stats;
}

function rankedPlayers(players: PadelPlayerRow[], matches: PadelMatchRow[]) {
  const stats = computeStats(players, matches);
  return players
    .map((p) => {
      const st = stats[p.id];
      const quote = st.games > 0 ? (st.wins / st.games) * 100 : 0;
      return { id: p.id, name: p.name, games: st.games, wins: st.wins, losses: st.losses, diff: st.diff, quote };
    })
    .sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.quote !== a.quote) return b.quote - a.quote;
      return b.diff - a.diff;
    });
}

const PLAYER_PALETTE = ["#14B8A6", "#F97316", "#2563EB", "#7C3AED", "#0F766E", "#C2570C", "#1D4ED8", "#A78BFA"];

function teamColorVar(color: TeamColor): string {
  return color === "club" ? "var(--club)" : `var(--${color})`;
}

function TeamBadge({
  ids,
  color,
  playerName,
}: {
  ids: [string, string];
  color: TeamColor;
  playerName: (id: string) => string;
}) {
  const cv = teamColorVar(color);
  return (
    <div className="padel-team-badge">
      <div className="padel-avatar-stack">
        {ids.map((id) => (
          <span
            key={id}
            className="padel-mini-avatar"
            style={{ background: `linear-gradient(135deg, ${cv} 0%, color-mix(in srgb, ${cv} 65%, black) 100%)` }}
          >
            {playerName(id).slice(0, 2).toUpperCase()}
          </span>
        ))}
      </div>
      <div className="padel-team-names" style={{ color: cv }}>
        {ids.map((id) => playerName(id)).join(" & ")}
      </div>
    </div>
  );
}

interface PendingRound {
  round: PadelRoundRow;
  matches: PadelMatchRow[];
}

export function PadelApp({ initial }: { initial: PadelState }) {
  const [players, setPlayers] = useState(initial.players);
  const [rounds, setRounds] = useState(initial.rounds);
  const [matches, setMatches] = useState(initial.matches);
  const [tournament, setTournament] = useState(initial.tournament);
  const [tab, setTab] = useState<Tab>("start");
  const [drawing, setDrawing] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refetch = useCallback(async () => {
    const [p, r, m, t] = await Promise.all([
      supabase.from("padel_players").select("*").order("slot", { ascending: true }),
      supabase.from("padel_rounds").select("*").order("round_number", { ascending: true }),
      supabase.from("padel_matches").select("*").order("match_number", { ascending: true }),
      supabase.from("padel_tournament").select("*").eq("id", true).single(),
    ]);
    if (p.data) setPlayers(p.data as PadelPlayerRow[]);
    if (r.data) setRounds(r.data as PadelRoundRow[]);
    if (m.data) setMatches(m.data as PadelMatchRow[]);
    if (t.data) setTournament(t.data as PadelTournamentRow);
  }, [supabase]);

  useEffect(() => {
    const scheduleRefetch = () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      refetchTimer.current = setTimeout(refetch, 250);
    };
    const channel = supabase
      .channel("padel-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "padel_players" }, scheduleRefetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "padel_rounds" }, scheduleRefetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "padel_matches" }, scheduleRefetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "padel_tournament" }, scheduleRefetch)
      .subscribe();
    return () => {
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
      supabase.removeChannel(channel);
    };
  }, [supabase, refetch]);

  const sortedRounds = useMemo(() => [...rounds].sort((a, b) => a.round_number - b.round_number), [rounds]);

  const matchesByRound = useMemo(() => {
    const map = new Map<string, PadelMatchRow[]>();
    matches.forEach((m) => {
      if (!map.has(m.round_id)) map.set(m.round_id, []);
      map.get(m.round_id)!.push(m);
    });
    map.forEach((list) => list.sort((a, b) => a.match_number - b.match_number));
    return map;
  }, [matches]);

  const pendingRound: PendingRound | null = useMemo(() => {
    const found = sortedRounds.find((r) => {
      const ms = matchesByRound.get(r.id) ?? [];
      return ms.some((m) => !m.sets || m.sets.length === 0);
    });
    return found ? { round: found, matches: matchesByRound.get(found.id) ?? [] } : null;
  }, [sortedRounds, matchesByRound]);

  const completedMatches = useMemo(() => matches.filter((m) => m.sets && m.sets.length > 0), [matches]);

  const completedRoundsCount = useMemo(() => {
    let count = 0;
    for (const r of sortedRounds) {
      const ms = matchesByRound.get(r.id) ?? [];
      if (ms.length > 0 && ms.every((m) => m.sets && m.sets.length > 0)) count++;
    }
    return count;
  }, [sortedRounds, matchesByRound]);

  async function handleDraw() {
    setDrawError(null);
    setDrawing(true);
    try {
      const proposal = generateProposal(players, completedMatches);
      await createPadelRound({ matches: proposal.matches });
      await refetch();
    } catch (e) {
      setDrawError(e instanceof Error ? e.message : "Fehler beim Auslosen.");
    } finally {
      setDrawing(false);
    }
  }

  function playerName(id: string) {
    return players.find((p) => p.id === id)?.name ?? "?";
  }

  const ranked = useMemo(() => rankedPlayers(players, completedMatches), [players, completedMatches]);
  const roundsPlayed = completedRoundsCount;
  const matchesPlayed = completedMatches.length;
  const leader = ranked[0];

  return (
    <>
      <div className="padel-tabbar">
        <div className="pill-tabs">
          <TabButton tab={tab} value="start" onClick={setTab}>
            Start
          </TabButton>
          <TabButton tab={tab} value="spieler" onClick={setTab}>
            Spieler
          </TabButton>
          <TabButton tab={tab} value="runde" onClick={setTab}>
            Runde
          </TabButton>
          <TabButton tab={tab} value="rangliste" onClick={setTab}>
            Rangliste
          </TabButton>
        </div>
      </div>

      <nav className="padel-bottom-bar">
        {(Object.keys(TAB_LABELS) as Tab[]).map((value) => (
          <button
            key={value}
            type="button"
            className={`padel-bb-item ${tab === value ? "active" : ""}`}
            onClick={() => setTab(value)}
          >
            {TAB_ICONS[value]}
            <span>{TAB_LABELS[value]}</span>
          </button>
        ))}
      </nav>

      {tab === "start" && (
        <StartView
          roundsPlayed={roundsPlayed}
          matchesPlayed={matchesPlayed}
          leader={leader}
          finished={tournament.finished}
          onNavigate={setTab}
        />
      )}

      {tab === "spieler" && (
        <SpielerView
          players={players}
          matches={completedMatches}
          onReset={async () => {
            if (window.confirm("Alle Spielernamen auf die Standardnamen zurücksetzen?")) {
              await resetPadelNames();
              await refetch();
            }
          }}
          onResetTournament={async () => {
            if (window.confirm("Turnier wirklich neu starten? Alle Runden und Ergebnisse werden gelöscht.")) {
              await resetPadelTournament();
              await refetch();
              setTab("start");
            }
          }}
        />
      )}

      {tab === "runde" && (
        <RundeView
          key={pendingRound?.round.id ?? "none"}
          roundNumber={pendingRound ? pendingRound.round.round_number : completedRoundsCount + 1}
          finished={tournament.finished}
          pendingRound={pendingRound}
          sortedRounds={sortedRounds}
          matchesByRound={matchesByRound}
          drawing={drawing}
          drawError={drawError}
          playerName={playerName}
          onDraw={handleDraw}
          onSubmitted={async () => {
            await refetch();
            setTab("rangliste");
          }}
          onSaveMatch={async (matchId, sets) => {
            await submitPadelMatchSets(matchId, sets);
            await refetch();
          }}
          onResetTournament={async () => {
            if (window.confirm("Turnier wirklich neu starten? Alle Runden und Ergebnisse werden gelöscht.")) {
              await resetPadelTournament();
              await refetch();
            }
          }}
        />
      )}

      {tab === "rangliste" && (
        <RanglisteView
          ranked={ranked}
          finished={tournament.finished}
          onCrown={async () => {
            await setPadelFinished(true);
            await refetch();
          }}
          onUncrown={async () => {
            await setPadelFinished(false);
            await refetch();
          }}
        />
      )}
    </>
  );
}

function TabButton({
  tab,
  value,
  onClick,
  children,
}: {
  tab: Tab;
  value: Tab;
  onClick: (t: Tab) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`pill-tab ${tab === value ? "active club" : ""}`}
      onClick={() => onClick(value)}
    >
      {children}
    </button>
  );
}

function StartView({
  roundsPlayed,
  matchesPlayed,
  leader,
  finished,
  onNavigate,
}: {
  roundsPlayed: number;
  matchesPlayed: number;
  leader: ReturnType<typeof rankedPlayers>[number] | undefined;
  finished: boolean;
  onNavigate: (t: Tab) => void;
}) {
  return (
    <>
      {finished && leader && leader.games > 0 ? (
        <div className="hero-banner champion">
          <div>
            <div className="padel-champ-crown">🏆</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700, letterSpacing: ".10em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 10 }}>
              Barcelona Padel Champion
            </div>
            <div className="padel-champ-name">{leader.name}</div>
            <div className="padel-champ-record">
              {leader.wins} Siege aus {leader.games} Spielen · {leader.quote.toFixed(0)} % Siegquote
            </div>
          </div>
        </div>
      ) : (
        <div className="hero-banner has-image" style={{ ["--hero-img" as string]: "url(/padel/barcelona.webp)" }}>
          <div>
            <div className="hero-greeting" style={{ textTransform: "none" }}>🇪🇸 Padel Urlaub</div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.82)", maxWidth: 440, lineHeight: 1.6, marginTop: 8 }}>
              8 Spieler · 4 Teams pro Runde · ein Champion am Ende. Neue Runde auslosen, Ergebnis eintragen, fertig.
            </div>
          </div>
        </div>
      )}

      <div className="kpi-grid" style={{ marginBottom: "var(--space-6)" }}>
        <div className="kpi-card">
          <div className="kpi-value">{roundsPlayed}</div>
          <div className="kpi-label">Runden</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{matchesPlayed}</div>
          <div className="kpi-label">Matches</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value club">{leader && leader.games > 0 ? leader.name : "–"}</div>
          <div className="kpi-label">Spitzenreiter</div>
        </div>
      </div>

      <div className="module-grid">
        <ActionCard color="var(--club)" title="Neue Runde" desc="Teams auslosen & Ergebnis eintragen" onClick={() => onNavigate("runde")} />
        <ActionCard color="var(--gold)" title="Rangliste" desc="Siege, Quote & aktueller Champion" onClick={() => onNavigate("rangliste")} />
        <ActionCard color="var(--blue)" title="Spieler" desc="Namen der 8 Teilnehmer verwalten" onClick={() => onNavigate("spieler")} />
      </div>
    </>
  );
}

function ActionCard({ color, title, desc, onClick }: { color: string; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      className="module-card"
      style={{
        ["--module-color" as string]: color,
        textAlign: "left",
        cursor: "pointer",
        width: "100%",
        font: "inherit",
        color: "inherit",
      }}
      onClick={onClick}
      type="button"
    >
      <div className="module-name">{title}</div>
      <div className="module-desc">{desc}</div>
    </button>
  );
}

function SpielerView({
  players,
  matches,
  onReset,
  onResetTournament,
}: {
  players: PadelPlayerRow[];
  matches: PadelMatchRow[];
  onReset: () => void;
  onResetTournament: () => void;
}) {
  const stats = computeStats(players, matches);
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Spieler</h1>
          <p>Namen antippen zum Ändern. Änderungen gelten sofort für alle neuen Runden.</p>
        </div>
      </div>
      <div className="player-list" style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        {players.map((p, i) => {
          const st = stats[p.id];
          return (
            <div className="padel-player-row" key={p.id}>
              <div className="padel-avatar" style={{ ["--pcolor" as string]: PLAYER_PALETTE[i % PLAYER_PALETTE.length] }}>
                {(p.name || "?").slice(0, 2).toUpperCase()}
              </div>
              <input
                className="padel-name-input"
                defaultValue={p.name}
                maxLength={20}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val && val !== p.name) renamePadelPlayer(p.id, val);
                }}
              />
              <div className="padel-stat">
                {st.wins}
                <span style={{ opacity: 0.5 }}>S</span> · <strong>{st.games}</strong> Sp.
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: "var(--space-6)", display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <button className="btn secondary sm" onClick={onReset} type="button">
          Namen zurücksetzen
        </button>
        <button className="btn danger sm" onClick={onResetTournament} type="button">
          Turnier neu starten
        </button>
      </div>
    </>
  );
}

function RundeView({
  roundNumber,
  finished,
  pendingRound,
  sortedRounds,
  matchesByRound,
  drawing,
  drawError,
  playerName,
  onDraw,
  onSubmitted,
  onSaveMatch,
  onResetTournament,
}: {
  roundNumber: number;
  finished: boolean;
  pendingRound: PendingRound | null;
  sortedRounds: PadelRoundRow[];
  matchesByRound: Map<string, PadelMatchRow[]>;
  drawing: boolean;
  drawError: string | null;
  playerName: (id: string) => string;
  onDraw: () => void;
  onSubmitted: () => void | Promise<void>;
  onSaveMatch: (matchId: string, sets: PadelSet[]) => Promise<void>;
  onResetTournament: () => void;
}) {
  const [setsDraft, setSetsDraft] = useState<Record<number, SetDraft[]>>(blankRoundDraft());
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  function onSetChange(mi: number, si: number, side: "a" | "b", value: string) {
    setSetsDraft((prev) => {
      const next = { ...prev, [mi]: prev[mi].map((s) => ({ ...s })) };
      next[mi][si][side] = value;
      return next;
    });
  }

  async function handleSubmit() {
    if (!pendingRound) return;
    const nextErrors: Record<number, string> = {};
    const results: (PadelSet[] | null)[] = pendingRound.matches.map((_, mi) => {
      const res = validateMatchSets(setsDraft[mi] ?? blankMatchDraft());
      if ("error" in res) {
        nextErrors[mi] = res.error;
        return null;
      }
      return res.sets;
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await Promise.all(pendingRound.matches.map((m, mi) => submitPadelMatchSets(m.id, results[mi]!)));
      await onSubmitted();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="padel-court-banner" style={{ ["--hero-img" as string]: "url(/padel/court.webp)" }}>
        <div className="padel-court-banner-text">
          <h1>Runde {roundNumber}</h1>
        </div>
      </div>

      {finished ? (
        <div className="empty-state">
          <div className="ico">🏆</div>
          Das Turnier ist beendet.
          <br />
          Im Tab „Spieler&rdquo; kannst du ein neues starten.
        </div>
      ) : !pendingRound ? (
        <div className="empty-state">
          <div className="ico">🎾</div>
          Noch keine Teams für diese Runde.
          <br />
          Die Auslosung findet einmalig statt — danach steht sie fest.
          <div style={{ marginTop: "var(--space-6)" }}>
            <button className="btn primary" onClick={onDraw} type="button" disabled={drawing}>
              🎲 {drawing ? "Lose wird gezogen …" : "Teams auslosen"}
            </button>
          </div>
          {drawError && <div className="padel-match-err" style={{ marginTop: "var(--space-4)" }}>{drawError}</div>}
        </div>
      ) : (
        <>
          {pendingRound.matches.map((m, mi) => {
            const team1: [string, string] = [m.team1_player1, m.team1_player2];
            const team2: [string, string] = [m.team2_player1, m.team2_player2];
            const draft = setsDraft[mi] ?? blankMatchDraft();
            const liveWinner = draftWinner(draft);
            return (
              <div className="padel-match-card" key={m.id}>
                <div className="padel-match-label">🎾 Match {mi + 1}</div>
                <div className="padel-match-teams">
                  <div className={`padel-match-team ${liveWinner === 2 ? "loser" : ""}`}>
                    <TeamBadge ids={team1} color={TEAM_COLORS[mi * 2]} playerName={playerName} />
                    {liveWinner === 1 && <span className="padel-winner-badge">🏆</span>}
                  </div>
                  <div className="padel-vs">VS</div>
                  <div className={`padel-match-team ${liveWinner === 1 ? "loser" : ""}`}>
                    <TeamBadge ids={team2} color={TEAM_COLORS[mi * 2 + 1]} playerName={playerName} />
                    {liveWinner === 2 && <span className="padel-winner-badge">🏆</span>}
                  </div>
                </div>

                <div className="padel-sets-grid">
                  <div className="padel-sets-labels">
                    {[0, 1, 2].map((si) => (
                      <span key={si}>Satz {si + 1}</span>
                    ))}
                  </div>
                  {(["a", "b"] as const).map((side) => (
                    <div className="padel-sets-row" key={side}>
                      {[0, 1, 2].map((si) => {
                        const a = draft[si].a;
                        const b = draft[si].b;
                        const bothFilled = a !== "" && b !== "";
                        const mine = draft[si][side];
                        const other = side === "a" ? b : a;
                        const isWin = bothFilled && Number(mine) > Number(other);
                        const isLose = bothFilled && Number(mine) < Number(other);
                        return (
                          <input
                            key={si}
                            className={`padel-set-input ${isWin ? "win" : ""} ${isLose ? "lose" : ""}`}
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={99}
                            placeholder="–"
                            value={mine}
                            onChange={(e) => onSetChange(mi, si, side, e.target.value)}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                {errors[mi] && <div className="padel-match-err">{errors[mi]}</div>}
              </div>
            );
          })}

          <button className="btn primary block" onClick={handleSubmit} type="button" disabled={saving}>
            {saving ? "Speichert …" : "Ergebnis speichern"}
          </button>
        </>
      )}

      <PadelRoundHistory
        sortedRounds={sortedRounds}
        matchesByRound={matchesByRound}
        playerName={playerName}
        onSaveMatch={onSaveMatch}
        onResetTournament={onResetTournament}
      />
    </>
  );
}

function PadelRoundHistory({
  sortedRounds,
  matchesByRound,
  playerName,
  onSaveMatch,
  onResetTournament,
}: {
  sortedRounds: PadelRoundRow[];
  matchesByRound: Map<string, PadelMatchRow[]>;
  playerName: (id: string) => string;
  onSaveMatch: (matchId: string, sets: PadelSet[]) => Promise<void>;
  onResetTournament: () => void;
}) {
  const completedRounds = sortedRounds
    .filter((r) => {
      const ms = matchesByRound.get(r.id) ?? [];
      return ms.length > 0 && ms.every((m) => m.sets && m.sets.length > 0);
    })
    .slice()
    .reverse();

  if (completedRounds.length === 0) return null;

  return (
    <div style={{ marginTop: "var(--space-8)" }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
          marginBottom: "var(--space-4)",
        }}
      >
        Bisherige Runden
      </div>

      {completedRounds.map((r) => (
        <div className="card" key={r.id} style={{ marginBottom: "var(--space-4)" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              marginBottom: "var(--space-4)",
            }}
          >
            Runde {r.round_number}
          </div>
          {(matchesByRound.get(r.id) ?? []).map((m, mi) => (
            <HistoryMatchRow
              key={m.id}
              match={m}
              colorA={TEAM_COLORS[mi * 2]}
              colorB={TEAM_COLORS[mi * 2 + 1]}
              playerName={playerName}
              onSave={(sets) => onSaveMatch(m.id, sets)}
            />
          ))}
        </div>
      ))}

      <button className="btn danger sm" onClick={onResetTournament} type="button">
        Turnier neu starten
      </button>
    </div>
  );
}

function RanglisteView({
  ranked,
  finished,
  onCrown,
  onUncrown,
}: {
  ranked: ReturnType<typeof rankedPlayers>;
  finished: boolean;
  onCrown: () => void;
  onUncrown: () => void;
}) {
  const leader = ranked[0];
  const anyGames = leader && leader.games > 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Rangliste</h1>
          <p>Sortiert nach Siegen, dann Siegquote.</p>
        </div>
      </div>

      {!anyGames ? (
        <div className="empty-state">
          <div className="ico">🎾</div>
          Noch keine Runde gespielt.
          <br />
          Lost die erste Runde aus, um loszulegen.
        </div>
      ) : (
        <>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: ".10em",
              textTransform: "uppercase",
              textAlign: "center",
              color: finished ? "var(--gold)" : "var(--club)",
              marginBottom: "var(--space-4)",
            }}
          >
            {finished ? "🏆 Champion" : "🔥 Aktuell in Führung"}
          </div>

          <Podium ranked={ranked} />

          <div className="card">
            {ranked.map((p, i) => {
              const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
              const rowClass = i === 0 ? "top1" : i === 1 ? "top2" : i === 2 ? "top3" : "";
              return (
                <div className={`padel-rank-row ${rowClass}`} key={p.id}>
                  <div className="padel-rank-num">{medal}</div>
                  <div />
                  <div className="padel-rank-name">{p.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div className="padel-rank-stats">
                      <span>
                        <b>{p.wins}</b>S
                      </span>
                      <span>
                        <b>{p.losses}</b>N
                      </span>
                      <span>
                        <b>{p.diff > 0 ? "+" : ""}{p.diff}</b>
                      </span>
                    </div>
                    <div className="padel-rank-quote">{p.quote.toFixed(0)}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: "var(--space-6)" }}>
            {!finished ? (
              <button className="btn primary block" onClick={onCrown} type="button">
                🏆 Champion küren & Turnier beenden
              </button>
            ) : (
              <button className="btn secondary block" onClick={onUncrown} type="button">
                Turnier fortsetzen
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}

function Podium({ ranked }: { ranked: ReturnType<typeof rankedPlayers> }) {
  const [p1, p2, p3] = ranked;
  if (!p1) return null;
  return (
    <div className="padel-podium">
      <PodiumSlot place={2} player={p2} />
      <PodiumSlot place={1} player={p1} />
      <PodiumSlot place={3} player={p3} />
    </div>
  );
}

function PodiumSlot({ place, player }: { place: 1 | 2 | 3; player: ReturnType<typeof rankedPlayers>[number] | undefined }) {
  if (!player) return <div className="padel-podium-slot empty" />;
  const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";
  const cv = place === 1 ? "var(--gold)" : place === 2 ? "var(--silver)" : "var(--bronze)";
  return (
    <div className={`padel-podium-slot p${place}`}>
      <div className="padel-podium-avatar" style={{ background: `linear-gradient(135deg, ${cv} 0%, color-mix(in srgb, ${cv} 60%, black) 100%)` }}>
        {player.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="padel-podium-medal">{medal}</div>
      <div className="padel-podium-name">{player.name}</div>
      <div className="padel-podium-stat">{player.wins} Siege</div>
      <div className="padel-podium-bar" />
    </div>
  );
}

function HistoryMatchRow({
  match,
  colorA,
  colorB,
  playerName,
  onSave,
}: {
  match: PadelMatchRow;
  colorA: TeamColor;
  colorB: TeamColor;
  playerName: (id: string) => string;
  onSave: (sets: PadelSet[]) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SetDraft[]>(() => setsToDraft(match.sets));
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const team1: [string, string] = [match.team1_player1, match.team1_player2];
  const team2: [string, string] = [match.team2_player1, match.team2_player2];
  const winner = setsWinner(match.sets);

  function startEdit() {
    setDraft(setsToDraft(match.sets));
    setError(undefined);
    setEditing(true);
  }

  async function save() {
    const res = validateMatchSets(draft);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setSaving(true);
    try {
      await onSave(res.sets);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ paddingBottom: "var(--space-4)", marginBottom: "var(--space-4)", borderBottom: "1px dashed var(--border-subtle)" }}>
      <div className="padel-match-teams">
        <div className={`padel-match-team ${!editing && winner === 2 ? "loser" : ""}`}>
          <TeamBadge ids={team1} color={colorA} playerName={playerName} />
          {!editing && winner === 1 && <span className="padel-winner-badge">🏆</span>}
        </div>
        <div className="padel-vs">VS</div>
        <div className={`padel-match-team ${!editing && winner === 1 ? "loser" : ""}`}>
          <TeamBadge ids={team2} color={colorB} playerName={playerName} />
          {!editing && winner === 2 && <span className="padel-winner-badge">🏆</span>}
        </div>
      </div>

      {!editing ? (
        <div className="padel-sets-summary">
          {match.sets.map((s, i) => (
            <span className="padel-set-pair" key={i}>
              <span className={s.a > s.b ? "win" : "lose"}>{s.a}</span>:
              <span className={s.b > s.a ? "win" : "lose"}>{s.b}</span>
            </span>
          ))}
          <button className="btn ghost sm" onClick={startEdit} type="button">
            ✏️ Bearbeiten
          </button>
        </div>
      ) : (
        <>
          <div className="padel-sets-grid">
            <div className="padel-sets-labels">
              {[0, 1, 2].map((si) => (
                <span key={si}>Satz {si + 1}</span>
              ))}
            </div>
            {(["a", "b"] as const).map((side) => (
              <div className="padel-sets-row" key={side}>
                {[0, 1, 2].map((si) => {
                  const a = draft[si].a;
                  const b = draft[si].b;
                  const bothFilled = a !== "" && b !== "";
                  const mine = draft[si][side];
                  const other = side === "a" ? b : a;
                  const isWin = bothFilled && Number(mine) > Number(other);
                  const isLose = bothFilled && Number(mine) < Number(other);
                  return (
                    <input
                      key={si}
                      className={`padel-set-input ${isWin ? "win" : ""} ${isLose ? "lose" : ""}`}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={99}
                      placeholder="–"
                      value={mine}
                      onChange={(e) =>
                        setDraft((prev) => {
                          const next = prev.map((s) => ({ ...s }));
                          next[si][side] = e.target.value;
                          return next;
                        })
                      }
                    />
                  );
                })}
              </div>
            ))}
          </div>
          {error && <div className="padel-match-err">{error}</div>}
          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
            <button className="btn secondary sm" onClick={() => setEditing(false)} type="button" disabled={saving}>
              Abbrechen
            </button>
            <button className="btn primary sm" onClick={save} type="button" disabled={saving}>
              {saving ? "Speichert …" : "Speichern"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
