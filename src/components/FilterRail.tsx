import type { Facility, Filters, FilterKey } from "../types";
import { countForChip, hasActiveFilters } from "../lib/filter";
import {
  COUNTRY_CODES,
  COUNTRIES,
  TYPES,
  TYPE_COLORS,
  CAPABILITIES,
  ACCESS_MODELS,
  SECTORS,
} from "../lib/vocab";

type Option = { val: string; label: string; dot?: string };

type Props = {
  facilities: Facility[];
  filters: Filters;
  open: boolean;
  onToggle: (key: FilterKey, val: string) => void;
  onReset: () => void;
};

function Chip({
  k,
  val,
  label,
  dot,
  isKey,
  facilities,
  filters,
  onToggle,
}: {
  k: FilterKey;
  val: string;
  label: string;
  dot?: string;
  isKey?: boolean;
  facilities: Facility[];
  filters: Filters;
  onToggle: (key: FilterKey, val: string) => void;
}) {
  const active = filters[k].includes(val);
  const count = countForChip(facilities, filters, k, val);
  const cls = [
    "chip",
    isKey ? "key" : "",
    count === 0 && !active ? "is-zero" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      className={cls}
      aria-pressed={active}
      onClick={() => onToggle(k, val)}
    >
      {dot && <span className="cdot" style={{ background: dot }} />}
      <span>{label}</span>
      <span className="cn">{count}</span>
    </button>
  );
}

function ChipGroup({
  title,
  k,
  options,
  facilities,
  filters,
  onToggle,
}: {
  title: string;
  k: FilterKey;
  options: Option[];
  facilities: Facility[];
  filters: Filters;
  onToggle: (key: FilterKey, val: string) => void;
}) {
  return (
    <div className="group">
      <div className="ghead">
        <span className="gh-l">{title}</span>
      </div>
      <div className="chips">
        {options.map((o) => (
          <Chip
            key={o.val}
            k={k}
            val={o.val}
            label={o.label}
            dot={o.dot}
            facilities={facilities}
            filters={filters}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

export default function FilterRail({
  facilities,
  filters,
  open,
  onToggle,
  onReset,
}: Props) {
  const ccOptions: Option[] = COUNTRY_CODES.map((cc) => ({
    val: cc,
    label: `${COUNTRIES[cc].flag} ${cc}`,
  }));
  const typeOptions: Option[] = TYPES.map((t) => ({
    val: t,
    label: t,
    dot: TYPE_COLORS[t],
  }));
  const accessOptions: Option[] = ACCESS_MODELS.map((a) => ({
    val: a,
    label: a,
  }));
  const sectorOptions: Option[] = SECTORS.map((s) => ({ val: s, label: s }));
  const capOptions: Option[] = CAPABILITIES.map((c) => ({ val: c, label: c }));

  return (
    <div
      className={`filter-panel ${open ? "open" : ""}`}
      role="region"
      aria-label="Filters"
      aria-hidden={!open}
    >
      <div className="filter-inner">
        <ChipGroup
          title="Facility"
          k="cap"
          options={capOptions}
          facilities={facilities}
          filters={filters}
          onToggle={onToggle}
        />
        <ChipGroup
          title="Industrial vertical"
          k="sector"
          options={sectorOptions}
          facilities={facilities}
          filters={filters}
          onToggle={onToggle}
        />
        <ChipGroup
          title="Access model"
          k="access"
          options={accessOptions}
          facilities={facilities}
          filters={filters}
          onToggle={onToggle}
        />
        <ChipGroup
          title="Country"
          k="cc"
          options={ccOptions}
          facilities={facilities}
          filters={filters}
          onToggle={onToggle}
        />
        <ChipGroup
          title="Resource type"
          k="type"
          options={typeOptions}
          facilities={facilities}
          filters={filters}
          onToggle={onToggle}
        />

        {hasActiveFilters(filters) && (
          <button className="btn-reset" onClick={onReset}>
            Reset all filters
          </button>
        )}
      </div>
    </div>
  );
}
