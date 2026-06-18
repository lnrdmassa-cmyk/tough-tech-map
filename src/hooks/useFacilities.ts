import { useEffect, useState } from "react";
import type { Facility } from "../types";
import { hasSupabase, fetchApprovedFacilities } from "../lib/supabase";
import { SEED } from "../data/seed";

export type FacilitiesState = {
  facilities: Facility[];
  loading: boolean;
  error: string | null;
  demoMode: boolean;
};

/**
 * Source of truth for the map. With Supabase configured it loads approved rows;
 * otherwise (and on any error / empty result) it falls back to the bundled seed
 * so the map always renders something.
 */
export function useFacilities(): FacilitiesState {
  const [facilities, setFacilities] = useState<Facility[]>(
    hasSupabase ? [] : SEED,
  );
  const [loading, setLoading] = useState<boolean>(hasSupabase);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hasSupabase) return;
    let alive = true;
    fetchApprovedFacilities()
      .then((rows) => {
        if (!alive) return;
        setFacilities(rows.length ? rows : SEED);
      })
      .catch((e: unknown) => {
        if (!alive) return;
        setError(e instanceof Error ? e.message : String(e));
        setFacilities(SEED);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { facilities, loading, error, demoMode: !hasSupabase };
}
