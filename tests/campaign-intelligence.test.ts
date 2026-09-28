import { describe, expect, it } from "vitest";
import { campaignCases, synthesizePatternIdeas } from "@/lib/campaign-intelligence";

describe("campaign intelligence library", () => {
  it("covers the last five decades with cited, original analysis", () => {
    expect(campaignCases.length).toBeGreaterThanOrEqual(12);
    expect(Math.min(...campaignCases.map((item) => item.year))).toBeLessThanOrEqual(1979);
    expect(Math.max(...campaignCases.map((item) => item.year))).toBeGreaterThanOrEqual(2025);
    expect(campaignCases.every((item) => item.sourceUrl.startsWith("https://"))).toBe(true);
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
