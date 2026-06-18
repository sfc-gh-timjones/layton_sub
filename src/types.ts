import type { Geometry } from "geojson";

export type TierFilter = "all" | "1" | "2" | "3" | "4";

export interface ScoreRule {
  ruleCode: string;
  ruleName: string;
  scoreColumn: string;
  reasonLabel: string;
  reasonFavorable?: string | null;
  reasonUnfavorable?: string | null;
  scoreMin: number | null;
  scoreMax: number | null;
  description: string | null;
}

export interface TopScoreReason {
  ruleCode: string;
  ruleName?: string;
  summary?: string;
  /** @deprecated legacy export field */
  reason?: string;
  score: number | null;
  /** @deprecated legacy export field */
  sentiment?: string;
  rank: number | null;
}

export interface ParcelScores {
  houseAge: number | null;
  houseSqft: number | null;
  primaryResidence: number | null;
  marketValue: number | null;
  landValueRatio: number | null;
  bldgFootprintSqft: number | null;
  bldgCoverageRatio: number | null;
  centroidInBldg: number | null;
  centroidToEdge: number | null;
  centroidToBldgCentroid: number | null;
  flagLot: number | null;
  frontBackOffset: number | null;
  touchesRoad: number | null;
  cornerLot: number | null;
  frontBackFrontage: number | null;
  frontBackSetback: number | null;
  distToRoad: number | null;
  rawLandVsStructure: number | null;
  parcelSize: number | null;
  aiLotShape: number | null;
  aiPhysicalConstraints: number | null;
  aiSubdivision: number | null;
  largeHomeFilter: number | null;
  generalPlan: number | null;
}

export interface ParcelStats {
  builtYear: number | null;
  buildingSqft: number | null;
  primaryResidence: boolean | null;
  totalMarketValue: number | null;
  landMarketValue: number | null;
  landValueRatio: number | null;
  totalBldgAreaSqft: number | null;
  bldgCoverageRatio: number | null;
  buildingCnt: number | null;
  centroidInBldg: boolean | null;
  centroidToBldgEdgeFt: number | null;
  centroidToBldgCentroidDistFt: number | null;
  setbackFt1: number | null;
  setbackFt2: number | null;
  setbackFt3: number | null;
  setbackFt4: number | null;
  rdTouchesRoadway: boolean | null;
  aiTouchesRoadDsc: string | null;
  rdIsCornerLot: boolean | null;
  aiCornerLot: boolean | null;
  rdFrontAndBackFrontage: boolean | null;
  distanceToNearestRoadwayFt: number | null;
  aiLandType: string | null;
  aiLotShape: string | null;
  aiPhysicalConstraints: string | null;
  aiSubdivisionFeasibility: string | null;
  generalPlan: string | null;
  currentZone: string | null;
  zoneGeneralDescription: string | null;
  zoneDetailedDescription: string | null;
  ownerName: string | null;
  ownerIsEntity: boolean | null;
  acreage: number | null;
}

export interface ScoredParcel {
  parcelId: number;
  address: string;
  city: string;
  acreage: number | null;
  tier: number | null;
  totalScore: number | null;
  tierMethod: string | null;
  topScoreReasons: TopScoreReason[];
  scores: ParcelScores;
  stats: ParcelStats;
  lat: number;
  lon: number;
  parcelGeometry: Geometry;
  buildingGeometry: Geometry;
  setbackFt1Geometry?: Geometry;
  setbackFt2Geometry?: Geometry;
  setbackFt3Geometry?: Geometry;
  setbackFt4Geometry?: Geometry;
  cornerRoadGeometries?: Geometry[];
  frontBackRoadGeometries?: Geometry[];
}

export interface ScoredTierData {
  version: string;
  exportedAt: string;
  total: number;
  rules: ScoreRule[];
  parcels: ScoredParcel[];
}

export const TIER_COLORS: Record<string, string> = {
  "1": "#16a34a",
  "2": "#2563eb",
  "3": "#d97706",
  "4": "#dc2626",
};

export function tierKey(tier: number | null): string {
  if (tier === null) return "4";
  return String(tier);
}

export function tierLabel(tier: number | null): string {
  if (tier === null) return "Unscored";
  return `Tier ${tier}`;
}

/** Snowflake JSON may return numbers as strings — coerce safely. */
export function toNum(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** @deprecated Use formatTopReason from reasonStats.ts */
export function formatReasonLine(reason: TopScoreReason): string {
  const sentiment = reason.sentiment?.trim() ?? "";
  const text = (reason.reason ?? "").trim().toLowerCase();
  const base = reason.summary?.trim() || text || reason.ruleName || reason.ruleCode;
  if (!sentiment) return base;
  if (!text) return sentiment;
  return `${sentiment} ${text}`;
}

export function scoreTone(score: number | null): "positive" | "negative" | "neutral" {
  const n = toNum(score);
  if (n == null || n === 0) return "neutral";
  return n > 0 ? "positive" : "negative";
}

export function formatScore(score: number | null): string {
  const n = toNum(score);
  if (n == null || n === 0) return "0";
  const abs = Math.abs(n);
  const rounded = abs % 1 === 0 ? String(Math.trunc(abs)) : abs.toFixed(1);
  return n > 0 ? `+${rounded}` : `-${rounded}`;
}
