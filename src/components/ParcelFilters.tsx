import {
  countParcelsMatchingFilter,
  DEFAULT_PARCEL_FILTERS,
  FILTER_OPTIONS,
  type ParcelFilterState,
} from "../filters";
import type { ScoredParcel } from "../types";

interface Props {
  parcels: ScoredParcel[];
  filters: ParcelFilterState;
  onChange: (filters: ParcelFilterState) => void;
}

export function ParcelFilters({ parcels, filters, onChange }: Props) {
  const toggle = (key: keyof ParcelFilterState) => {
    onChange({ ...filters, [key]: !filters[key] });
  };

  const clearAll = () => onChange({ ...DEFAULT_PARCEL_FILTERS });

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="filter-panel">
      <div className="filter-panel-header">
        <h2>Parcel filters</h2>
        <p>Combine filters to narrow the parcel list. Tier tabs and search still apply.</p>
        {activeCount > 0 ? (
          <button type="button" className="filter-clear" onClick={clearAll}>
            Clear all ({activeCount})
          </button>
        ) : null}
      </div>
      <div className="filter-options">
        {FILTER_OPTIONS.map((opt) => {
          const count = countParcelsMatchingFilter(parcels, opt.key);
          const checked = filters[opt.key];
          return (
            <label key={opt.key} className={`filter-option${checked ? " active" : ""}`}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(opt.key)}
              />
              <span className="filter-option-copy">
                <span className="filter-option-label">
                  {opt.label}
                  <span className="filter-option-count">{count}</span>
                </span>
                <span className="filter-option-desc">{opt.description}</span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
