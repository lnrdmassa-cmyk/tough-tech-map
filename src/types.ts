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
  email?: string;
  status?: "approved" | "pending";
};

export type FilterKey = "cc" | "type" | "cap" | "access";

export type Filters = {
  q: string;
  cc: string[];
  type: string[];
  cap: string[];
  access: string[];
};

export const EMPTY_FILTERS: Filters = {
  q: "",
  cc: [],
  type: [],
  cap: [],
  access: [],
};

/** A public submission — no id (server-generated) and always lands as pending. */
export type NewFacility = Omit<Facility, "id" | "status">;
