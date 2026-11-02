/** Daten einer Teilen-Karte — serialisierbar, damit Server-Seiten sie an den Client geben können. */
export interface ShareCardData {
  kicker: string;
  title: string;
  date: string;
  hero: { value: string; unit?: string; label: string };
  stats: { label: string; value: string }[];
  rows: { label: string; value: string }[];
  badge?: string;
  fileName: string;
}

export type ShareCardTheme = "hell" | "dunkel" | "salbei";

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;

const THEMES: Record<ShareCardTheme, { bg: string; text: string; muted: string; accent: string; rule: string; badgeBg: string; badgeText: string }> = {
  hell: { bg: "#f8f9f7", text: "#242a27", muted: "#6f776f", accent: "#526e59", rule: "#dde2da", badgeBg: "#526e59", badgeText: "#ffffff" },
  dunkel: { bg: "#0f1411", text: "#eef1ec", muted: "#97a399", accent: "#a5bca6", rule: "#26302a", badgeBg: "#a5bca6", badgeText: "#0f1411" },
  salbei: { bg: "#526e59", text: "#ffffff", muted: "#d7e2d5", accent: "#e4ecd9", rule: "#ffffff33", badgeBg: "#ffffff", badgeText: "#405845" },
};
const PHOTO = { text: "#ffffff", muted: "#ffffffc4", accent: "#d9e8d3", rule: "#ffffff40", badgeBg: "#ffffff", badgeText: "#242a27" };

const PAD = 88;

function setSpacing(ctx: CanvasRenderingContext2D, px: number) {
  // letterSpacing fehlt in älteren Safari-Versionen — dann eben ohne.
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    let last = kept[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    kept[maxLines - 1] = `${last.trimEnd()}…`;
    return kept;
  }
  return lines;
}

function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

function drawCover(ctx: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }) {
  const scale = Math.max(CARD_WIDTH / img.width, CARD_HEIGHT / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (CARD_WIDTH - w) / 2, (CARD_HEIGHT - h) / 2, w, h);
  const shade = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  shade.addColorStop(0, "rgba(10,14,11,.55)");
  shade.addColorStop(0.35, "rgba(10,14,11,.15)");
  shade.addColorStop(0.6, "rgba(10,14,11,.45)");
  shade.addColorStop(1, "rgba(10,14,11,.88)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
}

/** Zeichnet die Karte. `font` ist die CSS-Font-Family der App (next/font vergibt gehashte Namen). */
export function drawShareCard(
  ctx: CanvasRenderingContext2D,
  data: ShareCardData,
  opts: { theme: ShareCardTheme; photo: (CanvasImageSource & { width: number; height: number }) | null; details: boolean; font: string }
) {
  const { font } = opts;
  const t = opts.photo ? { ...THEMES[opts.theme], ...PHOTO } : THEMES[opts.theme];
  const inner = CARD_WIDTH - PAD * 2;

  ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.textBaseline = "alphabetic";
  if (opts.photo) drawCover(ctx, opts.photo);
  else {
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  }

  // Kopfzeile: Wortmarke links, Kicker rechts.
  setSpacing(ctx, -1);
  ctx.fillStyle = t.text;
  ctx.font = `500 40px ${font}`;
  ctx.textAlign = "left";
  ctx.fillText("personal", PAD, PAD + 30);
  const wordW = ctx.measureText("personal").width;
  ctx.fillStyle = t.accent;
  ctx.font = `italic 400 44px Georgia, serif`;
  ctx.fillText("os", PAD + wordW + 8, PAD + 30);

  setSpacing(ctx, 5);
  ctx.font = `500 24px ${font}`;
  ctx.fillStyle = t.muted;
  ctx.textAlign = "right";
  ctx.fillText(data.kicker.toUpperCase(), CARD_WIDTH - PAD, PAD + 26);
  ctx.textAlign = "left";

  // Titelblock.
  setSpacing(ctx, 0);
  ctx.font = `400 32px ${font}`;
  ctx.fillStyle = t.muted;
  ctx.fillText(data.date, PAD, 236);
  setSpacing(ctx, -3);
  ctx.font = `500 84px ${font}`;
  ctx.fillStyle = t.text;
  const titleLines = wrap(ctx, data.title, inner, 2);
  titleLines.forEach((line, i) => ctx.fillText(line, PAD, 330 + i * 92));

  // Hero-Zahl.
  const heroY = (opts.details ? 650 : 760) + (titleLines.length > 1 ? 36 : 0);
  setSpacing(ctx, -10);
  ctx.font = `500 220px ${font}`;
  ctx.fillStyle = t.text;
  const heroText = fit(ctx, data.hero.value, inner - 160);
  ctx.fillText(heroText, PAD - 6, heroY);
  if (data.hero.unit) {
    const heroW = ctx.measureText(heroText).width;
    setSpacing(ctx, -2);
    ctx.font = `400 72px ${font}`;
    ctx.fillStyle = t.muted;
    ctx.fillText(data.hero.unit, PAD + heroW + 14, heroY);
  }
  setSpacing(ctx, 0);
  ctx.font = `400 34px ${font}`;
  ctx.fillStyle = t.muted;
  ctx.fillText(data.hero.label, PAD, heroY + 58);

  // Badge (z.B. Bestleistungen).
  if (data.badge) {
    ctx.font = `500 28px ${font}`;
    const label = fit(ctx, data.badge, inner - 56);
    const w = ctx.measureText(label).width + 56;
    const y = heroY + 96;
    ctx.fillStyle = t.badgeBg;
    ctx.beginPath();
    ctx.roundRect(PAD, y, w, 58, 29);
    ctx.fill();
    ctx.fillStyle = t.badgeText;
    ctx.fillText(label, PAD + 28, y + 39);
  }

  // Kennzahlen in drei Spalten.
  const statsY = opts.details ? 930 : 1090;
  const stats = data.stats.slice(0, 3);
  const colW = inner / Math.max(1, stats.length);
  ctx.fillStyle = t.rule;
  ctx.fillRect(PAD, statsY, inner, 2);
  stats.forEach((stat, i) => {
    const x = PAD + i * colW;
    if (i > 0) {
      ctx.fillStyle = t.rule;
      ctx.fillRect(x - 20, statsY + 34, 2, 104);
    }
    ctx.font = `400 26px ${font}`;
    ctx.fillStyle = t.muted;
    ctx.fillText(fit(ctx, stat.label, colW - 40), x + (i > 0 ? 8 : 0), statsY + 66);
    setSpacing(ctx, -2);
    ctx.font = `500 58px ${font}`;
    ctx.fillStyle = t.text;
    ctx.fillText(fit(ctx, stat.value, colW - 40), x + (i > 0 ? 8 : 0), statsY + 132);
    setSpacing(ctx, 0);
  });

  // Detailzeilen.
  if (opts.details && data.rows.length) {
    let y = statsY + 196;
    for (const row of data.rows.slice(0, 3)) {
      ctx.fillStyle = t.rule;
      ctx.fillRect(PAD, y - 46, inner, 1);
      ctx.font = `500 30px ${font}`;
      ctx.fillStyle = t.text;
      ctx.textAlign = "right";
      const valueW = ctx.measureText(row.value).width;
      ctx.fillText(row.value, CARD_WIDTH - PAD, y);
      ctx.textAlign = "left";
      ctx.font = `400 30px ${font}`;
      ctx.fillStyle = t.muted;
      ctx.fillText(fit(ctx, row.label, inner - valueW - 40), PAD, y);
      y += 66;
    }
  }
}
