export interface ModuleDef {
  key: string;
  label: string;
  short: string;
  href: string;
  colorVar: string;
}

export const MODULES: ModuleDef[] = [
  { key: "finanzielles", label: "Finanzielles", short: "Finanzen", href: "/finanzielles", colorVar: "--mod-finanzielles" },
  { key: "erik", label: "Erik", short: "Erik", href: "/erik", colorVar: "--mod-erik" },
  { key: "termine", label: "Termine", short: "Termine", href: "/termine", colorVar: "--mod-termine" },
  { key: "arbeit", label: "Arbeit/Master", short: "Arbeit", href: "/arbeit", colorVar: "--mod-arbeit" },
  { key: "training", label: "Training", short: "Training", href: "/training", colorVar: "--mod-fussball" },
];

export const HEUTE: ModuleDef = {
  key: "heute",
  label: "Heute",
  short: "Heute",
  href: "/heute",
  colorVar: "--club",
};

export const NAV_ITEMS: ModuleDef[] = [HEUTE, ...MODULES];
