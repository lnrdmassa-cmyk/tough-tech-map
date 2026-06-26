import type { Facility, Filters, FilterKey } from "../types";

/** Lowercase + strip diacritics so "julich" matches "Jülich", "krakow" → "Kraków". */
function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function textMatch(f: Facility, q: string): boolean {
  const needle = fold(q.trim());
  if (!needle) return true;
  return fold(
    [
      f.name,
      f.org,
      f.city,
      f.blurb,
      f.equipment,
      f.type,
      ...f.sectors,
      ...f.capabilities,
    ].join(" "),
  ).includes(needle);
}

export function fieldMatch(f: Facility, key: FilterKey, val: string): boolean {
  switch (key) {
    case "cc":
      return f.cc === val;
    case "type":
      return f.type === val;
    case "access":
      return f.access === val;
    case "cap":
      return f.capabilities.includes(val);
    default:
      return true;
  }
}

/** Does a facility pass all active filters? `ignore` skips one group (for facet counts). */
export function passes(
  f: Facility,
  filters: Filters,
  ignore: FilterKey | null,
): boolean {
  if (!textMatch(f, filters.q)) return false;
  if (ignore !== "cc" && filters.cc.length && !filters.cc.includes(f.cc))
    return false;
  if (
    ignore !== "type" &&
    filters.type.length &&
    !filters.type.includes(f.type)
  )
    return false;
  if (
    ignore !== "access" &&
    filters.access.length &&
    !filters.access.includes(f.access)
  )
    return false;
  if (
    ignore !== "cap" &&
    filters.cap.length &&
    !filters.cap.some((c) => f.capabilities.includes(c))
  )
    return false;
  return true;
}

export function applyFilters(list: Facility[], filters: Filters): Facility[] {
  return list.filter((f) => passes(f, filters, null));
}

/**
 * Live count for a chip: how many facilities would match if this chip were also
 * selected, holding the OTHER groups' filters (and the text search) fixed.
 */
export function countForChip(
  list: Facility[],
  filters: Filters,
  key: FilterKey,
  val: string,
): number {
  let n = 0;
  for (const f of list) {
    if (passes(f, filters, key) && fieldMatch(f, key, val)) n++;
  }
  return n;
}

export function hasActiveFilters(filters: Filters): boolean {
  return Boolean(
    filters.q ||
      filters.cc.length ||
      filters.type.length ||
      filters.cap.length ||
      filters.access.length,
  );
}
