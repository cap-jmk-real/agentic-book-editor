import { expect, test } from "@playwright/test";
import { freshEditor } from "./fixtures";

const viewports = [
  { width: 375, height: 812, name: "iphone-se" },
  { width: 390, height: 844, name: "iphone-14" },
  { width: 768, height: 1024, name: "tablet" },
  { width: 1280, height: 800, name: "desktop" },
] as const;

for (const vp of viewports) {
  test(`smoke ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await freshEditor(page);
    await expect(page.locator(".book-editor")).toBeVisible();
    if (vp.width >= 1024) {
      await expect(page.getByTestId("toc-desktop")).toBeVisible();
    } else {
      await expect(page.getByTestId("toc-desktop")).toBeHidden();
    }
  });
}
