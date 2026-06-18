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
        return (
          <button
            key={p.parcelId}
            type="button"
            className={`parcel-item${p.parcelId === selectedId ? " active" : ""}`}
            onClick={() => onSelect(p.parcelId)}
          >
            <div className="parcel-item-id">
              #{p.parcelId}
              <span className={`tag tag-tier-${tk}`}>{tierLabel(p.tier)}</span>
              {p.totalScore != null && (
                <span className="tag tag-score">Score {p.totalScore}</span>
              )}
            </div>
            <div className="parcel-item-address">{p.address || "No address"}</div>
            {acreage != null ? (
              <div className="parcel-item-meta">{acreage.toFixed(2)} ac</div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
