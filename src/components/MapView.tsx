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

// Lock the map to the European data extent (Azores in the west, Andøya in the
// north) so it can't be panned or zoomed out to the whole world.
const EUROPE_BOUNDS: [[number, number], [number, number]] = [
  [34, -28],
  [72, 34],
];

// Beyond this zoom, every facility is drawn as its own square — no clustering.
// Below it, dense areas group into a numbered density bubble while isolated
// facilities already show as their individual type-square.
const DECLUSTER_ZOOM = 9;

/** Small square divIcon coloured by resource type. */
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
function MapBridge({
  flyTo,
  sizeKey,
  onBoundsChange,
}: {
  flyTo: FlyTarget;
  sizeKey: number;
  onBoundsChange?: (b: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }) => void;
}) {
  const map = useMap();

  // Report the visible map bounds up so the list stays in sync, live.
  useEffect(() => {
    if (!onBoundsChange) return;
    const emit = () => {
      const b = map.getBounds();
      onBoundsChange({
        minLat: b.getSouth(),
        maxLat: b.getNorth(),
        minLng: b.getWest(),
        maxLng: b.getEast(),
      });
    };
    emit();
    map.on("moveend", emit);
    return () => {
      map.off("moveend", emit);
    };
  }, [map, onBoundsChange]);

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
  onBoundsChange?: (b: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }) => void;
};

export default function MapView({
  facilities,
  loading,
  hoveredId,
  flyTo,
  sizeKey,
  onSelect,
  onBoundsChange,
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
        minZoom={4}
        maxBounds={EUROPE_BOUNDS}
        maxBoundsViscosity={1}
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
          spiderfyOnMaxZoom={false}
          disableClusteringAtZoom={DECLUSTER_ZOOM}
          chunkedLoading
        >
          {markers}
        </MarkerClusterGroup>
        <MapBridge
          flyTo={flyTo}
          sizeKey={sizeKey}
          onBoundsChange={onBoundsChange}
        />
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
        Built &amp; maintained by Leonardo Massa · directionally accurate —
        verify access, capabilities &amp; equipment with each facility.{" "}
        <a href="/facilities.html" target="_blank" rel="noopener">
          Text directory ↗
        </a>
      </div>
    </section>
  );
}
