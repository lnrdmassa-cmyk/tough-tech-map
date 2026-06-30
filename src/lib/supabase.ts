import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Facility, NewFacility } from "../types";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when both env vars are present — otherwise the app runs in demo mode. */
export const hasSupabase: boolean = Boolean(url && key);

export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url as string, key as string)
  : null;

/** Read only approved facilities (RLS also enforces this server-side). */
export async function fetchApprovedFacilities(): Promise<Facility[]> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { data, error } = await supabase
    .from("facilities")
    .select("*")
    .eq("status", "approved")
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Facility[];
}

/**
 * Submit a public facility. It is inserted as `pending`; a DB trigger also forces
 * `pending`, so submissions never appear on the map until approved in Supabase.
 */
export async function submitFacility(rec: NewFacility): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase
    .from("facilities")
    .insert([{ ...rec, status: "pending", submitted_by: null }]);
  if (error) throw error;
}

/**
 * Suggest an update to an existing facility (new equipment, changed access,
 * better contact). Lands in `facility_edits` as `pending` for review; the
 * public cannot read the queue.
 */
export async function submitEdit(
  facilityId: string,
  message: string,
  contactEmail: string,
): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured");
  const { error } = await supabase.from("facility_edits").insert([
    {
      facility_id: facilityId,
      message,
      contact_email: contactEmail || null,
      status: "pending",
    },
  ]);
  if (error) throw error;
}
