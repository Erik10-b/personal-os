export const muscleGroups = ["Brust", "Rücken", "Schultern", "Arme", "Beine", "Po", "Bauch", "Waden"] as const;
export type MuscleGroup = typeof muscleGroups[number];

/** Eigener Startkatalog; keine Übernahme der FIN-Datenbank. Primäre Muskelgruppe. */
export const exerciseCatalog: { name: string; group: MuscleGroup }[] = [
  ...["Bankdrücken", "Schrägbankdrücken", "Kurzhantel-Bankdrücken", "Butterfly", "Liegestütze", "Kabel-Flys"].map(name => ({ name, group: "Brust" as const })),
  ...["Kreuzheben", "Klimmzüge", "Latzug", "Rudern am Kabel", "Langhantelrudern", "Kurzhantelrudern"].map(name => ({ name, group: "Rücken" as const })),
  ...["Schulterdrücken", "Seitheben", "Face Pulls", "Reverse Butterfly"].map(name => ({ name, group: "Schultern" as const })),
  ...["Bizepscurls", "Hammercurls", "Preacher Curls am Kabel", "Trizepsdrücken", "Trizepsstrecken", "Dips"].map(name => ({ name, group: "Arme" as const })),
  ...["Kniebeugen", "Beinpresse", "Beinstrecker", "Beinbeuger", "Ausfallschritte", "Bulgarian Split Squats"].map(name => ({ name, group: "Beine" as const })),
  ...["Hip Thrust", "Glute Bridge", "Kickbacks"].map(name => ({ name, group: "Po" as const })),
  ...["Crunches", "Plank", "Beinheben", "Cable Crunch"].map(name => ({ name, group: "Bauch" as const })),
  ...["Wadenheben stehend", "Wadenheben sitzend"].map(name => ({ name, group: "Waden" as const })),
];

export const exerciseKey = (name: string) => name.trim().toLocaleLowerCase("de-DE");
export function primaryMuscle(name: string): MuscleGroup | null {
  return exerciseCatalog.find(ex => exerciseKey(ex.name) === exerciseKey(name))?.group ?? null;
}
