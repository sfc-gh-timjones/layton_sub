import type { ScoredParcel } from "../types";
import {
  groupRegulations,
  LAYTON_MUNICIPAL_CODE_URL,
  lookupZoneRegulations,
  normalizeRegulationZone,
  type ZoningRegulationsData,
} from "../zoningRegulations";

interface Props {
  parcel: ScoredParcel;
  regulations: ZoningRegulationsData | null;
}

export function MapZoningRegulationsCard({ parcel, regulations }: Props) {
  const zone = parcel.stats.currentZone?.trim() || null;
  const zoneKey = normalizeRegulationZone(zone);
  const rows = lookupZoneRegulations(regulations, zone);
  const groups = groupRegulations(rows);

  return (
    <div className="map-zoning-card">
      <div className="map-zoning-card-header">
        <h3>Zoning regulations</h3>
        <p className="map-zoning-official">
          Official source:{" "}
          <a href={LAYTON_MUNICIPAL_CODE_URL} target="_blank" rel="noopener noreferrer">
            Layton Municipal Code 19.05
          </a>
        </p>
        <p>
          {zone ? (
            <>
              Zone <strong>{zone}</strong>
              {zoneKey && zoneKey !== zone ? ` · Table lookup: ${zoneKey}` : ""}
            </>
          ) : (
            "No current zoning assigned"
          )}
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="map-zoning-empty">
          No municipal code table rows loaded for this zone in our export set.
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.category} className="map-zoning-section">
            <h4>{group.category}</h4>
            <dl className="map-zoning-grid">
              {group.items.map((item) => (
                <div key={`${group.category}-${item.regulation}`} className="map-zoning-row">
                  <dt>{item.regulation}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))
      )}

      {regulations?.sourceUpdated ? (
        <p className="map-zoning-source">
          Layton MC 19.05 Tables 5-1/5-2 · updated {regulations.sourceUpdated}
        </p>
      ) : null}
    </div>
  );
}
