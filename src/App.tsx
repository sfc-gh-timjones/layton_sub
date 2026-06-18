import { useEffect, useMemo, useState } from "react";
import { formatTopReason } from "./reasonStats";
import type { ScoredParcel, ScoredTierData, TierFilter } from "./types";
import { MapPropertyCard } from "./components/MapPropertyCard";
import { MapZoningRegulationsCard } from "./components/MapZoningRegulationsCard";
import { MapView } from "./components/MapView";
import { ParcelFilters } from "./components/ParcelFilters";
import { ParcelList } from "./components/ParcelList";
import { ScoreDetail } from "./components/ScoreDetail";
import {
  activeFilterCount,
  DEFAULT_PARCEL_FILTERS,
  matchesParcelFilters,
  type ParcelFilterState,
  type SidebarPanel,
} from "./filters";
import "./App.css";
import type { ZoningRegulationsData } from "./zoningRegulations";

export default function App() {
  const [data, setData] = useState<ScoredTierData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [sidebarPanel, setSidebarPanel] = useState<SidebarPanel>("parcels");
  const [parcelFilters, setParcelFilters] = useState<ParcelFilterState>(DEFAULT_PARCEL_FILTERS);
  const [showBuildingOverlays, setShowBuildingOverlays] = useState(true);
  const [propertyCardOpen, setPropertyCardOpen] = useState(true);
  const [showZoningRegulations, setShowZoningRegulations] = useState(true);
  const [zoningRegulations, setZoningRegulations] = useState<ZoningRegulationsData | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/tiers.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load data (${r.status})`);
        return r.json();
      })
      .then((json: ScoredTierData) => {
        setData(json);
        if (json.parcels.length > 0) setSelectedId(json.parcels[0].parcelId);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));

    fetch(`${import.meta.env.BASE_URL}data/zoning_regulations.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json: ZoningRegulationsData | null) => setZoningRegulations(json))
      .catch(() => setZoningRegulations(null));
  }, []);

  const filterMatched = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.parcels.filter((p) => {
      if (!matchesParcelFilters(p, parcelFilters)) return false;
      if (!q) return true;
      return (
        String(p.parcelId).includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.topScoreReasons.some((r) =>
          formatTopReason(r, p).toLowerCase().includes(q),
        )
      );
    });
  }, [data, query, parcelFilters]);

  const counts = useMemo(() => {
    const c = { "1": 0, "2": 0, "3": 0, "4": 0 };
    filterMatched.forEach((p) => {
      if (p.tier != null && p.tier >= 1 && p.tier <= 4) {
        c[String(p.tier) as keyof typeof c] += 1;
      }
    });
    return c;
  }, [filterMatched]);

  const filtered = useMemo(() => {
    if (tierFilter === "all") return filterMatched;
    return filterMatched.filter((p) => String(p.tier) === tierFilter);
  }, [filterMatched, tierFilter]);

  const selectedIndex = filtered.findIndex((p) => p.parcelId === selectedId);
  const selected: ScoredParcel | null =
    selectedIndex >= 0 ? filtered[selectedIndex] : filtered[0] ?? null;

  useEffect(() => {
    if (selected && selected.parcelId !== selectedId) {
      setSelectedId(selected.parcelId);
    }
  }, [selected, selectedId]);

  useEffect(() => {
    setPropertyCardOpen(true);
  }, [selected?.parcelId]);

  const goPrev = () => {
    if (selectedIndex > 0) setSelectedId(filtered[selectedIndex - 1].parcelId);
  };

  const goNext = () => {
    if (selectedIndex >= 0 && selectedIndex < filtered.length - 1) {
      setSelectedId(filtered[selectedIndex + 1].parcelId);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div>
          <h1>Loading score data…</h1>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="error">
        <div>
          <h1>Could not load score data</h1>
          <p>{error ?? "Unknown error"}</p>
          <p>
            Run <code>npm run export-data</code> from the layton-tier-scorer-viewer folder first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>Layton Tier Scorer</h1>
          <p>Score-based tiers from LAYTON_TIER_SCORED (v2)</p>
          <input
            className="search"
            placeholder="Search parcel ID, address, reason…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="tier-tabs">
            <button
              type="button"
              className={tierFilter === "all" ? "active" : ""}
              onClick={() => setTierFilter("all")}
            >
              All ({filterMatched.length})
            </button>
            {(["1", "2", "3", "4"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`tier-tab-${t}${tierFilter === t ? " active" : ""}`}
                onClick={() => setTierFilter(t)}
              >
                Tier {t} ({counts[t]})
              </button>
            ))}
            <button
              type="button"
              className={`zoning-regs-toggle${showZoningRegulations ? " active" : ""}`}
              onClick={() => setShowZoningRegulations((v) => !v)}
            >
              {showZoningRegulations ? "Hide zoning regs" : "See zoning regs"}
            </button>
          </div>
          <div className="stats">
            <span className="stat">{filtered.length} shown</span>
            {activeFilterCount(parcelFilters) > 0 ? (
              <span className="stat stat-filtered">{activeFilterCount(parcelFilters)} filters on</span>
            ) : null}
          </div>
          <div className="sidebar-tabs">
            <button
              type="button"
              className={sidebarPanel === "parcels" ? "active" : ""}
              onClick={() => setSidebarPanel("parcels")}
            >
              Parcels ({filtered.length})
            </button>
            <button
              type="button"
              className={sidebarPanel === "filters" ? "active" : ""}
              onClick={() => setSidebarPanel("filters")}
            >
              Filters
              {activeFilterCount(parcelFilters) > 0
                ? ` (${activeFilterCount(parcelFilters)})`
                : ""}
            </button>
          </div>
        </div>
        {sidebarPanel === "filters" ? (
          <ParcelFilters
            parcels={data.parcels}
            filters={parcelFilters}
            onChange={setParcelFilters}
          />
        ) : (
          <ParcelList
            parcels={filtered}
            selectedId={selected?.parcelId ?? null}
            onSelect={setSelectedId}
          />
        )}
      </aside>
      <main className="main-panel">
        {selected ? (
          <>
            <div className="map-column">
              <MapView
                parcel={selected}
                showBuildingOverlays={showBuildingOverlays}
                onToggleBuildingOverlays={() => setShowBuildingOverlays((v) => !v)}
                onParcelClick={() => setPropertyCardOpen(true)}
              />
              <div className="map-nav-overlay">
                <div className="nav-row">
                  <button type="button" onClick={goPrev} disabled={selectedIndex <= 0}>
                    ← Prev
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={selectedIndex < 0 || selectedIndex >= filtered.length - 1}
                  >
                    Next →
                  </button>
                </div>
              </div>
              {propertyCardOpen ? (
                <MapPropertyCard parcel={selected} regulations={zoningRegulations} />
              ) : null}
              {showZoningRegulations ? (
                <MapZoningRegulationsCard parcel={selected} regulations={zoningRegulations} />
              ) : null}
            </div>
            <div className="detail-column">
              <ScoreDetail parcel={selected} rules={data.rules} />
            </div>
          </>
        ) : (
          <div className="loading">No parcels match your filters.</div>
        )}
      </main>
    </div>
  );
}
