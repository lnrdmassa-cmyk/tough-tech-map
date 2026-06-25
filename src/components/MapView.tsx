import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import type { Facility } from "../types";
import {
  TYPE_COLORS,
  TYPES,
  CARTO_TILES,
  CARTO_ATTRIBUTION,
  MAP_CENTER,
  MAP_ZOOM,
} from "../lib/vocab";

const REDUCE =
  typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

export type FlyTarget = { lat: number; lng: number; nonce: number } | null;

/** Small square divIcon coloured by resource type, with a thin white border. */
function markerIcon(type: string, fid: string): L.DivIcon {
  const color = TYPE_COLORS[type] ?? "#101a24";
  return L.divIcon({
    className: "tt-marker",
    html: `<i data-fid="${fid}" style="background:${color}"></i>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function createClusterIcon(cluster: { getChildCount: () => number }): L.DivIcon {
  return L.divIcon({
    className: "tt-cluster",
    html: `<b>${cluster.getChildCount()}</b>`,
    iconSize: [40, 40],
  });
}

/** Lives inside MapContainer so it can drive the Leaflet map imperatively. */
function MapBridge({ flyTo, sizeKey }: { flyTo: FlyTarget; sizeKey: number }) {
  const map = useMap();

  useEffect(() => {
    if (!flyTo) return;
    if (REDUCE) map.setView([flyTo.lat, flyTo.lng], 9);
    else map.flyTo([flyTo.lat, flyTo.lng], 9, { duration: 0.7 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTo?.nonce]);

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 260);
    return () => clearTimeout(t);
  }, [sizeKey, map]);

  useEffect(() => {
    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);
    const t = setTimeout(() => map.invalidateSize(), 200);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t);
    };
  }, [map]);

  return null;
}

type Props = {
  facilities: Facility[];
  loading: boolean;
  hoveredId: string | null;
  flyTo: FlyTarget;
  sizeKey: number;
  onSelect: (f: Facility) => void;
};

export default function MapView({
  facilities,
  loading,
  hoveredId,
  flyTo,
  sizeKey,
  onSelect,
}: Props) {
  // Keep onSelect out of the markers memo so hover/state changes never rebuild
  // the cluster layer.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const markers = useMemo(
    () =>
      facilities.map((f) => (
        <Marker
          key={f.id}
          position={[f.lat, f.lng]}
          icon={markerIcon(f.type, f.id)}
          eventHandlers={{ click: () => onSelectRef.current(f) }}
        />
      )),
    [facilities],
  );

  // Highlight a marker when its card is hovered — done via the DOM so the
  // cluster layer is never re-created.
  useEffect(() => {
    document
      .querySelectorAll(".tt-marker i.hot")
      .forEach((e) => e.classList.remove("hot"));
    if (hoveredId) {
      const el = document.querySelector(
        `.tt-marker i[data-fid="${hoveredId}"]`,
      );
      if (el) el.classList.add("hot");
    }
  }, [hoveredId, facilities]);

  return (
    <section className="map-wrap">
      {loading && <div className="loading-bar" />}
      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        minZoom={3}
        scrollWheelZoom
        className="ttm-map"
      >
        <TileLayer
          url={CARTO_TILES}
          subdomains="abcd"
          maxZoom={19}
          attribution={CARTO_ATTRIBUTION}
        />
        <MarkerClusterGroup
          iconCreateFunction={createClusterIcon}
          maxClusterRadius={46}
          showCoverageOnHover={false}
          chunkedLoading
        >
          {markers}
        </MarkerClusterGroup>
        <MapBridge flyTo={flyTo} sizeKey={sizeKey} />
      </MapContainer>

      <div className="legend">
        <div className="lh">Resource type</div>
        <ul>
          {TYPES.map((t) => (
            <li key={t}>
              <span className="sq" style={{ background: TYPE_COLORS[t] }} />
              {t}
            </li>
          ))}
        </ul>
      </div>

      <div className="data-note">
        Community-maintained &amp; directionally accurate — verify access,
        capabilities &amp; equipment with each facility.{" "}
        <a href="/facilities.html" target="_blank" rel="noopener">
          Text directory ↗
        </a>
      </div>
    </section>
  );
}
