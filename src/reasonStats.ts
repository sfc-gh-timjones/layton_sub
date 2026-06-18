import type { ParcelStats, ScoreRule, ScoredParcel, TopScoreReason } from "./types";
import { toNum } from "./types";

function fmtCurrency(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return m >= 10 ? `$${Math.round(m)}M` : `$${m.toFixed(1)}M`;
  }
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`;
  return `$${Math.round(value)}`;
}

function fmtSqft(value: number): string {
  return `${Math.round(value).toLocaleString()} sqft`;
}

function fmtFeet(value: number): string {
  return `${Math.round(value)} ft`;
}

function fmtPct(value: number): string {
  const pct = value * 100;
  if (pct >= 10) return `${Math.round(pct)}%`;
  if (pct >= 1) return `${pct.toFixed(1)}%`;
  return `${pct.toFixed(1)}%`;
}

/** e.g. "13% of land is covered by building(s)" */
export function formatLandBuildingCoverage(ratio: number | null | undefined): string | null {
  const r = toNum(ratio);
  if (r == null || r <= 0) return null;
  return `${fmtPct(r)} of land is covered by building(s)`;
}

function fmtYesNo(value: boolean | null | undefined): string | null {
  if (value == null) return null;
  return value ? "yes" : "no";
}

/** Parcel-specific parenthetical appended to comparative reason text. */
export function reasonStatSuffix(ruleCode: string, stats: ParcelStats): string | null {
  switch (ruleCode) {
    case "HOUSE_AGE": {
      const y = stats.builtYear;
      return y != null && y > 0 ? `built in ${Math.round(y)}` : null;
    }
    case "HOUSE_SQFT": {
      const sqft = toNum(stats.buildingSqft);
      return sqft != null && sqft > 0 ? fmtSqft(sqft) : null;
    }
    case "PRIMARY_RESIDENCE": {
      if (stats.primaryResidence == null) return null;
      return stats.primaryResidence ? "owner-occupied" : "not owner-occupied";
    }
    case "MARKET_VALUE": {
      const v = toNum(stats.totalMarketValue);
      return v != null && v > 0 ? fmtCurrency(v) : null;
    }
    case "LAND_VALUE_RATIO": {
      const r = toNum(stats.landValueRatio);
      return r != null && r > 0 ? `${fmtPct(r)} land value` : null;
    }
    case "BLDG_FOOTPRINT_SQFT": {
      const sqft = toNum(stats.totalBldgAreaSqft);
      return sqft != null && sqft > 0 ? `${fmtSqft(sqft)} building footprint` : null;
    }
    case "BLDG_COVERAGE_RATIO":
      return formatLandBuildingCoverage(stats.bldgCoverageRatio);
    case "CENTROID_IN_BLDG": {
      if (stats.centroidInBldg == null) return null;
      return stats.centroidInBldg
        ? "parcel centroid inside building"
        : "parcel centroid outside building";
    }
    case "CENTROID_TO_EDGE": {
      const ft = toNum(stats.centroidToBldgEdgeFt);
      return ft != null ? `parcel centroid ${fmtFeet(ft)} to building edge` : null;
    }
    case "CENTROID_TO_BLDG_CENTROID": {
      const ft = toNum(stats.centroidToBldgCentroidDistFt);
      return ft != null ? `parcel centroid ${fmtFeet(ft)} to building center` : null;
    }
    case "FLAG_LOT": {
      const ft = Math.max(toNum(stats.setbackFt1) ?? 0, toNum(stats.setbackFt2) ?? 0);
      return ft > 0 ? `max side setback ${fmtFeet(ft)}` : null;
    }
    case "FRONT_BACK_OFFSET": {
      const ft = Math.max(toNum(stats.setbackFt3) ?? 0, toNum(stats.setbackFt4) ?? 0);
      return ft > 0 ? `max offset ${fmtFeet(ft)}` : null;
    }
    case "TOUCHES_ROAD": {
      const parts: string[] = [];
      const county = fmtYesNo(stats.rdTouchesRoadway);
      if (county) parts.push(`county road: ${county}`);
      if (stats.aiTouchesRoadDsc?.trim()) {
        const ai = stats.aiTouchesRoadDsc.replace(/^Yes\s*-\s*/i, "").trim();
        parts.push(`AI: ${ai}`);
      }
      return parts.length ? parts.join(", ") : null;
    }
    case "CORNER_LOT": {
      const parts: string[] = [];
      const rd = fmtYesNo(stats.rdIsCornerLot);
      const ai = fmtYesNo(stats.aiCornerLot);
      if (rd) parts.push(`county: ${rd}`);
      if (ai) parts.push(`AI: ${ai}`);
      if (stats.centroidInBldg === false) parts.push("parcel centroid outside building");
      return parts.length ? parts.join(", ") : null;
    }
    case "FRONT_BACK_FRONTAGE":
      return stats.rdFrontAndBackFrontage != null
        ? stats.rdFrontAndBackFrontage
          ? "front and back roads"
          : "no front/back roads"
        : null;
    case "FRONT_BACK_SETBACK": {
      const ftAny = Math.max(
        toNum(stats.setbackFt1) ?? 0,
        toNum(stats.setbackFt2) ?? 0,
        toNum(stats.setbackFt3) ?? 0,
        toNum(stats.setbackFt4) ?? 0,
      );
      const ft34 = Math.max(toNum(stats.setbackFt3) ?? 0, toNum(stats.setbackFt4) ?? 0);
      if (ftAny > 400) return `max setback ${fmtFeet(ftAny)}`;
      if (ftAny > 250) return `max setback ${fmtFeet(ftAny)}`;
      if (stats.rdFrontAndBackFrontage && ft34 > 0) return `front/back depth ${fmtFeet(ft34)}`;
      return stats.rdFrontAndBackFrontage ? "front/back frontage" : null;
    }
    case "DIST_TO_ROAD": {
      const ft = toNum(stats.distanceToNearestRoadwayFt);
      return ft != null ? `${fmtFeet(ft)} to nearest road` : null;
    }
    case "RAW_LAND_VS_STRUCTURE": {
      if (stats.aiLandType?.trim()) return stats.aiLandType.trim();
      const cnt = toNum(stats.buildingCnt);
      if (cnt != null) return cnt === 0 ? "no MSFT footprint" : `${cnt} building(s)`;
      return null;
    }
    case "AI_LOT_SHAPE":
      return stats.aiLotShape?.trim() ?? null;
    case "AI_PHYSICAL_CONSTRAINTS":
      return stats.aiPhysicalConstraints?.trim() ?? null;
    case "AI_SUBDIVISION":
      return stats.aiSubdivisionFeasibility?.trim() ?? null;
    case "LARGE_HOME_FILTER": {
      const v = toNum(stats.totalMarketValue);
      const sqft = toNum(stats.totalBldgAreaSqft);
      const parts: string[] = [];
      if (v != null && v > 0) parts.push(fmtCurrency(v));
      if (sqft != null && sqft > 0) parts.push(fmtSqft(sqft));
      return parts.length ? parts.join(", ") : null;
    }
    case "GENERAL_PLAN":
      return stats.generalPlan?.trim() ?? null;
    case "PARCEL_SIZE": {
      const ac = toNum(stats.acreage);
      return ac != null && ac > 0 ? `${ac.toFixed(2)} ac` : null;
    }
    default:
      return null;
  }
}

export function formatTopReason(reason: TopScoreReason, parcel?: ScoredParcel | null): string {
  const score = toNum(reason.score);
  if (score === 0) return "Neutral";

  let base = reason.summary?.trim() ?? "";
  if (!base) {
    const text = (reason.reason ?? "").trim();
    base = text || (reason.ruleName ?? reason.ruleCode);
  }

  return appendStat(base, reason.ruleCode, parcel);
}

function comparativeText(
  ruleCode: string,
  score: number,
  rules?: ScoreRule[],
): string | null {
  const rule = rules?.find((r) => r.ruleCode === ruleCode);
  if (!rule) return null;
  if (score > 0) return rule.reasonFavorable?.trim() || null;
  if (score < 0) return rule.reasonUnfavorable?.trim() || null;
  return null;
}

function appendStat(base: string, ruleCode: string, parcel?: ScoredParcel | null): string {
  if (!parcel?.stats) return base;
  const stat = reasonStatSuffix(ruleCode, parcel.stats);
  return stat ? `${base} (${stat})` : base;
}

/** Comparative reason + parcel stat for a scored rule row. */
export function formatScoreReason(
  ruleCode: string,
  score: number | null,
  parcel: ScoredParcel,
  rules?: ScoreRule[],
): string {
  const n = toNum(score);
  if (n == null || n === 0) return "Neutral";

  const base =
    comparativeText(ruleCode, n, rules) ??
    rules?.find((r) => r.ruleCode === ruleCode)?.ruleName ??
    ruleCode;

  return appendStat(base, ruleCode, parcel);
}
