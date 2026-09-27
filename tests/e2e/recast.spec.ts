import { expect, test } from "@playwright/test";

test("judge flow: revise, guard, approve, and export", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Your day changes. Your bag should keep up." })).toBeVisible();

  await page.getByTestId("nav-revision").click();
  await page.getByTestId("price-input").fill("₹2,299");
  await page.getByTestId("apply-price").click();
  await expect(page.getByTestId("affected-output")).toHaveCount(2);
  await expect(page.getByText("Design Story Launch Post")).toBeVisible();
  await expect(page.getByText("Preserved", { exact: true })).toBeVisible();

  await page.getByTestId("claim-input").fill("Make it completely waterproof");
  await page.getByTestId("check-claim").click();
  await expect(page.getByTestId("claim-warning")).toContainText("Unsupported claim");
  await page.getByTestId("use-approved").click();
  await expect(page.getByTestId("claim-approved")).toContainText("Approved replacement");

  await page.getByTestId("nav-review").click();
  await page.getByTestId("approve-all").click();
  await expect(page.getByText("approved to export", { exact: true })).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("export-revision").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("recast-revision-report.md");
});
