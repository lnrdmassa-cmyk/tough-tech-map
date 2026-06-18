import { useEffect, useState, type ReactNode } from "react";
import type { Facility } from "../types";
import { TYPE_COLORS, flagFor, isKeyCapability, websiteUrl } from "../lib/vocab";

type Props = {
  facility: Facility | null;
  onClose: () => void;
};

function Spec({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="spec">
      <div className="sk">{k}</div>
      <div className="sv">{children}</div>
    </div>
  );
}

export default function DetailDrawer({ facility, onClose }: Props) {
  const open = Boolean(facility);
  // Keep the last facility visible during the slide-out transition.
  const [shown, setShown] = useState<Facility | null>(facility);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (facility) setShown(facility);
  }, [facility]);

  const f = shown;
  const url = f ? websiteUrl(f.website) : "";

  return (
    <>
      <div className={`scrim ${open ? "on" : ""}`} onClick={onClose} />
      <aside
        className={`drawer ${open ? "on" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Facility detail"
        aria-hidden={!open}
      >
        {f && (
          <>
            <div className="dhead">
              <button className="dclose" onClick={onClose} aria-label="Close">
                ✕
              </button>
              <div className="did">{f.id}</div>
              <h2>{f.name}</h2>
              <div className="dorg">
                {f.org} · {flagFor(f.cc)} {f.city}
              </div>
            </div>
            <div className="dbody">
              <Spec k="Type">
                <span
                  className="tag"
                  style={{ background: TYPE_COLORS[f.type] }}
                >
                  {f.type}
                </span>
              </Spec>
              <Spec k="Access">{f.access}</Spec>
              <Spec k="Capabilities">
                {f.capabilities.map((c) => (
                  <span
                    key={c}
                    className={`capchip ${isKeyCapability(c) ? "key" : ""}`}
                  >
                    {c}
                  </span>
                ))}
              </Spec>
              <Spec k="Sectors">
                {f.sectors.map((s) => (
                  <span key={s} className="capchip">
                    {s}
                  </span>
                ))}
              </Spec>
              {f.equipment && <Spec k="Equipment">{f.equipment}</Spec>}
              {f.blurb && <Spec k="About">{f.blurb}</Spec>}
              <Spec k="Coordinates">
                <span className="mono">
                  {f.lat.toFixed(4)}, {f.lng.toFixed(4)}
                </span>
              </Spec>
              {f.website && (
                <a
                  className="dvisit"
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit &amp; request access ↗
                </a>
              )}
              <button
                className="dcopy"
                onClick={() => {
                  const link = `${window.location.origin}${window.location.pathname}?f=${f.id}`;
                  navigator.clipboard?.writeText(link);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? "Link copied ✓" : "Copy link to this facility"}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
