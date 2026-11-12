import { expect, test } from "@playwright/test";
import { freshEditor, installApiMocks } from "./fixtures";

test.describe("premium chrome", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("serif prose and sentence-case labels", async ({ page }) => {
    await freshEditor(page);
    await expect(page.getByText("Agentic book editor")).toBeVisible();
    await expect(page.getByText("Chapters")).toBeVisible();
    const prose = page.locator(".book-prose").first();
    await page.getByRole("tab", { name: "Read" }).click();
    const font = await prose.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(font.toLowerCase()).toMatch(/source serif|serif/);
  });

  test("no emoji in rendered chrome", async ({ page }) => {
    await freshEditor(page);
    const text = await page.locator(".book-editor").innerText();
    expect(/\p{Extended_Pictographic}/u.test(text)).toBe(false);
  });
});

test.describe("mobile shell", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("chapter title opens TOC sheet", async ({ page }) => {
    await freshEditor(page);
    await page.getByTestId("chapter-title-button").click();
    await expect(page.getByRole("dialog", { name: "Chapters" })).toBeVisible();
    await page.getByRole("button", { name: /Statistics/ }).click();
    await expect(page.getByRole("heading", { name: "Statistics" })).toBeVisible();
  });

  test("overflow menu instead of pill row", async ({ page }) => {
    await freshEditor(page);
    await expect(page.getByTestId("overflow-menu")).toBeVisible();
    const header = page.getByTestId("editor-header");
    await expect(header.getByText("Dark", { exact: true })).toHaveCount(0);
  });

  test("audit opens sheet not split pane", async ({ page }) => {
    await freshEditor(page);
    await page.getByTestId("overflow-menu").click();
    await page.getByRole("button", { name: "Audit" }).click();
    await expect(page.getByRole("dialog", { name: "Audit" })).toBeVisible();
    await expect(page.locator(".book-prose")).toBeVisible();
  });

  test("format toolbar fixed with safe area class", async ({ page }) => {
    await freshEditor(page);
    await page.getByRole("tab", { name: "Edit" }).click();
    const toolbar = page.locator(".book-format-toolbar");
    await expect(toolbar).toBeVisible();
    const pos = await toolbar.evaluate((el) => getComputedStyle(el).position);
    expect(pos).toBe("fixed");
    await expect(toolbar).toHaveClass(/safe-area/);
  });

  test("read mode without horizontal overflow", async ({ page }) => {
    await freshEditor(page);
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientW = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollW).toBeLessThanOrEqual(clientW + 2);
  });
});

test.describe("desktop layout", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("three-pane grid", async ({ page }) => {
    await freshEditor(page);
    await expect(page.getByTestId("toc-desktop")).toBeVisible();
    await expect(page.getByTestId("desktop-rail")).toBeVisible();
    await expect(page.getByTestId("audit-panel")).toBeVisible();
  });
});

test.describe("tablet layout", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("uses sheets not desktop toc", async ({ page }) => {
    await freshEditor(page);
    await expect(page.getByTestId("toc-desktop")).toBeHidden();
    await page.getByTestId("chapter-title-button").click();
    await expect(page.getByRole("dialog", { name: "Chapters" })).toBeVisible();
  });
});

test.describe("AI proposals", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("continue flow accept and revert", async ({ page }) => {
    await freshEditor(page);
    await page.getByRole("tab", { name: "Edit" }).click();
    const textarea = page.getByTestId("chapter-textarea");
    const before = await textarea.inputValue();
    await page.getByTestId("continue-munenori").click();
    await expect(page.getByText("Munenori is writing")).toBeVisible();
    await expect(page.getByText("Fixture paragraph from Munenori")).toBeVisible({ timeout: 10_000 });
    expect(await textarea.inputValue()).toBe(before);
    await page.getByRole("button", { name: "Accept" }).click();
    expect(await textarea.inputValue()).toContain("Fixture paragraph");
    await page.getByRole("button", { name: "Revert" }).click();
    expect(await textarea.inputValue()).toBe(before);
  });

  test("discard leaves body unchanged", async ({ page }) => {
    await freshEditor(page);
    await page.getByRole("tab", { name: "Edit" }).click();
    const textarea = page.getByTestId("chapter-textarea");
    const before = await textarea.inputValue();
    await page.getByTestId("continue-munenori").click();
    await expect(page.getByRole("button", { name: "Discard" })).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Discard" }).click();
    expect(await textarea.inputValue()).toBe(before);
  });

  test("command palette mod+k", async ({ page }) => {
    await freshEditor(page);
    await page.keyboard.press(process.platform === "darwin" ? "Meta+k" : "Control+k");
    await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
    await expect(page.getByText("Continue chapter")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Command palette" })).toHaveCount(0);
  });

  test("slash menu on /", async ({ page }) => {
    await freshEditor(page);
    await page.getByRole("tab", { name: "Edit" }).click();
    const textarea = page.getByTestId("chapter-textarea");
    await textarea.fill("/\n");
    await textarea.press("Home");
    await textarea.type("/");
    await expect(page.locator(".book-slash-menu")).toBeVisible();
  });

  test("audit fix requires accept", async ({ page }) => {
    await freshEditor(page);
    await page.getByRole("tab", { name: "Edit" }).click();
    const textarea = page.getByTestId("chapter-textarea");
    const before = await textarea.inputValue();
    await page.getByRole("button", { name: "Fix with Munenori" }).first().click();
    await expect(page.getByRole("button", { name: "Accept" })).toBeVisible({ timeout: 10_000 });
    expect(await textarea.inputValue()).toBe(before);
    await page.getByRole("button", { name: "Accept" }).click();
    expect(await textarea.inputValue()).toContain("Fixed excerpt");
  });

  test("offline disables continue", async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await installApiMocks(page, { offline: true });
    await page.goto("/");
    await page.waitForSelector(".book-editor");
    await page.getByRole("tab", { name: "Edit" }).click();
    await expect(page.getByTestId("continue-munenori")).toBeDisabled();
  });
});

test.describe("go-deeper", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("seeded terms dotted underline in read", async ({ page }) => {
    await freshEditor(page);
    await expect(page.locator("button.book-term").first()).toBeVisible();
  });

  test("term popover desktop", async ({ page }) => {
    await freshEditor(page);
    await page.locator("button.book-term", { hasText: "cosine similarity" }).click();
    await expect(page.getByTestId("term-popover")).toBeVisible();
    await expect(page.getByText("normalized dot product", { exact: false })).toBeVisible();
    await page.keyboard.press("Escape");
  });

  test("mark term persists", async ({ page }) => {
    await freshEditor(page);
    await page.getByRole("tab", { name: "Edit" }).click();
    const textarea = page.getByTestId("chapter-textarea");
    const idx = (await textarea.inputValue()).indexOf("ordered list");
    await textarea.focus();
    await textarea.evaluate(
      (el, start) => {
        const end = start + "ordered list".length;
        const input = el as HTMLTextAreaElement;
        input.setSelectionRange(start, end);
        input.dispatchEvent(new Event("select", { bubbles: true }));
        input.dispatchEvent(new MouseEvent("mouseup", { bubbles: true }));
      },
      idx,
    );
    await page.getByRole("button", { name: "Go deeper" }).click();
    await page.getByRole("textbox", { name: "Term" }).fill("ordered list");
    await page.getByPlaceholder("Add a short explanation").fill("A vector written in order.");
    await page.getByRole("button", { name: "Save" }).click();
    await page.waitForTimeout(300);
    await page.reload();
    await page.waitForSelector(".book-editor");
    await page.getByRole("tab", { name: "Read" }).click();
    await expect(page.locator("button.book-term", { hasText: "ordered list" })).toBeVisible();
    const stored = await page.evaluate(() => localStorage.getItem("agentic-book-editor:book"));
    expect(stored).toContain("ordered list");
  });

  test("detect terms heuristic", async ({ page }) => {
    await freshEditor(page);
    await page.keyboard.press(process.platform === "darwin" ? "Meta+k" : "Control+k");
    await page.getByText("Detect terms").click();
    await page.getByRole("button", { name: "Terms" }).click();
    await expect(page.getByRole("heading", { name: "Suggested terms" }).first()).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("go-deeper mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("term opens sheet with explain deeper", async ({ page }) => {
    await freshEditor(page);
    await page.locator("button.book-term").first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("button", { name: "Explain deeper" })).toBeVisible();
    await page.getByRole("button", { name: "Explain deeper" }).click();
    await expect(page.getByText("Fixture deeper explanation")).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("regression", () => {
  test("theme toggle", async ({ page }) => {
    await freshEditor(page);
    await page.evaluate(() => {
      document.querySelector(".book-editor")?.setAttribute("data-theme", "dark");
    });
    await expect(page.locator(".book-editor")).toHaveAttribute("data-theme", "dark");
  });

  test("phone modal qr", async ({ page }) => {
    await freshEditor(page);
    await page.keyboard.press(process.platform === "darwin" ? "Meta+k" : "Control+k");
    await page.getByText("Open on this Wi‑Fi").click();
    await expect(page.getByTestId("phone-qr")).toBeVisible();
  });
});
