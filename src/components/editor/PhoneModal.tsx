"use client";

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
};

export function PhoneModal({ open, onClose }: Props) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-title"
    >
      <div className="w-full max-w-sm rounded-xl border border-zinc-700 bg-zinc-900 p-5 shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h2 id="phone-title" className="text-lg font-semibold text-zinc-100">
              Phone on Wi‑Fi
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Same network as this Mac. Book data stays in each browser&apos;s storage.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-zinc-400 hover:bg-zinc-800"
          >
            Close
          </button>
        </div>
        {error && <p className="text-sm text-amber-300">{error}</p>}
        {lan && (
          <>
            {lan.qrDataUrl && (
              <img
                src={lan.qrDataUrl}
                alt="QR code to open editor on phone"
                className="mx-auto rounded-lg bg-white p-2"
              />
            )}
            <p className="mt-3 break-all text-center font-mono text-sm text-violet-200">
              {lan.url}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
