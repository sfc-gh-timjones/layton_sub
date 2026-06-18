import type { ScoredParcel, ScoreRule } from "../types";
import {
  formatScore,
  scoreTone,
  tierKey,
  tierLabel,
  toNum,
} from "../types";
import { formatScoreReason, formatTopReason, formatLandBuildingCoverage } from "../reasonStats";

interface Props {
  parcel: ScoredParcel;
  rules: ScoreRule[];
}

function fmtNum(n: unknown, digits = 1): string {
  const v = toNum(n);
  if (v == null) return "—";
  return v.toLocaleString(undefined, { maximumFractionDigits: digits });
}

const SCORE_KEY_TO_RULE: Record<string, string> = {
  houseAge: "HOUSE_AGE",
  houseSqft: "HOUSE_SQFT",
  primaryResidence: "PRIMARY_RESIDENCE",
  marketValue: "MARKET_VALUE",
  landValueRatio: "LAND_VALUE_RATIO",
  bldgFootprintSqft: "BLDG_FOOTPRINT_SQFT",
  bldgCoverageRatio: "BLDG_COVERAGE_RATIO",
  centroidInBldg: "CENTROID_IN_BLDG",
  centroidToEdge: "CENTROID_TO_EDGE",
  centroidToBldgCentroid: "CENTROID_TO_BLDG_CENTROID",
  flagLot: "FLAG_LOT",
  frontBackOffset: "FRONT_BACK_OFFSET",
  touchesRoad: "TOUCHES_ROAD",
  cornerLot: "CORNER_LOT",
  frontBackFrontage: "FRONT_BACK_FRONTAGE",
  frontBackSetback: "FRONT_BACK_SETBACK",
  distToRoad: "DIST_TO_ROAD",
  rawLandVsStructure: "RAW_LAND_VS_STRUCTURE",
  parcelSize: "PARCEL_SIZE",
  aiLotShape: "AI_LOT_SHAPE",
  aiPhysicalConstraints: "AI_PHYSICAL_CONSTRAINTS",
  aiSubdivision: "AI_SUBDIVISION",
  largeHomeFilter: "LARGE_HOME_FILTER",
  generalPlan: "GENERAL_PLAN",
  subdivisionMath: "SUBDIVISION_MATH",
};

export function ScoreDetail({ parcel, rules }: Props) {
  const tk = tierKey(parcel.tier);
  const ruleByCode = new Map(rules.map((r) => [r.ruleCode, r]));
  const topRuleCodes = new Set(parcel.topScoreReasons.map((r) => r.ruleCode));

  const otherNonZeroScores = Object.entries(parcel.scores)
    .map(([key, value]) => {
      const ruleCode = SCORE_KEY_TO_RULE[key];
      const rule = ruleCode ? ruleByCode.get(ruleCode) : undefined;
      return {
        key,
        ruleCode: ruleCode ?? key,
        ruleName: rule?.ruleName ?? key,
        score: toNum(value),
      };
    })
    .filter((row) => row.score != null && row.score !== 0)
    .filter((row) => !topRuleCodes.has(row.ruleCode))
    .sort((a, b) => Math.abs(b.score!) - Math.abs(a.score!));

  return (
    <div className="detail-panel">
      <div className={`tier-badge tier-badge-${tk}`}>{tierLabel(parcel.tier)}</div>
      <div className="total-score">
        Total score: <strong>{parcel.totalScore ?? "—"}</strong>
      </div>

      <section className="detail-section">
        <h3>Top influencing factors</h3>
        {parcel.topScoreReasons.length === 0 ? (
          <p>No non-zero score factors recorded.</p>
        ) : (
          <ul className="reason-list">
            {parcel.topScoreReasons.map((r) => (
              <li
                key={`${r.ruleCode}-${r.rank}`}
                className={`reason-item reason-${scoreTone(r.score)}`}
              >
                <span className="reason-text">{formatTopReason(r, parcel)}</span>
                <span className="reason-score">{formatScore(r.score)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="detail-section">
        <h3>Other non-zero scores</h3>
        {otherNonZeroScores.length === 0 ? (
          <p>No additional non-zero scores beyond the top factors.</p>
        ) : (
          <div className="score-grid">
            {otherNonZeroScores.map((row) => (
              <div
                key={row.ruleCode}
                className={`score-grid-row score-grid-row-rich score-${scoreTone(row.score)}`}
              >
                <span className="score-grid-label">{formatScoreReason(row.ruleCode, row.score, parcel, rules)}</span>
                <span className={`score-grid-value score-${scoreTone(row.score)}`}>
                  {formatScore(row.score)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="detail-section">
        <h3>Key inputs</h3>
        <dl className="metric-grid">
          <dt>Acreage</dt>
          <dd>{fmtNum(parcel.stats.acreage ?? parcel.acreage, 2)}</dd>
          <dt>Land covered by buildings</dt>
          <dd>{formatLandBuildingCoverage(parcel.stats.bldgCoverageRatio) ?? "—"}</dd>
          <dt>Building count</dt>
          <dd>{parcel.stats.buildingCnt ?? "—"}</dd>
          <dt>Setback 1 / 2 / 3 / 4</dt>
          <dd>
            {fmtNum(parcel.stats.setbackFt1, 1)} / {fmtNum(parcel.stats.setbackFt2, 1)} /{" "}
            {fmtNum(parcel.stats.setbackFt3, 1)} / {fmtNum(parcel.stats.setbackFt4, 1)}
          </dd>
        </dl>
      </section>
    </div>
  );
}
