"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { CARD_HEIGHT, CARD_WIDTH, drawShareCard } from "@/lib/shareCard";
import type { ShareCardData, ShareCardTheme } from "@/lib/shareCard";

const THEME_LABELS: { key: ShareCardTheme; label: string }[] = [
  { key: "hell", label: "Hell" },
  { key: "dunkel", label: "Dunkel" },
  { key: "salbei", label: "Salbei" },
];

export function ShareCardButton({ data, label = "Teilen" }: { data: ShareCardData; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn ghost sm" onClick={() => setOpen(true)}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>
        {label}
      </button>
      {open && <ShareCardEditor data={data} onClose={() => setOpen(false)} />}
    </>
  );
}

function ShareCardEditor({ data, onClose }: { data: ShareCardData; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [theme, setTheme] = useState<ShareCardTheme>("hell");
  const [details, setDetails] = useState(true);
  const [photo, setPhoto] = useState<ImageBitmap | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const font = getComputedStyle(document.body).fontFamily;
    // Erst zeichnen, wenn Outfit geladen ist — sonst landet die Fallback-Schrift im Bild.
    Promise.all([document.fonts.load(`500 80px ${font}`), document.fonts.load(`400 30px ${font}`)]).finally(() => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!cancelled && ctx) drawShareCard(ctx, data, { theme, photo, details, font });
    });
    return () => { cancelled = true; };
  }, [data, theme, photo, details]);

  useEffect(() => () => photo?.close(), [photo]);

  async function pickPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setPhoto(await createImageBitmap(file));
    } catch {
      setStatus("Das Foto konnte nicht geladen werden.");
    }
  }

  function toBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => canvasRef.current?.toBlob(b => (b ? resolve(b) : reject(new Error("toBlob"))), "image/png"));
  }

  async function share() {
    setStatus(null);
    try {
      const file = new File([await toBlob()], `${data.fileName}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: data.title });
        return;
      }
      download(file);
    } catch (error) {
      if ((error as Error).name !== "AbortError") setStatus("Teilen hat nicht geklappt — speichere das Bild stattdessen.");
    }
  }

  async function save() {
    setStatus(null);
    download(new File([await toBlob()], `${data.fileName}.png`, { type: "image/png" }));
  }

  function download(file: File) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("Bild gespeichert.");
  }

  return (
    <Modal
      title="Teilen-Karte"
      eyebrow={data.kicker}
      onClose={onClose}
      footer={
        <div className="share-actions">
          <button type="button" className="btn secondary" onClick={save}>Bild speichern</button>
          <button type="button" className="btn primary" onClick={share}>Teilen</button>
        </div>
      }
    >
      <div className="share-editor">
        <canvas ref={canvasRef} width={CARD_WIDTH} height={CARD_HEIGHT} className="share-preview" role="img" aria-label={`Vorschau: ${data.title}, ${data.hero.value}${data.hero.unit ? ` ${data.hero.unit}` : ""} ${data.hero.label}`} />
        <div className="share-controls">
          <div className="share-themes" role="radiogroup" aria-label="Stil">
            {THEME_LABELS.map(t => (
              <button key={t.key} type="button" role="radio" aria-checked={theme === t.key} className={`share-chip share-chip-${t.key}${theme === t.key ? " active" : ""}`} onClick={() => setTheme(t.key)}>
                <span aria-hidden="true"/>{t.label}
              </button>
            ))}
          </div>
          <div className="share-toggles">
            <label className="share-photo">
              <input type="file" accept="image/*" onChange={pickPhoto}/>
              {photo ? "Foto ändern" : "+ Foto"}
            </label>
            {photo && <button type="button" className="btn ghost sm" onClick={() => setPhoto(null)}>Foto entfernen</button>}
            <label className="share-switch">
              <input type="checkbox" checked={details} onChange={e => setDetails(e.target.checked)}/>
              Details
            </label>
          </div>
          {status && <p className="share-status" role="status">{status}</p>}
        </div>
      </div>
    </Modal>
  );
}
