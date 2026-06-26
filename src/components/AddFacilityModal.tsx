import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import type { NewFacility } from "../types";
import {
  TYPES,
  COUNTRY_CODES,
  COUNTRIES,
  ACCESS_MODELS,
  CAPABILITIES,
  SECTORS,
  KEY_CAPABILITIES,
  jitteredCentroid,
} from "../lib/vocab";

type Props = {
  open: boolean;
  demoMode: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (rec: NewFacility) => void;
};

function toggleIn(
  setState: Dispatch<SetStateAction<Set<string>>>,
  val: string,
) {
  setState((prev) => {
    const next = new Set(prev);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    return next;
  });
}

export default function AddFacilityModal({
  open,
  demoMode,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [caps, setCaps] = useState<Set<string>>(new Set());
  const [sectors, setSectors] = useState<Set<string>>(new Set());
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setErr("");
      const t = setTimeout(() => {
        const el = formRef.current?.querySelector(
          'input[name="name"]',
        ) as HTMLInputElement | null;
        el?.focus();
      }, 60);
      return () => clearTimeout(t);
    }
    // reset on close
    formRef.current?.reset();
    setCaps(new Set());
    setSectors(new Set());
    setErr("");
  }, [open]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const get = (k: string) => ((fd.get(k) as string) ?? "").trim();

    const name = get("name");
    const org = get("org");
    const city = get("city");
    if (!name || !org || !city) {
      setErr("Name, organisation and city are required.");
      return;
    }
    if (caps.size === 0) {
      setErr("Select at least one capability.");
      return;
    }
    setErr("");

    const cc = get("cc") || COUNTRY_CODES[0];
    let lat = parseFloat(get("lat"));
    let lng = parseFloat(get("lng"));
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      [lat, lng] = jitteredCentroid(cc);
    }

    const rec: NewFacility = {
      name,
      org,
      type: get("type") || TYPES[0],
      cc,
      city,
      lat,
      lng,
      sectors: [...sectors],
      capabilities: [...caps],
      access: get("access") || ACCESS_MODELS[0],
      equipment: get("equipment"),
      blurb: get("blurb"),
      website: get("website"),
      email: get("email"),
    };
    onSubmit(rec);
  }

  return (
    <>
      <div className={`scrim ${open ? "on" : ""}`} onClick={onClose} />
      <div
        className={`modal ${open ? "on" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Add a facility"
        aria-hidden={!open}
      >
        <div className="mhead">
          <button className="mclose" onClick={onClose} aria-label="Close">
            ✕
          </button>
          <span className="eyebrow">Build in Europe</span>
          <h2>Add a facility</h2>
          <p>
            Submit infrastructure that startups and external teams can access.
            Entries are reviewed before they appear on the map
            {demoMode ? " — demo mode: nothing is saved." : "."}
          </p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} noValidate>
          <div className="frow">
            <div className="field">
              <label>
                Facility name <span className="req">*</span>
              </label>
              <input name="name" required />
            </div>
            <div className="field">
              <label>
                Organisation <span className="req">*</span>
              </label>
              <input name="org" required />
            </div>
          </div>

          <div className="frow">
            <div className="field">
              <label>Resource type</label>
              <select name="type" defaultValue={TYPES[0]}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Country</label>
              <select name="cc" defaultValue={COUNTRY_CODES[0]}>
                {COUNTRY_CODES.map((cc) => (
                  <option key={cc} value={cc}>
                    {COUNTRIES[cc].flag} {COUNTRIES[cc].name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="frow">
            <div className="field">
              <label>
                City <span className="req">*</span>
              </label>
              <input name="city" required />
            </div>
            <div className="field">
              <label>Access model</label>
              <select name="access" defaultValue={ACCESS_MODELS[0]}>
                {ACCESS_MODELS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field full" style={{ marginBottom: 14 }}>
            <label>
              Capabilities <span className="req">*</span>{" "}
              <span className="hint">— dashed = highlighted core capabilities</span>
            </label>
            <div className="checkwrap">
              {CAPABILITIES.map((c) => {
                const isKey = KEY_CAPABILITIES.has(c);
                const has = caps.has(c);
                return (
                  <label
                    key={c}
                    className={`checkpill ${isKey ? "key" : ""} ${has ? "has" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={has}
                      onChange={() => toggleIn(setCaps, c)}
                    />
                    <span>{c}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="field full" style={{ marginBottom: 14 }}>
            <label>Sectors</label>
            <div className="checkwrap">
              {SECTORS.map((s) => {
                const has = sectors.has(s);
                return (
                  <label key={s} className={`checkpill ${has ? "has" : ""}`}>
                    <input
                      type="checkbox"
                      checked={has}
                      onChange={() => toggleIn(setSectors, s)}
                    />
                    <span>{s}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="field full" style={{ marginBottom: 14 }}>
            <label>Representative equipment</label>
            <input
              name="equipment"
              placeholder="e.g. Photolithography, e-beam, etch & deposition"
            />
          </div>

          <div className="field full" style={{ marginBottom: 14 }}>
            <label>Short description</label>
            <textarea
              name="blurb"
              placeholder="One or two sentences on what external teams can access."
            />
          </div>

          <div className="frow">
            <div className="field">
              <label>Website</label>
              <input name="website" placeholder="example.org" />
            </div>
            <div className="field">
              <label>
                Contact email <span className="hint">(optional)</span>
              </label>
              <input name="email" type="email" placeholder="info@example.org" />
            </div>
          </div>

          <div className="frow">
            <div className="field">
              <label>
                Coordinates <span className="hint">(optional)</span>
              </label>
              <div className="coord-grid">
                <input name="lat" placeholder="lat" inputMode="decimal" />
                <input name="lng" placeholder="lng" inputMode="decimal" />
              </div>
              <span className="hint">
                Blank → placed near the country centroid.
              </span>
            </div>
          </div>

          <div className="mfoot">
            <span className="err">{err}</span>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit for review"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
