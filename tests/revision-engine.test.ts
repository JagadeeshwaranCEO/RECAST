import { describe, expect, it } from "vitest";
import { CampaignSchema } from "@/lib/models";
import { createSeedCampaign } from "@/lib/seed";
import {
  checkClaim,
  exportCampaign,
  reviseFact,
  StaleRevisionError,
  UnsupportedClaimError,
  validateCampaign,
} from "@/lib/revision-engine";

describe("RECAST revision engine", () => {
  it("updates every block with an explicit price dependency", () => {
    const source = createSeedCampaign();
    const priceEdges = source.dependencies.filter((edge) => edge.factId === "fact.price.v1");
    const { campaign, revision } = reviseFact(source, {
      factKey: "fact.price",
      nextValue: "₹2,299",
      baseCampaignVersion: source.version,
      now: "2026-09-28T10:00:00.000Z",
    });

    expect(revision.changes).toHaveLength(priceEdges.length);
    expect(revision.affectedAssetIds).toEqual(["asset.reel", "asset.carousel"]);
    for (const edge of priceEdges) {
      const asset = campaign.assets.find((item) => item.id === edge.assetId);
      const block = asset?.blocks.find((item) => item.id === edge.blockId);
      expect(block?.content).toContain("₹2,299");
    }
    expect(campaign.dependencies.filter((edge) => edge.factId === "fact.price.v2")).toHaveLength(priceEdges.length);
  });

  it("preserves the unrelated LinkedIn design story after a price revision", () => {
    const source = createSeedCampaign();
    const before = source.assets.find((asset) => asset.id === "asset.linkedin");
    const { campaign } = reviseFact(source, { factKey: "fact.price", nextValue: "₹2,299", baseCampaignVersion: 1 });
    const after = campaign.assets.find((asset) => asset.id === "asset.linkedin");

    expect(after).toEqual(before);
    expect(campaign.approvals.find((approval) => approval.assetId === "asset.linkedin")?.status).toBe("approved");
  });

  it("keeps every locked product image hash unchanged", () => {
    const source = createSeedCampaign();
    const { campaign } = reviseFact(source, { factKey: "fact.price", nextValue: "₹2,299", baseCampaignVersion: 1 });
    for (const block of campaign.assets.flatMap((asset) => asset.blocks).filter((item) => item.locked)) {
      expect(block.integrityHash).toBe(campaign.baselineIntegrity[block.id]);
    }
  });

  it("rejects completely waterproof because it is not an approved claim", () => {
    const source = createSeedCampaign();
    expect(() => checkClaim(source, "Make it completely waterproof")).toThrow(UnsupportedClaimError);
    expect(() => checkClaim(source, "Make it water-resistant for changing weather")).not.toThrow();
  });

  it("prevents a stale revision job from overwriting a newer campaign", () => {
    const source = createSeedCampaign();
    const { campaign } = reviseFact(source, { factKey: "fact.price", nextValue: "₹2,299", baseCampaignVersion: 1 });
    expect(() => reviseFact(campaign, { factKey: "fact.price", nextValue: "₹2,199", baseCampaignVersion: 1 })).toThrow(StaleRevisionError);
  });

  it("exports campaign data that validates and serializes as JSON", () => {
    const source = createSeedCampaign();
    const exported = exportCampaign(source);
    const serialized = JSON.stringify(exported);
    expect(() => JSON.parse(serialized)).not.toThrow();
    expect(CampaignSchema.safeParse(JSON.parse(serialized)).success).toBe(true);
  });

  it("keeps automated evidence checks separate from human creative approval", () => {
    const checks = validateCampaign(createSeedCampaign());
    const revision = checks.find((check) => check.id === "check.revision");
    const tone = checks.find((check) => check.id === "check.tone");

    expect(revision?.status).toBe("ready");
    expect(revision?.evidence).toContain("current source");
    expect(revision?.evidence).not.toContain("approved for export");
    expect(tone).toMatchObject({ status: "needs_review", humanJudgment: true });
  });
});
