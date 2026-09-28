import { expect, test, type Page } from "@playwright/test";

async function openStudio(page: Page) {
  await page.addInitScript(() => window.sessionStorage.setItem("recast-intro-seen", "true"));
  await page.goto("/");
  await expect(page.getByTestId("site-intro")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Your day changes. Your bag should keep up." })).toBeVisible();
}

test("cinematic intro welcomes the user and yields to the studio", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("site-intro")).toBeVisible();
  await expect(page.getByText("Scattered signals.")).toBeVisible();
  await page.getByTestId("skip-intro").click();
  await expect(page.getByTestId("site-intro")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Your day changes. Your bag should keep up." })).toBeVisible();
});

test("desktop workspace uses the available screen without horizontal overflow", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 800 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(viewport);
    await openStudio(page);

    const layout = await page.evaluate(() => {
      const main = document.querySelector<HTMLElement>(".studio-main")!;
      const rect = main.getBoundingClientRect();
      return {
        mainLeft: Math.round(rect.left),
        mainRight: Math.round(rect.right),
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
      };
    });

    expect(layout.mainLeft).toBe(viewport.width <= 860 ? 0 : 106);
    expect(layout.mainRight).toBe(viewport.width);
    expect(layout.documentWidth).toBe(viewport.width);
  }
});

test("judge flow: revise, guard, approve, and export", async ({ page }) => {
  await openStudio(page);

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

test("campaign memory and intelligence library stay responsive", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openStudio(page);
  await expect(page.getByRole("heading", { name: "Fifty years of attention." })).toBeVisible();
  await page.getByTestId("nav-intelligence").click();
  await expect(page.getByRole("heading", { name: "The model remembers why people cared." })).toBeVisible();
  await expect(page.getByText("Pattern Library · R1", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Mean Joe Greene case study" })).toBeVisible();
  await page.getByRole("button", { name: "Personalization", exact: true }).click();
  await expect(page.getByRole("button", { name: "Open Wrapped case study" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Mean Joe Greene case study" })).toHaveCount(0);

  const layout = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));
  expect(layout.documentWidth).toBe(layout.viewportWidth);
});

test("brand team can create a campaign and move work through the studio", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openStudio(page);
  await page.getByTestId("nav-builder").click();
  await expect(page.getByRole("heading", { name: "From brand truth to a team-ready system." })).toBeVisible();

  await page.getByTestId("builder-step-2").click();
  await page.getByTestId("campaign-challenge").fill("Launch a sustainable product with visible material proof");
  await page.getByTestId("builder-step-3").click();
  await page.getByTestId("generate-directions").click();
  await expect(page.getByRole("heading", { name: "Let the proof look risky" })).toBeVisible();

  await page.getByTestId("builder-step-4").click();
  await expect(page.getByTestId("launch-blueprint")).toContainText("Let the proof look risky");
  await page.getByRole("button", { name: "Open team studio" }).click();
  await expect(page.getByRole("heading", { name: "One room for the work and the decisions." })).toBeVisible();

  await page.getByTestId("task-status-task-2").selectOption("Approved");
  await expect(page.getByTestId("task-status-task-2")).toHaveValue("Approved");
  await page.getByPlaceholder("Add a decision, question or feedback…").fill("Approved for the next production pass.");
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await expect(page.getByText("Approved for the next production pass.")).toBeVisible();

  const layout = await page.evaluate(() => ({ viewportWidth: innerWidth, documentWidth: document.documentElement.scrollWidth }));
  expect(layout.documentWidth).toBe(layout.viewportWidth);
});
