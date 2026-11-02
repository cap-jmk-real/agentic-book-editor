"use client";

import { useCallback, useEffect, useState } from "react";
import type { LlmStatus } from "@/lib/llm/types";

export function MunenoriStatus() {
  const [status, setStatus] = useState<LlmStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/llm/status");
      const data = (await res.json()) as LlmStatus;
      setStatus(data);
    } catch {
      setStatus({
        ok: false,
        baseUrl: "",
        model: "munenori",
        error: "status check failed",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const online = status?.ok;

  return (
    <div
      className="flex max-w-[14rem] items-center gap-2 text-xs sm:max-w-none"
      style={{ color: "var(--book-text-muted)" }}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{
          background: loading
            ? "var(--book-text-faint)"
            : online
              ? "var(--book-success)"
              : "var(--book-warning)",
        }}
      />
      <span className="truncate font-medium" style={{ color: "var(--book-text-secondary)" }}>
        Munenori {online ? "online" : "offline"}
        {status?.latencyMs != null && online ? ` · ${status.latencyMs}ms` : ""}
      </span>
      {!online && status?.error && (
        <span className="hidden truncate sm:inline" title={status.error} style={{ color: "var(--book-warning)" }}>
          ({status.error})
        </span>
      )}
      <button
        type="button"
        onClick={() => void refresh()}
        className="shrink-0 underline-offset-2 hover:underline"
        style={{ color: "var(--book-text-faint)" }}
      >
        refresh
      </button>
    </div>
  );
}
