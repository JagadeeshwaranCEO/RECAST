"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { synthesizePatternIdeas, type PatternIdea } from "@/lib/campaign-intelligence";

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
  productName: "Modular Backpack",
  challenge: "Launch a modular backpack for people whose day changes without warning",
  audience: "Hybrid workers and urban creators, 22–38",
  objective: "Build launch awareness and waitlist intent",
  promise: "One carry system that changes with the day",
  proof: "18L modular system · water-resistant shell · launch price ₹2,499",
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
      updateDraft: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),
      toggleChannel: (channel) => set((state) => ({
        draft: {
          ...state.draft,
          channels: state.draft.channels.includes(channel)
            ? state.draft.channels.filter((item) => item !== channel)
            : [...state.draft.channels, channel],
        },
      })),
      generateIdeas: () => {
        const ideas = synthesizePatternIdeas(get().draft.challenge);
        set({ ideas, selectedIdeaIndex: 0, generatedAt: new Date().toISOString() });
      },
      selectIdea: (index) => set((state) => ({ selectedIdeaIndex: Math.min(Math.max(index, 0), state.ideas.length - 1) })),
      addMember: (name, role) => set((state) => ({
        members: [...state.members, { id: `member-${Date.now()}`, name: name.trim(), initials: initialsFor(name), role, presence: "online" }],
      })),
      moveTask: (id, status) => set((state) => ({ tasks: state.tasks.map((task) => task.id === id ? { ...task, status } : task) })),
      addComment: (body) => set((state) => ({
        comments: [...state.comments, {
          id: `comment-${Date.now()}`,
          author: "Jagadeeshwaran E",
          initials: "JE",
          body: body.trim(),
          context: "Campaign room",
          createdAt: new Date().toISOString(),
        }],
      })),
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
    { name: "recast-brand-studio-v1" },
  ),
);
