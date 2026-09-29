"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { z } from "zod";
import { synthesizePatternIdeas, type PatternIdea } from "@/lib/campaign-intelligence";

export const WORKSPACE_STORAGE_KEY = "recast-brand-studio-v2";
export const LEGACY_WORKSPACE_STORAGE_KEY = "recast-brand-studio-v1";
export const WORKSPACE_INPUT_LIMITS = {
  brandName: 80,
  productName: 120,
  challenge: 500,
  audience: 300,
  objective: 300,
  promise: 220,
  proof: 800,
  tone: 180,
  market: 120,
  collaboratorName: 80,
  comment: 600,
} as const;

export type CampaignDraft = {
  brandName: string;
  productName: string;
  challenge: string;
  audience: string;
  objective: string;
  promise: string;
  proof: string;
  tone: string;
  market: string;
  deadline: string;
  channels: string[];
  primaryColor: string;
  accentColor: string;
};

export type TeamRole = "Brand lead" | "Strategist" | "Copywriter" | "Designer" | "Reviewer";
export type WorkStatus = "Brief" | "Making" | "Review" | "Approved";

export type TeamMember = {
  id: string;
  name: string;
  initials: string;
  role: TeamRole;
  presence: "online" | "away";
};

export type StudioTask = {
  id: string;
  title: string;
  ownerId: string;
  status: WorkStatus;
  due: string;
};

export type StudioComment = {
  id: string;
  author: string;
  initials: string;
  body: string;
  context: string;
  createdAt: string;
};

const CampaignDraftPatchSchema = z.object({
  brandName: z.string().max(WORKSPACE_INPUT_LIMITS.brandName).optional(),
  productName: z.string().max(WORKSPACE_INPUT_LIMITS.productName).optional(),
  challenge: z.string().max(WORKSPACE_INPUT_LIMITS.challenge).optional(),
  audience: z.string().max(WORKSPACE_INPUT_LIMITS.audience).optional(),
  objective: z.string().max(WORKSPACE_INPUT_LIMITS.objective).optional(),
  promise: z.string().max(WORKSPACE_INPUT_LIMITS.promise).optional(),
  proof: z.string().max(WORKSPACE_INPUT_LIMITS.proof).optional(),
  tone: z.string().max(WORKSPACE_INPUT_LIMITS.tone).optional(),
  market: z.string().max(WORKSPACE_INPUT_LIMITS.market).optional(),
  deadline: z.string().max(10).optional(),
  channels: z.array(z.string().min(1).max(40)).max(8).optional(),
  primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
}).strict();

const TeamRoleSchema = z.enum(["Brand lead", "Strategist", "Copywriter", "Designer", "Reviewer"]);
const WorkStatusSchema = z.enum(["Brief", "Making", "Review", "Approved"]);
const CollaboratorInputSchema = z.object({
  name: z.string().trim().min(1).max(WORKSPACE_INPUT_LIMITS.collaboratorName),
  role: TeamRoleSchema,
});
const CommentInputSchema = z.string().trim().min(1).max(WORKSPACE_INPUT_LIMITS.comment);

type WorkspaceState = {
  draft: CampaignDraft;
  ideas: PatternIdea[];
  selectedIdeaIndex: number;
  generatedAt: string | null;
  members: TeamMember[];
  tasks: StudioTask[];
  comments: StudioComment[];
  updateDraft: (patch: Partial<CampaignDraft>) => void;
  toggleChannel: (channel: string) => void;
  generateIdeas: () => void;
  selectIdea: (index: number) => void;
  addMember: (name: string, role: TeamRole) => void;
  moveTask: (id: string, status: WorkStatus) => void;
  addComment: (body: string) => void;
  resetWorkspace: () => void;
};

const initialDraft: CampaignDraft = {
  brandName: "Stride",
  productName: "New Formal Collection",
  challenge: "Launch an adaptive menswear collection for people whose day changes without warning",
  audience: "Hybrid workers and urban creators, 22–38",
  objective: "Build launch awareness and waitlist intent",
  promise: "One point of view that changes with the day",
  proof: "Three modular looks · water-resistant outer layer · launch price ₹2,499",
  tone: "Useful, observant, quietly confident",
  market: "India · English-first",
  deadline: "2026-10-30",
  channels: ["Instagram", "LinkedIn", "YouTube Shorts"],
  primaryColor: "#1d1c18",
  accentColor: "#e84b32",
};

const initialMembers: TeamMember[] = [
  { id: "member-1", name: "Jagadeeshwaran E", initials: "JE", role: "Brand lead", presence: "online" },
  { id: "member-2", name: "Mira Sen", initials: "MS", role: "Strategist", presence: "online" },
  { id: "member-3", name: "Aarav Shah", initials: "AS", role: "Designer", presence: "away" },
  { id: "member-4", name: "Anika Rao", initials: "AR", role: "Copywriter", presence: "online" },
];

const initialTasks: StudioTask[] = [
  { id: "task-1", title: "Lock campaign tension", ownerId: "member-2", status: "Approved", due: "Today" },
  { id: "task-2", title: "Write 12s launch film", ownerId: "member-4", status: "Making", due: "29 Sep" },
  { id: "task-3", title: "Design carousel system", ownerId: "member-3", status: "Review", due: "30 Sep" },
  { id: "task-4", title: "Approve launch claims", ownerId: "member-1", status: "Brief", due: "01 Oct" },
];

const initialComments: StudioComment[] = [
  {
    id: "comment-1",
    author: "Mira Sen",
    initials: "MS",
    body: "The strongest tension is not organization—it is the identity shift between work and everything after it.",
    context: "Campaign concept",
    createdAt: "2026-09-28T09:20:00.000Z",
  },
  {
    id: "comment-2",
    author: "Jagadeeshwaran E",
    initials: "JE",
    body: "Keep the price visible in conversion assets, but do not let it lead the launch story.",
    context: "Source of truth",
    createdAt: "2026-09-28T10:05:00.000Z",
  },
];

const initialIdeas = synthesizePatternIdeas(initialDraft.challenge);

function initialsFor(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "TM";
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      draft: initialDraft,
      ideas: initialIdeas,
      selectedIdeaIndex: 0,
      generatedAt: null,
      members: initialMembers,
      tasks: initialTasks,
      comments: initialComments,
      updateDraft: (patch) => {
        const parsed = CampaignDraftPatchSchema.safeParse(patch);
        if (!parsed.success) return;
        set((state) => ({ draft: { ...state.draft, ...parsed.data } }));
      },
      toggleChannel: (channel) => set((state) => ({
        draft: {
          ...state.draft,
          channels: state.draft.channels.includes(channel)
            ? state.draft.channels.filter((item) => item !== channel)
            : state.draft.channels.length < 8 ? [...state.draft.channels, channel] : state.draft.channels,
        },
      })),
      generateIdeas: () => {
        const ideas = synthesizePatternIdeas(get().draft.challenge);
        set({ ideas, selectedIdeaIndex: 0, generatedAt: new Date().toISOString() });
      },
      selectIdea: (index) => set((state) => ({ selectedIdeaIndex: Math.min(Math.max(index, 0), state.ideas.length - 1) })),
      addMember: (name, role) => {
        const parsed = CollaboratorInputSchema.safeParse({ name, role });
        if (!parsed.success) return;
        set((state) => ({
          members: state.members.length >= 24 ? state.members : [...state.members, { id: `member-${Date.now()}`, name: parsed.data.name, initials: initialsFor(parsed.data.name), role: parsed.data.role, presence: "online" }],
        }));
      },
      moveTask: (id, status) => {
        const parsed = WorkStatusSchema.safeParse(status);
        if (!parsed.success) return;
        set((state) => ({ tasks: state.tasks.map((task) => task.id === id ? { ...task, status: parsed.data } : task) }));
      },
      addComment: (body) => {
        const parsed = CommentInputSchema.safeParse(body);
        if (!parsed.success) return;
        set((state) => ({
          comments: state.comments.length >= 100 ? state.comments : [...state.comments, {
          id: `comment-${Date.now()}`,
          author: "Jagadeeshwaran E",
          initials: "JE",
          body: parsed.data,
          context: "Campaign room",
          createdAt: new Date().toISOString(),
        }],
        }));
      },
      resetWorkspace: () => set({
        draft: initialDraft,
        ideas: initialIdeas,
        selectedIdeaIndex: 0,
        generatedAt: null,
        members: initialMembers,
        tasks: initialTasks,
        comments: initialComments,
      }),
    }),
    {
      name: WORKSPACE_STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
