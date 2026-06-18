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

export const LAYTON_MUNICIPAL_CODE_URL =
  "https://hosting.civiclinq.com/layton/books/municipal-code/19.05.000";

export const SQFT_PER_ACRE = 43560;

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

export function parseMinLotAreaSqft(rows: ZoningRegulationRow[]): number | null {
  const row = rows.find(
    (r) =>
      r.regulation.startsWith("Min. Lot Area 1st Dwelling") || r.regulation === "Min. Lot Area",
  );
  if (!row?.value) return null;

  const value = row.value.trim();
  const acreMatch = value.match(/([\d,.]+)\s*Acres?/i);
  if (acreMatch) {
    const acres = Number(acreMatch[1].replace(/,/g, ""));
    return Number.isFinite(acres) && acres > 0 ? acres * SQFT_PER_ACRE : null;
  }

  const sqftMatch = value.match(/([\d,.]+)\s*s\/f/i);
  if (sqftMatch) {
    const sqft = Number(sqftMatch[1].replace(/,/g, ""));
    return Number.isFinite(sqft) && sqft > 0 ? sqft : null;
  }

  return null;
}

export interface SubdivisionMath {
  parcelSqft: number;
  minLotSqft: number | null;
  minLotLabel: string | null;
  lotsPossible: number | null;
}

export function computeSubdivisionMath(
  acreage: number | null | undefined,
  zoneRows: ZoningRegulationRow[],
): SubdivisionMath | null {
  if (acreage == null || acreage <= 0) return null;

  const parcelSqft = acreage * SQFT_PER_ACRE;
  const minRow = zoneRows.find(
    (r) =>
      r.regulation.startsWith("Min. Lot Area 1st Dwelling") || r.regulation === "Min. Lot Area",
  );
  const minLotSqft = parseMinLotAreaSqft(zoneRows);
  const lotsPossible =
    minLotSqft != null && minLotSqft > 0 ? Math.floor(parcelSqft / minLotSqft) : null;

  return {
    parcelSqft,
    minLotSqft,
    minLotLabel: minRow?.value ?? null,
    lotsPossible,
  };
}
