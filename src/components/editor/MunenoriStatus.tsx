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

  const dot = status?.ok ? "bg-emerald-400" : "bg-amber-400";

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-400">
      <span className={`h-2 w-2 rounded-full ${loading ? "animate-pulse bg-zinc-500" : dot}`} />
      <span className="font-mono">
        Munenori {status?.ok ? "online" : "offline"}
        {status?.latencyMs != null && status.ok ? ` · ${status.latencyMs}ms` : ""}
      </span>
      {!status?.ok && status?.error && (
        <span className="truncate text-amber-200/80" title={status.error}>
          ({status.error})
        </span>
      )}
      <button
        type="button"
        onClick={() => void refresh()}
        className="ml-1 text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline"
      >
        refresh
      </button>
    </div>
  );
}
