import { useEffect, useRef, useState } from "react";
import type { Facility, Filters, FilterKey } from "../types";
import { CAPABILITIES, KEY_CAPABILITIES } from "../lib/vocab";
import { countForChip } from "../lib/filter";

type Props = {
  facilities: Facility[];
  filters: Filters;
  onToggle: (key: FilterKey, val: string) => void;
};

/**
 * Compact "Labs" dropdown sitting next to Filters — quick access to the
 * capability (lab-type) facets. Collapsed by default so it stays out of the way.
 */
export default function LabsDropdown({ facilities, filters, onToggle }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onDoc);
      document.addEventListener("keydown", onEsc);
    }
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const count = filters.cap.length;

  return (
    <div className="labs-dd" ref={ref}>
      <button
        className="btn-filters"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>Labs</span>
        {count > 0 && <span className="fcount">{count}</span>}
        <span className="caret">▾</span>
      </button>
      {open && (
        <div className="labs-menu" role="region" aria-label="Lab capabilities">
          {CAPABILITIES.map((c) => {
            const active = filters.cap.includes(c);
            const n = countForChip(facilities, filters, "cap", c);
            const cls = [
              "chip",
              KEY_CAPABILITIES.has(c) ? "key" : "",
              !active && n === 0 ? "is-zero" : "",
            ]
              .filter(Boolean)
              .join(" ");
            return (
              <button
                key={c}
                className={cls}
                aria-pressed={active}
                onClick={() => onToggle("cap", c)}
              >
                <span>{c}</span>
                <span className="cn">{n}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
