export interface ModuleDef {
  key: string;
  label: string;
  href: string;
  colorVar: string;
}

export const MODULES: ModuleDef[] = [
  { key: "finanzielles", label: "Finanzielles", href: "/finanzielles", colorVar: "--mod-finanzielles" },
  { key: "erik", label: "Erik", href: "/erik", colorVar: "--mod-erik" },
  { key: "termine", label: "Termine", href: "/termine", colorVar: "--mod-termine" },
  { key: "arbeit", label: "Arbeit/Master", href: "/arbeit", colorVar: "--mod-arbeit" },
  { key: "fussball", label: "Fußball", href: "/fussball", colorVar: "--mod-fussball" },
];
