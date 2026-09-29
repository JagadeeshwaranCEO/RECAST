"use client";

/* eslint-disable @next/next/no-img-element -- local campaign assets are pre-sized; vinext image optimization is unavailable in the worker preview. */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bot,
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
  FileImage,
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
  Radar,
  RotateCcw,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  SwatchBook,
  Target,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { campaignCases, campaignDisciplines, getEvidenceProfile, researchArchives, synthesizePatternIdeas } from "@/lib/campaign-intelligence";
import { checkClaim, exportCampaign, UnsupportedClaimError, validateCampaign } from "@/lib/revision-engine";
import type { Asset, Campaign, ValidationResult } from "@/lib/models";
import { AgentRoom, AssetVault, BrandControlCenter, LaunchHub, PosterStudio, SignalRadar } from "@/app/studio/ExpansionStudio";
import { type StudioView, useCampaignStore } from "@/store/campaign-store";
import { PRODUCTION_STORAGE_KEY, useProductionStore } from "@/store/production-store";
import {
  LEGACY_WORKSPACE_STORAGE_KEY,
  WORKSPACE_INPUT_LIMITS,
  WORKSPACE_STORAGE_KEY,
  type TeamRole,
  type WorkStatus,
  useWorkspaceStore,
} from "@/store/workspace-store";

const navItems: { id: StudioView; label: string; icon: typeof Home; short: string }[] = [
  { id: "home", label: "Campaign home", icon: Home, short: "Home" },
  { id: "builder", label: "Campaign brief", icon: Plus, short: "Brief" },
  { id: "intelligence", label: "Campaign intelligence", icon: BookOpen, short: "Memory" },
  { id: "source", label: "Source of truth", icon: FileCheck2, short: "Source" },
  { id: "brandos", label: "Brand control center", icon: SwatchBook, short: "Brand OS" },
  { id: "agents", label: "AI agent council", icon: Bot, short: "Agents" },
  { id: "assets", label: "Brand asset vault", icon: FileImage, short: "Assets" },
  { id: "poster", label: "Campaign poster studio", icon: Palette, short: "Create" },
  { id: "concepts", label: "Creative concepts", icon: Sparkles, short: "Concept" },
  { id: "canvas", label: "Campaign canvas", icon: LayoutTemplate, short: "Canvas" },
  { id: "team", label: "Team studio", icon: Users, short: "Team" },
  { id: "revision", label: "Revision studio", icon: GitBranch, short: "Revise" },
  { id: "review", label: "Review & publish", icon: ShieldCheck, short: "Review" },
  { id: "publish", label: "Launch campaign", icon: Rocket, short: "Launch" },
  { id: "radar", label: "Brand signal radar", icon: Radar, short: "Radar" },
];

const primaryNavIds: StudioView[] = ["home", "builder", "agents", "poster", "revision", "review", "publish"];
const primaryNavItems = primaryNavIds.map((id) => navItems.find((item) => item.id === id)!);

const viewTitles: Record<StudioView, { eyebrow: string; title: string; note: string }> = {
  home: { eyebrow: "Campaign 01 · Active", title: "Stride / The New Formal", note: "One campaign source · Three connected outputs" },
  builder: { eyebrow: "New campaign · Guided build", title: "Campaign builder", note: "Brand, brief, strategy and delivery" },
  intelligence: { eyebrow: "Pattern library · R2", title: "Campaign intelligence", note: "Five research lenses · Evidence kept separate" },
  source: { eyebrow: "01 · Campaign source", title: "Brief & source of truth", note: "Approved facts control factual copy" },
  brandos: { eyebrow: "Brand OS · Governance", title: "Brand control center", note: "Tokens · Voice · Guardrails · Toolchain" },
  agents: { eyebrow: "Agent council · 6 specialists", title: "AI campaign agents", note: "Research to activation · One governed brief" },
  assets: { eyebrow: "Brand system · Asset vault", title: "Campaign assets", note: "Upload, classify and reuse brand material" },
  poster: { eyebrow: "Production · Poster studio", title: "Campaign poster builder", note: "Editable formats · Production PNG export" },
  concepts: { eyebrow: "02 · Creative direction", title: "Choose one campaign idea", note: "Strategy before production" },
  canvas: { eyebrow: "03 · Connected output", title: "Campaign canvas", note: "Every claim has a source" },
  team: { eyebrow: "Studio room · 4 collaborators", title: "Team workspace", note: "Roles, feedback and approval flow" },
  revision: { eyebrow: "04 · Selective revision", title: "Change meaning, not files", note: "Only dependent blocks move" },
  review: { eyebrow: "05 · Quality control", title: "Review & publish readiness", note: "Evidence before export" },
  publish: { eyebrow: "Launch control · Activation", title: "Host & publish campaign", note: "Campaign page · Calendar · Channel packages" },
  radar: { eyebrow: "Signal radar · Learning loop", title: "Monitor & adapt", note: "Mentions · Sentiment · Opportunity · Response" },
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

function FashionCampaignArt({ scene = "street", compact = false }: { scene?: "street" | "studio" | "runway"; compact?: boolean }) {
  const sceneCopy = {
    street: { word: "STREET", caption: "08:40 / street formalism", alt: "Model in navy tailoring inside an aged brass and green elevator" },
    studio: { word: "FORM", caption: "14:15 / sculpted attitude", alt: "Model in an emerald double-breasted suit against a lacquer-red studio backdrop" },
    runway: { word: "MOVE", caption: "20:10 / new runway", alt: "Model walking a runway in plaid tailoring and wide-leg denim" },
  }[scene];
  return (
    <figure className={cx("scene-art", `scene-${scene}`, compact && "scene-compact")}>
      <img className="scene-photo" src="/assets/stride-fashion-editorial-v2.jpg" alt={sceneCopy.alt} width={1536} height={1024} loading={compact ? "lazy" : "eager"} decoding="async" fetchPriority={compact ? "auto" : "high"} />
      <div className="scene-shade" aria-hidden="true" />
      <div className="scene-word" aria-hidden="true">{sceneCopy.word}</div>
      <figcaption className="scene-caption">{sceneCopy.caption}</figcaption>
    </figure>
  );
}

function CampaignThumbnail({ imageUrl, imageAlt }: { imageUrl: string; imageAlt: string }) {
  return <span className="campaign-thumbnail"><img src={imageUrl} alt={imageAlt} loading="lazy" decoding="async" /></span>;
}

function CampaignImageCredit({ credit }: { credit: string }) {
  return <span className="campaign-image-credit">Image: {credit}</span>;
}

function AppSidebar({ open, onClose, onCommand }: { open: boolean; onClose: () => void; onCommand: () => void }) {
  const view = useCampaignStore((state) => state.view);
  const setView = useCampaignStore((state) => state.setView);
  return (
    <aside className={cx("sidebar", open && "sidebar-open")} aria-label="Studio navigation">
      <button className="sidebar-close" onClick={onClose} aria-label="Close navigation"><X size={20} /></button>
      <button className="brand-mark" onClick={() => setView("home")} aria-label="RECAST home">
        <img src="/recast-logo.png" alt="" aria-hidden="true" />
      </button>
      <nav className="sidebar-nav">
        {primaryNavItems.map((item, index) => {
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
              <span className="nav-index">{String(index + 1).padStart(2, "0")}</span>
              <Icon size={19} strokeWidth={1.7} />
              <span>{item.short}</span>
            </button>
          );
        })}
      </nav>
      <button className="sidebar-tools" type="button" onClick={() => { onClose(); onCommand(); }} aria-label="Open all studio tools">
        <Command size={17} /><span>All tools</span>
      </button>
      <div className="sidebar-foot"><span>PX</span><span className="online-dot" /></div>
    </aside>
  );
}

function AppHeader({ onMenu, onCommand }: { onMenu: () => void; onCommand: () => void }) {
  const { campaign, view, resetDemo } = useCampaignStore();
  const resetWorkspace = useWorkspaceStore((state) => state.resetWorkspace);
  const resetProduction = useProductionStore((state) => state.resetProduction);
  const meta = viewTitles[view];
  const usesWorkspaceBrief = (["builder", "brandos", "agents", "assets", "poster", "team", "publish", "radar"] as StudioView[]).includes(view);
  const resetAllLocalData = () => {
    if (!window.confirm("Reset the campaign and clear this tab’s locally saved workspace?")) return;
    resetDemo();
    resetWorkspace();
    resetProduction();
    useWorkspaceStore.persist.clearStorage();
    useProductionStore.persist.clearStorage();
    window.localStorage.removeItem(LEGACY_WORKSPACE_STORAGE_KEY);
    window.sessionStorage.removeItem(WORKSPACE_STORAGE_KEY);
    window.sessionStorage.removeItem(PRODUCTION_STORAGE_KEY);
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith("recast:published:")) window.localStorage.removeItem(key);
    }
  };
  return (
    <header className="app-header">
      <button className="mobile-menu" onClick={onMenu} aria-label="Open navigation"><Menu size={20} /></button>
      <div className="header-title">
        <span>{meta.eyebrow}</span>
        <strong>{meta.title}</strong>
      </div>
      <div className="header-meta">
        <span className="source-version"><CircleDot size={13} /> {usesWorkspaceBrief ? "Brief synced" : `Source v${campaign.version}`}</span>
        <span className="header-note">{meta.note}</span>
        <button className="header-command" onClick={onCommand} aria-label="Open studio switcher"><Command size={14} /><span>Switch</span><kbd>⌘K</kbd></button>
        <button className="icon-button" onClick={resetAllLocalData} aria-label="Reset campaign and clear local workspace" title="Reset local demo data"><RotateCcw size={17} /></button>
        <span className="avatar">JE</span>
      </div>
    </header>
  );
}

function StudioSwitcher({ open, onClose }: { open: boolean; onClose: () => void }) {
  const view = useCampaignStore((state) => state.view);
  const setView = useCampaignStore((state) => state.setView);
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const matches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return navItems;
    return navItems.filter((item) => `${item.label} ${item.short} ${viewTitles[item.id].note}`.toLowerCase().includes(normalized));
  }, [query]);

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.classList.add("command-active");
    const dialog = dialogRef.current;
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || !dialog) return;
      const focusable = [...dialog.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex='-1'])")]
        .filter((element) => !element.hasAttribute("hidden"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    dialog?.addEventListener("keydown", trapFocus);
    return () => {
      dialog?.removeEventListener("keydown", trapFocus);
      document.body.classList.remove("command-active");
      previousFocusRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="command-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="command-menu" role="dialog" aria-modal="true" aria-labelledby="command-title" aria-describedby="command-description" data-testid="studio-switcher">
        <div className="command-head"><div><span>RECAST / NAVIGATE</span><h2 id="command-title">Where do you want to work?</h2></div><button onClick={onClose} aria-label="Close studio switcher"><X size={17} /></button></div>
        <p className="sr-only" id="command-description">Search and open any RECAST workspace. Press Escape to close.</p>
        <label className="command-search"><Search size={17} /><span className="sr-only">Search studio destinations</span><input autoFocus maxLength={80} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search campaign tools…" /></label>
        <div className="command-results">
          {matches.map((item, index) => {
            const Icon = item.icon;
            return <button key={item.id} className={cx(view === item.id && "command-current")} onClick={() => { setView(item.id); onClose(); }} data-testid={`command-${item.id}`}><span>{String(index + 1).padStart(2, "0")}</span><Icon size={18} /><div><strong>{item.label}</strong><small>{viewTitles[item.id].note}</small></div><ChevronRight size={15} /></button>;
          })}
          {!matches.length && <div className="command-empty">No studio destination matches “{query}”.</div>}
        </div>
        <footer><span><kbd>type</kbd> to filter</span><span><kbd>esc</kbd> close</span></footer>
      </section>
    </div>
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
              <img src={campaign.imageUrl} alt="" loading="lazy" decoding="async" />
              <div className="memory-card-shade" />
              <span>{campaign.year} · {campaign.brand}</span>
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
  const { campaign, humanApproval, setView } = useCampaignStore();
  const draft = useWorkspaceStore((state) => state.draft);
  const agentResult = useProductionStore((state) => state.agentResult);
  const poster = useProductionStore((state) => state.poster);
  const launch = useProductionStore((state) => state.launch);
  const reviewCount = campaign.approvals.filter((item) => item.status !== "approved").length;
  const decisionCount = reviewCount + (humanApproval ? 0 : 1);
  const currentFacts = campaign.facts.filter((fact) => fact.status === "approved").length;
  const runway = [
    { id: "builder" as const, label: "Brief", note: "Brand truth", complete: Boolean(draft.brandName.trim() && draft.productName.trim() && draft.challenge.trim() && draft.proof.trim()) },
    { id: "agents" as const, label: "Agents", note: "Campaign system", complete: Boolean(agentResult) },
    { id: "poster" as const, label: "Create", note: "Production master", complete: Boolean(poster.headline.trim()) },
    { id: "revision" as const, label: "Revise", note: "Meaning graph", complete: campaign.revisions.length > 0 },
    { id: "review" as const, label: "Review", note: "Human decision", complete: humanApproval && reviewCount === 0 },
    { id: "publish" as const, label: "Launch", note: "Shareable route", complete: launch.status === "published" },
  ];
  const completedSteps = runway.filter((step) => step.complete).length;
  return (
    <div className="view home-view page-enter">
      <section className="campaign-intro">
        <div>
          <div className="micro-label">LIVE CAMPAIGN / STRIDE 01</div>
          <h1>Your day changes.<br /><em>Your style should keep up.</em></h1>
          <p>One expressive menswear collection, moving from street to studio to runway — governed by the same approved campaign source.</p>
        </div>
        <div className="intro-actions">
          <button className="button button-primary" onClick={() => setView("builder")}>
            Create a campaign <Plus size={17} />
          </button>
          <button className="button button-outline" onClick={() => setView("revision")}>
            Revise campaign <ArrowUpRight size={17} />
          </button>
          <button className="button button-quiet" onClick={() => setView("agents")}>Run agent council <ArrowRight size={16} /></button>
        </div>
      </section>

      <section className="campaign-runway" aria-label="Guided campaign workflow">
        <div className="runway-heading">
          <div><span className="micro-label">WINNING PATH</span><strong>One brief. Six controlled decisions.</strong></div>
          <span>{completedSteps} / {runway.length} complete</span>
        </div>
        <div className="runway-steps">
          {runway.map((step, index) => (
            <button key={step.id} type="button" className={cx(step.complete && "runway-complete")} onClick={() => setView(step.id)}>
              <span>{step.complete ? <Check size={14} /> : String(index + 1).padStart(2, "0")}</span>
              <div><strong>{step.label}</strong><small>{step.note}</small></div>
              <ChevronRight size={14} />
            </button>
          ))}
        </div>
      </section>

      <section className="timeline-shell" aria-label="Campaign visual timeline">
        <div className="timeline-heading">
          <span>Campaign editorial · 12 sec</span>
          <div><span className="tiny-live" /> Concept locked</div>
        </div>
        <div className="scene-grid">
          <div className="scene-item"><FashionCampaignArt scene="street" /><div className="scene-meta"><span>01</span><strong>Street</strong><small>Quiet confidence</small></div></div>
          <div className="scene-item"><FashionCampaignArt scene="studio" /><div className="scene-meta"><span>02</span><strong>Studio</strong><small>Sculpted attitude</small></div></div>
          <div className="scene-item"><FashionCampaignArt scene="runway" /><div className="scene-meta"><span>03</span><strong>Runway</strong><small>Movement, tailored</small></div></div>
        </div>
        <div className="timeline-track"><i /><i /><i /></div>
      </section>

      <section className="health-grid">
        <div className="health-title">
          <span className="micro-label">Campaign health</span>
          <strong>{reviewCount ? "Revision in review" : humanApproval ? "One source. Fully aligned." : "Final sign-off needed."}</strong>
        </div>
        <button onClick={() => setView("source")} className="health-stat">
          <span>Approved facts</span><strong>{currentFacts}</strong><small>Current source <ChevronRight size={14} /></small>
        </button>
        <button onClick={() => setView("poster")} className="health-stat">
          <span>Production master</span><strong>{poster.headline.trim() ? "1" : "0"}<i>/1</i></strong><small>Poster + channel pack <ChevronRight size={14} /></small>
        </button>
        <button onClick={() => setView("review")} className="health-stat health-review">
          <span>Needs review</span><strong>{decisionCount}</strong><small>{reviewCount ? "Approval changed" : humanApproval ? "Nothing outstanding" : "Human sign-off"} <ChevronRight size={14} /></small>
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
  const [activeArchiveId, setActiveArchiveId] = useState(researchArchives[0].id);
  const [challenge, setChallenge] = useState("Launch an adaptive menswear collection for people whose day changes without warning");
  const [ideas, setIdeas] = useState(() => synthesizePatternIdeas(challenge));
  const active = campaignCases.find((item) => item.id === activeId) ?? campaignCases[0];
  const activeArchive = researchArchives.find((item) => item.id === activeArchiveId) ?? researchArchives[0];
  const evidenceProfile = getEvidenceProfile(active);
  const filtered = discipline === "All" ? campaignCases : campaignCases.filter((item) => item.discipline === discipline);
  const firstYear = Math.min(...campaignCases.map((item) => item.year));
  const lastYear = Math.max(...campaignCases.map((item) => item.year));

  return (
    <div className="view intelligence-view page-enter">
      <section className="intelligence-hero">
        <div>
          <span className="micro-label">RESEARCH-GROUNDED CREATIVE MEMORY</span>
          <h1>The model remembers<br /><em>why people cared.</em></h1>
        </div>
        <div className="intelligence-intro">
          <p>RECAST turns landmark campaigns into reusable mechanics—not copy to imitate. Discovery, award recognition and measured effectiveness remain separate evidence layers, each linked to its source.</p>
          <div className="corpus-stats">
            <div><strong>{lastYear - firstYear + 1}</strong><span>year research span</span></div>
            <div><strong>{campaignCases.length}</strong><span>campaign cases</span></div>
            <div><strong>{researchArchives.length}</strong><span>archive lenses</span></div>
          </div>
        </div>
      </section>

      <section className="method-strip">
        <div><BookOpen size={18} /><strong>Pattern Library · R2</strong></div>
        <p>This prototype uses a curated, cited retrieval set—not foundation-model training. It stores the creative move, award record and outcome claim as different facts.</p>
        <span>Evidence boundaries on</span>
      </section>

      <section className="research-observatory">
        <div className="research-observatory-heading">
          <div><span className="micro-label">RESEARCH SOURCE MAP</span><h2>Five archives.<br /><em>Five different jobs.</em></h2></div>
          <p>A useful campaign memory needs breadth, authority and outcomes. RECAST now knows what each archive can support—and what it cannot.</p>
        </div>
        <div className="research-source-layout">
          <div className="research-source-list" aria-label="Campaign research archives">
            {researchArchives.map((archive, index) => (
              <button
                key={archive.id}
                className={cx(activeArchive.id === archive.id && "research-source-active")}
                onClick={() => setActiveArchiveId(archive.id)}
                aria-pressed={activeArchive.id === archive.id}
                data-testid={`research-source-${archive.id}`}
              >
                <span>0{index + 1}</span><div><strong>{archive.name}</strong><small>{archive.role}</small></div><ChevronRight size={15} />
              </button>
            ))}
          </div>
          <article className="research-source-detail" aria-live="polite">
            <div className="research-source-top"><span>{activeArchive.role}</span><strong>{activeArchive.coverage}</strong></div>
            <h3>{activeArchive.name}</h3>
            <p>{activeArchive.strength}</p>
            <div className="research-lenses">{activeArchive.lenses.map((lens) => <span key={lens}>{lens}</span>)}</div>
            <dl>
              <div><dt>Safe to infer</dt><dd>{activeArchive.proves}</dd></div>
              <div><dt>Do not infer</dt><dd>{activeArchive.caution}</dd></div>
            </dl>
            <a href={activeArchive.url} target="_blank" rel="noreferrer">Open the source archive <ExternalLink size={13} /></a>
          </article>
        </div>
        <div className="evidence-protocol" aria-label="RECAST research evidence protocol">
          <article><span>01</span><div><strong>Discover</strong><p>Find the work across eras, markets and media.</p></div></article>
          <article><span>02</span><div><strong>Verify</strong><p>Confirm year, award, category and credited creators.</p></div></article>
          <article><span>03</span><div><strong>Prove</strong><p>Attach the original metric, method and outcome owner.</p></div></article>
          <article><span>04</span><div><strong>Transfer</strong><p>Extract the mechanic—never the protected execution.</p></div></article>
        </div>
      </section>

      <section className="archive-section">
        <div className="archive-heading">
          <div><span className="micro-label">THE CURATED CAMPAIGN SET</span><h2>Forty-seven years. Eight ways into culture.</h2></div>
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
                <div className="archive-poster">
                  <CampaignThumbnail imageUrl={campaign.imageUrl} imageAlt={campaign.imageAlt} />
                  <div className="archive-poster-shade" />
                  <span>{campaign.year}</span><strong>{campaign.name}</strong><small>{campaign.brand}</small><i>{String(index + 1).padStart(2, "0")}</i>{campaign.recognitions?.length ? <b>{campaign.recognitions.length}× award verified</b> : null}
                  <CampaignImageCredit credit={campaign.imageCredit} />
                </div>
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
          <div className="case-evidence-ribbon">
            <div><ShieldCheck size={16} /><span>Evidence profile</span></div>
            <dl>
              <div><dt>Provenance</dt><dd>{evidenceProfile.sourceClass}</dd></div>
              <div><dt>Results</dt><dd>{evidenceProfile.resultStatus}</dd></div>
              <div><dt>Awards</dt><dd>{evidenceProfile.awardStatus}</dd></div>
            </dl>
          </div>
          <div className="case-columns">
            <article><span>WHAT IT DID</span><p>{active.originalMove}</p></article>
            <article><span>WHY IT TRAVELLED</span><p>{active.whyItWorked}</p><small>{active.evidence}</small></article>
            <article className="case-recast"><span>IF RECAST HAD BEEN THERE</span><p>{active.recastLift}</p></article>
          </div>
          {active.recognitions?.length ? <div className="recognition-links">{active.recognitions.map((recognition) => <a key={`${recognition.archive}-${recognition.label}`} href={recognition.url} target="_blank" rel="noreferrer"><span>{recognition.archive}</span>{recognition.label}<ExternalLink size={11} /></a>)}</div> : null}
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
          <textarea id="pattern-brief" maxLength={WORKSPACE_INPUT_LIMITS.challenge} value={challenge} onChange={(event) => setChallenge(event.target.value)} />
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
        <span>RECAST / CAMPAIGN INTELLIGENCE R2</span>
        <p>Research is a launchpad for original thinking—not a license to reproduce protected creative or misstate submitted results.</p>
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
    provenance: "RECAST Pattern Library R2",
  }, null, 2), "application/json");

  return (
    <div className="view builder-view page-enter">
      <section className="builder-hero">
        <div><span className="micro-label">END-TO-END CAMPAIGN CREATION</span><h1>From brand truth<br /><em>to a team-ready system.</em></h1></div>
        <div><p>Build one campaign source, retrieve useful creative mechanics, assign every channel a job and hand the work to a studio with approvals already attached.</p><span><i /> Autosaved to this device</span></div>
      </section>

      <div className="builder-layout">
        <aside className="builder-steps" aria-label="Campaign builder steps">
          <div className="builder-progress"><span>Workflow progress</span><strong>0{step}/04</strong><i><b style={{ width: `${step * 25}%` }} /></i><small>{readiness.filter(Boolean).length} of 4 sections have required inputs</small></div>
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
                <label><span>Brand name</span><input maxLength={WORKSPACE_INPUT_LIMITS.brandName} value={draft.brandName} onChange={(event) => updateDraft({ brandName: event.target.value })} /></label>
                <label><span>Product or offer</span><input maxLength={WORKSPACE_INPUT_LIMITS.productName} value={draft.productName} onChange={(event) => updateDraft({ productName: event.target.value })} /></label>
                <label className="field-wide"><span>Voice and tone</span><input maxLength={WORKSPACE_INPUT_LIMITS.tone} value={draft.tone} onChange={(event) => updateDraft({ tone: event.target.value })} /></label>
                <label><span>Market / language</span><input maxLength={WORKSPACE_INPUT_LIMITS.market} value={draft.market} onChange={(event) => updateDraft({ market: event.target.value })} /></label>
                <div className="brand-colours"><span>Brand colours</span><label><input type="color" value={draft.primaryColor} onChange={(event) => updateDraft({ primaryColor: event.target.value })} /><strong>{draft.primaryColor}</strong></label><label><input type="color" value={draft.accentColor} onChange={(event) => updateDraft({ accentColor: event.target.value })} /><strong>{draft.accentColor}</strong></label></div>
              </div>
              <div className="brand-preview" style={{ "--brand-primary": draft.primaryColor, "--brand-accent": draft.accentColor } as React.CSSProperties}><span>{draft.brandName || "YOUR BRAND"}</span><strong>{draft.productName || "Campaign system"}</strong><small>{draft.tone || "Define the voice"}</small><i /></div>
            </div>
          )}

          {step === 2 && (
            <div className="builder-form page-enter">
              <div className="form-explainer"><strong>A sharp brief gives creativity something to push against.</strong><p>Separate the human problem, business objective and approved proof so the model knows where it can invent—and where it cannot.</p></div>
              <div className="field-grid brief-fields">
                <label className="field-wide"><span>Campaign challenge</span><textarea maxLength={WORKSPACE_INPUT_LIMITS.challenge} data-testid="campaign-challenge" value={draft.challenge} onChange={(event) => updateDraft({ challenge: event.target.value })} /></label>
                <label><span>Audience</span><textarea maxLength={WORKSPACE_INPUT_LIMITS.audience} value={draft.audience} onChange={(event) => updateDraft({ audience: event.target.value })} /></label>
                <label><span>Business objective</span><textarea maxLength={WORKSPACE_INPUT_LIMITS.objective} value={draft.objective} onChange={(event) => updateDraft({ objective: event.target.value })} /></label>
                <label className="field-wide"><span>Single-minded promise</span><input maxLength={WORKSPACE_INPUT_LIMITS.promise} value={draft.promise} onChange={(event) => updateDraft({ promise: event.target.value })} /></label>
                <label className="field-wide"><span>Approved proof / claims</span><textarea maxLength={WORKSPACE_INPUT_LIMITS.proof} value={draft.proof} onChange={(event) => updateDraft({ proof: event.target.value })} /></label>
                <label><span>Launch deadline</span><input type="date" value={draft.deadline} onChange={(event) => updateDraft({ deadline: event.target.value })} /></label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="builder-form page-enter">
              <div className="channel-picker"><div><span className="micro-label">CHANNEL JOBS</span><h3>Choose where this campaign must work.</h3></div><div>{availableChannels.map((channel) => <button key={channel} onClick={() => toggleChannel(channel)} className={cx(draft.channels.includes(channel) && "channel-active")} aria-pressed={draft.channels.includes(channel)}>{draft.channels.includes(channel) && <Check size={13} />}{channel}</button>)}</div></div>
              <div className="generation-bar"><div><Sparkles size={19} /><span><strong>Pattern Engine · R2</strong><small>Uses your challenge to retrieve useful, evidence-separated campaign mechanics.</small></span></div><button className="button button-primary" onClick={generateIdeas} data-testid="generate-directions">Generate directions <ArrowRight size={15} /></button></div>
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
                <div className="blueprint-actions"><button className="button button-primary" onClick={() => setView("agents")}><Bot size={16} /> Run the agent council</button><button className="button button-outline" onClick={exportBlueprint}><Download size={16} /> Export blueprint</button></div>
              </div>
            </div>
          )}

          <div className="builder-controls"><button className="button button-quiet" onClick={() => setStep((current) => Math.max(1, current - 1))} disabled={step === 1}>← Back</button><span>Autosaved to this device</span>{step < 4 ? <button className="button button-primary" disabled={!readiness[step - 1]} onClick={() => setStep((current) => Math.min(4, current + 1))}>Continue to {builderSteps[step].label} <ArrowRight size={15} /></button> : <button className="button button-primary" onClick={() => setView("agents")}>Run the agent council <Bot size={15} /></button>}</div>
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
            <div className="member-form"><input aria-label="Collaborator name" maxLength={WORKSPACE_INPUT_LIMITS.collaboratorName} placeholder="Collaborator name" value={memberName} onChange={(event) => setMemberName(event.target.value)} /><select aria-label="Collaborator role" value={memberRole} onChange={(event) => setMemberRole(event.target.value as TeamRole)}>{teamRoles.map((role) => <option key={role}>{role}</option>)}</select><button onClick={submitMember} disabled={!memberName.trim()} aria-label="Add collaborator"><UserPlus size={15} /></button></div>
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
          <div className="comment-compose"><MessageSquare size={17} /><input aria-label="Campaign comment" maxLength={WORKSPACE_INPUT_LIMITS.comment} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Add a decision, question or feedback…" onKeyDown={(event) => { if (event.key === "Enter") submitComment(); }} /><button onClick={submitComment} disabled={!comment.trim()}>Post</button></div>
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
            <div className={`concept-art concept-art-${index + 1}`}><FashionCampaignArt scene={index === 0 ? "runway" : "street"} compact /><span className="concept-number">0{index + 1}</span></div>
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
        <div className="phone-stage"><FashionCampaignArt scene="studio" compact /><span className="reel-time">00:07 / 00:12</span></div>
        <div className="scene-script">{asset.blocks.filter((block) => block.type !== "image").map((block, index) => <div key={block.id}><span>0{index + 1}</span><p>{block.content}</p><DependencyChips campaign={campaign} blockId={block.id} /></div>)}</div>
      </div>
    );
  }
  if (asset.id === "asset.carousel") {
    return <div className="carousel-preview">{asset.blocks.filter((block) => block.type === "copy").map((block, index) => <div className={`carousel-slide slide-${index + 1}`} key={block.id}><span>0{index + 1}</span>{index > 0 && <div className="mini-campaign-art"><FashionCampaignArt scene={index === 1 ? "street" : index === 2 ? "runway" : "studio"} compact /></div>}<strong>{block.content}</strong><DependencyChips campaign={campaign} blockId={block.id} /></div>)}</div>;
  }
  return (
    <div className="linkedin-preview">
      <div className="linkedin-profile"><span>S</span><div><strong>Stride Design</strong><small>Product company · Just now</small></div></div>
      {asset.blocks.filter((block) => block.type === "copy").map((block, index) => <div key={block.id} className="linkedin-block"><p className={index === 0 ? "linkedin-hook" : ""}>{block.content}</p><DependencyChips campaign={campaign} blockId={block.id} /></div>)}
      <div className="linkedin-visual"><FashionCampaignArt scene="street" compact /><span>DESIGNED FOR<br />THE DAY BETWEEN<br />THE PLANS.</span></div>
    </div>
  );
}

function CampaignCanvas() {
  const { campaign, setView } = useCampaignStore();
  const [activeAsset, setActiveAsset] = useState(campaign.assets[0].id);
  const asset = campaign.assets.find((candidate) => candidate.id === activeAsset) ?? campaign.assets[0];
  const approval = campaign.approvals.find((item) => item.assetId === asset.id);
  const onTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? campaign.assets.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + campaign.assets.length) % campaign.assets.length;
    const nextAsset = campaign.assets[nextIndex];
    setActiveAsset(nextAsset.id);
    window.requestAnimationFrame(() => document.getElementById(`asset-tab-${nextAsset.id}`)?.focus());
  };
  return (
    <div className="view page-enter canvas-view">
      <div className="canvas-toolbar">
        <div className="asset-tabs" role="tablist" aria-label="Campaign outputs">
          {campaign.assets.map((item, index) => <button key={item.id} id={`asset-tab-${item.id}`} className={cx(activeAsset === item.id && "asset-tab-active")} onClick={() => setActiveAsset(item.id)} onKeyDown={(event) => onTabKeyDown(event, index)} role="tab" aria-selected={activeAsset === item.id} aria-controls={`asset-panel-${item.id}`} tabIndex={activeAsset === item.id ? 0 : -1}><span>{item.platform}</span>{item.title}<i /></button>)}
        </div>
        <button className="button button-primary button-small" onClick={() => setView("revision")}><PenLine size={15} /> Revise source</button>
      </div>
      <div className="canvas-layout">
        <section className="asset-stage" id={`asset-panel-${asset.id}`} role="tabpanel" aria-labelledby={`asset-tab-${asset.id}`} tabIndex={0}>
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
            <div className="price-control"><input id="price-input" inputMode="text" maxLength={32} data-testid="price-input" value={price} onChange={(event) => setPrice(event.target.value)} /><button data-testid="apply-price" onClick={() => revisePrice(price)} disabled={!price.trim() || price === currentPrice?.value}>Apply to campaign <ArrowRight size={16} /></button></div>
            <div className="impact-preview"><GitBranch size={15} /><span>{priceEdges.length || 2} connected blocks will update</span><span>1 output preserved</span></div>
          </div>

          <div className="revision-control-card compact-control">
            <div><span className="control-label"><span>02 · Claim removal</span></span><strong>Recycled nylon exterior</strong><p>Remove this approved fact and rewrite only connected blocks.</p></div>
            <button className="button button-outline" onClick={removeRecycledClaim} disabled={!recycledCurrent}>{recycledCurrent ? "Remove claim" : "Claim removed"}</button>
          </div>

          <div className={cx("claim-guard", claimState === "unsupported" && "guard-warning", claimState === "approved" && "guard-approved")}>
            <div className="control-label"><span>03 · Claim guard</span><ShieldCheck size={16} /></div>
            <label htmlFor="claim-input">Requested campaign wording</label>
            <textarea id="claim-input" maxLength={300} data-testid="claim-input" value={claim} onChange={(event) => { setClaim(event.target.value); setClaimState("idle"); }} />
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
  const { campaign, humanApproval, approveAsset, approveAffected, approveCreativeQuality, setView } = useCampaignStore();
  const draft = useWorkspaceStore((state) => state.draft);
  const poster = useProductionStore((state) => state.poster);
  const productionAssets = useProductionStore((state) => state.assets);
  const agentResult = useProductionStore((state) => state.agentResult);
  const productionAsset = productionAssets.find((item) => item.id === poster.assetId) ?? productionAssets[0];
  const checks = useMemo(() => validateCampaign(campaign), [campaign]);
  const latest = campaign.revisions[0];
  const stale = campaign.approvals.filter((approval) => approval.status === "stale");
  const linkedin = campaign.assets.find((asset) => asset.id === "asset.linkedin");
  const exportReady = stale.length === 0 && humanApproval;
  const displayChecks = checks.map((check) => check.id === "check.tone" && humanApproval
    ? { ...check, status: "ready" as const, evidence: "Creative quality approved by Jagadeeshwaran · Human reviewer." }
    : check);

  const downloadCampaign = () => downloadFile("recast-stride-campaign.json", JSON.stringify(exportCampaign(campaign), null, 2), "application/json");
  const downloadRevision = () => downloadFile("recast-revision-report.md", latest?.report ?? "# RECAST revision report\n\nNo revision has been created yet.", "text/markdown");
  const downloadLinkedIn = () => downloadFile("stride-linkedin-post.txt", linkedin?.blocks.filter((block) => block.type === "copy").map((block) => block.content).join("\n\n") ?? "");

  return (
    <div className="view page-enter review-view">
      <div className="review-hero">
        <div><span className="micro-label">PUBLISH READINESS</span><h1>{stale.length ? "The change is sound.\nThe decision is yours." : humanApproval ? "Campaign ready.\nEvery source is current." : "Evidence clear.\nOne human decision left."}</h1><p>Machine checks show evidence. Tone and visual quality stay explicitly human.</p></div>
        <div className={cx("readiness-seal", exportReady && "seal-ready")}><span>{stale.length ? `${stale.length}` : humanApproval ? <Check size={38} /> : "01"}</span><strong>{stale.length ? "outputs need review" : humanApproval ? "approved to export" : "human sign-off needed"}</strong><small>Campaign source v{campaign.version}</small></div>
      </div>
      <div className="review-layout">
        <section className="check-panel">
          <div className="panel-heading"><div><span>Quality gates</span><strong>Checks with evidence</strong></div><ShieldCheck size={18} /></div>
          <div className="validation-list">{displayChecks.map((check) => <ValidationRow key={check.id} result={check} />)}</div>
          <div className={cx("human-signoff", humanApproval && "human-signoff-complete")}><div><span>{humanApproval ? <Check size={15} /> : <CircleAlert size={15} />}</span><div><strong>{humanApproval ? "Creative quality signed off" : "Human review required"}</strong><p>{humanApproval ? "Tone, craft and brand feel were approved for this source version." : "Review tone, visual craft and cultural fit before enabling export."}</p></div></div><button onClick={approveCreativeQuality} disabled={humanApproval} data-testid="approve-creative-quality">{humanApproval ? "Signed off" : "Sign off creative quality"}</button></div>
        </section>
        <section className="approval-panel">
          <div className="panel-heading"><div><span>Human approval</span><strong>Changed outputs only</strong></div><span>{stale.length} pending</span></div>
          <article className="production-review-card">
            <div className="production-review-art" style={{ background: poster.backgroundColor }}>{productionAsset && <img src={productionAsset.url} alt="Current production master" />}<span>{draft.brandName}</span></div>
            <div><small>PRODUCTION MASTER · {poster.format.toUpperCase()}</small><strong>{poster.headline.replace("\n", " ")}</strong><p>{agentResult ? `${agentResult.channelPlan.length} channel deliverables are attached to this creative system.` : "Run the agent council to attach platform-ready deliverables."}</p></div>
            <StatusPill status={humanApproval ? "ready" : "needs_review"} />
          </article>
          <div className="approval-list">
            {campaign.assets.map((asset) => {
              const approval = campaign.approvals.find((item) => item.assetId === asset.id)!;
              return <article key={asset.id}><div className="approval-art"><FashionCampaignArt scene={asset.id === "asset.reel" ? "studio" : asset.id === "asset.carousel" ? "runway" : "street"} compact /></div><div><small>{asset.platform} · {asset.format}</small><strong>{asset.title}</strong><span>{approval.status === "approved" ? `Approved by ${approval.reviewer}` : "Source changed · previous approval is stale"}</span></div>{approval.status === "stale" ? <button onClick={() => approveAsset(asset.id)}>Approve <Check size={14} /></button> : <StatusPill status={latest?.preservedAssetIds.includes(asset.id) ? "preserved" : "ready"} />}</article>;
            })}
          </div>
          {stale.length > 0 && <button className="button button-primary approve-all" onClick={approveAffected} data-testid="approve-all">Approve {stale.length} affected output{stale.length === 1 ? "" : "s"} <Check size={16} /></button>}
        </section>
      </div>

      <section className="export-panel">
        <div><span className="micro-label">EXPORT DESK</span><h2>Take the approved campaign with you.</h2><p>Portable source, audit trail and channel copy. Nothing is trapped in RECAST.</p></div>
        <div className="export-actions">
          <button onClick={downloadCampaign} disabled={!exportReady}><Download size={17} /><span><strong>Campaign brief</strong><small>{exportReady ? "Validated JSON" : "Awaiting human sign-off"}</small></span></button>
          <button onClick={downloadRevision} disabled={!exportReady} data-testid="export-revision"><Download size={17} /><span><strong>Revision report</strong><small>{exportReady ? "Markdown audit trail" : "Awaiting human sign-off"}</small></span></button>
          <button onClick={downloadLinkedIn} disabled={!exportReady}><Download size={17} /><span><strong>LinkedIn post</strong><small>{exportReady ? "Plain text" : "Awaiting human sign-off"}</small></span></button>
          <button disabled={!exportReady} onClick={() => downloadFile("stride-reel-preview.txt", "SIMULATED PREVIEW EXPORT\n\n12-second Stride context-shift reel scene plan. Connect a renderer for final MP4 output.")}><PanelTop size={17} /><span><strong>Reel preview</strong><small>{exportReady ? "Simulated export · TXT" : "Awaiting human sign-off"}</small></span></button>
        </div>
      </section>

      <section className={cx("review-next-action", exportReady && "review-next-ready")}>
        <div><span className="micro-label">FINAL CONTROL</span><h2>{exportReady ? "Approved work can now move." : "Launch stays locked until review is complete."}</h2><p>{exportReady ? "The exact poster, channel pack and governed source can continue to activation." : "Approve changed outputs and sign off creative quality to unlock launch control."}</p></div>
        <button className="button button-primary" type="button" disabled={!exportReady} onClick={() => setView("publish")} data-testid="continue-to-launch">Continue to launch <Rocket size={16} /></button>
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
  if (view === "source") return <SourceTruth />;
  if (view === "brandos") return <BrandControlCenter />;
  if (view === "agents") return <AgentRoom />;
  if (view === "assets") return <AssetVault />;
  if (view === "poster") return <PosterStudio />;
  if (view === "concepts") return <ConceptSelection />;
  if (view === "canvas") return <CampaignCanvas />;
  if (view === "team") return <TeamStudio />;
  if (view === "revision") return <RevisionStudio />;
  if (view === "review") return <ReviewPublish />;
  if (view === "publish") return <LaunchHub />;
  if (view === "radar") return <SignalRadar />;
  return <CampaignHome />;
}

function CinematicIntro({ onComplete }: { onComplete: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const leaveAfter = reduceMotion ? 120 : 1350;
    const finishAfter = reduceMotion ? 180 : 1750;
    const beginExit = window.setTimeout(() => setLeaving(true), leaveAfter);
    const finish = window.setTimeout(onComplete, finishAfter);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") {
        setLeaving(true);
        window.setTimeout(onComplete, 420);
      }
    };

    document.body.classList.add("intro-active");
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(beginExit);
      window.clearTimeout(finish);
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("intro-active");
    };
  }, [onComplete]);

  const skip = () => {
    setLeaving(true);
    window.setTimeout(onComplete, 420);
  };

  return (
    <section
      className={cx("cinematic-intro", leaving && "cinematic-intro-leaving")}
      data-testid="site-intro"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to RECAST"
    >
      <div className="intro-aurora" aria-hidden="true"><i /><i /><i /></div>
      <div className="intro-grid" aria-hidden="true" />
      <div className="intro-orbit intro-orbit-one" aria-hidden="true"><i /><b /></div>
      <div className="intro-orbit intro-orbit-two" aria-hidden="true"><i /><b /></div>

      <div className="intro-signals" aria-hidden="true">
        <span className="signal signal-one">BRAND TRUTH</span>
        <span className="signal signal-two">CULTURAL MEMORY</span>
        <span className="signal signal-three">HUMAN TENSION</span>
        <span className="signal signal-four">CHANNEL LOGIC</span>
      </div>

      <div className="intro-core">
        <div className="intro-monogram" aria-hidden="true"><img src="/recast-logo.png" alt="" /></div>
        <p className="intro-overline">MEANING-AWARE CAMPAIGN INTELLIGENCE</p>
        <h1><span>Scattered signals.</span><em>One living idea.</em></h1>
        <div className="intro-lockup"><span>RE</span><i>CAST</i></div>
      </div>

      <div className="intro-status" aria-hidden="true">
        <span>01</span><i /><p>Memory becomes method</p><strong>STUDIO ONLINE</strong>
      </div>
      <button className="intro-skip" onClick={skip} data-testid="skip-intro">Enter studio <ArrowRight size={15} /></button>
    </section>
  );
}

export function CampaignStudio() {
  const [showIntro, setShowIntro] = useState(true);
  const [navOpen, setNavOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const { notice, clearNotice, view, setView } = useCampaignStore();
  const contentRef = useRef<HTMLElement>(null);

  const completeIntro = () => {
    try {
      window.sessionStorage.setItem("recast-intro-seen", "true");
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
    setShowIntro(false);
  };

  useEffect(() => {
    window.localStorage.removeItem(LEGACY_WORKSPACE_STORAGE_KEY);
    const requestedView = new URLSearchParams(window.location.search).get("view") as StudioView | null;
    if (requestedView && navItems.some((item) => item.id === requestedView)) setView(requestedView);
    if (new URLSearchParams(window.location.search).has("replay")) return;
    let introSeen = false;
    try {
      introSeen = window.sessionStorage.getItem("recast-intro-seen") === "true";
    } catch {
      introSeen = false;
    }
    if (!introSeen) return;
    const frame = window.requestAnimationFrame(() => setShowIntro(false));
    return () => window.cancelAnimationFrame(frame);
  }, [setView]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(clearNotice, 3200);
    return () => window.clearTimeout(timer);
  }, [notice, clearNotice]);

  useEffect(() => {
    if (showIntro) return;
    window.scrollTo({ top: 0, behavior: "auto" });
    const frame = window.requestAnimationFrame(() => contentRef.current?.focus({ preventScroll: true }));
    return () => window.cancelAnimationFrame(frame);
  }, [view, showIntro]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }
      if (event.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <a className="skip-link" href="#studio-content">Skip to campaign workspace</a>
      {showIntro && <CinematicIntro onComplete={completeIntro} />}
      <div className={cx("studio-shell", showIntro && "studio-awaiting")} aria-hidden={showIntro || undefined} inert={showIntro || undefined}>
        <AppSidebar open={navOpen} onClose={() => setNavOpen(false)} onCommand={() => setCommandOpen(true)} />
        {navOpen && <button className="nav-scrim" onClick={() => setNavOpen(false)} aria-label="Close navigation overlay" />}
        <div className="studio-main">
          <AppHeader onMenu={() => setNavOpen(true)} onCommand={() => setCommandOpen(true)} />
          <main ref={contentRef} className="content-frame" id="studio-content" tabIndex={-1}><CurrentView /></main>
        </div>
        {commandOpen && <StudioSwitcher open onClose={() => setCommandOpen(false)} />}
        {notice && <div className="toast" role="status" aria-live="polite"><CheckCircle2 size={18} /><span>{notice}</span><button onClick={clearNotice} aria-label="Dismiss"><X size={15} /></button></div>}
      </div>
    </>
  );
}
