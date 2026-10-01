import { describe, expect, it } from "vitest";
import {
  decodePublishedCampaignPayload,
  encodePublishedCampaignPayload,
  parsePublishedCampaignPayload,
} from "@/lib/published-campaign";

const payload = {
  brandName: "Northstar",
  productName: "Care Companion",
  headline: "CARE, CONNECTED.",
  subheadline: "NORTHSTAR / LAUNCH",
  cta: "Meet the companion",
  imageUrl: "/assets/stride-fashion-editorial-v2.jpg",
  backgroundColor: "#080c13",
  accentColor: "#63e6cb",
  proof: "Encrypted notes and shared reminders.",
  thesis: "Calm coordination for every care decision.",
  publishedAt: "2026-10-01T03:00:00.000Z",
};

describe("published campaign boundary", () => {
  it("round-trips a valid campaign share payload", () => {
    expect(decodePublishedCampaignPayload(encodePublishedCampaignPayload(payload))).toEqual(payload);
  });

  it("rejects type confusion instead of reaching the renderer", () => {
    expect(parsePublishedCampaignPayload({ ...payload, headline: 1 })).toBeNull();
  });

  it("rejects remote and traversal image sources", () => {
    expect(parsePublishedCampaignPayload({ ...payload, imageUrl: "https://tracker.example/pixel" })).toBeNull();
    expect(parsePublishedCampaignPayload({ ...payload, imageUrl: "/assets/../secret.png" })).toBeNull();
  });

  it("rejects oversized encoded payloads before decoding", () => {
    expect(decodePublishedCampaignPayload("A".repeat(12_001))).toBeNull();
  });
});
