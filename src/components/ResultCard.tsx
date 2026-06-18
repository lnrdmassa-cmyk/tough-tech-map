import type { Facility } from "../types";
import { TYPE_COLORS, flagFor, isKeyCapability } from "../lib/vocab";

type Props = {
  f: Facility;
  onSelect: (f: Facility) => void;
  onHover: (id: string | null) => void;
};

export default function ResultCard({ f, onSelect, onHover }: Props) {
  return (
    <article
      className="card"
      tabIndex={0}
      role="button"
      aria-label={`${f.name}, ${f.org}`}
      onClick={() => onSelect(f)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(f);
        }
      }}
      onMouseEnter={() => onHover(f.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="crow1">
        <span className="cid">{f.id}</span>
        <span className="tag" style={{ background: TYPE_COLORS[f.type] }}>
          {f.type}
        </span>
      </div>
      <h3>{f.name}</h3>
      <div className="corg">
        {f.org} · {flagFor(f.cc)} {f.city}
      </div>
      <div className="capwrap">
        {f.capabilities.map((c) => (
          <span
            key={c}
            className={`capchip ${isKeyCapability(c) ? "key" : ""}`}
          >
            {c}
          </span>
        ))}
      </div>
      <div className="access">
        <b>ACCESS:</b> {f.access}
      </div>
    </article>
  );
}
