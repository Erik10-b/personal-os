"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { signIn } from "@/lib/actions/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" className="btn primary block auth-submit" disabled={pending} aria-busy={pending}>
    <span>{pending ? "Wird angemeldet …" : "Anmelden"}</span>
    {pending ? <span className="auth-spinner" aria-hidden="true"/> : <span className="desktop-arrow" aria-hidden="true">↗</span>}
  </button>;
}

export function LoginForm({ error }: { error?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  return <form action={signIn} className="auth-form" aria-describedby={error ? "login-error" : undefined}>
    <div className="form-row">
      <label htmlFor="email">E-Mail-Adresse</label>
      <input className="input" id="email" name="email" type="email" required autoComplete="username" placeholder="name@beispiel.de" autoCapitalize="none" spellCheck={false}/>
    </div>
    <div className="form-row">
      <label htmlFor="password">Passwort</label>
      <div className="auth-password">
        <input className="input" id="password" name="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" placeholder="Passwort eingeben"/>
        <button className="auth-reveal" type="button" onClick={() => setShowPassword(value => !value)} aria-controls="password" aria-pressed={showPassword} aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{showPassword && <path d="m3 3 18 18"/>}</svg>
        </button>
      </div>
    </div>
    {error && <div className="err" role="alert" id="login-error">{error}</div>}
    <SubmitButton/>
  </form>;
}