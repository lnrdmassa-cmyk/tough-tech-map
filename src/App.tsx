import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Masthead from "./components/Masthead";
import FilterRail from "./components/FilterRail";
import MapView, { type FlyTarget } from "./components/MapView";
import ResultCard from "./components/ResultCard";
import DetailDrawer from "./components/DetailDrawer";
import AddFacilityModal from "./components/AddFacilityModal";
import Toast, { type ToastMsg } from "./components/Toast";
import { useFacilities } from "./hooks/useFacilities";
import { applyFilters } from "./lib/filter";
import { EMPTY_FILTERS } from "./types";
import type { Facility, FilterKey, Filters, NewFacility } from "./types";
import { submitFacility } from "./lib/supabase";

export default function App() {
  const { facilities, loading, demoMode } = useFacilities();

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<Facility | null>(null);
  const [flyTo, setFlyTo] = useState<FlyTarget>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastMsg>(null);
  const [sizeKey, setSizeKey] = useState(0);

  const filtered = useMemo(
    () => applyFilters(facilities, filters),
    [facilities, filters],
  );
  const countries = useMemo(
    () => new Set(filtered.map((f) => f.cc)).size,
    [filtered],
  );
  const activeCount = useMemo(
    () =>
      [filters.cc, filters.type, filters.cap, filters.access].filter(Boolean)
        .length,
    [filters],
  );

  const select = useCallback((f: Facility) => {
    setSelected(f);
    setFlyTo({ lat: f.lat, lng: f.lng, nonce: Date.now() });
  }, []);

  const toggle = useCallback((key: FilterKey, val: string) => {
    setFilters((p) => ({ ...p, [key]: p[key] === val ? null : val }));
  }, []);

  const search = useCallback((q: string) => {
    setFilters((p) => ({ ...p, q }));
  }, []);

  const reset = useCallback(() => setFilters(EMPTY_FILTERS), []);

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

  return (
    <div className="app">
      <Masthead
        shown={filtered.length}
        total={facilities.length}
        countries={countries}
        demoMode={demoMode}
        q={filters.q}
        filtersOpen={filtersOpen}
        activeCount={activeCount}
        onSearch={search}
        onToggleFilters={toggleFilters}
        onAdd={() => setModalOpen(true)}
      />

      <FilterRail
        facilities={facilities}
        filters={filters}
        open={filtersOpen}
        onToggle={toggle}
        onReset={reset}
      />

      <div className="shell">
        <section className="cards">
          <div className="cards-head">
            <span className="ch-n">
              {filtered.length}{" "}
              {filtered.length === 1 ? "facility" : "facilities"}
            </span>
            <span className="eyebrow">spec sheets</span>
          </div>
          {filtered.length === 0 ? (
            <div className="empty">
              No facilities match these filters.
              <br />
              Try removing one.
            </div>
          ) : (
            filtered.map((f) => (
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
        />
      </div>

      <DetailDrawer facility={selected} onClose={() => setSelected(null)} />
      <AddFacilityModal
        open={modalOpen}
        demoMode={demoMode}
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
      <Toast toast={toast} onDone={() => setToast(null)} />
    </div>
  );
}
