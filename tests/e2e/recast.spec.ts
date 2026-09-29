import { expect, test, type Page } from "@playwright/test";

async function openStudio(page: Page) {
  await page.addInitScript(() => window.sessionStorage.setItem("recast-intro-seen", "true"));
  await page.goto("/");
  await expect(page.getByTestId("site-intro")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Your day changes. Your style should keep up." })).toBeVisible();
}

test("cinematic intro welcomes the user and yields to the studio", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("site-intro")).toBeVisible();
  await expect(page.getByText("Scattered signals.")).toBeVisible();
  await page.getByTestId("skip-intro").click();
  await expect(page.getByTestId("site-intro")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Your day changes. Your style should keep up." })).toBeVisible();
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
  await page.getByTestId("approve-creative-quality").click();
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
  await expect(page.getByText("Pattern Library · R2", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Five archives. Five different jobs." })).toBeVisible();
  await page.getByTestId("research-source-drum").click();
  await expect(page.getByText("Effectiveness authority", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("Treat campaign metrics as submitted case evidence until the original measurement method or an independent result source is attached.")).toBeVisible();
  await page.getByTestId("research-source-dandad").click();
  await expect(page.getByRole("heading", { name: "D&AD", exact: true })).toBeVisible();
  await expect(page.getByText("Pencil", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Mean Joe Greene case study" })).toBeVisible();
  await page.getByRole("button", { name: "Personalization", exact: true }).click();
  await expect(page.getByRole("button", { name: "Open Wrapped case study" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Mean Joe Greene case study" })).toHaveCount(0);

  const layout = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));
  expect(layout.documentWidth).toBe(layout.viewportWidth);

  await page.setViewportSize({ width: 390, height: 844 });
  await openStudio(page);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByTestId("nav-intelligence").click();
  await page.getByTestId("research-source-ads-of-the-world").click();
  await expect(page.getByRole("heading", { name: "Ads of the World", exact: true })).toBeVisible();
  const mobileLayout = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));
  expect(mobileLayout.documentWidth).toBe(mobileLayout.viewportWidth);
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

test("studio switcher provides fast keyboard navigation", async ({ page }) => {
  await openStudio(page);
  await page.keyboard.press("Meta+k");
  await expect(page.getByTestId("studio-switcher")).toBeVisible();
  await page.getByPlaceholder("Search campaign tools…").fill("intelligence");
  await page.getByTestId("command-intelligence").click();
  await expect(page.getByRole("heading", { name: "The model remembers why people cared." })).toBeVisible();
});

test("runtime exposes a healthy, hardened deterministic service", async ({ page, request }) => {
  const health = await request.get("/api/health");
  expect(health.ok()).toBe(true);
  await expect(health.json()).resolves.toMatchObject({
    status: "ok",
    service: "recast-campaign-studio",
    mode: "deterministic-demo",
    storage: "browser-session",
    checks: { application: "ready", campaignEngine: "ready" },
  });
  expect(health.headers()["cache-control"]).toContain("no-store");

  const response = await page.goto("/");
  const headers = response?.headers() ?? {};
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["permissions-policy"]).toContain("camera=()");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
});

test("reset clears the session workspace and legacy browser data", async ({ page }) => {
  await openStudio(page);
  await page.getByTestId("nav-builder").click();
  await page.getByTestId("builder-step-2").click();
  await page.getByTestId("campaign-challenge").fill("Confidential launch idea for a shared demo device");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset campaign and clear local workspace" }).click();
  await page.getByTestId("nav-builder").click();
  await page.getByTestId("builder-step-2").click();
  await expect(page.getByTestId("campaign-challenge")).toHaveValue("Launch an adaptive menswear collection for people whose day changes without warning");

  const storage = await page.evaluate(() => ({
    legacy: localStorage.getItem("recast-brand-studio-v1"),
    current: sessionStorage.getItem("recast-brand-studio-v2"),
  }));
  expect(storage).toEqual({ legacy: null, current: null });
});
