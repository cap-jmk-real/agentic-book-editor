"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

type LanPayload = {
  url: string;
  host: string;
  port: string;
  qrDataUrl: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  theme?: "light" | "dark";
};

export function PhoneModal({ open, onClose, theme = "light" }: Props) {
  const [lan, setLan] = useState<LanPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    void fetch("/api/lan")
      .then((r) => r.json())
      .then((data: LanPayload) => setLan(data))
      .catch(() => setError("Could not load LAN URL"));
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="book-editor fixed inset-0 z-50 flex items-center justify-center p-4"
      data-theme={theme}
      style={{ background: "rgb(0 0 0 / 45%)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-xl p-5 shadow-xl"
        style={{
          background: "var(--book-page)",
          border: "1px solid var(--book-border-strong)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h2 id="phone-title" className="text-lg font-semibold" style={{ color: "var(--book-text)" }}>
              Open on this Wi‑Fi
            </h2>
            <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--book-text-muted)" }}>
              Same network as this machine. Book data stays in each browser&apos;s storage.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="book-icon-btn flex h-9 w-9 items-center justify-center rounded-md"
            aria-label="Close"
            style={{ color: "var(--book-text-muted)" }}
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>
        {error && (
          <p className="text-sm" style={{ color: "var(--book-danger)" }}>
            {error}
          </p>
        )}
        {lan && (
          <>
            {lan.qrDataUrl && (
              <img
                src={lan.qrDataUrl}
                alt="QR code to open editor on phone"
                className="mx-auto rounded-lg bg-white p-2"
                data-testid="phone-qr"
              />
            )}
            <p
              className="mt-3 select-all break-all text-center font-mono text-sm"
              style={{ color: "var(--book-accent-text)" }}
            >
              {lan.url}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
