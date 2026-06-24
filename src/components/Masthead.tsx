type Props = {
  shown: number;
  total: number;
  countries: number;
  demoMode: boolean;
  q: string;
  filtersOpen: boolean;
  activeCount: number;
  onSearch: (q: string) => void;
  onToggleFilters: () => void;
  onAdd: () => void;
};

function Counter({ n, l }: { n: number; l: string }) {
  return (
    <div className="counter">
      <div className="n">{n}</div>
      <div className="l">{l}</div>
    </div>
  );
}

export default function Masthead({
  shown,
  total,
  countries,
  demoMode,
  q,
  filtersOpen,
  activeCount,
  onSearch,
  onToggleFilters,
  onAdd,
}: Props) {
  return (
    <header className="masthead">
      <div className="mast-top">
        <div className="brand">
          <h1>Build Deep Tech in Europe</h1>
          <span className="tag">
            The open map of deep-tech infrastructure across Europe — labs,
            cleanrooms, pilot lines, test beds and launchpads you can actually
            access.
          </span>
        </div>
        <div className="mast-right">
          <span
            className={`source-pill ${demoMode ? "" : "live"}`}
            title={
              demoMode
                ? "Running on the bundled seed (no Supabase keys set)"
                : "Reading approved facilities from Supabase"
            }
          >
            {demoMode ? "Demo data" : "Live · Supabase"}
          </span>
          <button className="btn-add" onClick={onAdd}>
            + Add a facility
          </button>
        </div>
      </div>

      <div className="mast-tools">
        <div className="search">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={q}
            placeholder="Search name, org, city, equipment…"
            autoComplete="off"
            aria-label="Search facilities"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <button
          className="btn-filters"
          aria-expanded={filtersOpen}
          onClick={onToggleFilters}
        >
          <span>Filters</span>
          {activeCount > 0 && <span className="fcount">{activeCount}</span>}
          <span className="caret">▾</span>
        </button>
        <div className="counters">
          <Counter n={shown} l="Shown" />
          <Counter n={total} l="Facilities" />
          <Counter n={countries} l="Countries" />
        </div>
      </div>
    </header>
  );
}
