export interface MapImageryLayer {
  url: string;
  attribution: string;
  maxNativeZoom: number;
  maxZoom: number;
  label: string;
}

const utahKey = import.meta.env.VITE_UTAH_DISCOVER_KEY as string | undefined;
const stadiaKey = import.meta.env.VITE_STADIA_API_KEY as string | undefined;

function stadiaUrl(): string {
  const base = "https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.jpg";
  if (!stadiaKey) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}api_key=${encodeURIComponent(stadiaKey)}`;
}

/** Best available imagery for Layton parcel review. */
export function getMapImageryLayer(): MapImageryLayer {
  if (utahKey) {
    return {
      label: "Utah HRO 2012 (12.5 cm)",
      url: `https://discover.agrc.utah.gov/tiles/v1/hro2012_rgb/{z}/{x}/{y}?apikey=${encodeURIComponent(utahKey)}`,
      attribution:
        '&copy; <a href="https://gis.utah.gov/products/discover/">Utah AGRC Discover</a>',
      maxNativeZoom: 21,
      maxZoom: 21,
    };
  }

  return {
    label: "Stadia Alidade Satellite",
    url: stadiaUrl(),
    attribution:
      '© CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | © <a href="https://stadiamaps.com/">Stadia Maps</a>',
    maxNativeZoom: 20,
    maxZoom: 20,
  };
}
