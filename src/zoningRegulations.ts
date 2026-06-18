export interface ZoningRegulationRow {
  category: string | null;
  regulation: string;
  value: string;
  tableNumber: string;
}

export interface ZoningRegulationsData {
  sourceUpdated: string | null;
  sourceUrl: string | null;
  zones: Record<string, ZoningRegulationRow[]>;
}

const ZONE_ALIASES: Record<string, string> = {
  PB: "P-B",
};

const CATEGORY_ORDER = [
  "LOT SIZE",
  "PRINCIPLE STRUCTURE SETBACKS",
  "PRINCIPLE USE",
  "ACCESSORY STRUCTURE SETBACKS",
  "ACCESSORY USES",
  "STRUCTURE HEIGHT AND LOT COVERAGE",
  "HEIGHT",
  "LOT COVERAGE",
  "ADJACENT TO RESIDENTIAL ZONES",
];

const CATEGORY_LABELS: Record<string, string> = {
  "LOT SIZE": "Lot size",
  "PRINCIPLE STRUCTURE SETBACKS": "Setbacks (principal)",
  "PRINCIPLE USE": "Setbacks (principal)",
  "ACCESSORY STRUCTURE SETBACKS": "Setbacks (accessory)",
  "ACCESSORY USES": "Setbacks (accessory)",
  "STRUCTURE HEIGHT AND LOT COVERAGE": "Height & coverage",
  HEIGHT: "Height",
  "LOT COVERAGE": "Coverage",
  "ADJACENT TO RESIDENTIAL ZONES": "Adjacent to residential",
};

export function normalizeRegulationZone(zone: string | null | undefined): string | null {
  if (!zone?.trim()) return null;
  const cleaned = zone.trim().replace(/\s*\(PRUD\)\s*$/i, "");
  return ZONE_ALIASES[cleaned] ?? cleaned;
}

export function lookupZoneRegulations(
  data: ZoningRegulationsData | null,
  zone: string | null | undefined,
): ZoningRegulationRow[] {
  if (!data) return [];
  const key = normalizeRegulationZone(zone);
  if (!key) return [];
  return data.zones[key] ?? [];
}

export function groupRegulations(rows: ZoningRegulationRow[]): { category: string; items: ZoningRegulationRow[] }[] {
  const grouped = new Map<string, ZoningRegulationRow[]>();
  rows.forEach((row) => {
    const category = row.category ?? "OTHER";
    const list = grouped.get(category) ?? [];
    list.push(row);
    grouped.set(category, list);
  });

  return Array.from(grouped.entries())
    .sort(([a], [b]) => {
      const ai = CATEGORY_ORDER.indexOf(a);
      const bi = CATEGORY_ORDER.indexOf(b);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    })
    .map(([category, items]) => ({
      category: CATEGORY_LABELS[category] ?? category,
      items,
    }));
}
