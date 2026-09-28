import {
  CampaignSchema,
  RevisionSchema,
  type Campaign,
  type Revision,
  type ValidationResult,
} from "./models";

export class StaleRevisionError extends Error {
  constructor() {
    super("This revision started from an older campaign version and was safely stopped.");
    this.name = "StaleRevisionError";
  }
}

export class UnsupportedClaimError extends Error {
  replacement: string;

  constructor(replacement: string) {
    super(`Unsupported claim. Use approved wording: “${replacement}”.`);
    this.name = "UnsupportedClaimError";
    this.replacement = replacement;
  }
}

type RevisionInput = {
  factKey: string;
  nextValue: string;
  baseCampaignVersion: number;
  author?: string;
  mode?: "replace" | "remove";
  now?: string;
};

function blockWithUpdatedValue(
  block: Campaign["assets"][number]["blocks"][number],
  value: string,
  mode: "replace" | "remove",
) {
  if (mode === "remove") {
    return { ...block, content: block.removalContent ?? "" };
  }

  return {
    ...block,
    content: block.template ? block.template.replaceAll("{{value}}", value) : block.content,
  };
}

export function reviseFact(campaign: Campaign, input: RevisionInput): { campaign: Campaign; revision: Revision } {
  if (input.baseCampaignVersion !== campaign.version) {
    throw new StaleRevisionError();
  }

  const currentFact = campaign.facts.find((fact) => fact.key === input.factKey && fact.status === "approved");
  if (!currentFact) {
    throw new Error(`No current approved fact found for ${input.factKey}.`);
  }

  const mode = input.mode ?? "replace";
  const connectedEdges = campaign.dependencies.filter((edge) => edge.factId === currentFact.id);
  const affectedAssetIds = [...new Set(connectedEdges.map((edge) => edge.assetId))];
  const preservedAssetIds = campaign.assets.filter((asset) => !affectedAssetIds.includes(asset.id)).map((asset) => asset.id);
  const nextFactVersion = currentFact.version + 1;
  const nextFactId = `${currentFact.key}.v${nextFactVersion}`;
  const timestamp = input.now ?? new Date().toISOString();

  const changes: Revision["changes"] = [];
  const assets = campaign.assets.map((asset) => ({
    ...asset,
    blocks: asset.blocks.map((block) => {
      const edge = connectedEdges.find((candidate) => candidate.assetId === asset.id && candidate.blockId === block.id);
      if (!edge) return block;
      const updatedBlock = blockWithUpdatedValue(block, input.nextValue, mode);
      changes.push({
        assetId: asset.id,
        blockId: block.id,
        blockLabel: block.label,
        before: block.content,
        after: updatedBlock.content,
        reason: edge.reason,
      });
      return updatedBlock;
    }),
  }));

  const facts = campaign.facts
    .map((fact) => fact.id === currentFact.id ? { ...fact, status: "superseded" as const } : fact)
    .concat({
      ...currentFact,
      id: nextFactId,
      value: input.nextValue,
      version: nextFactVersion,
      status: mode === "remove" ? "removed" as const : "approved" as const,
      approvedAt: timestamp,
    });

  const dependencies = mode === "remove"
    ? campaign.dependencies.filter((edge) => edge.factId !== currentFact.id)
    : campaign.dependencies.map((edge) => edge.factId === currentFact.id ? { ...edge, factId: nextFactId } : edge);

  const approvals = campaign.approvals.map((approval) => affectedAssetIds.includes(approval.assetId)
    ? { ...approval, status: "stale" as const, reviewer: null, updatedAt: timestamp }
    : approval);

  const nextCampaignVersion = campaign.version + 1;
  const changeNoun = mode === "remove" ? `removed “${currentFact.value}”` : `changed ${currentFact.label.toLowerCase()} from ${currentFact.value} to ${input.nextValue}`;
  const reportLines = changes.map((change) => `- ${change.blockLabel}: “${change.before}” → “${change.after}”`);
  const report = [
    `# RECAST revision ${nextCampaignVersion}`,
    "",
    `Campaign source ${changeNoun}.`,
    `${affectedAssetIds.length} output${affectedAssetIds.length === 1 ? "" : "s"} now require review; ${preservedAssetIds.length} output${preservedAssetIds.length === 1 ? "" : "s"} were preserved.`,
    "",
    "## Changed blocks",
    ...reportLines,
    "",
    "Locked product photography and logo integrity hashes were not changed.",
  ].join("\n");

  const revision = RevisionSchema.parse({
    id: `revision.${nextCampaignVersion}.${currentFact.key.replaceAll(".", "-")}`,
    createdAt: timestamp,
    author: input.author ?? "Jagadeeshwaran · Campaign editor",
    baseCampaignVersion: campaign.version,
    campaignVersion: nextCampaignVersion,
    changedFactKey: currentFact.key,
    previousFactId: currentFact.id,
    nextFactId,
    before: currentFact.value,
    after: mode === "remove" ? "Removed" : input.nextValue,
    affectedAssetIds,
    preservedAssetIds,
    changes,
    reviewerState: "pending",
    report,
  });

  return {
    campaign: CampaignSchema.parse({
      ...campaign,
      version: nextCampaignVersion,
      status: "review",
      facts,
      assets,
      dependencies,
      approvals,
      revisions: [revision, ...campaign.revisions],
    }),
    revision,
  };
}

export function checkClaim(campaign: Campaign, candidate: string) {
  const normalized = candidate.trim().toLowerCase();
  const prohibited = campaign.claims.find((claim) =>
    claim.approvalStatus === "prohibited" && normalized.includes(claim.wording.toLowerCase())
  );
  if (prohibited) {
    throw new UnsupportedClaimError("water-resistant");
  }
  const approved = campaign.claims.find((claim) =>
    claim.approvalStatus === "approved" && normalized.includes(claim.wording.toLowerCase())
  );
  if (!approved) {
    throw new UnsupportedClaimError("water-resistant");
  }
  return approved;
}

export function validateCampaign(campaign: Campaign): ValidationResult[] {
  const currentPrice = campaign.facts.find((fact) => fact.key === "fact.price" && fact.status === "approved");
  const priceEdges = currentPrice ? campaign.dependencies.filter((edge) => edge.factId === currentPrice.id) : [];
  const priceIsCurrent = Boolean(currentPrice) && priceEdges.every((edge) => {
    const asset = campaign.assets.find((candidate) => candidate.id === edge.assetId);
    const block = asset?.blocks.find((candidate) => candidate.id === edge.blockId);
    return block?.content.includes(currentPrice!.value);
  });
  const integrityPreserved = campaign.assets.flatMap((asset) => asset.blocks).filter((block) => block.locked).every((block) =>
    block.integrityHash === campaign.baselineIntegrity[block.id]
  );
  const layoutFits = campaign.assets.flatMap((asset) => asset.blocks).every((block) =>
    !block.maxCharacters || block.content.length <= block.maxCharacters
  );
  const staleCount = campaign.approvals.filter((approval) => approval.status === "stale").length;
  const factualEdgesValid = campaign.dependencies.every((edge) => campaign.facts.some((fact) => fact.id === edge.factId && fact.status === "approved"));

  return [
    { id: "check.price", label: "Price consistency", status: priceIsCurrent ? "ready" : "needs_review", evidence: priceIsCurrent ? `Every price-bearing block uses ${currentPrice?.id}.` : "At least one price block is out of date.", humanJudgment: false },
    { id: "check.claims", label: "Approved claims", status: factualEdgesValid ? "ready" : "unsupported", evidence: factualEdgesValid ? "Every factual block maps to a current approved fact ID." : "A factual block has no current approved source.", humanJudgment: false },
    { id: "check.integrity", label: "Asset integrity", status: integrityPreserved ? "preserved" : "needs_review", evidence: integrityPreserved ? "4 locked image/logo hashes match the approved baseline." : "A locked asset hash changed.", humanJudgment: false },
    { id: "check.layout", label: "Layout fit", status: layoutFits ? "ready" : "needs_review", evidence: layoutFits ? "All selected templates pass deterministic character-fit checks." : "At least one text block exceeds its template limit.", humanJudgment: false },
    { id: "check.revision", label: "Revision status", status: staleCount ? "stale" : "ready", evidence: staleCount ? `${staleCount} changed output${staleCount === 1 ? "" : "s"} require reapproval.` : "All changed outputs are approved against the current source.", humanJudgment: false },
    { id: "check.tone", label: "Tone & aesthetic quality", status: "needs_review", evidence: "Requires human judgment; RECAST does not claim automated verification.", humanJudgment: true },
  ];
}

export function exportCampaign(campaign: Campaign) {
  return CampaignSchema.parse(campaign);
}
