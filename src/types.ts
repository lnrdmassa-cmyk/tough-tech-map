export type Facility = {
  id: string;
  name: string;
  org: string;
  type: string;
  cc: string;
  city: string;
  lat: number;
  lng: number;
  sectors: string[];
  capabilities: string[];
  access: string;
  equipment: string;
  blurb: string;
  website: string;
  status?: "approved" | "pending";
};

export type FilterKey = "cc" | "type" | "cap" | "access";

export type Filters = {
  q: string;
  cc: string | null;
  type: string | null;
  cap: string | null;
  access: string | null;
};

export const EMPTY_FILTERS: Filters = {
  q: "",
  cc: null,
  type: null,
  cap: null,
  access: null,
};

/** A public submission — no id (server-generated) and always lands as pending. */
export type NewFacility = Omit<Facility, "id" | "status">;
