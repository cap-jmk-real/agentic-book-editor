import { NextResponse } from "next/server";
import { munenoriComplete } from "@/lib/llm/munenori";
import type { LlmWriteRequest } from "@/lib/llm/types";

export async function POST(request: Request) {
  let body: LlmWriteRequest;
  try {
    body = (await request.json()) as LlmWriteRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.chapterTitle || typeof body.body !== "string" || !body.mode) {
    return NextResponse.json({ error: "Missing chapterTitle, body, or mode" }, { status: 400 });
  }

  try {
    const text = await munenoriComplete(body);
    return NextResponse.json({ text });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Munenori request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
