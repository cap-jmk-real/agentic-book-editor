# Agentic Book Editor

Local Next.js editor for **The Agentic Book**, with **Munenori** (OpenAI-compatible) on Arno VPN and phone access over LAN.

## Prerequisites

- Node 20+
- **Arno VPN** on the Mac (Munenori at `10.63.81.100:8000`)
- Phone on the same Wi‑Fi for QR access

## Run

```bash
npm install
# Connect Arno VPN
npm run mac
```

Open `http://localhost:3847`. Use **Phone** in the header for a QR code to the LAN URL (`0.0.0.0:3847`).

## Munenori

| Setting | Default |
| --- | --- |
| Base URL | `http://10.63.81.100:8000/v1` |
| Model | `munenori` |

Verify VPN:

```bash
curl http://10.63.81.100:8000/v1/models
```

API routes: `/api/llm/write`, `/api/llm/status`, `/api/lan`.

## Storage

Chapter and audit state live in **localStorage** per browser (Mac and phone do not share data).

## Build

```bash
npm run build
```
