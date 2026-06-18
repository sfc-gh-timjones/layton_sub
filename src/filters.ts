import type { ScoredParcel } from "./types";
import { toNum } from "./types";

export type SidebarPanel = "parcels" | "filters";

export interface ParcelFilterState {
  cornerLot: boolean;
  countyCornerLot: boolean;
  frontBackFrontage: boolean;
  touchesRoad: boolean;
  hasBuilding: boolean;
  noBuilding: boolean;
  primaryResidence: boolean;
  notPrimaryResidence: boolean;
  rawLand: boolean;
}

export const DEFAULT_PARCEL_FILTERS: ParcelFilterState = {
  cornerLot: false,
  countyCornerLot: false,
  frontBackFrontage: false,
  touchesRoad: false,
  hasBuilding: false,
  noBuilding: false,
  primaryResidence: false,
  notPrimaryResidence: false,
  rawLand: false,
};

export interface FilterOption {
  key: keyof ParcelFilterState;
  label: string;
  description: string;
}

export const FILTER_OPTIONS: FilterOption[] = [
  {
    key: "cornerLot",
    label: "Corner lot",
    description: "County or AI flags this as a corner lot",
  },
  {
    key: "countyCornerLot",
    label: "County corner lot",
    description: "RD_IS_CORNER_LOT is true",
  },
  {
    key: "frontBackFrontage",
    label: "Front & back roads",
    description: "Parcel has front and back road frontage",
  },
  {
    key: "touchesRoad",
    label: "Touches road",
    description: "County road frontage or AI road touch",
  },
  {
    key: "hasBuilding",
    label: "Has MSFT building",
    description: "At least one matched building footprint",
  },
  {
    key: "noBuilding",
    label: "No MSFT building",
    description: "No matched Microsoft building footprint",
  },
  {
    key: "rawLand",
    label: "Raw land (AI)",
    description: "AI land type indicates vacant/raw land",
  },
  {
    key: "primaryResidence",
    label: "Owner-occupied",
    description: "PRIMARY_RESIDENCE is true",
  },
  {
    key: "notPrimaryResidence",
    label: "Not owner-occupied",
    description: "PRIMARY_RESIDENCE is false",
  },
];

function isCornerLot(p: ScoredParcel): boolean {
  const { stats } = p;
  return Boolean(stats.rdIsCornerLot || stats.aiCornerLot);
}

function isRawLand(p: ScoredParcel): boolean {
  const t = p.stats.aiLandType?.trim().toLowerCase() ?? "";
  return t.includes("raw") || t.includes("vacant") || t.includes("land only");
}

function touchesRoad(p: ScoredParcel): boolean {
  const { stats } = p;
  if (stats.rdTouchesRoadway) return true;
  const ai = stats.aiTouchesRoadDsc?.trim().toLowerCase() ?? "";
  return ai.startsWith("yes");
}

export function activeFilterCount(filters: ParcelFilterState): number {
  return Object.values(filters).filter(Boolean).length;
}

export function matchesParcelFilters(p: ScoredParcel, filters: ParcelFilterState): boolean {
  const { stats } = p;
  const buildingCnt = toNum(stats.buildingCnt) ?? 0;

  if (filters.cornerLot && !isCornerLot(p)) return false;
  if (filters.countyCornerLot && !stats.rdIsCornerLot) return false;
  if (filters.frontBackFrontage && !stats.rdFrontAndBackFrontage) return false;
  if (filters.touchesRoad && !touchesRoad(p)) return false;
  if (filters.hasBuilding && buildingCnt <= 0) return false;
  if (filters.noBuilding && buildingCnt > 0) return false;
  if (filters.rawLand && !isRawLand(p)) return false;
  if (filters.primaryResidence && !stats.primaryResidence) return false;
  if (filters.notPrimaryResidence && stats.primaryResidence !== false) return false;

  return true;
}

export function countParcelsMatchingFilter(
  parcels: ScoredParcel[],
  key: keyof ParcelFilterState,
): number {
  const probe = { ...DEFAULT_PARCEL_FILTERS, [key]: true };
  return parcels.filter((p) => matchesParcelFilters(p, probe)).length;
}
