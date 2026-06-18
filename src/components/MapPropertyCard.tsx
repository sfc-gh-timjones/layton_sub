import type { ScoredParcel } from "../types";
import { toNum } from "../types";

interface Props {
  parcel: ScoredParcel;
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

export function MapPropertyCard({ parcel }: Props) {
  const { stats } = parcel;
  const acreage = toNum(parcel.acreage ?? stats.acreage);

  const rows: { label: string; value: string }[] = [
    { label: "Acreage", value: acreage != null ? `${acreage.toFixed(2)} ac` : "—" },
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
    </div>
  );
}
