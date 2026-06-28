import { signIn } from "@/lib/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-6)",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ marginBottom: "var(--space-6)" }}>
          <div
            className="brand-mark"
            style={{ width: 44, height: 44, fontSize: 18, marginBottom: "var(--space-4)" }}
          >
            P
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Personal OS</h1>
          <p style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
            Privater Organizer · Anmeldung
          </p>
        </div>

        <form action={signIn} className="form-grid">
          <div className="form-row">
            <label htmlFor="email">E-Mail</label>
            <input
              className="input"
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              placeholder="du@beispiel.de"
            />
          </div>
          <div className="form-row">
            <label htmlFor="password">Passwort</label>
            <input
              className="input"
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <div className="form-row">
              <div className="err">{error}</div>
            </div>
          )}
          <button type="submit" className="btn primary block">
            Anmelden
          </button>
        </form>
      </div>
    </div>
  );
}
