import { useState, type FormEvent } from "react";
import type { Facility } from "../types";

type Props = {
  facility: Facility | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (message: string, email: string) => void;
};

/**
 * "Suggest an update" for an existing facility — new equipment/tools, changed
 * access terms, a better contact. Submissions land in a review queue.
 */
export default function RequestUpdatesModal({
  facility,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const open = Boolean(facility);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (message.trim().length < 5) {
      setErr("Add a short description of what should change.");
      return;
    }
    setErr("");
    onSubmit(message.trim(), email.trim());
  }

  return (
    <>
      <div className={`scrim ${open ? "on" : ""}`} onClick={onClose} />
      <div
        className={`modal ${open ? "on" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Suggest an update"
        aria-hidden={!open}
      >
        {facility && (
          <>
            <div className="mhead">
              <button className="mclose" onClick={onClose} aria-label="Close">
                ✕
              </button>
              <span className="eyebrow">Suggest an update</span>
              <h2>{facility.name}</h2>
              <p>
                New equipment or tools, changed access terms, a better contact?
                Tell us what to update. It goes to review before it appears.
              </p>
            </div>
            <form onSubmit={submit}>
              <div className="frow">
                <div className="field full">
                  <label>
                    What should change? <span className="req">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. New tool: Bruker D8 XRD added (2026). Access now also fee-for-service. Updated contact: facility@org.eu"
                    style={{ minHeight: 120 }}
                  />
                </div>
              </div>
              <div className="frow">
                <div className="field full">
                  <label>Your email (optional)</label>
                  <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="so we can follow up"
                  />
                </div>
              </div>
              <div className="mfoot">
                <span className="err">{err}</span>
                <button
                  className="btn-submit"
                  type="submit"
                  disabled={submitting}
                >
                  {submitting ? "Sending…" : "Send suggestion"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </>
  );
}
