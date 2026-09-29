import { describe, expect, it } from "vitest";
import { AgentCouncilResultSchema, agentSystemPrompt, runLocalCampaignCouncil } from "@/lib/agent-orchestrator";

const brief = {
  brandName: "Northstar Health",
  productName: "Care Companion",
  challenge: "Help families coordinate daily care without adding more administrative work",
  audience: "Caregivers and working families",
  objective: "Create qualified trial intent",
  promise: "Every care decision in one calm place",
  proof: "Encrypted notes · shared reminders · human support during business hours",
  tone: "Calm, precise and reassuring",
  market: "India · English and Hindi",
  channels: ["Instagram", "LinkedIn", "Email"],
};

describe("campaign agent council", () => {
  it("creates a governed six-agent plan for brands outside fashion", () => {
    const result = runLocalCampaignCouncil(brief);
    expect(AgentCouncilResultSchema.safeParse(result).success).toBe(true);
    expect(result.findings).toHaveLength(6);
    expect(result.findings.map((item) => item.role)).toEqual([
      "Research agent",
      "Strategy agent",
      "Copy agent",
      "Art direction agent",
      "Claims agent",
      "Activation agent",
    ]);
    expect(result.channelPlan.map((item) => item.channel)).toEqual(brief.channels);
    expect(result.campaignThesis).toContain("Northstar Health");
    expect(result.campaignThesis).toContain("Care Companion");
  });

  it("keeps unapproved claims outside the model instructions", () => {
    const prompt = agentSystemPrompt(brief);
    expect(prompt).toContain("Never invent product claims");
    expect(prompt).toContain("APPROVED PROOF: Encrypted notes");
    expect(prompt).toContain("CHANNELS: Instagram, LinkedIn, Email");
  });
});
