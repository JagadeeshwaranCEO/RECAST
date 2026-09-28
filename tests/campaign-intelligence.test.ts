import { describe, expect, it } from "vitest";
import { campaignCases, getEvidenceProfile, researchArchives, synthesizePatternIdeas } from "@/lib/campaign-intelligence";

describe("campaign intelligence library", () => {
  it("covers a 47-year cited research span with original analysis", () => {
    expect(campaignCases.length).toBeGreaterThanOrEqual(12);
    const firstYear = Math.min(...campaignCases.map((item) => item.year));
    const lastYear = Math.max(...campaignCases.map((item) => item.year));
    expect(lastYear - firstYear + 1).toBe(47);
    expect(campaignCases.every((item) => item.sourceUrl.startsWith("https://"))).toBe(true);
  });

  it("keeps discovery, award and effectiveness archives in distinct evidence roles", () => {
    expect(researchArchives).toHaveLength(5);
    expect(researchArchives.every((archive) => archive.url.startsWith("https://"))).toBe(true);
    expect(researchArchives.find((archive) => archive.id === "love-the-work-more")?.role).toBe("Discovery mirror");
    expect(researchArchives.find((archive) => archive.id === "drum")?.role).toBe("Effectiveness authority");
    expect(researchArchives.filter((archive) => archive.role === "Award authority").map((archive) => archive.id)).toEqual(["one-show", "dandad"]);
    expect(new Set(researchArchives.map((archive) => archive.caution)).size).toBe(5);
  });

  it("exposes the evidence boundary for each campaign case", () => {
    const moldyWhopper = campaignCases.find((campaign) => campaign.id === "moldy-whopper")!;
    const likeAGirl = campaignCases.find((campaign) => campaign.id === "like-a-girl")!;

    expect(getEvidenceProfile(moldyWhopper)).toEqual({
      sourceClass: "Independent reporting",
      resultStatus: "Mechanic evidence only",
      awardStatus: "2 official award records",
    });
    expect(getEvidenceProfile(likeAGirl).resultStatus).toBe("Measured outcome cited");
    expect(getEvidenceProfile(likeAGirl).awardStatus).toBe("1 official award record");
  });

  it("retrieves proof-led patterns for a product evidence brief", () => {
    const ideas = synthesizePatternIdeas("Launch a sustainable product with material proof");
    expect(ideas).toHaveLength(3);
    expect(ideas[0].title).toBe("Let the proof look risky");
    expect(ideas[0].inspiredBy).toContain("Moldy Whopper");
  });

  it("retrieves participation patterns for a community brief", () => {
    const ideas = synthesizePatternIdeas("Help a creator community share a weekly ritual");
    expect(ideas[0].mechanic).toContain("nomination");
    expect(ideas.map((item) => item.title)).toContain("Turn use into identity");
  });
});
