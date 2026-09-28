"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleDot,
  Command,
  Download,
  ExternalLink,
  FileCheck2,
  GitBranch,
  Home,
  Layers3,
  LayoutTemplate,
  Link2,
  LockKeyhole,
  Menu,
  MessageSquare,
  PanelTop,
  Palette,
  PenLine,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { campaignCases, campaignDisciplines, synthesizePatternIdeas } from "@/lib/campaign-intelligence";
import { checkClaim, exportCampaign, UnsupportedClaimError, validateCampaign } from "@/lib/revision-engine";
import type { Asset, Campaign, ValidationResult } from "@/lib/models";
import { type StudioView, useCampaignStore } from "@/store/campaign-store";
import { type TeamRole, type WorkStatus, useWorkspaceStore } from "@/store/workspace-store";

const navItems: { id: StudioView; label: string; icon: typeof Home; short: string }[] = [
  { id: "home", label: "Campaign home", icon: Home, short: "Home" },
  { id: "builder", label: "Create a campaign", icon: Plus, short: "Create" },
  { id: "intelligence", label: "Campaign intelligence", icon: BookOpen, short: "Memory" },
  { id: "source", label: "Source of truth", icon: FileCheck2, short: "Source" },
  { id: "concepts", label: "Creative concepts", icon: Sparkles, short: "Concept" },
  { id: "canvas", label: "Campaign canvas", icon: LayoutTemplate, short: "Canvas" },
  { id: "team", label: "Team studio", icon: Users, short: "Team" },
  { id: "revision", label: "Revision studio", icon: GitBranch, short: "Revise" },
  { id: "review", label: "Review & publish", icon: ShieldCheck, short: "Review" },
];

const viewTitles: Record<StudioView, { eyebrow: string; title: string; note: string }> = {
  home: { eyebrow: "Campaign 01 · Active", title: "Stride Modular Backpack Launch", note: "One campaign source · Three connected outputs" },
  builder: { eyebrow: "New campaign · Guided build", title: "Campaign builder", note: "Brand, brief, strategy and delivery" },
  intelligence: { eyebrow: "Pattern library · R1", title: "Campaign intelligence", note: "Five decades of creative mechanics" },
  team: { eyebrow: "Studio room · 4 collaborators", title: "Team workspace", note: "Roles, feedback and approval flow" },
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

function CampaignMemoryScroll({ onOpen }: { onOpen: () => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const [phase, setPhase] = useState(0);
  const memories = campaignCases.filter((item) => item.deepDive).slice(0, 6);
  const statements = [
    ["Fifty years of attention.", "Not a swipe file—a map of why people cared."],
    ["Hooks are only the surface.", "Underneath: tension, identity, proof, ritual and a reason to pass it on."],
    ["Memory becomes method.", "RECAST retrieves the pattern, then rebuilds it around your truth."],
  ];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const stickyOffset = window.innerWidth <= 860 ? 74 : 86;
      const travel = Math.max(1, rect.height - window.innerHeight + stickyOffset);
      const progress = reduceMotion ? 1 : Math.min(1, Math.max(0, (stickyOffset - rect.top) / travel));
      section.style.setProperty("--memory-progress", progress.toFixed(3));
      const nextPhase = progress < 0.34 ? 0 : progress < 0.68 ? 1 : 2;
      setPhase((current) => current === nextPhase ? current : nextPhase);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section className="memory-scroll" ref={sectionRef} aria-label="Five decades of campaign intelligence">
      <div className="memory-sticky">
        <div className="memory-kicker"><span>RECAST / CAMPAIGN MEMORY</span><span>1979—2025</span></div>
        <div className="memory-collage" aria-hidden="true">
          {memories.map((campaign, index) => (
            <article className={`memory-card memory-card-${index + 1}`} key={campaign.id} style={{ "--memory-accent": campaign.accent } as React.CSSProperties}>
              <span>{campaign.year}</span>
              <strong>{campaign.name}</strong>
              <small>{campaign.mechanic}</small>
            </article>
          ))}
        </div>
        <div className="memory-message" key={phase}>
          <span>0{phase + 1} / 03</span>
          <h2>{statements[phase][0]}</h2>
          <p>{statements[phase][1]}</p>
        </div>
        <div className="memory-progress" aria-hidden="true"><i /></div>
        <button className="memory-cta" onClick={onOpen}>Explore the intelligence library <ArrowRight size={16} /></button>
      </div>
    </section>
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
          <button className="button button-primary" onClick={() => setView("builder")}>
            Create a campaign <Plus size={17} />
          </button>
          <button className="button button-outline" onClick={() => setView("revision")}>
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

      <CampaignMemoryScroll onOpen={() => setView("intelligence")} />
    </div>
  );
}

function CampaignIntelligence() {
  const [discipline, setDiscipline] = useState<(typeof campaignDisciplines)[number]>("All");
  const [activeId, setActiveId] = useState("mean-joe");
  const [challenge, setChallenge] = useState("Launch a modular backpack for people whose day changes without warning");
  const [ideas, setIdeas] = useState(() => synthesizePatternIdeas(challenge));
  const active = campaignCases.find((item) => item.id === activeId) ?? campaignCases[0];
  const filtered = discipline === "All" ? campaignCases : campaignCases.filter((item) => item.discipline === discipline);

  return (
    <div className="view intelligence-view page-enter">
      <section className="intelligence-hero">
        <div>
          <span className="micro-label">RESEARCH-GROUNDED CREATIVE MEMORY</span>
          <h1>The model remembers<br /><em>why people cared.</em></h1>
        </div>
        <div className="intelligence-intro">
          <p>RECAST turns landmark campaigns into reusable mechanics—not copy to imitate. Every pattern stays linked to the source, the cultural tension and the evidence that made it work.</p>
          <div className="corpus-stats">
            <div><strong>47</strong><span>years studied</span></div>
            <div><strong>{campaignCases.length}</strong><span>campaign cases</span></div>
            <div><strong>8</strong><span>creative mechanics</span></div>
          </div>
        </div>
      </section>

      <section className="method-strip">
        <div><BookOpen size={18} /><strong>Pattern Library · R1</strong></div>
        <p>This working prototype uses a cited retrieval layer to steer ideation. It does not claim that these campaigns trained a foundation model.</p>
        <span>Sources attached</span>
      </section>

      <section className="archive-section">
        <div className="archive-heading">
          <div><span className="micro-label">THE CAMPAIGN ARCHIVE</span><h2>Five decades. Eight ways into culture.</h2></div>
          <div className="archive-search"><Search size={15} /><span>Filter the underlying mechanic</span></div>
        </div>
        <div className="discipline-filter" aria-label="Filter campaigns by creative mechanic">
          {campaignDisciplines.map((item) => (
            <button key={item} className={cx(discipline === item && "filter-active")} onClick={() => setDiscipline(item)} aria-pressed={discipline === item}>{item}</button>
          ))}
        </div>
        <div className="archive-grid">
          {filtered.map((campaign, index) => (
            <article className={cx("archive-card", active.id === campaign.id && "archive-card-active")} key={campaign.id} style={{ "--case-accent": campaign.accent } as React.CSSProperties}>
              <button className="archive-card-main" onClick={() => setActiveId(campaign.id)} aria-label={`Open ${campaign.name} case study`}>
                <div className="archive-poster"><span>{campaign.year}</span><strong>{campaign.name}</strong><small>{campaign.brand}</small><i>{String(index + 1).padStart(2, "0")}</i></div>
                <div className="archive-copy"><span>{campaign.discipline}</span><h3>{campaign.hook}</h3><p>{campaign.mechanic}</p></div>
              </button>
              <a href={campaign.sourceUrl} target="_blank" rel="noreferrer">{campaign.sourceLabel}<ExternalLink size={12} /></a>
            </article>
          ))}
        </div>
      </section>

      <section className="case-file" aria-live="polite">
        <div className="case-index"><span>CASE FILE</span><strong>{active.year}</strong><small>{active.brand}</small></div>
        <div className="case-main">
          <div className="case-title"><span>{active.discipline} / {active.mechanic}</span><h2>{active.name}</h2><p>{active.hook}</p></div>
          <div className="case-columns">
            <article><span>WHAT IT DID</span><p>{active.originalMove}</p></article>
            <article><span>WHY IT TRAVELLED</span><p>{active.whyItWorked}</p><small>{active.evidence}</small></article>
            <article className="case-recast"><span>IF RECAST HAD BEEN THERE</span><p>{active.recastLift}</p></article>
          </div>
          <div className="case-logic" aria-label="RECAST campaign pattern flow">
            <span>cultural signal</span><ArrowRight size={14} /><span>creative tension</span><ArrowRight size={14} /><span>channel roles</span><ArrowRight size={14} /><span>evidence lock</span>
          </div>
          <a className="case-source" href={active.sourceUrl} target="_blank" rel="noreferrer">Read the cited source · {active.sourceLabel}<ExternalLink size={13} /></a>
        </div>
      </section>

      <section className="pattern-lab">
        <div className="pattern-lab-intro">
          <span className="micro-label">PATTERN SYNTHESIS LAB</span>
          <h2>Do not copy the campaign.<br /><em>Transfer the intelligence.</em></h2>
          <p>Describe a campaign challenge. RECAST retrieves useful mechanics, rewrites them around the new truth and keeps the historical inspiration visible.</p>
          <label htmlFor="pattern-brief">Campaign challenge</label>
          <textarea id="pattern-brief" value={challenge} onChange={(event) => setChallenge(event.target.value)} />
          <button className="button button-primary" onClick={() => setIdeas(synthesizePatternIdeas(challenge))}><Sparkles size={16} /> Synthesize three directions</button>
        </div>
        <div className="pattern-results">
          {ideas.map((idea, index) => (
            <article key={`${idea.title}-${index}`}>
              <span>0{index + 1} · {idea.mechanic}</span>
              <h3>{idea.title}</h3>
              <blockquote>{idea.hook}</blockquote>
              <p>{idea.rationale}</p>
              <small>Pattern trace · {idea.inspiredBy}</small>
            </article>
          ))}
        </div>
      </section>

      <footer className="research-footer">
        <span>RECAST / CAMPAIGN INTELLIGENCE R1</span>
        <p>Research is a launchpad for original thinking—not a license to reproduce protected creative.</p>
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Back to top ↑</button>
      </footer>
    </div>
  );
}

const builderSteps = [
  { id: 1, label: "Brand DNA", note: "Identity and voice", icon: Palette },
  { id: 2, label: "Campaign brief", note: "Problem and proof", icon: Target },
  { id: 3, label: "Creative system", note: "Patterns and channels", icon: Sparkles },
  { id: 4, label: "Launch blueprint", note: "Team-ready plan", icon: FileCheck2 },
];

const availableChannels = ["Instagram", "LinkedIn", "YouTube Shorts", "Email", "X", "Out-of-home"];

function channelRole(channel: string) {
  const roles: Record<string, string> = {
    Instagram: "Visual hook + saveable story",
    LinkedIn: "Design reasoning + authority",
    "YouTube Shorts": "12-second tension-to-proof film",
    Email: "Launch narrative + conversion",
    X: "Provocation + conversation loop",
    "Out-of-home": "Single-minded memory structure",
  };
  return roles[channel] ?? "Channel-specific campaign role";
}

function CampaignBuilder() {
  const { setView } = useCampaignStore();
  const { draft, ideas, selectedIdeaIndex, generatedAt, updateDraft, toggleChannel, generateIdeas, selectIdea } = useWorkspaceStore();
  const [step, setStep] = useState(1);
  const selectedIdea = ideas[selectedIdeaIndex] ?? ideas[0];
  const readiness = [
    Boolean(draft.brandName && draft.productName && draft.tone),
    Boolean(draft.challenge && draft.audience && draft.objective && draft.proof),
    Boolean(draft.channels.length && ideas.length),
    Boolean(selectedIdea),
  ];

  const exportBlueprint = () => downloadFile("recast-campaign-blueprint.json", JSON.stringify({
    brand: draft,
    direction: selectedIdea,
    outputs: draft.channels.map((channel) => ({ channel, role: channelRole(channel) })),
    generatedAt: generatedAt ?? new Date().toISOString(),
    provenance: "RECAST Pattern Library R1",
  }, null, 2), "application/json");

  return (
    <div className="view builder-view page-enter">
      <section className="builder-hero">
        <div><span className="micro-label">END-TO-END CAMPAIGN CREATION</span><h1>From brand truth<br /><em>to a team-ready system.</em></h1></div>
        <div><p>Build one campaign source, retrieve useful creative mechanics, assign every channel a job and hand the work to a studio with approvals already attached.</p><span><i /> Saved locally in this workspace</span></div>
      </section>

      <div className="builder-layout">
        <aside className="builder-steps" aria-label="Campaign builder steps">
          <div className="builder-progress"><span>Build progress</span><strong>{readiness.filter(Boolean).length}/4</strong><i><b style={{ width: `${readiness.filter(Boolean).length * 25}%` }} /></i></div>
          {builderSteps.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={cx(step === item.id && "builder-step-active")} onClick={() => setStep(item.id)} aria-current={step === item.id ? "step" : undefined} data-testid={`builder-step-${item.id}`}>
                <span>0{item.id}</span><Icon size={17} /><div><strong>{item.label}</strong><small>{item.note}</small></div>{readiness[item.id - 1] && <Check size={14} />}
              </button>
            );
          })}
          <div className="builder-help"><BookOpen size={17} /><div><strong>Need inspiration?</strong><p>Open the campaign memory and bring a proven mechanic back into this brief.</p><button onClick={() => setView("intelligence")}>Browse intelligence <ArrowRight size={13} /></button></div></div>
        </aside>

        <section className="builder-panel">
          <div className="builder-panel-head"><div><span>STEP 0{step} / 04</span><h2>{builderSteps[step - 1].label}</h2></div><span>{readiness[step - 1] ? <><CheckCircle2 size={14} /> Complete</> : "In progress"}</span></div>

          {step === 1 && (
            <div className="builder-form page-enter">
              <div className="form-explainer"><strong>Teach RECAST the brand before asking it for ideas.</strong><p>These inputs become reusable guardrails for every campaign, output and revision.</p></div>
              <div className="field-grid">
                <label><span>Brand name</span><input value={draft.brandName} onChange={(event) => updateDraft({ brandName: event.target.value })} /></label>
                <label><span>Product or offer</span><input value={draft.productName} onChange={(event) => updateDraft({ productName: event.target.value })} /></label>
                <label className="field-wide"><span>Voice and tone</span><input value={draft.tone} onChange={(event) => updateDraft({ tone: event.target.value })} /></label>
                <label><span>Market / language</span><input value={draft.market} onChange={(event) => updateDraft({ market: event.target.value })} /></label>
                <div className="brand-colours"><span>Brand colours</span><label><input type="color" value={draft.primaryColor} onChange={(event) => updateDraft({ primaryColor: event.target.value })} /><strong>{draft.primaryColor}</strong></label><label><input type="color" value={draft.accentColor} onChange={(event) => updateDraft({ accentColor: event.target.value })} /><strong>{draft.accentColor}</strong></label></div>
              </div>
              <div className="brand-preview" style={{ "--brand-primary": draft.primaryColor, "--brand-accent": draft.accentColor } as React.CSSProperties}><span>{draft.brandName || "YOUR BRAND"}</span><strong>{draft.productName || "Campaign system"}</strong><small>{draft.tone || "Define the voice"}</small><i /></div>
            </div>
          )}

          {step === 2 && (
            <div className="builder-form page-enter">
              <div className="form-explainer"><strong>A sharp brief gives creativity something to push against.</strong><p>Separate the human problem, business objective and approved proof so the model knows where it can invent—and where it cannot.</p></div>
              <div className="field-grid brief-fields">
                <label className="field-wide"><span>Campaign challenge</span><textarea data-testid="campaign-challenge" value={draft.challenge} onChange={(event) => updateDraft({ challenge: event.target.value })} /></label>
                <label><span>Audience</span><textarea value={draft.audience} onChange={(event) => updateDraft({ audience: event.target.value })} /></label>
                <label><span>Business objective</span><textarea value={draft.objective} onChange={(event) => updateDraft({ objective: event.target.value })} /></label>
                <label className="field-wide"><span>Single-minded promise</span><input value={draft.promise} onChange={(event) => updateDraft({ promise: event.target.value })} /></label>
                <label className="field-wide"><span>Approved proof / claims</span><textarea value={draft.proof} onChange={(event) => updateDraft({ proof: event.target.value })} /></label>
                <label><span>Launch deadline</span><input type="date" value={draft.deadline} onChange={(event) => updateDraft({ deadline: event.target.value })} /></label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="builder-form page-enter">
              <div className="channel-picker"><div><span className="micro-label">CHANNEL JOBS</span><h3>Choose where this campaign must work.</h3></div><div>{availableChannels.map((channel) => <button key={channel} onClick={() => toggleChannel(channel)} className={cx(draft.channels.includes(channel) && "channel-active")} aria-pressed={draft.channels.includes(channel)}>{draft.channels.includes(channel) && <Check size={13} />}{channel}</button>)}</div></div>
              <div className="generation-bar"><div><Sparkles size={19} /><span><strong>Pattern Engine · R1</strong><small>Uses your challenge to retrieve useful campaign mechanics.</small></span></div><button className="button button-primary" onClick={generateIdeas} data-testid="generate-directions">Generate directions <ArrowRight size={15} /></button></div>
              <div className="generated-directions">
                {ideas.map((idea, index) => (
                  <button key={idea.title} onClick={() => selectIdea(index)} className={cx(selectedIdeaIndex === index && "direction-active")} aria-pressed={selectedIdeaIndex === index}>
                    <span>0{index + 1} · {idea.mechanic}</span><h3>{idea.title}</h3><p>{idea.hook}</p><small>{idea.inspiredBy}</small>{selectedIdeaIndex === index && <i><Check size={13} /> Selected</i>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="launch-blueprint page-enter" data-testid="launch-blueprint">
              <div className="blueprint-cover" style={{ "--brand-primary": draft.primaryColor, "--brand-accent": draft.accentColor } as React.CSSProperties}>
                <span>{draft.brandName} / CAMPAIGN BLUEPRINT</span><h3>{selectedIdea.title}</h3><p>{selectedIdea.hook}</p><div><small>Promise</small><strong>{draft.promise}</strong></div>
              </div>
              <div className="blueprint-detail">
                <div className="blueprint-meta"><div><span>Audience</span><strong>{draft.audience}</strong></div><div><span>Objective</span><strong>{draft.objective}</strong></div><div><span>Launch</span><strong>{draft.deadline}</strong></div></div>
                <div className="output-plan"><span className="micro-label">CHANNEL ARCHITECTURE</span>{draft.channels.map((channel, index) => <article key={channel}><span>0{index + 1}</span><div><strong>{channel}</strong><small>{channelRole(channel)}</small></div><CheckCircle2 size={16} /></article>)}</div>
                <div className="blueprint-trace"><BookOpen size={17} /><div><strong>Pattern provenance stays visible</strong><span>{selectedIdea.rationale} Trace: {selectedIdea.inspiredBy}.</span></div></div>
                <div className="blueprint-actions"><button className="button button-primary" onClick={() => setView("team")}><Users size={16} /> Open team studio</button><button className="button button-outline" onClick={exportBlueprint}><Download size={16} /> Export blueprint</button></div>
              </div>
            </div>
          )}

          <div className="builder-controls"><button className="button button-quiet" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1}>← Back</button><span>Changes save automatically</span>{step < 4 ? <button className="button button-primary" onClick={() => setStep((current) => Math.min(4, current + 1))}>Save & continue <ArrowRight size={15} /></button> : <button className="button button-primary" onClick={() => setView("team")}>Invite the team <UserPlus size={15} /></button>}</div>
        </section>
      </div>
    </div>
  );
}

const workStatuses: WorkStatus[] = ["Brief", "Making", "Review", "Approved"];
const teamRoles: TeamRole[] = ["Brand lead", "Strategist", "Copywriter", "Designer", "Reviewer"];

function TeamStudio() {
  const { setView } = useCampaignStore();
  const { draft, ideas, selectedIdeaIndex, members, tasks, comments, addMember, moveTask, addComment } = useWorkspaceStore();
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState<TeamRole>("Reviewer");
  const [comment, setComment] = useState("");
  const selectedIdea = ideas[selectedIdeaIndex] ?? ideas[0];
  const approved = tasks.filter((task) => task.status === "Approved").length;

  function submitMember() {
    if (!memberName.trim()) return;
    addMember(memberName, memberRole);
    setMemberName("");
  }

  function submitComment() {
    if (!comment.trim()) return;
    addComment(comment);
    setComment("");
  }

  return (
    <div className="view team-view page-enter">
      <section className="team-hero">
        <div><span className="micro-label">SHARED CAMPAIGN ROOM</span><h1>One room for the work<br /><em>and the decisions.</em></h1></div>
        <div className="team-pulse"><span>Studio pulse</span><strong>{approved}/{tasks.length}</strong><small>workstreams approved</small><i><b style={{ width: `${(approved / tasks.length) * 100}%` }} /></i></div>
      </section>

      <section className="workspace-ribbon">
        <div><span>ACTIVE CAMPAIGN</span><strong>{draft.brandName} · {draft.productName}</strong></div>
        <div><span>DIRECTION</span><strong>{selectedIdea.title}</strong></div>
        <div><span>LAUNCH</span><strong><CalendarDays size={13} /> {draft.deadline}</strong></div>
        <button onClick={() => setView("builder")}>Edit campaign source <ArrowRight size={14} /></button>
      </section>

      <div className="team-dashboard">
        <section className="team-board">
          <div className="team-section-head"><div><span className="micro-label">LIVE WORKBOARD</span><h2>From brief to approved.</h2></div><span>{tasks.length} workstreams</span></div>
          <div className="kanban-grid">
            {workStatuses.map((status) => (
              <div className={`kanban-column kanban-${status.toLowerCase()}`} key={status}>
                <div className="kanban-head"><span>{status}</span><strong>{tasks.filter((task) => task.status === status).length}</strong></div>
                {tasks.filter((task) => task.status === status).map((task) => {
                  const owner = members.find((member) => member.id === task.ownerId);
                  return <article key={task.id}><span>{owner?.initials ?? "TM"}</span><h3>{task.title}</h3><div><small>{owner?.name ?? "Unassigned"}</small><small>{task.due}</small></div><label><span>Move to</span><select value={task.status} onChange={(event) => moveTask(task.id, event.target.value as WorkStatus)} aria-label={`Move ${task.title}`} data-testid={`task-status-${task.id}`}>{workStatuses.map((item) => <option key={item}>{item}</option>)}</select></label></article>;
                })}
              </div>
            ))}
          </div>
        </section>

        <aside className="studio-sidebar">
          <section className="collaborators-panel">
            <div className="panel-heading"><div><span>People</span><strong>{members.length} collaborators</strong></div><Users size={17} /></div>
            <div className="member-list">{members.map((member) => <article key={member.id}><span>{member.initials}<i className={member.presence === "online" ? "member-online" : ""} /></span><div><strong>{member.name}</strong><small>{member.role}</small></div></article>)}</div>
            <div className="member-form"><input placeholder="Collaborator name" value={memberName} onChange={(event) => setMemberName(event.target.value)} /><select value={memberRole} onChange={(event) => setMemberRole(event.target.value as TeamRole)}>{teamRoles.map((role) => <option key={role}>{role}</option>)}</select><button onClick={submitMember} disabled={!memberName.trim()} aria-label="Add collaborator"><UserPlus size={15} /></button></div>
          </section>

          <section className="approval-gates">
            <div className="panel-heading"><div><span>Approval gates</span><strong>Decision ownership</strong></div><ShieldCheck size={17} /></div>
            <article><span className="gate-ready"><Check size={13} /></span><div><strong>Strategy</strong><small>Direction selected · Mira Sen</small></div><StatusPill status="ready" /></article>
            <article><span className="gate-review"><CircleAlert size={13} /></span><div><strong>Claims</strong><small>2 facts need brand review · JE</small></div><StatusPill status="needs_review" /></article>
            <article><span className="gate-review"><CircleAlert size={13} /></span><div><strong>Final creative</strong><small>{tasks.filter((task) => task.status !== "Approved").length} workstreams open</small></div><StatusPill status="stale" /></article>
          </section>
        </aside>
      </div>

      <section className="decision-room">
        <div className="decision-intro"><span className="micro-label">DECISION THREAD</span><h2>Feedback stays attached<br />to the campaign.</h2><p>Comments carry context, owners and timing so the final approval does not depend on finding the right message in a different app.</p></div>
        <div className="comment-panel">
          <div className="comment-list">{comments.slice(-5).map((item) => <article key={item.id}><span>{item.initials}</span><div><div><strong>{item.author}</strong><small>{item.context} · {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small></div><p>{item.body}</p></div></article>)}</div>
          <div className="comment-compose"><MessageSquare size={17} /><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a decision, question or feedback…" onKeyDown={(event) => { if (event.key === "Enter") submitComment(); }} /><button onClick={submitComment} disabled={!comment.trim()}>Post</button></div>
        </div>
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
  if (view === "builder") return <CampaignBuilder />;
  if (view === "intelligence") return <CampaignIntelligence />;
  if (view === "team") return <TeamStudio />;
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
  const { notice, clearNotice, view } = useCampaignStore();

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 260);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(clearNotice, 3200);
    return () => window.clearTimeout(timer);
  }, [notice, clearNotice]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [view]);

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
