"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PadelMatchRow, PadelPlayerRow, PadelRoundRow, PadelTournamentRow } from "@/lib/types";
import {
  renamePadelPlayer,
  resetPadelNames,
  resetPadelTournament,
  savePadelRound,
  setPadelFinished,
} from "@/lib/actions/padel";
import type { PadelState } from "@/lib/services/padel";

type Tab = "start" | "spieler" | "runde" | "rangliste";
type TeamColor = "club" | "orange" | "blue" | "purple";
const TEAM_COLORS: TeamColor[] = ["club", "orange", "blue", "purple"];

interface Proposal {
  matches: { team1: [string, string]; team2: [string, string] }[];
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
    const t1win = m.score1 > m.score2;
    const winners = t1win ? [m.team1_player1, m.team1_player2] : [m.team2_player1, m.team2_player2];
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
    const t1win = m.score1 > m.score2;
    const team1 = [m.team1_player1, m.team1_player2];
    const team2 = [m.team2_player1, m.team2_player2];
    const winners = t1win ? team1 : team2;
    const losers = t1win ? team2 : team1;
    team1.forEach((id) => {
      if (stats[id]) {
        stats[id].games++;
        stats[id].diff += m.score1 - m.score2;
      }
    });
    team2.forEach((id) => {
      if (stats[id]) {
        stats[id].games++;
        stats[id].diff += m.score2 - m.score1;
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

function chipStyle(color: TeamColor): React.CSSProperties {
  if (color === "club") return {};
  return {
    ["--chip-bg" as string]: `var(--${color}-dim, var(--club-glow-2))`,
    ["--chip-color" as string]: `var(--${color}, var(--club))`,
    ["--chip-border" as string]: `var(--${color}-border, var(--border-club))`,
  };
}

export function PadelApp({ initial }: { initial: PadelState }) {
  const [players, setPlayers] = useState(initial.players);
  const [rounds, setRounds] = useState(initial.rounds);
  const [matches, setMatches] = useState(initial.matches);
  const [tournament, setTournament] = useState(initial.tournament);
  const [tab, setTab] = useState<Tab>("start");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [scoreDraft, setScoreDraft] = useState<Record<number, { a: string; b: string }>>({
    0: { a: "", b: "" },
    1: { a: "", b: "" },
  });
  const [errors, setErrors] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);

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

  function ensureProposal() {
    if (!proposal) {
      setProposal(generateProposal(players, matches));
      setScoreDraft({ 0: { a: "", b: "" }, 1: { a: "", b: "" } });
      setErrors({});
    }
  }

  function reroll() {
    setProposal(generateProposal(players, matches));
    setScoreDraft({ 0: { a: "", b: "" }, 1: { a: "", b: "" } });
    setErrors({});
  }

  async function handleSaveRound() {
    if (!proposal) return;
    const nextErrors: Record<number, boolean> = {};
    let ok = true;
    proposal.matches.forEach((_, mi) => {
      const a = scoreDraft[mi]?.a ?? "";
      const b = scoreDraft[mi]?.b ?? "";
      const na = a === "" ? NaN : Number(a);
      const nb = b === "" ? NaN : Number(b);
      const bad = Number.isNaN(na) || Number.isNaN(nb) || na === nb;
      nextErrors[mi] = bad;
      if (bad) ok = false;
    });
    setErrors(nextErrors);
    if (!ok) return;

    setSaving(true);
    try {
      await savePadelRound({
        matches: proposal.matches.map((m, mi) => ({
          team1: m.team1,
          team2: m.team2,
          score1: Number(scoreDraft[mi].a),
          score2: Number(scoreDraft[mi].b),
        })),
      });
      setProposal(null);
      await refetch();
      setTab("rangliste");
    } finally {
      setSaving(false);
    }
  }

  function playerName(id: string) {
    return players.find((p) => p.id === id)?.name ?? "?";
  }

  const ranked = useMemo(() => rankedPlayers(players, matches), [players, matches]);
  const roundsPlayed = rounds.length;
  const matchesPlayed = matches.length;
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
          <TabButton
            tab={tab}
            value="runde"
            onClick={(t) => {
              setTab(t);
              ensureProposal();
            }}
          >
            Runde
          </TabButton>
          <TabButton tab={tab} value="rangliste" onClick={setTab}>
            Rangliste
          </TabButton>
        </div>
      </div>

      {tab === "start" && (
        <StartView
          roundsPlayed={roundsPlayed}
          matchesPlayed={matchesPlayed}
          leader={leader}
          finished={tournament.finished}
          onNavigate={(t) => {
            setTab(t);
            if (t === "runde") ensureProposal();
          }}
        />
      )}

      {tab === "spieler" && (
        <SpielerView
          players={players}
          matches={matches}
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
          roundNumber={roundsPlayed + 1}
          finished={tournament.finished}
          proposal={proposal}
          scoreDraft={scoreDraft}
          errors={errors}
          saving={saving}
          playerName={playerName}
          onReroll={reroll}
          onScoreChange={(mi, side, value) =>
            setScoreDraft((prev) => ({ ...prev, [mi]: { ...prev[mi], [side]: value } }))
          }
          onSave={handleSaveRound}
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
        <div className="hero-banner">
          <div>
            <div className="hero-greeting" style={{ textTransform: "none" }}>🇪🇸 Padel BCN</div>
            <div style={{ fontSize: 12.5, color: "var(--text-secondary)", maxWidth: 440, lineHeight: 1.6, marginTop: 8 }}>
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
  proposal,
  scoreDraft,
  errors,
  saving,
  playerName,
  onReroll,
  onScoreChange,
  onSave,
}: {
  roundNumber: number;
  finished: boolean;
  proposal: Proposal | null;
  scoreDraft: Record<number, { a: string; b: string }>;
  errors: Record<number, boolean>;
  saving: boolean;
  playerName: (id: string) => string;
  onReroll: () => void;
  onScoreChange: (mi: number, side: "a" | "b", value: string) => void;
  onSave: () => void;
}) {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Runde {roundNumber}</h1>
          <p>Teams sind ausgelost — möglichst neue Partner, faire Gegner.</p>
        </div>
      </div>

      {finished ? (
        <div className="empty-state">
          <div className="ico">🏆</div>
          Das Turnier ist beendet.
          <br />
          Im Tab „Spieler&rdquo; kannst du ein neues starten.
        </div>
      ) : !proposal ? (
        <div className="empty-state">Lose wird gezogen …</div>
      ) : (
        <>
          {proposal.matches.map((m, mi) => (
            <div className="padel-match-card" key={mi}>
              <div className="padel-match-label">🎾 Match {mi + 1}</div>
              <div className="padel-match-teams">
                <div className="padel-match-team">
                  {m.team1.map((id) => (
                    <span className="padel-chip" style={chipStyle(TEAM_COLORS[mi * 2])} key={id}>
                      <span className="dot" />
                      {playerName(id)}
                    </span>
                  ))}
                </div>
                <div className="padel-vs">VS</div>
                <div className="padel-match-team">
                  {m.team2.map((id) => (
                    <span className="padel-chip" style={chipStyle(TEAM_COLORS[mi * 2 + 1])} key={id}>
                      <span className="dot" />
                      {playerName(id)}
                    </span>
                  ))}
                </div>
              </div>
              <div className="padel-score-row">
                <input
                  className="padel-score-input"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  placeholder="0"
                  value={scoreDraft[mi]?.a ?? ""}
                  onChange={(e) => onScoreChange(mi, "a", e.target.value)}
                />
                <span className="padel-score-sep">:</span>
                <input
                  className="padel-score-input"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={99}
                  placeholder="0"
                  value={scoreDraft[mi]?.b ?? ""}
                  onChange={(e) => onScoreChange(mi, "b", e.target.value)}
                />
              </div>
              {errors[mi] && (
                <div className="padel-match-err">Bitte beide Ergebnisse eintragen — Unentschieden ist nicht möglich.</div>
              )}
            </div>
          ))}

          <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
            <button className="btn secondary" onClick={onReroll} type="button" disabled={saving}>
              🎲 Neu auslosen
            </button>
            <button className="btn primary block" onClick={onSave} type="button" disabled={saving}>
              {saving ? "Speichert …" : "Ergebnis speichern"}
            </button>
          </div>
        </>
      )}
    </>
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
          <div className="hero-banner" style={{ padding: "var(--space-5)", marginBottom: "var(--space-5)", minHeight: "auto" }}>
            <div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700, letterSpacing: ".10em", textTransform: "uppercase", color: finished ? "var(--gold)" : "var(--club)", marginBottom: 6 }}>
                {finished ? "🏆 Champion" : "🔥 Aktuell in Führung"}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.01em" }}>{leader.name}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-secondary)", marginTop: 4 }}>
                {leader.wins} Siege · {leader.quote.toFixed(0)} % Quote
              </div>
            </div>
          </div>

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
