"use client";

import { RefreshCw } from "lucide-react";
import { useMunenoriStatus } from "@/hooks/useMunenoriStatus";
import { StatusDot } from "@/components/ui/StatusDot";
import { IconButton } from "@/components/ui/IconButton";

export function MunenoriStatus() {
  const { status, loading, refresh, online } = useMunenoriStatus();

  const title = online
    ? `Munenori online${status?.latencyMs != null ? ` · ${status.latencyMs}ms` : ""}`
    : status?.error
      ? `Munenori offline · ${status.error}`
      : "Munenori offline";

  return (
    <div className="flex items-center gap-1" title={title}>
      <StatusDot online={online} loading={loading} />
      <IconButton icon={RefreshCw} label="Refresh Munenori status" size="sm" onClick={() => void refresh()} />
    </div>
  );
}
