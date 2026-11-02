import Image from "next/image";
import { LoginForm } from "@/components/auth/LoginForm";
import { ThemeToggle } from "@/components/nav/ThemeToggle";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <div className="auth-shell">
    <header className="auth-header"><div className="auth-brand"><span aria-hidden="true">✳</span> Personal OS</div><ThemeToggle/></header>
    <main className="auth-main">
      <section className="auth-scene" aria-label="Personal OS Sportmotiv">
        <div className="auth-scene-top"><span>PERSONAL OS</span><span>01 / PRIVAT</span></div>
        <div className="auth-orbit auth-orbit-one" aria-hidden="true"/><div className="auth-orbit auth-orbit-two" aria-hidden="true"/>
        <div className="auth-sport"><Image src="/sport-editorial.png" alt="Fußballspieler im Seitenprofil mit einem Ball" fill sizes="(max-width: 760px) 100vw, 50vw" priority/></div>
        <div className="auth-scene-bottom"><span>Finanzen</span><span>Planung</span><span>Training</span></div>
      </section>
      <section className="auth-form-side" aria-labelledby="login-heading">
        <div className="auth-form-content">
          <div className="auth-kicker"><span/> PRIVATER ZUGANG</div>
          <h1 id="login-heading">Anmelden<span>.</span></h1>
          <p className="auth-description">Mit deinem Personal-OS-Konto fortfahren.</p>
          <LoginForm error={error}/>
          <div className="auth-account-note"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg><span>Nur für dein bestehendes Konto.</span></div>
        </div>
        <footer className="auth-footer"><span>Personal OS</span><span>Erik Wolters</span></footer>
      </section>
    </main>
  </div>;
}