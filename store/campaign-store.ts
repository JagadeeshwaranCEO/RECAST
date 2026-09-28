"use client";

import { create } from "zustand";
import { createSeedCampaign } from "@/lib/seed";
import { reviseFact } from "@/lib/revision-engine";
import type { Campaign } from "@/lib/models";

export type StudioView = "home" | "builder" | "intelligence" | "team" | "source" | "concepts" | "canvas" | "revision" | "review";

type CampaignState = {
  campaign: Campaign;
  view: StudioView;
  notice: string | null;
  humanApproval: boolean;
  setView: (view: StudioView) => void;
  revisePrice: (nextPrice: string) => void;
  removeRecycledClaim: () => void;
  approveAsset: (assetId: string) => void;
  approveAffected: () => void;
  approveCreativeQuality: () => void;
  updateBrandRule: (id: string, value: string) => void;
  selectConcept: (id: string) => void;
  clearNotice: () => void;
  resetDemo: () => void;
};

function finalizeApprovalState(campaign: Campaign): Campaign {
  const pending = campaign.approvals.some((approval) => approval.status !== "approved");
  const latestRevision = campaign.revisions[0];
  return {
    ...campaign,
    status: pending ? "review" : "ready",
    revisions: campaign.revisions.map((revision) => revision.id === latestRevision?.id && !pending
      ? { ...revision, reviewerState: "approved" as const }
      : revision),
  };
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaign: createSeedCampaign(),
  view: "home",
  notice: null,
  humanApproval: false,
  setView: (view) => set({ view }),
  revisePrice: (nextPrice) => {
    const source = get().campaign;
    const result = reviseFact(source, {
      factKey: "fact.price",
      nextValue: nextPrice,
      baseCampaignVersion: source.version,
    });
    set({ campaign: result.campaign, view: "revision", humanApproval: false, notice: "Price revision mapped across the campaign." });
  },
  removeRecycledClaim: () => {
    const source = get().campaign;
    const result = reviseFact(source, {
      factKey: "claim.recycled-nylon",
      nextValue: "",
      baseCampaignVersion: source.version,
      mode: "remove",
    });
    set({ campaign: result.campaign, view: "revision", humanApproval: false, notice: "Recycled nylon claim removed from connected blocks only." });
  },
  approveAsset: (assetId) => set((state) => ({
    campaign: finalizeApprovalState({
      ...state.campaign,
      approvals: state.campaign.approvals.map((approval) => approval.assetId === assetId
        ? { ...approval, status: "approved" as const, reviewer: "Jagadeeshwaran · Reviewer", updatedAt: new Date().toISOString() }
        : approval),
    }),
    notice: "Output approved against the latest campaign source.",
  })),
  approveAffected: () => set((state) => ({
    campaign: finalizeApprovalState({
      ...state.campaign,
      approvals: state.campaign.approvals.map((approval) => approval.status === "stale"
        ? { ...approval, status: "approved" as const, reviewer: "Jagadeeshwaran · Reviewer", updatedAt: new Date().toISOString() }
        : approval),
    }),
    notice: "All affected outputs are approved against the current source.",
  })),
  approveCreativeQuality: () => set({
    humanApproval: true,
    notice: "Creative quality signed off by the human reviewer.",
  }),
  updateBrandRule: (id, value) => set((state) => ({
    campaign: {
      ...state.campaign,
      brandRules: state.campaign.brandRules.map((rule) => rule.id === id ? { ...rule, value } : rule),
    },
    notice: "Brand rule saved locally.",
  })),
  selectConcept: (id) => set((state) => {
    const selected = state.campaign.concepts.find((concept) => concept.id === id);
    return {
      campaign: {
        ...state.campaign,
        conceptLine: selected?.title ?? state.campaign.conceptLine,
        concepts: state.campaign.concepts.map((concept) => ({ ...concept, selected: concept.id === id })),
      },
      notice: selected ? `“${selected.title}” selected as the campaign concept.` : null,
    };
  }),
  clearNotice: () => set({ notice: null }),
  resetDemo: () => set({ campaign: createSeedCampaign(), view: "home", humanApproval: false, notice: "Demo campaign restored to its approved source." }),
}));
