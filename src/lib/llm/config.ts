/** Munenori on Arno VPN — do not change default host without explicit request. */
export const MUNENORI_BASE_URL =
  process.env.MUNENORI_BASE_URL ?? "http://10.63.81.100:8000/v1";

export const MUNENORI_MODEL = process.env.MUNENORI_MODEL ?? "munenori";

export const MAC_SERVE_PORT = Number(process.env.PORT ?? "3847");
