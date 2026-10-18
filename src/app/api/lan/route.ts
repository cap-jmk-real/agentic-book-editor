import os from "node:os";
import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { MAC_SERVE_PORT } from "@/lib/llm/config";

function pickLanIp(): string {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    const addrs = nets[name];
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === "IPv4" && !addr.internal && addr.address.startsWith("192.168.")) {
        return addr.address;
      }
    }
  }
  for (const name of Object.keys(nets)) {
    const addrs = nets[name];
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === "IPv4" && !addr.internal) {
        return addr.address;
      }
    }
  }
  return "127.0.0.1";
}

export async function GET(request: NextRequest) {
  const host = request.nextUrl.searchParams.get("host") ?? pickLanIp();
  const port = request.nextUrl.searchParams.get("port") ?? String(MAC_SERVE_PORT);
  const url = `http://${host}:${port}/`;
  const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 280 });
  return NextResponse.json({ url, host, port, qrDataUrl });
}
