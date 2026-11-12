"use client";

import { useCallback, useEffect, useState } from "react";
import type { LlmStatus } from "@/lib/llm/types";

export function useMunenoriStatus(pollMs = 30_000) {
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
    const id = window.setInterval(() => void refresh(), pollMs);
    return () => window.clearInterval(id);
  }, [refresh, pollMs]);

  return { status, loading, refresh, online: Boolean(status?.ok) };
}
