import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Masthead from "./components/Masthead";
import FilterRail from "./components/FilterRail";
import MapView, { type FlyTarget } from "./components/MapView";
import ResultCard from "./components/ResultCard";
import DetailDrawer from "./components/DetailDrawer";
import AddFacilityModal from "./components/AddFacilityModal";
import RequestUpdatesModal from "./components/RequestUpdatesModal";
import Toast, { type ToastMsg } from "./components/Toast";
import { useFacilities } from "./hooks/useFacilities";
import { applyFilters } from "./lib/filter";
import { EMPTY_FILTERS } from "./types";
import type { Facility, FilterKey, Filters, NewFacility } from "./types";
import { submitFacility, submitEdit } from "./lib/supabase";

type Bounds = { minLat: number; maxLat: number; minLng: number; maxLng: number };

export default function App() {
  const { facilities, loading, demoMode } = useFacilities();

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Facility | null>(null);
  const [flyTo, setFlyTo] = useState<FlyTarget>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editFacility, setEditFacility] = useState<Facility | null>(null);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<ToastMsg>(null);
  const [sizeKey, setSizeKey] = useState(0);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [bounds, setBounds] = useState<Bounds | null>(null);

  const filtered = useMemo(
    () => applyFilters(facilities, filters),
    [facilities, filters],
  );
  // The list shows only facilities inside the current map viewport, so the
  // list and map stay in sync live as you pan and zoom.
  const visible = useMemo(() => {
    if (!bounds) return filtered;
    // Ignore degenerate bounds (e.g. the map hidden on mobile list view) and
    // just show the full filtered set.
    if (
      bounds.maxLat - bounds.minLat < 0.01 ||
      bounds.maxLng - bounds.minLng < 0.01
    )
      return filtered;
    return filtered.filter(
      (f) =>
        f.lat >= bounds.minLat &&
        f.lat <= bounds.maxLat &&
        f.lng >= bounds.minLng &&
        f.lng <= bounds.maxLng,
    );
  }, [filtered, bounds]);
  const countries = useMemo(
    () => new Set(filtered.map((f) => f.cc)).size,
    [filtered],
  );
  const activeCount = useMemo(
    () =>
      filters.cc.length +
      filters.type.length +
      filters.access.length +
      filters.sector.length,
    [filters],
  );

  const select = useCallback((f: Facility) => {
    setSelected(f);
    setFlyTo({ lat: f.lat, lng: f.lng, nonce: Date.now() });
  }, []);

  const toggle = useCallback((key: FilterKey, val: string) => {
    setFilters((p) => {
      const cur = p[key];
      const next = cur.includes(val)
        ? cur.filter((v) => v !== val)
        : [...cur, val];
      return { ...p, [key]: next };
    });
  }, []);

  const search = useCallback((q: string) => {
    setFilters((p) => ({ ...p, q }));
  }, []);

  const reset = useCallback(() => setFilters(EMPTY_FILTERS), []);

  // Mobile: switch between the list and the map. When the map becomes visible
  // again, bump sizeKey so Leaflet re-measures (otherwise tiles render grey).
  const switchMobileView = useCallback((v: "list" | "map") => {
    setMobileView(v);
    if (v === "map") setSizeKey((k) => k + 1);
  }, []);

  // Deep-linking: open a facility from ?f= on first load, and keep the URL in
  // sync with the open facility so any view can be shared or bookmarked.
  const deepLinkApplied = useRef(false);
  useEffect(() => {
    if (deepLinkApplied.current || facilities.length === 0) return;
    deepLinkApplied.current = true;
    const id = new URLSearchParams(window.location.search).get("f");
    if (id) {
      const f = facilities.find((x) => x.id === id);
      if (f) select(f);
    }
  }, [facilities, select]);
  useEffect(() => {
    const url = selected
      ? `${window.location.pathname}?f=${encodeURIComponent(selected.id)}`
      : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [selected]);

  const toggleFilters = useCallback(() => {
    setFiltersOpen((o) => !o);
    // layout height changes → let the map recompute its size
    setSizeKey((k) => k + 1);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelected(null);
        setModalOpen(false);
        setFiltersOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSubmit = useCallback(
    async (rec: NewFacility) => {
      if (demoMode) {
        setModalOpen(false);
        setToast({
          msg: "Submitted for review — it stays hidden until approved.",
          kind: "ok",
        });
        return;
      }
      try {
        setSubmitting(true);
        await submitFacility(rec);
        setModalOpen(false);
        setToast({
          msg: "Submitted for review — it stays hidden until approved.",
          kind: "ok",
        });
      } catch (e) {
        setToast({
          msg:
            "Could not submit: " +
            (e instanceof Error ? e.message : "unknown error"),
          kind: "err",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [demoMode],
  );

  const handleEditSubmit = useCallback(
    async (message: string, email: string) => {
      const target = editFacility;
      if (!target) return;
      if (demoMode) {
        setEditFacility(null);
        setToast({ msg: "Thanks — sent for review.", kind: "ok" });
        return;
      }
      try {
        setEditing(true);
        await submitEdit(target.id, message, email);
        setEditFacility(null);
        setToast({
          msg: "Thanks — your update was sent for review.",
          kind: "ok",
        });
      } catch (e) {
        setToast({
          msg:
            "Could not send: " +
            (e instanceof Error ? e.message : "unknown error"),
          kind: "err",
        });
      } finally {
        setEditing(false);
      }
    },
    [editFacility, demoMode],
  );

  return (
    <div className="app">
      <Masthead
        shown={visible.length}
        total={facilities.length}
        countries={countries}
        demoMode={demoMode}
        q={filters.q}
        filtersOpen={filtersOpen}
        activeCount={activeCount}
        onSearch={search}
        onToggleFilters={toggleFilters}
        onAdd={() => setModalOpen(true)}
        facilities={facilities}
        filters={filters}
        onToggle={toggle}
      />

      <FilterRail
        facilities={facilities}
        filters={filters}
        open={filtersOpen}
        onToggle={toggle}
        onReset={reset}
      />

      <div
        className="mvtoggle"
        role="tablist"
        aria-label="Switch between list and map"
      >
        <button
          role="tab"
          aria-selected={mobileView === "list"}
          className={mobileView === "list" ? "on" : ""}
          onClick={() => switchMobileView("list")}
        >
          List
        </button>
        <button
          role="tab"
          aria-selected={mobileView === "map"}
          className={mobileView === "map" ? "on" : ""}
          onClick={() => switchMobileView("map")}
        >
          Map
        </button>
      </div>

      <div className="shell" data-mobile-view={mobileView}>
        <section className="cards">
          <div className="cards-head">
            <span className="ch-n">
              {visible.length}{" "}
              {visible.length === 1 ? "facility" : "facilities"} in view
            </span>
            <span className="eyebrow">spec sheets</span>
          </div>
          {visible.length === 0 ? (
            <div className="empty">
              {filtered.length === 0
                ? "No facilities match these filters."
                : "No facilities in this map area."}
              <br />
              {filtered.length === 0
                ? "Try removing one."
                : "Pan or zoom out to see more."}
            </div>
          ) : (
            visible.map((f) => (
              <ResultCard
                key={f.id}
                f={f}
                onSelect={select}
                onHover={setHoveredId}
              />
            ))
          )}
        </section>

        <MapView
          facilities={filtered}
          loading={loading}
          hoveredId={hoveredId}
          flyTo={flyTo}
          sizeKey={sizeKey}
          onSelect={select}
          onBoundsChange={setBounds}
        />
      </div>

      <DetailDrawer
        facility={selected}
        onClose={() => setSelected(null)}
        onRequestUpdate={(f) => setEditFacility(f)}
      />
      <AddFacilityModal
        open={modalOpen}
        demoMode={demoMode}
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
      <RequestUpdatesModal
        key={editFacility?.id ?? "none"}
        facility={editFacility}
        submitting={editing}
        onClose={() => setEditFacility(null)}
        onSubmit={handleEditSubmit}
      />
      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
