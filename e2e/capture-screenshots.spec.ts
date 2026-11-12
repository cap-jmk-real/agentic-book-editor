import { test } from "@playwright/test";
import { freshEditor, installApiMocks } from "./fixtures";

test("capture after screenshots", async ({ page }) => {
  await freshEditor(page);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({ path: "/opt/cursor/artifacts/editor-desktop-after.png", fullPage: true });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: "/opt/cursor/artifacts/editor-mobile-after.png", fullPage: true });
});
