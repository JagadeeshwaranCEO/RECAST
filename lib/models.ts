import { z } from "zod";

export const FactSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  label: z.string().min(1),
  value: z.string(),
  version: z.number().int().positive(),
  status: z.enum(["approved", "superseded", "removed", "prohibited"]),
  approvedAt: z.string().nullable(),
});

export const ClaimSchema = z.object({
  id: z.string().min(1),
  factId: z.string().min(1),
  wording: z.string().min(1),
  approvalStatus: z.enum(["approved", "prohibited"]),
  evidence: z.string().min(1),
});

export const BrandRuleSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.string(),
  type: z.enum(["tone", "colour", "font", "cta", "date"]),
});

export const CreativeConceptSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  promise: z.string().min(1),
  metaphor: z.string().min(1),
  hook: z.string().min(1),
  contentPlan: z.array(z.string().min(1)).min(1),
  selected: z.boolean(),
});

export const AssetBlockSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["copy", "image", "logo", "scene"]),
  content: z.string(),
  template: z.string().optional(),
  removalContent: z.string().optional(),
  maxCharacters: z.number().int().positive().optional(),
  locked: z.boolean().default(false),
  integrityHash: z.string().optional(),
});

export const AssetSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  platform: z.enum(["Instagram", "LinkedIn"]),
  format: z.string().min(1),
  role: z.string().min(1),
  blocks: z.array(AssetBlockSchema).min(1),
});

export const DependencyEdgeSchema = z.object({
  id: z.string().min(1),
  factId: z.string().min(1),
  assetId: z.string().min(1),
  blockId: z.string().min(1),
  reason: z.string().min(1),
});

export const ApprovalSchema = z.object({
  id: z.string().min(1),
  assetId: z.string().min(1),
  status: z.enum(["approved", "stale", "needs_review"]),
  reviewer: z.string().nullable(),
  updatedAt: z.string(),
});

export const RevisionChangeSchema = z.object({
  assetId: z.string().min(1),
  blockId: z.string().min(1),
  blockLabel: z.string().min(1),
  before: z.string(),
  after: z.string(),
  reason: z.string().min(1),
});

export const RevisionSchema = z.object({
  id: z.string().min(1),
  createdAt: z.string(),
  author: z.string().min(1),
  baseCampaignVersion: z.number().int().positive(),
  campaignVersion: z.number().int().positive(),
  changedFactKey: z.string().min(1),
  previousFactId: z.string().min(1),
  nextFactId: z.string().min(1),
  before: z.string(),
  after: z.string(),
  affectedAssetIds: z.array(z.string()),
  preservedAssetIds: z.array(z.string()),
  changes: z.array(RevisionChangeSchema),
  reviewerState: z.enum(["pending", "approved"]),
  report: z.string().min(1),
});

export const ValidationResultSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  status: z.enum(["ready", "needs_review", "unsupported", "preserved", "stale"]),
  evidence: z.string().min(1),
  humanJudgment: z.boolean().default(false),
});

export const CampaignSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  brand: z.string().min(1),
  product: z.string().min(1),
  conceptLine: z.string().min(1),
  version: z.number().int().positive(),
  status: z.enum(["active", "review", "ready"]),
  facts: z.array(FactSchema),
  claims: z.array(ClaimSchema),
  brandRules: z.array(BrandRuleSchema),
  concepts: z.array(CreativeConceptSchema),
  assets: z.array(AssetSchema),
  dependencies: z.array(DependencyEdgeSchema),
  approvals: z.array(ApprovalSchema),
  revisions: z.array(RevisionSchema),
  baselineIntegrity: z.record(z.string(), z.string()),
});

export type Fact = z.infer<typeof FactSchema>;
export type Claim = z.infer<typeof ClaimSchema>;
export type BrandRule = z.infer<typeof BrandRuleSchema>;
export type CreativeConcept = z.infer<typeof CreativeConceptSchema>;
export type AssetBlock = z.infer<typeof AssetBlockSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type DependencyEdge = z.infer<typeof DependencyEdgeSchema>;
export type Approval = z.infer<typeof ApprovalSchema>;
export type Revision = z.infer<typeof RevisionSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type Campaign = z.infer<typeof CampaignSchema>;

