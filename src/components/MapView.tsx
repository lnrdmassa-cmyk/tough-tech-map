import { useEffect, useMemo, useRef, useState } from "react";
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

// Below this zoom every facility is a density bubble (lone ones show as "1").
// At/above it — including the zoom-9 fly-in when a point is clicked — each
// facility is drawn as its own type-coloured square.
const SQUARE_ZOOM = 8;

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
  onZoom,
}: {
  flyTo: FlyTarget;
  sizeKey: number;
  onBoundsChange?: (b: {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  }) => void;
  onZoom?: (zoom: number) => void;
}) {
  const map = useMap();
  // Whether the map first mounted inside a hidden (0×0) pane — true on mobile,
  // where it lives in the display:none List pane until the Map tab is tapped.
  const bornHidden = useRef<boolean | null>(null);
  const revealed = useRef(false);

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

  // Report the zoom so the markers can switch between density bubbles and
  // individual type-squares.
  useEffect(() => {
    if (!onZoom) return;
    const emit = () => onZoom(map.getZoom());
    emit();
    map.on("zoomend", emit);
    return () => {
      map.off("zoomend", emit);
    };
  }, [map, onZoom]);

  useEffect(() => {
    if (!flyTo) return;
    if (REDUCE) map.setView([flyTo.lat, flyTo.lng], 9);
    else map.flyTo([flyTo.lat, flyTo.lng], 9, { duration: 0.7 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTo?.nonce]);

  // Re-measure when the container is shown/resized (notably the mobile
  // List↔Map switch, where the map starts life in a display:none pane and
  // Leaflet therefore initialises at 0×0, leaving the tiles grey).
  useEffect(() => {
    if (bornHidden.current === null) bornHidden.current = map.getSize().x === 0;
    let n = 0;
    const id = setInterval(() => {
      map.invalidateSize({ animate: false });
      // The first time the map actually has a size, if it was born hidden,
      // snap it to a clean European view so tiles load correctly.
      if (!revealed.current && map.getSize().x > 0) {
        revealed.current = true;
        if (bornHidden.current) map.setView(MAP_CENTER, MAP_ZOOM, { animate: false });
      }
      if (++n >= 6) clearInterval(id);
    }, 120);
    return () => clearInterval(id);
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

  // Density bubbles when zoomed out; type-squares once zoomed in past
  // SQUARE_ZOOM. Driven by the live map zoom (see MapBridge.onZoom).
  const [zoomedIn, setZoomedIn] = useState(false);

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

  // Two configurations of the SAME cluster layer (so it stays viewport-culled
  // and fast). Keyed so Leaflet re-inits with the right options on switch:
  //  • zoomed out → singleMarkerMode: everything is a bubble, lone points "1".
  //  • zoomed in  → clustering disabled: every facility is its own square.
  const cluster = zoomedIn ? (
    <MarkerClusterGroup
      key="squares"
      iconCreateFunction={createClusterIcon}
      maxClusterRadius={46}
      showCoverageOnHover={false}
      spiderfyOnMaxZoom={false}
      disableClusteringAtZoom={SQUARE_ZOOM}
      chunkedLoading
    >
      {markers}
    </MarkerClusterGroup>
  ) : (
    <MarkerClusterGroup
      key="bubbles"
      iconCreateFunction={createClusterIcon}
      maxClusterRadius={46}
      showCoverageOnHover={false}
      singleMarkerMode
      chunkedLoading
    >
      {markers}
    </MarkerClusterGroup>
  );

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
        {cluster}
        <MapBridge
          flyTo={flyTo}
          sizeKey={sizeKey}
          onBoundsChange={onBoundsChange}
          onZoom={(z) => setZoomedIn(z >= SQUARE_ZOOM)}
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
        Community-sourced &amp; directionally accurate — verify access,
        capabilities &amp; equipment with each facility.{" "}
        <a href="/facilities.html" target="_blank" rel="noopener">
          Text directory ↗
        </a>
      </div>
    </section>
  );
}
