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
  await expect(page.getByTestId("site-intro")).toBeHidden();
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
  await page.keyboard.press("Meta+k");
  await page.getByTestId("command-intelligence").click();
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
  await page.goto("/?view=intelligence");
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
  await page.keyboard.press("Meta+k");
  await page.getByTestId("command-team").click();
  await expect(page.getByRole("heading", { name: "One room for the work and the decisions." })).toBeVisible();

  await page.getByTestId("task-status-task-2").selectOption("Approved");
  await expect(page.getByTestId("task-status-task-2")).toHaveValue("Approved");
  await page.getByPlaceholder("Add a decision, question or feedback…").fill("Approved for the next production pass.");
  await page.getByRole("button", { name: "Post", exact: true }).click();
  await expect(page.getByText("Approved for the next production pass.")).toBeVisible();

  const layout = await page.evaluate(() => ({ viewportWidth: innerWidth, documentWidth: document.documentElement.scrollWidth }));
  expect(layout.documentWidth).toBe(layout.viewportWidth);
});

test("production flow connects brand governance, agents, uploads, design, launch, and listening", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openStudio(page);

  await page.keyboard.press("Meta+k");
  await page.getByTestId("command-brandos").click();
  await expect(page.getByRole("heading", { name: "Make the brand usable. Then make it impossible to dilute." })).toBeVisible();
  await page.getByRole("button", { name: /Digital atelier/ }).click();
  await expect(page.getByText("Five systems, one campaign flow")).toBeVisible();

  await page.keyboard.press("Meta+k");
  await page.getByTestId("command-assets").click();
  await page.getByTestId("asset-upload").setInputFiles({
    name: "approved-product.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"),
  });
  await expect(page.getByText("approved-product.png", { exact: true })).toBeVisible();

  await page.getByTestId("nav-agents").click();
  await page.getByTestId("run-agent-council").click();
  await expect(page.getByText("Campaign thesis", { exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Scout/ })).toBeVisible();

  await page.getByTestId("nav-poster").click();
  await expect(page.getByTestId("poster-preview")).toBeVisible();
  await page.getByLabel("Headline").fill("ONE LOOK. EVERY TURN.");
  await expect(page.getByTestId("poster-preview")).toContainText("ONE LOOK. EVERY TURN.");

  await page.getByTestId("nav-publish").click();
  await expect(page.getByTestId("publish-campaign")).toBeDisabled();
  await expect(page.getByText(/Launch is intentionally locked/)).toBeVisible();
  await page.getByTestId("nav-review").click();
  await page.getByTestId("approve-creative-quality").click();
  await page.getByTestId("continue-to-launch").click();
  await page.getByTestId("publish-campaign").click();
  await expect(page.getByText(/Shareable campaign route is live/)).toBeVisible();
  const publishedLink = page.getByRole("link", { name: /Open published campaign/ });
  await expect(publishedLink).toBeVisible();
  const publishedHref = await publishedLink.getAttribute("href");
  expect(publishedHref).toContain("?campaign=");
  const sharedPage = await page.context().newPage();
  await sharedPage.goto(publishedHref!);
  await expect(sharedPage.getByRole("heading", { name: "ONE LOOK. EVERY TURN." })).toBeVisible();
  await expect(sharedPage.getByText("VERIFIED CAMPAIGN PROOF", { exact: true })).toBeVisible();
  await sharedPage.close();

  await page.keyboard.press("Meta+k");
  await page.getByTestId("command-radar").click();
  await expect(page.getByRole("heading", { name: "Launch is not the finish. The campaign learns in public." })).toBeVisible();
  await page.getByRole("button", { name: "risk", exact: true }).click();
  await expect(page.getByText("Claim clarity", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Add insight to agent brief/ }).click();
  await expect(page.getByText(/Signal added to the campaign brief/)).toBeVisible();

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

test("security boundaries reject oversized API input and malformed public campaigns", async ({ page, request }) => {
  const oversized = await request.post("/api/agents", {
    headers: { "content-type": "application/json" },
    data: { padding: "x".repeat(17_000) },
  });
  expect(oversized.status()).toBe(413);
  expect(oversized.headers()["cache-control"]).toContain("no-store");
  expect(oversized.headers()["x-request-id"]).toBeTruthy();

  const brief = {
    brandName: "Northstar",
    productName: "Care Companion",
    challenge: "Help care teams coordinate without losing the human context.",
    audience: "Family care teams",
    objective: "Create an evidence-led launch",
    promise: "Every care decision stays connected",
    proof: "Encrypted notes and shared reminders",
    tone: "Calm, precise, and humane",
    market: "India",
    channels: ["Instagram"],
  };
  const anonymousRun = await request.post("/api/agents", { data: brief });
  expect(anonymousRun.ok()).toBe(true);
  expect(anonymousRun.headers()["x-recast-agent-mode"]).toBe("local-fallback");
  expect(anonymousRun.headers()["x-request-id"]).toBeTruthy();

  const malformed = Buffer.from(JSON.stringify({ headline: 1, backgroundColor: "javascript:alert(1)" })).toString("base64url");
  await page.goto(`/c/security-regression?campaign=${malformed}`);
  await expect(page.getByRole("heading", { name: "YOUR DAY CHANGES. YOUR STYLE SHOULD KEEP UP." })).toBeVisible();
  await expect(page.getByText("Recovery mode", { exact: false })).toHaveCount(0);
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
    production: sessionStorage.getItem("recast-production-studio-v1"),
  }));
  expect(storage).toEqual({ legacy: null, current: null, production: null });
});
