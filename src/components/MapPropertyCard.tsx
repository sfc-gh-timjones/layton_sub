import type { ScoredParcel } from "../types";
import { toNum } from "../types";
import {
  computeSubdivisionMath,
  lookupZoneRegulations,
  type ZoningRegulationsData,
} from "../zoningRegulations";

interface Props {
  parcel: ScoredParcel;
  regulations: ZoningRegulationsData | null;
}

function formatBool(value: boolean | null | undefined, yes = "Yes", no = "No"): string {
  if (value === true) return yes;
  if (value === false) return no;
  return "—";
}

function formatNumber(value: number | null | undefined): string {
  const n = toNum(value);
  if (n == null) return "—";
  return n.toLocaleString();
}

export function MapPropertyCard({ parcel, regulations }: Props) {
  const { stats } = parcel;
  const acreage = toNum(parcel.acreage ?? stats.acreage);
  const zoneRows = lookupZoneRegulations(regulations, stats.currentZone);
  const subdivision = computeSubdivisionMath(acreage, zoneRows);

  const rows: { label: string; value: string }[] = [
    { label: "Acreage", value: acreage != null ? `${acreage.toFixed(2)} ac` : "—" },
    {
      label: "Parcel size",
      value: subdivision ? `${formatNumber(subdivision.parcelSqft)} sq ft` : "—",
    },
    { label: "Building size", value: stats.buildingSqft != null ? `${formatNumber(stats.buildingSqft)} sq ft` : "—" },
    { label: "Year built", value: stats.builtYear != null ? String(stats.builtYear) : "—" },
    {
      label: "Owner",
      value: stats.ownerName?.trim() || "—",
    },
    {
      label: "Owner occupied",
      value: formatBool(stats.primaryResidence, "Owner-occupied", "Not owner-occupied"),
    },
    {
      label: "Current zoning",
      value: stats.currentZone?.trim() || "—",
    },
    {
      label: "Zoning description",
      value: stats.zoneDetailedDescription?.trim() || stats.zoneGeneralDescription?.trim() || "—",
    },
    {
      label: "General Plan",
      value: stats.generalPlan?.trim() || "—",
    },
  ];

  return (
    <div className="map-property-card">
      <div className="map-property-card-header">
        <h3>{parcel.address || "No address"}</h3>
        <p>
          Parcel #{parcel.parcelId}
          {parcel.totalScore != null ? ` · Score ${parcel.totalScore}` : ""}
        </p>
      </div>
      <dl className="map-property-card-grid">
        {rows.map((row) => (
          <div key={row.label} className="map-property-card-row">
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>

      <section className="map-property-subdivision">
        <h4>Subdivision math</h4>
        <dl className="map-property-card-grid">
          <div className="map-property-card-row">
            <dt>Min lot (zoning)</dt>
            <dd>{subdivision?.minLotLabel ?? "—"}</dd>
          </div>
          <div className="map-property-card-row map-property-card-row-emphasis">
            <dt>Lots that could fit</dt>
            <dd>
              {subdivision?.lotsPossible != null
                ? `${subdivision.lotsPossible} lot${subdivision.lotsPossible === 1 ? "" : "s"}`
                : "—"}
            </dd>
          </div>
        </dl>
        {subdivision?.minLotSqft != null && subdivision.lotsPossible != null ? (
          <p className="map-property-subdivision-note">
            {formatNumber(subdivision.parcelSqft)} sq ft ÷ {formatNumber(subdivision.minLotSqft)} sq ft
            {" = "}
            {subdivision.lotsPossible}
          </p>
        ) : null}
      </section>
    </div>
  );
}
