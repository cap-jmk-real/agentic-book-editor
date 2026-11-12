import type { Page } from "@playwright/test";

export async function installApiMocks(page: Page, options?: { offline?: boolean }) {
  const offline = options?.offline ?? false;
  await page.route("**/api/llm/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: !offline,
        baseUrl: "http://mock",
        model: "munenori",
        latencyMs: offline ? undefined : 42,
        error: offline ? "unreachable" : undefined,
      }),
    });
  });

  await page.route("**/api/llm/write", async (route) => {
    const payload = route.request().postDataJSON() as { mode?: string };
    await new Promise((r) => setTimeout(r, 300));
    if (payload.mode === "continue") {
      await route.fulfill({
        json: { text: "\n\nFixture paragraph from Munenori for the acceptance test." },
      });
      return;
    }
    if (payload.mode === "audit-fix") {
      await route.fulfill({ json: { text: "Fixed excerpt text for audit." } });
      return;
    }
    if (payload.mode === "explain-deeper") {
      await route.fulfill({
        json: { text: "Fixture deeper explanation in the chapter voice." },
      });
      return;
    }
    if (payload.mode === "detect-terms") {
      await route.fulfill({
        json: {
          text: `[{"term":"gradient","excerpt":"gradients","reason":"Technical term","draftExplanation":"Rate of change"}]`,
        },
      });
      return;
    }
    await route.fulfill({ json: { text: "Rewritten selection fixture." } });
  });

  await page.route("**/api/lan", async (route) => {
    await route.fulfill({
      json: {
        url: "http://192.168.1.10:3847",
        host: "192.168.1.10",
        port: "3847",
        qrDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      },
    });
  });
}

export async function freshEditor(page: Page) {
  await page.addInitScript(() => {
    if (window.sessionStorage.getItem("abe-e2e-cleared")) return;
    window.localStorage.clear();
    window.sessionStorage.setItem("abe-e2e-cleared", "1");
  });
  await installApiMocks(page);
  await page.goto("/");
  await page.waitForSelector(".book-editor", { timeout: 15_000 });
}
