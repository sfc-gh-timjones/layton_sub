import type { ScoredParcel } from "../types";
import { tierKey, tierLabel, toNum } from "../types";

interface Props {
  parcels: ScoredParcel[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function ParcelList({ parcels, selectedId, onSelect }: Props) {
  return (
    <div className="parcel-list">
      {parcels.map((p) => {
        const tk = tierKey(p.tier);
        const acreage = toNum(p.acreage);
        const generalPlan = p.stats.generalPlan?.trim();
        const currentZone = p.stats.currentZone?.trim();
        return (
          <button
            key={p.parcelId}
            type="button"
            className={`parcel-item${p.parcelId === selectedId ? " active" : ""}`}
            onClick={() => onSelect(p.parcelId)}
          >
            <div className="parcel-item-header">
              <div className="parcel-item-id">
                #{p.parcelId}
                <span className={`tag tag-tier-${tk}`}>{tierLabel(p.tier)}</span>
              </div>
              <div className="parcel-item-metrics">
                {p.totalScore != null ? (
                  <span className="parcel-item-score">Score {p.totalScore}</span>
                ) : null}
                {acreage != null ? (
                  <span className="parcel-item-acreage">{acreage.toFixed(2)} ac</span>
                ) : null}
              </div>
            </div>
            <div className="parcel-item-address">{p.address || "No address"}</div>
            <div className="parcel-item-zoning-row">
              <div className="parcel-item-plan">
                <span className="parcel-item-plan-label">General Plan</span>
                <span className="parcel-item-plan-value">{generalPlan || "—"}</span>
              </div>
              <div className="parcel-item-plan">
                <span className="parcel-item-plan-label">Current zoning</span>
                <span className="parcel-item-plan-value">{currentZone || "—"}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
