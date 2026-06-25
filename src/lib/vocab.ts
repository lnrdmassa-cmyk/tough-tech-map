// Controlled vocabularies, design tokens and small helpers shared across the app.

export const TYPE_COLORS: Record<string, string> = {
  "Core Facility": "#1e3aff",
  "Pilot Line / Test Bed": "#c2410c",
  "Incubator / Accelerator": "#0e9f6e",
  "Research Institute": "#6d28d9",
  "Space Launchpad": "#0284c7",
};

export const TYPES: string[] = Object.keys(TYPE_COLORS);

export const CAPABILITIES: string[] = [
  "Cleanroom / Nanofab",
  "Wet Lab",
  "Dry Lab",
  "Pilot Line / Scale-up",
  "Characterization & Metrology",
  "Prototyping / Makerspace",
  "Launchpad - Space",
  "Biomanufacturing / GMP",
];

// The four capabilities to emphasise everywhere (dashed accent border).
export const KEY_CAPABILITIES = new Set<string>([
  "Cleanroom / Nanofab",
  "Wet Lab",
  "Dry Lab",
  "Launchpad - Space",
]);

export const ACCESS_MODELS: string[] = [
  "Open user access (proposal)",
  "Fee-for-service",
  "Membership / residency",
  "Program / cohort",
  "Collaboration / contract R&D",
];

export const SECTORS: string[] = [
  "Semiconductors & Photonics",
  "Quantum",
  "Life Sciences & Biotech",
  "Advanced Materials",
  "Energy & Climate",
  "Space & Aerospace",
  "Advanced Manufacturing",
  "Robotics & Automation",
];

export type Country = { name: string; centroid: [number, number]; flag: string };

export const COUNTRIES: Record<string, Country> = {
  CH: { name: "Switzerland", centroid: [46.8, 8.23], flag: "🇨🇭" },
  DE: { name: "Germany", centroid: [51.1, 10.4], flag: "🇩🇪" },
  FR: { name: "France", centroid: [46.6, 2.4], flag: "🇫🇷" },
  GB: { name: "United Kingdom", centroid: [53.0, -1.5], flag: "🇬🇧" },
  NL: { name: "Netherlands", centroid: [52.2, 5.3], flag: "🇳🇱" },
  IT: { name: "Italy", centroid: [42.8, 12.5], flag: "🇮🇹" },
  BE: { name: "Belgium", centroid: [50.6, 4.6], flag: "🇧🇪" },
  DK: { name: "Denmark", centroid: [56.0, 10.0], flag: "🇩🇰" },
  PL: { name: "Poland", centroid: [52.0, 19.4], flag: "🇵🇱" },
  EE: { name: "Estonia", centroid: [58.7, 25.5], flag: "🇪🇪" },
  LV: { name: "Latvia", centroid: [56.9, 24.6], flag: "🇱🇻" },
  LT: { name: "Lithuania", centroid: [55.2, 23.9], flag: "🇱🇹" },
  IE: { name: "Ireland", centroid: [53.2, -8.0], flag: "🇮🇪" },
  PT: { name: "Portugal", centroid: [39.6, -8.0], flag: "🇵🇹" },
  AT: { name: "Austria", centroid: [47.6, 14.1], flag: "🇦🇹" },
  SE: { name: "Sweden", centroid: [62.0, 15.0], flag: "🇸🇪" },
  NO: { name: "Norway", centroid: [64.5, 12.0], flag: "🇳🇴" },
  FI: { name: "Finland", centroid: [64.0, 26.0], flag: "🇫🇮" },
  CZ: { name: "Czechia", centroid: [49.8, 15.5], flag: "🇨🇿" },
  ES: { name: "Spain", centroid: [40.2, -3.7], flag: "🇪🇸" },
};

export const COUNTRY_CODES: string[] = Object.keys(COUNTRIES);

// Map view defaults.
export const MAP_CENTER: [number, number] = [49.5, 6.5];
export const MAP_ZOOM = 5;

export const CARTO_TILES =
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
export const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

export function flagFor(cc: string): string {
  return COUNTRIES[cc]?.flag ?? "";
}

export function countryName(cc: string): string {
  return COUNTRIES[cc]?.name ?? cc;
}

export function isKeyCapability(cap: string): boolean {
  return KEY_CAPABILITIES.has(cap);
}

/** Normalise a stored website (no scheme) into a safe https URL. */
export function websiteUrl(website: string): string {
  if (!website) return "";
  return website.startsWith("http") ? website : `https://${website}`;
}

/** Place a submission near its country centroid when no coordinates are given. */
export function jitteredCentroid(cc: string): [number, number] {
  const c = COUNTRIES[cc]?.centroid ?? MAP_CENTER;
  const j = () => (Math.random() - 0.5) * 0.9; // ±0.45°
  return [c[0] + j(), c[1] + j()];
}
