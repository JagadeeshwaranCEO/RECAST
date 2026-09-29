"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { AgentCouncilResult } from "@/lib/agent-orchestrator";

export type CreativeAssetKind = "Logo" | "Product" | "Campaign poster" | "Reference";

export type CreativeAsset = {
  id: string;
  name: string;
  kind: CreativeAssetKind;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
};

export type PosterFormat = "square" | "portrait" | "story" | "landscape";
export type PosterLayout = "editorial" | "split" | "minimal";

export type PosterDraft = {
  format: PosterFormat;
  layout: PosterLayout;
  headline: string;
  subheadline: string;
  cta: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  assetId: string;
};

export type LaunchPlan = {
  slug: string;
  status: "draft" | "scheduled" | "published";
  launchAt: string;
  channels: string[];
  publishedAt: string | null;
};

type ProductionState = {
  assets: CreativeAsset[];
  poster: PosterDraft;
  agentResult: AgentCouncilResult | null;
  launch: LaunchPlan;
  addAsset: (asset: CreativeAsset) => void;
  removeAsset: (id: string) => void;
  updatePoster: (patch: Partial<PosterDraft>) => void;
  setAgentResult: (result: AgentCouncilResult) => void;
  setLaunch: (patch: Partial<LaunchPlan>) => void;
  resetProduction: () => void;
};

const initialAssets: CreativeAsset[] = [
  {
    id: "asset-stride-editorial",
    name: "Stride editorial master",
    kind: "Campaign poster",
    mimeType: "image/jpeg",
    size: 584446,
    url: "/assets/stride-fashion-editorial-v2.jpg",
    createdAt: "2026-09-28T09:00:00.000Z",
  },
  {
    id: "asset-recast-mark",
    name: "RECAST studio mark",
    kind: "Logo",
    mimeType: "image/png",
    size: 1120000,
    url: "/recast-logo.png",
    createdAt: "2026-09-29T09:00:00.000Z",
  },
];

const initialPoster: PosterDraft = {
  format: "portrait",
  layout: "editorial",
  headline: "YOUR DAY CHANGES.\nYOUR STYLE SHOULD KEEP UP.",
  subheadline: "STRIDE / THE NEW FORMAL · LAUNCH 30 OCTOBER",
  cta: "Meet the collection",
  backgroundColor: "#080c13",
  accentColor: "#63e6cb",
  textColor: "#f4efe5",
  assetId: "asset-stride-editorial",
};

const initialLaunch: LaunchPlan = {
  slug: "stride-new-formal",
  status: "draft",
  launchAt: "2026-10-30T09:00",
  channels: ["Campaign page", "Instagram", "LinkedIn"],
  publishedAt: null,
};

export const PRODUCTION_STORAGE_KEY = "recast-production-studio-v1";

export const useProductionStore = create<ProductionState>()(
  persist(
    (set) => ({
      assets: initialAssets,
      poster: initialPoster,
      agentResult: null,
      launch: initialLaunch,
      addAsset: (asset) => set((state) => ({ assets: state.assets.length >= 8 ? state.assets : [...state.assets, asset] })),
      removeAsset: (id) => set((state) => ({
        assets: state.assets.filter((asset) => asset.id !== id || id.startsWith("asset-stride") || id.startsWith("asset-recast")),
        poster: state.poster.assetId === id ? { ...state.poster, assetId: "asset-stride-editorial" } : state.poster,
      })),
      updatePoster: (patch) => set((state) => ({ poster: { ...state.poster, ...patch } })),
      setAgentResult: (agentResult) => set({ agentResult }),
      setLaunch: (patch) => set((state) => ({ launch: { ...state.launch, ...patch } })),
      resetProduction: () => set({ assets: initialAssets, poster: initialPoster, agentResult: null, launch: initialLaunch }),
    }),
    {
      name: PRODUCTION_STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => sessionStorage),
      migrate: (persistedState, version) => version < 2
        ? { ...(persistedState as Partial<ProductionState>), agentResult: null, launch: initialLaunch }
        : persistedState as ProductionState,
      partialize: (state) => ({
        ...state,
        assets: state.assets.filter((asset) => !asset.url.startsWith("data:") || asset.size <= 1_500_000),
      }),
    },
  ),
);

export const posterDimensions: Record<PosterFormat, { width: number; height: number; label: string }> = {
  square: { width: 1080, height: 1080, label: "Instagram square · 1:1" },
  portrait: { width: 1080, height: 1350, label: "Feed portrait · 4:5" },
  story: { width: 1080, height: 1920, label: "Story / Reel · 9:16" },
  landscape: { width: 1200, height: 627, label: "LinkedIn / display · 1.91:1" },
};
