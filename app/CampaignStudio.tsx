"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleDot,
  Command,
  Download,
  FileCheck2,
  GitBranch,
  Home,
  Layers3,
  LayoutTemplate,
  Link2,
  LockKeyhole,
  Menu,
  PanelTop,
  PenLine,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { checkClaim, exportCampaign, UnsupportedClaimError, validateCampaign } from "@/lib/revision-engine";
import type { Asset, Campaign, ValidationResult } from "@/lib/models";
import { type StudioView, useCampaignStore } from "@/store/campaign-store";

const navItems: { id: StudioView; label: string; icon: typeof Home; short: string }[] = [
  { id: "home", label: "Campaign home", icon: Home, short: "Home" },
  { id: "source", label: "Source of truth", icon: FileCheck2, short: "Source" },
  { id: "concepts", label: "Creative concepts", icon: Sparkles, short: "Concept" },
  { id: "canvas", label: "Campaign canvas", icon: LayoutTemplate, short: "Canvas" },
  { id: "revision", label: "Revision studio", icon: GitBranch, short: "Revise" },
  { id: "review", label: "Review & publish", icon: ShieldCheck, short: "Review" },
];

const viewTitles: Record<StudioView, { eyebrow: string; title: string; note: string }> = {
  home: { eyebrow: "Campaign 01 · Active", title: "Stride Modular Backpack Launch", note: "One campaign source · Three connected outputs" },
  source: { eyebrow: "01 · Campaign source", title: "Brief & source of truth", note: "Approved facts control factual copy" },
  concepts: { eyebrow: "02 · Creative direction", title: "Choose one campaign idea", note: "Strategy before production" },
  canvas: { eyebrow: "03 · Connected output", title: "Campaign canvas", note: "Every claim has a source" },
  revision: { eyebrow: "04 · Selective revision", title: "Change meaning, not files", note: "Only dependent blocks move" },
  review: { eyebrow: "05 · Quality control", title: "Review & publish readiness", note: "Evidence before export" },
};

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function downloadFile(name: string, content: string, type = "text/plain") {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.replaceAll("_", " ");
  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return <span className={cx("status-pill", `status-${status}`)}><span className="status-dot" />{label}</span>;
}

function BackpackArt({ scene = "desk", compact = false }: { scene?: "desk" | "transit" | "weekend"; compact?: boolean }) {
  return (
    <div className={cx("scene-art", `scene-${scene}`, compact && "scene-compact")} aria-label={`Stride backpack in ${scene} setting`} role="img">
      <div className="scene-word">{scene === "desk" ? "WORK" : scene === "transit" ? "MOVE" : "ROAM"}</div>
      <div className="scene-line scene-line-one" />
      <div className="scene-line scene-line-two" />
      <div className="bag-shadow" />
      <div className="bag-wrap">
        <div className="bag-handle" />
        <div className="bag-body">
          <div className="bag-brand">STRIDE</div>
          <div className="bag-seam" />
          <div className="bag-pocket"><span /></div>
          <div className="bag-tab" />
        </div>
        <div className="bag-strap bag-strap-left" />
        <div className="bag-strap bag-strap-right" />
      </div>
      <div className="scene-caption">{scene === "desk" ? "09:10 / focused" : scene === "transit" ? "17:42 / in motion" : "07:20 / off-grid"}</div>
    </div>
  );
}

function AppSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const view = useCampaignStore((state) => state.view);
  const setView = useCampaignStore((state) => state.setView);
  return (
    <aside className={cx("sidebar", open && "sidebar-open")} aria-label="Studio navigation">
      <button className="sidebar-close" onClick={onClose} aria-label="Close navigation"><X size={20} /></button>
      <button className="brand-mark" onClick={() => setView("home")} aria-label="RECAST home">
        <span>R</span><i />
      </button>
      <nav className="sidebar-nav">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={cx("nav-button", view === item.id && "nav-active")}
              onClick={() => { setView(item.id); onClose(); }}
              aria-label={item.label}
              aria-current={view === item.id ? "page" : undefined}
              data-testid={`nav-${item.id}`}
            >
              <span className="nav-index">0{index + 1}</span>
              <Icon size={19} strokeWidth={1.7} />
              <span>{item.short}</span>
            </button>
          );
        })}
      </nav>
      <div className="sidebar-foot"><span>PX</span><span className="online-dot" /></div>
    </aside>
  );
}

function AppHeader({ onMenu }: { onMenu: () => void }) {
  const { campaign, view, resetDemo } = useCampaignStore();
  const meta = viewTitles[view];
  return (
    <header className="app-header">
      <button className="mobile-menu" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button>
      <div className="header-title">
        <span>{meta.eyebrow}</span>
        <strong>{meta.title}</strong>
      </div>
      <div className="header-meta">
        <span className="source-version"><CircleDot size={13} /> Source v{campaign.version}</span>
        <span className="header-note">{meta.note}</span>
        <button className="icon-button" onClick={resetDemo} aria-label="Reset demo campaign" title="Reset demo"><RotateCcw size={17} /></button>
        <span className="avatar">JE</span>
      </div>
    </header>
  );
}

function CampaignHome() {
  const { campaign, setView } = useCampaignStore();
  const reviewCount = campaign.approvals.filter((item) => item.status !== "approved").length;
  const currentFacts = campaign.facts.filter((fact) => fact.status === "approved").length;
  return (
    <div className="view home-view page-enter">
      <section className="campaign-intro">
        <div>
          <div className="micro-label">LIVE CAMPAIGN / STRIDE 01</div>
          <h1>Your day changes.<br /><em>Your bag should keep up.</em></h1>
          <p>One modular carry system, told differently across every context — and governed by the same approved source.</p>
        </div>
        <div className="intro-actions">
          <button className="button button-primary" onClick={() => setView("revision")}>
            Revise campaign <ArrowUpRight size={17} />
          </button>
          <button className="button button-quiet" onClick={() => setView("canvas")}>Open canvas <ArrowRight size={16} /></button>
        </div>
      </section>

      <section className="timeline-shell" aria-label="Campaign visual timeline">
        <div className="timeline-heading">
          <span>Campaign film · 12 sec</span>
          <div><span className="tiny-live" /> Concept locked</div>
        </div>
        <div className="scene-grid">
          <div className="scene-item"><BackpackArt scene="desk" /><div className="scene-meta"><span>01</span><strong>Desk</strong><small>Built for focus</small></div></div>
          <div className="scene-item"><BackpackArt scene="transit" /><div className="scene-meta"><span>02</span><strong>Transit</strong><small>Modular in motion</small></div></div>
          <div className="scene-item"><BackpackArt scene="weekend" /><div className="scene-meta"><span>03</span><strong>Weekend</strong><small>18L, off the clock</small></div></div>
        </div>
        <div className="timeline-track"><i /><i /><i /></div>
      </section>

      <section className="health-grid">
        <div className="health-title">
          <span className="micro-label">Campaign health</span>
          <strong>{reviewCount ? "Revision in review" : "One source. Fully aligned."}</strong>
        </div>
        <button onClick={() => setView("source")} className="health-stat">
          <span>Approved facts</span><strong>{currentFacts}</strong><small>Current source <ChevronRight size={14} /></small>
        </button>
        <button onClick={() => setView("canvas")} className="health-stat">
          <span>Outputs ready</span><strong>{campaign.assets.length - reviewCount}<i>/{campaign.assets.length}</i></strong><small>Connected canvas <ChevronRight size={14} /></small>
        </button>
        <button onClick={() => setView("review")} className="health-stat health-review">
          <span>Needs review</span><strong>{reviewCount}</strong><small>{reviewCount ? "Approval changed" : "Nothing outstanding"} <ChevronRight size={14} /></small>
        </button>
      </section>

      <section className="logic-strip">
        <div><Command size={18} /><span>RECAST logic</span></div>
        <p>Facts drive blocks. Blocks shape outputs. Creative that has no dependency stays untouched.</p>
        <button onClick={() => setView("revision")}>See the graph <ArrowRight size={15} /></button>
      </section>
    </div>
  );
}

function SourceTruth() {
  const { campaign, updateBrandRule } = useCampaignStore();
  const currentFacts = campaign.facts.filter((fact) => ["approved", "prohibited"].includes(fact.status));
  return (
    <div className="view page-enter">
      <div className="section-lead">
        <div><span className="micro-label">CONTROLLED INPUT</span><h1>The facts creative can trust.</h1></div>
        <p>Every factual statement has an owner, version and approval state. This is the campaign’s editable source — not another buried brief.</p>
      </div>
      <div className="source-layout">
        <section className="source-panel">
          <div className="panel-heading"><div><span>Product brief</span><strong>Stride / Launch source</strong></div><StatusPill status="ready" /></div>
          <div className="brief-grid">
            <label><span>Brand</span><input value={campaign.brand} readOnly /></label>
            <label><span>Product</span><input value={campaign.product} readOnly /></label>
            <label className="brief-wide"><span>Campaign concept</span><input value={campaign.conceptLine} readOnly /></label>
            {campaign.brandRules.filter((rule) => !["colour"].includes(rule.type)).map((rule) => (
              <label key={rule.id} className={rule.type === "tone" ? "brief-wide" : ""}>
                <span>{rule.label}</span>
                <input
                  type={rule.type === "date" ? "date" : "text"}
                  value={rule.value}
                  onChange={(event) => updateBrandRule(rule.id, event.target.value)}
                />
              </label>
            ))}
          </div>
          <div className="colour-row">
            <span>Brand colours</span>
            {campaign.brandRules.filter((rule) => rule.type === "colour").map((rule) => (
              <label key={rule.id} className="colour-input"><i style={{ background: rule.value }} /><span>{rule.label}</span><input aria-label={`${rule.label} colour`} value={rule.value} onChange={(event) => updateBrandRule(rule.id, event.target.value)} /></label>
            ))}
          </div>
        </section>

        <section className="fact-panel">
          <div className="panel-heading"><div><span>Source registry</span><strong>{currentFacts.length} controlled facts</strong></div><Link2 size={17} /></div>
          <div className="fact-list">
            {currentFacts.map((fact) => {
              const isProhibited = fact.status === "prohibited";
              const links = campaign.dependencies.filter((edge) => edge.factId === fact.id).length;
              return (
                <article className={cx("fact-row", isProhibited && "fact-prohibited")} key={fact.id}>
                  <div className="fact-icon">{isProhibited ? <CircleAlert size={17} /> : <Check size={16} />}</div>
                  <div><span>{fact.label}</span><strong>{fact.value}</strong><code>{fact.id}</code></div>
                  <div className="fact-links"><strong>{links}</strong><span>{links === 1 ? "link" : "links"}</span></div>
                  <StatusPill status={isProhibited ? "unsupported" : "ready"} />
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function ConceptSelection() {
  const { campaign, selectConcept, setView } = useCampaignStore();
  return (
    <div className="view page-enter">
      <div className="section-lead compact-lead">
        <div><span className="micro-label">CREATIVE STRATEGY</span><h1>One idea. Three different jobs.</h1></div>
        <p>Select the narrative spine before outputs are produced. Every channel gets a distinct storytelling role — not resized copy.</p>
      </div>
      <div className="concept-grid">
        {campaign.concepts.map((concept, index) => (
          <button key={concept.id} className={cx("concept-card", concept.selected && "concept-selected")} onClick={() => selectConcept(concept.id)} aria-pressed={concept.selected}>
            <div className="concept-top"><span>Direction 0{index + 1}</span>{concept.selected ? <span className="selected-mark"><Check size={14} /> Selected</span> : <span>Select direction</span>}</div>
            <div className={`concept-art concept-art-${index + 1}`}><BackpackArt scene={index === 0 ? "transit" : "desk"} compact /><span className="concept-number">0{index + 1}</span></div>
            <h2>{concept.title}</h2>
            <p>{concept.promise}</p>
            <dl>
              <div><dt>Visual metaphor</dt><dd>{concept.metaphor}</dd></div>
              <div><dt>Hook</dt><dd>{concept.hook}</dd></div>
            </dl>
            <div className="concept-plan">{concept.contentPlan.map((item) => <span key={item}>{item}</span>)}</div>
          </button>
        ))}
      </div>
      <div className="concept-footer"><div><CheckCircle2 size={18} /><span>Selected concept will govern all production prompts and review checks.</span></div><button className="button button-primary" onClick={() => setView("canvas")}>Produce connected outputs <ArrowRight size={17} /></button></div>
    </div>
  );
}

function DependencyChips({ campaign, blockId }: { campaign: Campaign; blockId: string }) {
  const edges = campaign.dependencies.filter((edge) => edge.blockId === blockId);
  if (!edges.length) return <span className="dependency-none">Creative only · no factual dependency</span>;
  return <div className="dependency-chips">{edges.map((edge) => <code key={edge.id}><Link2 size={11} />{edge.factId}</code>)}</div>;
}

function AssetPreview({ asset, campaign }: { asset: Asset; campaign: Campaign }) {
  if (asset.id === "asset.reel") {
    return (
      <div className="reel-preview">
        <div className="phone-stage"><BackpackArt scene="transit" compact /><span className="reel-time">00:07 / 00:12</span></div>
        <div className="scene-script">{asset.blocks.filter((block) => block.type !== "image").map((block, index) => <div key={block.id}><span>0{index + 1}</span><p>{block.content}</p><DependencyChips campaign={campaign} blockId={block.id} /></div>)}</div>
      </div>
    );
  }
  if (asset.id === "asset.carousel") {
    return <div className="carousel-preview">{asset.blocks.filter((block) => block.type === "copy").map((block, index) => <div className={`carousel-slide slide-${index + 1}`} key={block.id}><span>0{index + 1}</span>{index > 0 && <div className="mini-bag"><BackpackArt scene={index === 1 ? "desk" : index === 2 ? "weekend" : "transit"} compact /></div>}<strong>{block.content}</strong><DependencyChips campaign={campaign} blockId={block.id} /></div>)}</div>;
  }
  return (
    <div className="linkedin-preview">
      <div className="linkedin-profile"><span>S</span><div><strong>Stride Design</strong><small>Product company · Just now</small></div></div>
      {asset.blocks.filter((block) => block.type === "copy").map((block, index) => <div key={block.id} className="linkedin-block"><p className={index === 0 ? "linkedin-hook" : ""}>{block.content}</p><DependencyChips campaign={campaign} blockId={block.id} /></div>)}
      <div className="linkedin-visual"><BackpackArt scene="desk" compact /><span>DESIGNED FOR<br />THE DAY BETWEEN<br />THE PLANS.</span></div>
    </div>
  );
}

function CampaignCanvas() {
  const { campaign, setView } = useCampaignStore();
  const [activeAsset, setActiveAsset] = useState(campaign.assets[0].id);
  const asset = campaign.assets.find((candidate) => candidate.id === activeAsset) ?? campaign.assets[0];
  const approval = campaign.approvals.find((item) => item.assetId === asset.id);
  return (
    <div className="view page-enter canvas-view">
      <div className="canvas-toolbar">
        <div className="asset-tabs" role="tablist" aria-label="Campaign outputs">
          {campaign.assets.map((item) => <button key={item.id} className={cx(activeAsset === item.id && "asset-tab-active")} onClick={() => setActiveAsset(item.id)} role="tab" aria-selected={activeAsset === item.id}><span>{item.platform}</span>{item.title}<i /></button>)}
        </div>
        <button className="button button-primary button-small" onClick={() => setView("revision")}><PenLine size={15} /> Revise source</button>
      </div>
      <div className="canvas-layout">
        <section className="asset-stage">
          <div className="asset-stage-header"><div><span>{asset.format}</span><h2>{asset.title}</h2><p>{asset.role}</p></div><StatusPill status={approval?.status ?? "needs_review"} /></div>
          <AssetPreview asset={asset} campaign={campaign} />
        </section>
        <aside className="inspector">
          <div className="inspector-title"><div><span>Logic inspector</span><strong>{asset.blocks.length} content blocks</strong></div><Layers3 size={18} /></div>
          <div className="block-list">
            {asset.blocks.map((block) => (
              <article key={block.id}>
                <div className="block-row"><span className={cx("block-type", block.locked && "block-locked")}>{block.locked ? <LockKeyhole size={13} /> : <Link2 size={13} />}</span><div><strong>{block.label}</strong><small>{block.type}{block.locked ? " · immutable" : " · editable"}</small></div></div>
                <p>{block.content}</p>
                {block.locked ? <code className="hash-code">{block.integrityHash}</code> : <DependencyChips campaign={campaign} blockId={block.id} />}
              </article>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function RevisionStudio() {
  const { campaign, revisePrice, removeRecycledClaim, setView } = useCampaignStore();
  const [price, setPrice] = useState("₹2,299");
  const [claim, setClaim] = useState("Make it completely waterproof");
  const [claimState, setClaimState] = useState<"idle" | "unsupported" | "approved">("idle");
  const [claimMessage, setClaimMessage] = useState("");
  const currentPrice = campaign.facts.find((fact) => fact.key === "fact.price" && fact.status === "approved");
  const recycledCurrent = campaign.facts.some((fact) => fact.key === "claim.recycled-nylon" && fact.status === "approved");
  const latest = campaign.revisions[0];
  const priceEdges = campaign.dependencies.filter((edge) => edge.factId === currentPrice?.id || edge.factId.startsWith("fact.price.v"));

  function onCheckClaim() {
    try {
      const approved = checkClaim(campaign, claim);
      setClaimState("approved");
      setClaimMessage(`Mapped to ${approved.factId}. This wording is supported.`);
    } catch (error) {
      if (error instanceof UnsupportedClaimError) {
        setClaimState("unsupported");
        setClaimMessage("No approved waterproof evidence exists. The source supports “water-resistant” only.");
      } else {
        setClaimState("unsupported");
        setClaimMessage("This claim could not be validated against the approved source.");
      }
    }
  }

  return (
    <div className="view page-enter revision-view">
      <div className="revision-grid">
        <section className="revision-controls">
          <div className="micro-label">EDIT CAMPAIGN SOURCE</div>
          <h1>One change.<br /><em>Only where it belongs.</em></h1>
          <p>RECAST traces the dependency graph before it touches any output. Locked work remains locked.</p>

          <div className="revision-control-card">
            <div className="control-label"><span>01 · Pricing fact</span><code>{currentPrice?.id}</code></div>
            <label htmlFor="price-input">Approved launch price</label>
            <div className="price-control"><input id="price-input" data-testid="price-input" value={price} onChange={(event) => setPrice(event.target.value)} /><button data-testid="apply-price" onClick={() => revisePrice(price)} disabled={price === currentPrice?.value}>Apply to campaign <ArrowRight size={16} /></button></div>
            <div className="impact-preview"><GitBranch size={15} /><span>{priceEdges.length || 2} connected blocks will update</span><span>1 output preserved</span></div>
          </div>

          <div className="revision-control-card compact-control">
            <div><span className="control-label"><span>02 · Claim removal</span></span><strong>Recycled nylon exterior</strong><p>Remove this approved fact and rewrite only connected blocks.</p></div>
            <button className="button button-outline" onClick={removeRecycledClaim} disabled={!recycledCurrent}>{recycledCurrent ? "Remove claim" : "Claim removed"}</button>
          </div>

          <div className={cx("claim-guard", claimState === "unsupported" && "guard-warning", claimState === "approved" && "guard-approved")}>
            <div className="control-label"><span>03 · Claim guard</span><ShieldCheck size={16} /></div>
            <label htmlFor="claim-input">Requested campaign wording</label>
            <textarea id="claim-input" data-testid="claim-input" value={claim} onChange={(event) => { setClaim(event.target.value); setClaimState("idle"); }} />
            <button className="button button-dark" onClick={onCheckClaim} data-testid="check-claim">Check against source</button>
            {claimState !== "idle" && <div className="claim-result" data-testid={claimState === "unsupported" ? "claim-warning" : "claim-approved"}>{claimState === "unsupported" ? <CircleAlert size={19} /> : <CheckCircle2 size={19} />}<div><strong>{claimState === "unsupported" ? "Unsupported claim" : "Approved wording"}</strong><p>{claimMessage}</p>{claimState === "unsupported" && <button data-testid="use-approved" onClick={() => { setClaim("Make it water-resistant for changing weather"); setClaimState("approved"); setClaimMessage("Mapped to claim.water-resistant.v1. Approved replacement is ready."); }}>Use approved replacement <ArrowRight size={14} /></button>}</div></div>}
          </div>
        </section>

        <section className="revision-results">
          <div className="result-header"><div><span className="micro-label">DEPENDENCY MAP</span><h2>{latest ? `${latest.changes.length} blocks changed` : "Ready to trace a change"}</h2></div>{latest && <StatusPill status="needs_review" />}</div>
          {!latest ? (
            <div className="empty-revision"><GitBranch size={32} /><strong>No pending revision</strong><p>Change the price to see the campaign graph light up.</p></div>
          ) : (
            <>
              <div className="fact-transition"><div><span>Before</span><code>{latest.previousFactId}</code><strong>{latest.before}</strong></div><ArrowRight size={20} /><div className="fact-new"><span>Current</span><code>{latest.nextFactId}</code><strong>{latest.after}</strong></div></div>
              <div className="dependency-map">
                <div className="map-source"><span>Source v{latest.campaignVersion}</span><strong>{latest.changedFactKey}</strong><small>{latest.nextFactId}</small></div>
                <div className="map-lines"><i /><i /><i /></div>
                <div className="map-targets">
                  {latest.changes.map((change) => {
                    const asset = campaign.assets.find((item) => item.id === change.assetId);
                    return <article key={`${latest.id}-${change.blockId}`} data-testid="affected-output"><div><span className="changed-dot" /><div><small>{asset?.title}</small><strong>{change.blockLabel}</strong></div><StatusPill status="stale" /></div><p>{change.reason}</p><div className="diff"><del>{change.before}</del><ins>{change.after || "Block removed"}</ins></div></article>;
                  })}
                  {latest.preservedAssetIds.map((assetId) => {
                    const asset = campaign.assets.find((item) => item.id === assetId);
                    return <article key={assetId} className="preserved-card"><div><span className="preserved-dot"><LockKeyhole size={12} /></span><div><small>Unrelated output</small><strong>{asset?.title}</strong></div><StatusPill status="preserved" /></div><p>No dependency on {latest.previousFactId}. Content and approval remain untouched.</p></article>;
                  })}
                </div>
              </div>
              <div className="integrity-note"><LockKeyhole size={16} /><div><strong>Protected assets did not move</strong><span>Product photography and logo hashes match the approved baseline.</span></div><Check size={16} /></div>
              <button className="button button-primary review-button" onClick={() => setView("review")}>Review changed outputs <ArrowRight size={16} /></button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function ValidationRow({ result }: { result: ValidationResult }) {
  return <article className="validation-row"><span className={cx("validation-icon", `validation-${result.status}`)}>{result.status === "ready" || result.status === "preserved" ? <Check size={16} /> : result.status === "unsupported" ? <X size={16} /> : <CircleAlert size={16} />}</span><div><strong>{result.label}{result.humanJudgment && <i>Human</i>}</strong><p>{result.evidence}</p></div><StatusPill status={result.status} /></article>;
}

function ReviewPublish() {
  const { campaign, approveAsset, approveAffected } = useCampaignStore();
  const checks = useMemo(() => validateCampaign(campaign), [campaign]);
  const latest = campaign.revisions[0];
  const stale = campaign.approvals.filter((approval) => approval.status === "stale");
  const linkedin = campaign.assets.find((asset) => asset.id === "asset.linkedin");

  const downloadCampaign = () => downloadFile("recast-stride-campaign.json", JSON.stringify(exportCampaign(campaign), null, 2), "application/json");
  const downloadRevision = () => downloadFile("recast-revision-report.md", latest?.report ?? "# RECAST revision report\n\nNo revision has been created yet.", "text/markdown");
  const downloadLinkedIn = () => downloadFile("stride-linkedin-post.txt", linkedin?.blocks.filter((block) => block.type === "copy").map((block) => block.content).join("\n\n") ?? "");

  return (
    <div className="view page-enter review-view">
      <div className="review-hero">
        <div><span className="micro-label">PUBLISH READINESS</span><h1>{stale.length ? "The change is sound.\nThe decision is yours." : "Campaign ready.\nEvery source is current."}</h1><p>Machine checks show evidence. Tone and visual quality stay explicitly human.</p></div>
        <div className={cx("readiness-seal", !stale.length && "seal-ready")}><span>{stale.length ? `${stale.length}` : <Check size={38} />}</span><strong>{stale.length ? "outputs need review" : "approved to export"}</strong><small>Campaign source v{campaign.version}</small></div>
      </div>
      <div className="review-layout">
        <section className="check-panel">
          <div className="panel-heading"><div><span>Quality gates</span><strong>Checks with evidence</strong></div><ShieldCheck size={18} /></div>
          <div className="validation-list">{checks.map((check) => <ValidationRow key={check.id} result={check} />)}</div>
        </section>
        <section className="approval-panel">
          <div className="panel-heading"><div><span>Human approval</span><strong>Changed outputs only</strong></div><span>{stale.length} pending</span></div>
          <div className="approval-list">
            {campaign.assets.map((asset) => {
              const approval = campaign.approvals.find((item) => item.assetId === asset.id)!;
              return <article key={asset.id}><div className="approval-art"><BackpackArt scene={asset.id === "asset.reel" ? "transit" : asset.id === "asset.carousel" ? "weekend" : "desk"} compact /></div><div><small>{asset.platform} · {asset.format}</small><strong>{asset.title}</strong><span>{approval.status === "approved" ? `Approved by ${approval.reviewer}` : "Source changed · previous approval is stale"}</span></div>{approval.status === "stale" ? <button onClick={() => approveAsset(asset.id)}>Approve <Check size={14} /></button> : <StatusPill status={latest?.preservedAssetIds.includes(asset.id) ? "preserved" : "ready"} />}</article>;
            })}
          </div>
          {stale.length > 0 && <button className="button button-primary approve-all" onClick={approveAffected} data-testid="approve-all">Approve {stale.length} affected output{stale.length === 1 ? "" : "s"} <Check size={16} /></button>}
        </section>
      </div>

      <section className="export-panel">
        <div><span className="micro-label">EXPORT DESK</span><h2>Take the approved campaign with you.</h2><p>Portable source, audit trail and channel copy. Nothing is trapped in RECAST.</p></div>
        <div className="export-actions">
          <button onClick={downloadCampaign}><Download size={17} /><span><strong>Campaign brief</strong><small>Validated JSON</small></span></button>
          <button onClick={downloadRevision} data-testid="export-revision"><Download size={17} /><span><strong>Revision report</strong><small>Markdown audit trail</small></span></button>
          <button onClick={downloadLinkedIn}><Download size={17} /><span><strong>LinkedIn post</strong><small>Plain text</small></span></button>
          <button onClick={() => downloadFile("stride-reel-preview.txt", "SIMULATED PREVIEW EXPORT\n\n12-second Stride context-shift reel scene plan. Connect a renderer for final MP4 output.")}><PanelTop size={17} /><span><strong>Reel preview</strong><small>Simulated export · TXT</small></span></button>
        </div>
      </section>

      <section className="history-panel">
        <div className="panel-heading"><div><span>Revision history</span><strong>{campaign.revisions.length || "No"} campaign change{campaign.revisions.length === 1 ? "" : "s"}</strong></div><GitBranch size={17} /></div>
        {campaign.revisions.length ? campaign.revisions.map((revision) => <article key={revision.id}><span className="history-index">v{revision.campaignVersion}</span><div><strong>{revision.changedFactKey}</strong><p>{revision.before} <ArrowRight size={12} /> {revision.after}</p></div><div><strong>{revision.affectedAssetIds.length} affected</strong><p>{new Date(revision.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</p></div><StatusPill status={revision.reviewerState === "approved" ? "ready" : "needs_review"} /></article>) : <div className="history-empty">Revision history will appear after the campaign source changes.</div>}
      </section>
    </div>
  );
}

function CurrentView() {
  const view = useCampaignStore((state) => state.view);
  if (view === "source") return <SourceTruth />;
  if (view === "concepts") return <ConceptSelection />;
  if (view === "canvas") return <CampaignCanvas />;
  if (view === "revision") return <RevisionStudio />;
  if (view === "review") return <ReviewPublish />;
  return <CampaignHome />;
}

export function CampaignStudio() {
  const [loading, setLoading] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const { notice, clearNotice } = useCampaignStore();

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 260);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(clearNotice, 3200);
    return () => window.clearTimeout(timer);
  }, [notice, clearNotice]);

  if (loading) {
    return <main className="loading-screen"><div className="loading-mark">R<i /></div><p>Connecting campaign source</p><span><i /></span></main>;
  }

  return (
    <div className="studio-shell">
      <AppSidebar open={navOpen} onClose={() => setNavOpen(false)} />
      {navOpen && <button className="nav-scrim" onClick={() => setNavOpen(false)} aria-label="Close navigation overlay" />}
      <div className="studio-main">
        <AppHeader onMenu={() => setNavOpen(true)} />
        <main className="content-frame"><CurrentView /></main>
      </div>
      {notice && <div className="toast" role="status"><CheckCircle2 size={18} /><span>{notice}</span><button onClick={clearNotice} aria-label="Dismiss"><X size={15} /></button></div>}
    </div>
  );
}
