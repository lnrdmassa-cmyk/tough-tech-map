import { useEffect } from "react";

export type ToastMsg = { msg: string; kind: "ok" | "err" } | null;

type Props = {
  toast: ToastMsg;
  onDone: () => void;
};

export default function Toast({ toast, onDone }: Props) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDone, 3800);
    return () => clearTimeout(t);
  }, [toast, onDone]);

  return (
    <div
      className={`toast ${toast ? "on" : ""} ${toast?.kind === "err" ? "err" : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className="tdot" />
      <span>{toast?.msg}</span>
    </div>
  );
}
