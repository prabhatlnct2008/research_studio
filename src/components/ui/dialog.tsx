"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function Dialog({
  trigger,
  title,
  children,
  open: controlledOpen,
  onClose,
}: {
  trigger?: (open: () => void) => React.ReactNode;
  title: string;
  children: (close: () => void) => React.ReactNode;
  open?: boolean;
  onClose?: () => void;
}) {
  const [internal, setInternal] = useState(false);
  const isOpen = controlledOpen ?? internal;
  const close = () => {
    setInternal(false);
    onClose?.();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <>
      {trigger?.(() => setInternal(true))}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/30 px-4 py-10">
          <div className="w-full max-w-md rounded-card border border-border bg-surface shadow-overlay">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <h2 className="text-card-title font-semibold text-ink">{title}</h2>
              <button onClick={close} className="btn-ghost px-1.5" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">{children(close)}</div>
          </div>
        </div>
      )}
    </>
  );
}
