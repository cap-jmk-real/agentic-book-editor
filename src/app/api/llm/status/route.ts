import { NextResponse } from "next/server";
import { MUNENORI_BASE_URL, MUNENORI_MODEL } from "@/lib/llm/config";
import { probeMunenori } from "@/lib/llm/munenori";

export async function GET() {
  const probe = await probeMunenori();
  return NextResponse.json({
    ok: probe.ok,
    baseUrl: MUNENORI_BASE_URL,
    model: MUNENORI_MODEL,
    models: probe.models,
    error: probe.error,
    latencyMs: probe.latencyMs,
  });
}
