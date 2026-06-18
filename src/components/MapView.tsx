import { useEffect, useMemo } from "react";
import { GeoJSON, MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import type { Geometry } from "geojson";
import type { ScoredParcel } from "../types";
import { TIER_COLORS, tierKey } from "../types";
import { getMapImageryLayer } from "../mapImagery";

const BUILDING_FILL = "#f472b6";
const BUILDING_STROKE = "#db2777";

function FitBounds({ bounds, maxZoom }: { bounds: LatLngBoundsExpression; maxZoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom });
  }, [map, bounds, maxZoom]);
  return null;
}

interface Props {
  parcel: ScoredParcel;
  showBuildingOverlays: boolean;
  onToggleBuildingOverlays: () => void;
}

function isAreaGeometry(geom: Geometry | undefined): geom is Geometry {
  if (!geom || geom.type === "GeometryCollection") return false;
  return geom.type === "Polygon" || geom.type === "MultiPolygon";
}

function isLineGeometry(geom: Geometry | undefined): geom is Geometry {
  if (!geom || geom.type === "GeometryCollection") return false;
  return geom.type === "LineString" || geom.type === "MultiLineString";
}

function lineCoords(geom: Geometry): [number, number][] {
  if (geom.type === "LineString") {
    return geom.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]);
  }
  if (geom.type === "MultiLineString") {
    return geom.coordinates.flatMap((line) => line.map(([lon, lat]) => [lat, lon] as [number, number]));
  }
  return [];
}

function lineMidpoint(geom: Geometry): LatLngExpression | null {
  const coords = lineCoords(geom);
  if (coords.length === 0) return null;
  const idx = Math.floor(coords.length / 2);
  return coords[idx];
}

function formatFeet(value: number | null | undefined): string | null {
  if (value == null || !Number.isFinite(value)) return null;
  return `${Math.round(value)} ft`;
}

function distanceLabelIcon(label: string) {
  return L.divIcon({
    className: "setback-distance-label",
    html: `<span>${label}</span>`,
    iconSize: [96, 22],
    iconAnchor: [48, 11],
  });
}

function boundsFromGeometries(
  geoms: Geometry[],
  fallback: [number, number],
): LatLngBoundsExpression {
  const coords: [number, number][] = [];

  const walk = (g: Geometry) => {
    if (g.type === "Polygon") {
      g.coordinates[0].forEach(([lon, lat]) => coords.push([lat, lon]));
    } else if (g.type === "MultiPolygon") {
      g.coordinates.forEach((poly) => poly[0].forEach(([lon, lat]) => coords.push([lat, lon])));
    } else if (g.type === "LineString") {
      g.coordinates.forEach(([lon, lat]) => coords.push([lat, lon]));
    } else if (g.type === "MultiLineString") {
      g.coordinates.forEach((line) => line.forEach(([lon, lat]) => coords.push([lat, lon])));
    }
  };

  geoms.forEach(walk);
  if (coords.length === 0) {
    const [lat, lon] = fallback;
    return [
      [lat - 0.001, lon - 0.001],
      [lat + 0.001, lon + 0.001],
    ];
  }

  const lats = coords.map((c) => c[0]);
  const lons = coords.map((c) => c[1]);
  return [
    [Math.min(...lats), Math.min(...lons)],
    [Math.max(...lats), Math.max(...lons)],
  ];
}

function lineFeature(geometry: Geometry, kind: string, parcelId: number) {
  return {
    type: "Feature" as const,
    properties: { parcelId, kind },
    geometry,
  };
}

type SetbackSpec = {
  kind: string;
  geometry?: Geometry;
  feet: number | null | undefined;
  labelKey: string;
  legendClass: string;
  legendLabel: string;
  color: string;
  dashArray?: string;
};

export function MapView({ parcel, showBuildingOverlays, onToggleBuildingOverlays }: Props) {
  const imagery = getMapImageryLayer();
  const color = TIER_COLORS[tierKey(parcel.tier)];

  const parcelFeature = useMemo(
    () => ({
      type: "Feature" as const,
      properties: { parcelId: parcel.parcelId },
      geometry: parcel.parcelGeometry,
    }),
    [parcel],
  );

  const buildingFeature = useMemo(() => {
    if (!isAreaGeometry(parcel.buildingGeometry)) return null;
    return {
      type: "Feature" as const,
      properties: { parcelId: parcel.parcelId, kind: "building" },
      geometry: parcel.buildingGeometry,
    };
  }, [parcel]);

  const setbackSpecs = useMemo<SetbackSpec[]>(() => {
    const { stats } = parcel;
    return [
      {
        kind: "setback-ft1",
        geometry: parcel.setbackFt1Geometry,
        feet: stats.setbackFt1,
        labelKey: "ft1",
        legendClass: "legend-setback-ft1",
        legendLabel: "Setback 1",
        color: "#ea580c",
      },
      {
        kind: "setback-ft2",
        geometry: parcel.setbackFt2Geometry,
        feet: stats.setbackFt2,
        labelKey: "ft2",
        legendClass: "legend-setback-ft2",
        legendLabel: "Setback 2",
        color: "#ca8a04",
        dashArray: "8 6",
      },
      {
        kind: "setback-ft3",
        geometry: parcel.setbackFt3Geometry,
        feet: stats.setbackFt3,
        labelKey: "ft3",
        legendClass: "legend-setback-ft3",
        legendLabel: "Setback 3",
        color: "#0891b2",
        dashArray: "4 5",
      },
      {
        kind: "setback-ft4",
        geometry: parcel.setbackFt4Geometry,
        feet: stats.setbackFt4,
        labelKey: "ft4",
        legendClass: "legend-setback-ft4",
        legendLabel: "Setback 4",
        color: "#0d9488",
        dashArray: "2 6",
      },
    ];
  }, [parcel]);

  const setbackFeatures = useMemo(
    () =>
      setbackSpecs
        .filter((spec) => isLineGeometry(spec.geometry))
        .map((spec) => lineFeature(spec.geometry!, spec.kind, parcel.parcelId)),
    [parcel.parcelId, setbackSpecs],
  );

  const setbackLabels = useMemo(() => {
    const labels: { key: string; position: LatLngExpression; text: string }[] = [];
    setbackSpecs.forEach((spec) => {
      const feet = formatFeet(spec.feet);
      if (!isLineGeometry(spec.geometry) || !feet) return;
      const position = lineMidpoint(spec.geometry);
      if (position) {
        labels.push({
          key: spec.labelKey,
          position,
          text: `${spec.legendLabel}: ${feet}`,
        });
      }
    });
    return labels;
  }, [setbackSpecs]);

  const cornerRoadFeatures = useMemo(
    () =>
      (parcel.cornerRoadGeometries ?? [])
        .filter(isLineGeometry)
        .map((geometry, i) => lineFeature(geometry, `corner-road-${i + 1}`, parcel.parcelId)),
    [parcel],
  );

  const frontBackRoadFeatures = useMemo(
    () =>
      (parcel.frontBackRoadGeometries ?? [])
        .filter(isLineGeometry)
        .map((geometry, i) => lineFeature(geometry, `front-back-road-${i + 1}`, parcel.parcelId)),
    [parcel],
  );

  const bounds = useMemo(() => {
    const geoms: Geometry[] = [parcel.parcelGeometry];
    if (showBuildingOverlays) {
      if (isAreaGeometry(parcel.buildingGeometry)) geoms.push(parcel.buildingGeometry);
      setbackSpecs.forEach((spec) => {
        if (isLineGeometry(spec.geometry)) geoms.push(spec.geometry);
      });
    }
    (parcel.cornerRoadGeometries ?? []).filter(isLineGeometry).forEach((g) => geoms.push(g));
    (parcel.frontBackRoadGeometries ?? []).filter(isLineGeometry).forEach((g) => geoms.push(g));
    return boundsFromGeometries(geoms, [parcel.lat, parcel.lon]);
  }, [parcel, setbackSpecs, showBuildingOverlays]);

  const hasBuildingOverlays = Boolean(buildingFeature || setbackFeatures.length > 0);
  const hasRoadOverlays = cornerRoadFeatures.length > 0 || frontBackRoadFeatures.length > 0;
  const hasLegend = hasBuildingOverlays || hasRoadOverlays;

  const visibleSetbackSpecs = setbackSpecs.filter((spec) => isLineGeometry(spec.geometry));

  return (
    <div className="map-wrap">
      {hasLegend ? (
        <div className="map-legend-stack">
          <div className="map-legend">
            {showBuildingOverlays && buildingFeature ? (
              <span className="legend-item legend-building">Building</span>
            ) : null}
            {showBuildingOverlays
              ? visibleSetbackSpecs.map((spec) => (
                  <span key={spec.kind} className={`legend-item ${spec.legendClass}`}>
                    {spec.legendLabel}
                  </span>
                ))
              : null}
            {cornerRoadFeatures.length > 0 ? (
              <span className="legend-item legend-corner-road">Corner roads</span>
            ) : null}
            {frontBackRoadFeatures.length > 0 ? (
              <span className="legend-item legend-front-back-road">Front/back roads</span>
            ) : null}
          </div>
          {hasBuildingOverlays ? (
            <button
              type="button"
              className={`map-overlay-toggle${showBuildingOverlays ? "" : " off"}`}
              onClick={onToggleBuildingOverlays}
            >
              {showBuildingOverlays
                ? "Toggle: Hide building & setbacks"
                : "Toggle: Show building & setbacks"}
            </button>
          ) : null}
        </div>
      ) : null}
      <MapContainer
        center={[parcel.lat, parcel.lon]}
        zoom={18}
        minZoom={14}
        maxZoom={imagery.maxZoom}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution={imagery.attribution}
          url={imagery.url}
          maxNativeZoom={imagery.maxNativeZoom}
          maxZoom={imagery.maxZoom}
          detectRetina={imagery.detectRetina ?? false}
        />
        <FitBounds bounds={bounds} maxZoom={imagery.maxNativeZoom} />
        <GeoJSON
          key={`parcel-${parcel.parcelId}`}
          data={parcelFeature}
          style={{
            color,
            weight: 3,
            fillColor: color,
            fillOpacity: 0.25,
          }}
        />
        {showBuildingOverlays && buildingFeature ? (
          <GeoJSON
            key={`building-${parcel.parcelId}`}
            data={buildingFeature}
            style={{
              color: BUILDING_STROKE,
              weight: 3,
              fillColor: BUILDING_FILL,
              fillOpacity: 0.82,
            }}
          />
        ) : null}
        {cornerRoadFeatures.map((feature, i) => (
          <GeoJSON
            key={`corner-road-${parcel.parcelId}-${i}`}
            data={feature}
            style={{
              color: "#7c3aed",
              weight: 5,
              opacity: 0.9,
            }}
          />
        ))}
        {frontBackRoadFeatures.map((feature, i) => (
          <GeoJSON
            key={`front-back-road-${parcel.parcelId}-${i}`}
            data={feature}
            style={{
              color: "#0284c7",
              weight: 5,
              opacity: 0.9,
            }}
          />
        ))}
        {showBuildingOverlays
          ? setbackFeatures.map((feature) => {
              const spec = setbackSpecs.find((s) => s.kind === feature.properties.kind);
              return (
                <GeoJSON
                  key={`${feature.properties.kind}-${parcel.parcelId}`}
                  data={feature}
                  style={{
                    color: spec?.color ?? "#ea580c",
                    weight: 5,
                    opacity: 0.95,
                    dashArray: spec?.dashArray,
                  }}
                />
              );
            })
          : null}
        {showBuildingOverlays
          ? setbackLabels.map((label) => (
              <Marker
                key={`${label.key}-${parcel.parcelId}`}
                position={label.position}
                icon={distanceLabelIcon(label.text)}
                interactive={false}
              />
            ))
          : null}
      </MapContainer>
    </div>
  );
}
