"use client";

import { useEffect, useRef, useState } from "react";
import type { MealTemplate, Macros, RecipeIngredient } from "@/lib/mealTemplates";
import { macroKeys, macroLabels, recipeBatchMacros, templateMealMacros } from "@/lib/mealTemplates";
import { logMealTemplate, repeatMeal, saveMealTemplate } from "@/lib/actions/mealTemplates";
import type { MealRow } from "@/lib/types";

export function MealLibrary({ templates, date, previousMeals, storageReady }: { templates: MealTemplate[]; date: string; previousMeals: MealRow[]; storageReady: boolean }) {
  const [editor, setEditor] = useState<MealTemplate | null>(null);
  const [amountRecipe, setAmountRecipe] = useState<MealTemplate | null>(null);
  const [portions, setPortions] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  // Retain a request key after a network failure, so retrying cannot double-log.
  const pending = useRef<{ intent: string; key: string } | null>(null);
  async function log(recipe: MealTemplate, amount?: { grams?: number; ingredientGrams?: number[] }) {
    if (busy) return;
    setBusy(true); setError(""); setMessage("");
    const count = portions[recipe.key] ?? 1;
    const intent = JSON.stringify({ recipe: recipe.key, date, count, ...amount });
    if (pending.current?.intent !== intent) pending.current = { intent, key: crypto.randomUUID() };
    try {
      await logMealTemplate({ key: recipe.key, date, entryKey: pending.current.key, portions: count, ...amount });
      pending.current = null; setMessage(`${recipe.name} eingetragen.`); setAmountRecipe(null);
    } catch (e) { setError(e instanceof Error ? e.message : "Eintragen fehlgeschlagen. Bitte erneut versuchen."); }
    finally { setBusy(false); }
  }
  async function repeat(meal: MealRow) {
    if (busy) return;
    setBusy(true); setError(""); setMessage("");
    const intent = `repeat:${meal.id}:${date}`;
    if (pending.current?.intent !== intent) pending.current = { intent, key: crypto.randomUUID() };
    try { await repeatMeal({ sourceId: meal.id, date, entryKey: pending.current.key }); pending.current = null; setMessage(`${meal.name} übernommen.`); }
    catch (e) { setError(e instanceof Error ? e.message : "Übernehmen fehlgeschlagen."); }
    finally { setBusy(false); }
  }
  return <section className="meal-library" aria-label="Meine Gerichte">
    <div className="meal-library-head"><div><h2>Meine Gerichte</h2><p>Einmal einrichten. Danach Gericht und Menge auswählen.</p></div><button className="btn secondary sm" type="button" disabled={!storageReady || busy} onClick={() => setEditor({ key: crypto.randomUUID(), name: "", servings: 1, batchWeightG: null, mode: "totals", totalMacros: null, ingredients: [] })}>+ Eigenes Gericht</button></div>
    {!storageReady && <p className="meal-notice">Deine Gerichte sind vorbereitet. Zum Speichern und schnellen Eintragen muss einmal die enthaltene Supabase-Migration 0014 ausgeführt werden.</p>}
    {error && <p className="meal-notice" role="alert">{error}</p>}{message && <p className="meal-notice" role="status">{message}</p>}
    <div className="meal-template-grid">{templates.map(recipe => {
      const batch = recipeBatchMacros(recipe);
      const count = portions[recipe.key] ?? 1;
      return <article className={`card meal-template ${batch ? "ready" : "draft"}`} key={recipe.key}>
        <span className="meal-template-status">{batch ? "Dein Standardgericht" : "Mengen und Nährwerte fehlen noch"}</span><h3>{recipe.name}</h3><p>{recipe.ingredients.map(i => i.name).join(" · ") || "Eigene Nährwerte"}</p>
        {batch ? <>
          <div className="meal-template-macros"><strong>{Math.round(batch.kcal / recipe.servings * count)} kcal</strong><span>{Math.round(batch.protein_g / recipe.servings * count)} g Eiweiß</span></div>
          <div className="meal-portion-chips" role="group" aria-label={`Portionen für ${recipe.name}`}>{[0.5, 1, 1.5, 2].map(n => <button key={n} type="button" disabled={busy} aria-pressed={count === n} onClick={() => setPortions(prev => ({ ...prev, [recipe.key]: n }))}>{n.toLocaleString("de-DE")}×</button>)}</div>
          <button type="button" className="btn primary" disabled={busy || !storageReady} onClick={() => log(recipe)}>+ {count.toLocaleString("de-DE")} Portion{count === 1 ? "" : "en"} eintragen</button>
          <button type="button" className="btn ghost sm" disabled={busy || !storageReady} onClick={() => setAmountRecipe(recipe)}>Mengen ändern</button>
        </> : <><p className="meal-template-help">Keine geschätzten Kalorien. Ergänze einmal die Werte deiner Zubereitung.</p><button type="button" className="btn primary" disabled={!storageReady || busy} onClick={() => setEditor(recipe)}>Einmal einrichten</button></>}
        {batch && <button type="button" className="btn ghost sm" disabled={busy || !storageReady} onClick={() => setEditor(recipe)}>Vorlage bearbeiten</button>}
      </article>;
    })}</div>
    {previousMeals.length > 0 && <details className="card meal-repeat"><summary>Wie am Vortag</summary><p>Einzelne Mahlzeiten mit unveränderten Mengen übernehmen.</p>{previousMeals.map(meal => <div key={meal.id}><span>{meal.name}<small>{meal.kcal} kcal · {meal.protein_g} g Eiweiß</small></span><button className="btn secondary sm" type="button" disabled={busy || !storageReady} onClick={() => repeat(meal)}>Übernehmen</button></div>)}</details>}
    {editor && <RecipeEditor recipe={editor} onClose={() => setEditor(null)} />}
    {amountRecipe && <AmountDialog recipe={amountRecipe} portions={portions[amountRecipe.key] ?? 1} busy={busy} error={error} onClose={() => { if (!busy) setAmountRecipe(null); }} onLog={amount => log(amountRecipe, amount)} />}
  </section>;
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const headingId = "meal-dialog-title";
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog className="meal-dialog" ref={ref} aria-labelledby={headingId} onCancel={e => { e.preventDefault(); onClose(); }}><header><h2 id={headingId}>{title}</h2><button className="btn ghost" type="button" aria-label="Schließen" onClick={onClose}>✕</button></header>{children}</dialog>;
}

type MacroFields = Record<keyof Macros, string>;
const macroFields = (value: Macros | null): MacroFields => Object.fromEntries(macroKeys.map(k => [k, value === null ? "" : String(value[k])])) as MacroFields;
function parseFields(fields: MacroFields): Macros | null {
  if (macroKeys.every(k => !fields[k].trim())) return null;
  if (macroKeys.some(k => !fields[k].trim() || !Number.isFinite(Number(fields[k])) || Number(fields[k]) < 0)) throw new Error("Bitte alle vier Nährwerte ausfüllen (auch 0) oder alle leer lassen.");
  return Object.fromEntries(macroKeys.map(k => [k, Number(fields[k])])) as Macros;
}
function MacroInputs({ values, onChange, per100 = false }: { values: MacroFields; onChange: (values: MacroFields) => void; per100?: boolean }) {
  return <div className="meal-macro-fields">{macroKeys.map(key => <label key={key}>{macroLabels[key]}<input className="input" type="number" inputMode="decimal" min="0" max={per100 ? (key === "kcal" ? 1000 : 100) : (key === "kcal" ? 100000 : 20000)} step="any" value={values[key]} onChange={e => onChange({ ...values, [key]: e.target.value })} /></label>)}</div>;
}
function RecipeEditor({ recipe, onClose }: { recipe: MealTemplate; onClose: () => void }) {
  const [name, setName] = useState(recipe.name);
  const [servings, setServings] = useState(String(recipe.servings));
  const [weight, setWeight] = useState(recipe.batchWeightG === null ? "" : String(recipe.batchWeightG));
  const [mode, setMode] = useState(recipe.mode);
  const [totals, setTotals] = useState(macroFields(recipe.totalMacros));
  const [rows, setRows] = useState(recipe.ingredients.map(i => ({ name: i.name, grams: i.grams === null ? "" : String(i.grams), macros: macroFields(i.per100), hint: i.hint })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  function change(index: number, patch: Partial<typeof rows[number]>) { setRows(old => old.map((row, i) => i === index ? { ...row, ...patch } : row)); }
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (busy) return; setBusy(true); setError("");
    try {
      const ingredients: RecipeIngredient[] = rows.map(row => ({ name: row.name, grams: row.grams.trim() ? Number(row.grams) : null, per100: parseFields(row.macros), ...(row.hint ? { hint: row.hint } : {}) }));
      await saveMealTemplate({ key: recipe.key, name, servings: Number(servings), batchWeightG: weight.trim() ? Number(weight) : null, mode, totalMacros: parseFields(totals), ingredients });
      onClose();
    } catch (e) { setError(e instanceof Error ? e.message : "Vorlage konnte nicht gespeichert werden."); }
    finally { setBusy(false); }
  }
  return <Dialog title="Gericht einrichten" onClose={() => { if (!busy) onClose(); }}><form onSubmit={save}>
    <fieldset disabled={busy}><label>Gerichtname<input className="input" value={name} maxLength={120} required onChange={e => setName(e.target.value)} /></label><label>Wie viele Portionen ergibt die ganze Zubereitung?<input className="input" type="number" min="0.1" max="100" step="any" required value={servings} onChange={e => setServings(e.target.value)} /></label>
    <label>Berechnen aus<select className="input" value={mode} onChange={e => setMode(e.target.value as MealTemplate["mode"])}><option value="totals">Bekannten Gesamtnährwerten (schneller)</option><option value="ingredients">Zutaten und Packungsangaben</option></select></label>
    {mode === "totals" ? <section><h3>Nährwerte der gesamten Zubereitung</h3><p>Bei einer einzelnen Mahlzeit: 1 Portion und deren Werte eintragen. Bei Mealprep: Werte für den ganzen Topf.</p><MacroInputs values={totals} onChange={setTotals} /></section> : <section><h3>Zutaten für die gesamte Zubereitung</h3><p>Mengen in Gramm, Nährwerte je 100 g vom verwendeten Produkt. Reis und Nudeln mit ihrer Trockenmenge erfassen. Nicht verwendete Zutaten entfernen oder auf 0 g setzen.</p>{rows.map((row, index) => <fieldset className="meal-ingredient" key={index}><legend>Zutat {index + 1}</legend><div className="meal-ingredient-name"><label>Name<input className="input" maxLength={120} value={row.name} required onChange={e => change(index, { name: e.target.value })} /></label><label>Gramm im Rezept<input className="input" type="number" inputMode="decimal" min="0" max="100000" step="any" value={row.grams} onChange={e => change(index, { grams: e.target.value })} /></label></div>{row.hint && <small>{row.hint}</small>}<details><summary>Nährwerte je 100 g {macroKeys.every(k => row.macros[k] !== "") ? "· eingetragen" : "· noch offen"}</summary><MacroInputs values={row.macros} per100 onChange={macros => change(index, { macros })} /></details><button className="btn ghost sm" type="button" onClick={() => setRows(old => old.filter((_, i) => i !== index))}>Zutat entfernen</button></fieldset>)}<button className="btn secondary sm" type="button" disabled={rows.length >= 30} onClick={() => setRows(old => [...old, { name: "", grams: "", macros: macroFields(null), hint: undefined }])}>+ Zutat</button></section>}
    <details className="meal-weight-option"><summary>Auch nach Gramm eintragen können</summary><label>Gewogenes Gesamtgewicht des fertigen Gerichts (g)<input className="input" type="number" min="1" max="100000" step="any" value={weight} onChange={e => setWeight(e.target.value)} /></label><p>Optional. Erst nach dem Kochen wiegen: Das Rohgewicht passt wegen Wasseraufnahme und Garverlusten nicht zuverlässig.</p></details>
    <p>Du kannst unvollständige Vorlagen speichern. Eintragen ist erst möglich, wenn die nötigen Mengen und Nährwerte vollständig sind.</p>
    {error && <p className="meal-notice" role="alert">{error}</p>}<button type="submit" className="btn primary">{busy ? "Wird gespeichert …" : "Vorlage speichern"}</button></fieldset>
  </form></Dialog>;
}

function AmountDialog({ recipe, portions, busy, error, onClose, onLog }: { recipe: MealTemplate; portions: number; busy: boolean; error: string; onClose: () => void; onLog: (amount: { grams?: number; ingredientGrams?: number[] }) => Promise<void> }) {
  const [mode, setMode] = useState<"grams" | "ingredients">(recipe.mode === "ingredients" ? "ingredients" : "grams");
  const [grams, setGrams] = useState(recipe.batchWeightG ? String(Math.round(recipe.batchWeightG / recipe.servings * portions)) : "");
  const [amounts, setAmounts] = useState(recipe.ingredients.map(i => String(Math.round((i.grams ?? 0) / recipe.servings * portions * 10) / 10)));
  const [localError, setLocalError] = useState("");
  let computed: Macros | null = null;
  try { computed = templateMealMacros(recipe, portions, mode === "grams" ? Number(grams) : undefined, mode === "ingredients" ? amounts.map(Number) : undefined); } catch { /* Show setup instructions below. */ }
  return <Dialog title={recipe.name} onClose={onClose}><form onSubmit={async e => {
    e.preventDefault(); setLocalError("");
    if (!computed || (mode === "ingredients" && amounts.some(g => !g.trim()))) { setLocalError("Bitte gültige Mengen eingeben."); return; }
    await onLog(mode === "grams" ? { grams: Number(grams) } : { ingredientGrams: amounts.map(Number) });
  }}><fieldset disabled={busy}>
    <div className="meal-portion-chips">{recipe.mode === "ingredients" && <button type="button" aria-pressed={mode === "ingredients"} onClick={() => setMode("ingredients")}>Zutatenmengen</button>}<button type="button" aria-pressed={mode === "grams"} onClick={() => setMode("grams")}>Gramm des fertigen Gerichts</button></div>
    {mode === "ingredients" ? <><p>Deine gegessenen Mengen. Die gespeicherte Vorlage bleibt erhalten.</p>{recipe.ingredients.map((item, index) => <label key={index}>{item.name} (g)<input className="input" type="number" inputMode="decimal" min="0" max="100000" step="any" required value={amounts[index]} onChange={e => setAmounts(old => old.map((g, i) => i === index ? e.target.value : g))} /></label>)}</> : recipe.batchWeightG ? <label>Gegessene Menge (g)<input className="input" type="number" inputMode="decimal" min="1" max="100000" step="any" required value={grams} onChange={e => setGrams(e.target.value)} /></label> : <p className="meal-notice">Bearbeite die Vorlage und ergänze zuerst das gewogene Gesamtgewicht des fertigen Gerichts. Bis dahin kannst du über Portionen eintragen.</p>}
    {computed && <p className="meal-amount-preview">{Math.round(computed.kcal)} kcal · {Math.round(computed.protein_g)} g Eiweiß</p>}{(error || localError) && <p className="meal-notice" role="alert">{localError || error}</p>}<button className="btn primary" type="submit" disabled={busy || !computed}>{busy ? "Wird eingetragen …" : "Mit diesen Mengen eintragen"}</button>
    </fieldset></form></Dialog>;
}
