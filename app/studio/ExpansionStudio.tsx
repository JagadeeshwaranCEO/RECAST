"use client";

/* eslint-disable @next/next/no-img-element -- uploaded data URLs and local campaign assets require direct rendering in the editor. */

import { useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ArrowRight,
  Bot,
  CalendarClock,
  Check,
  CheckCircle2,
  Cloud,
  CloudOff,
  Copy,
  Download,
  ExternalLink,
  ImagePlus,
  Layers3,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Megaphone,
  Mail,
  Palette,
  Play,
  Radar,
  Rocket,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  SwatchBook,
  Trash2,
  Upload,
  WandSparkles,
  Workflow,
} from "lucide-react";
import { runLocalCampaignCouncil, type AgentCouncilResult } from "@/lib/agent-orchestrator";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useCampaignStore } from "@/store/campaign-store";
import { useWorkspaceStore } from "@/store/workspace-store";
import {
  posterDimensions,
  useProductionStore,
  type CreativeAssetKind,
  type PosterDraft,
  type PosterFormat,
  type PosterLayout,
} from "@/store/production-store";

const assetKinds: CreativeAssetKind[] = ["Logo", "Product", "Campaign poster", "Reference"];
const posterFormats = Object.entries(posterDimensions) as Array<[PosterFormat, (typeof posterDimensions)[PosterFormat]]>;
const posterLayouts: Array<{ id: PosterLayout; label: string; note: string }> = [
  { id: "editorial", label: "Editorial", note: "Image-led, oversized type" },
  { id: "split", label: "Product split", note: "Message and image share the frame" },
  { id: "minimal", label: "Proof first", note: "Quiet layout for factual campaigns" },
];

const palettePresets = [
  { name: "Quiet luxury", primary: "#171813", accent: "#d9ff68", text: "#f6f1e7" },
  { name: "Editorial signal", primary: "#3b0b12", accent: "#ff745e", text: "#fff1df" },
  { name: "Digital atelier", primary: "#0a1226", accent: "#73f2ce", text: "#f2f7ff" },
  { name: "Culture electric", primary: "#241044", accent: "#c6ff4d", text: "#fff7ed" },
];

const capabilityGroups = [
  { label: "Design system", sources: "Canva · Figma · Illustrator · Coolors", outcome: "Tokens, templates, responsive formats and palette control" },
  { label: "AI co-creation", sources: "Claude · ChatGPT · Midjourney", outcome: "Brief reasoning, copy variants, art direction and mood references" },
  { label: "Brand governance", sources: "Frontify · Brandfolder · Marq · Notion", outcome: "DAM, locked rules, approvals, versioning and shared knowledge" },
  { label: "Social operations", sources: "Buffer · Sprout Social · Hootsuite", outcome: "Native channel packages, calendar, approval and activation queues" },
  { label: "Signal intelligence", sources: "Brand24 · Mention", outcome: "Mentions, sentiment, risk alerts and insight-to-brief learning" },
];

function sectionHeading(eyebrow: string, title: string, emphasis: string, body: string) {
  return (
    <header className="production-heading">
      <span className="micro-label">{eyebrow}</span>
      <h1>{title}<br /><em>{emphasis}</em></h1>
      <p>{body}</p>
    </header>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadTextFile(name: string, content: string, type = "text/markdown") {
  const blob = new Blob([content], { type });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function encodeSharePayload(payload: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function BrandControlCenter() {
  const draft = useWorkspaceStore((state) => state.draft);
  const updateDraft = useWorkspaceStore((state) => state.updateDraft);
  const updatePoster = useProductionStore((state) => state.updatePoster);
  const setView = useCampaignStore((state) => state.setView);
  const [typeSystem, setTypeSystem] = useState("Editorial contrast");
  const [lockedRules, setLockedRules] = useState(["Approved palette", "Logo safe zone", "Claims from source"]);

  const toggleRule = (rule: string) => setLockedRules((current) => current.includes(rule) ? current.filter((item) => item !== rule) : [...current, rule]);
  const applyPalette = (preset: (typeof palettePresets)[number]) => {
    updateDraft({ primaryColor: preset.primary, accentColor: preset.accent });
    updatePoster({ backgroundColor: preset.primary, accentColor: preset.accent, textColor: preset.text });
  };
  const readiness = Math.min(100, 58 + lockedRules.length * 11 + (draft.tone.trim().length > 18 ? 9 : 0));

  return (
    <div className="view production-view">
      {sectionHeading("01 · BRAND OPERATING SYSTEM", "Make the brand usable.", "Then make it impossible to dilute.", "A shared control plane for visual tokens, voice, approved claims and reusable production rules. Changes made here flow directly into the poster studio.")}

      <section className="brand-os-overview">
        <div><span>ACTIVE SYSTEM</span><strong>{draft.brandName}</strong><small>{draft.productName}</small></div>
        <div><span>GOVERNANCE</span><strong>{readiness}% ready</strong><small>{lockedRules.length} production rules locked</small></div>
        <div><span>SYNC TARGETS</span><strong>Poster · Agents · Launch</strong><small>One source updates every output</small></div>
      </section>

      <section className="brand-os-grid">
        <div className="brand-token-panel">
          <div className="panel-heading"><div><span>VISUAL TOKENS</span><strong>Palette and typography</strong></div><SwatchBook size={18} /></div>
          <div className="palette-presets">
            {palettePresets.map((preset) => (
              <button key={preset.name} type="button" className={draft.primaryColor === preset.primary ? "selected" : ""} onClick={() => applyPalette(preset)}>
                <span><i style={{ background: preset.primary }} /><i style={{ background: preset.accent }} /><i style={{ background: preset.text }} /></span>
                <strong>{preset.name}</strong>
                <small>{preset.primary} · {preset.accent}</small>
              </button>
            ))}
          </div>
          <label className="brand-os-field"><span>Voice signature</span><textarea maxLength={180} value={draft.tone} onChange={(event) => updateDraft({ tone: event.target.value })} /></label>
          <fieldset className="type-system"><legend>Typography behavior</legend>{["Editorial contrast", "Modern utility", "Humanist clarity"].map((option) => <button key={option} type="button" className={typeSystem === option ? "selected" : ""} onClick={() => setTypeSystem(option)}>{option}<small>{option === "Editorial contrast" ? "Expressive headlines · neutral body" : option === "Modern utility" ? "One sans family · strict scale" : "Warm forms · generous rhythm"}</small></button>)}</fieldset>
        </div>

        <div className="brand-governance-panel">
          <div className="panel-heading"><div><span>GUARDRAILS</span><strong>What creators cannot break</strong></div><ShieldCheck size={18} /></div>
          <div className="brand-live-card" style={{ "--brand-os-primary": draft.primaryColor, "--brand-os-accent": draft.accentColor } as React.CSSProperties}>
            <small>{typeSystem.toUpperCase()}</small><strong>{draft.brandName}</strong><p>{draft.promise}</p><span>{draft.tone}</span><i />
          </div>
          <div className="brand-rule-list">
            {["Approved palette", "Logo safe zone", "Claims from source", "Human review before publish"].map((rule) => {
              const selected = lockedRules.includes(rule);
              return <button type="button" key={rule} className={selected ? "selected" : ""} onClick={() => toggleRule(rule)}><span>{selected ? <LockKeyhole size={14} /> : <Check size={14} />}</span><div><strong>{rule}</strong><small>{selected ? "Locked across production" : "Optional rule"}</small></div><b>{selected ? "ON" : "OFF"}</b></button>;
            })}
          </div>
          <button className="button button-primary" onClick={() => setView("assets")}>Open governed asset vault <ArrowRight size={16} /></button>
        </div>
      </section>

      <section className="capability-blueprint">
        <div className="panel-heading"><div><span>PROFESSIONAL TOOLCHAIN SYNTHESIS</span><strong>Five systems, one campaign flow</strong></div><Workflow size={18} /></div>
        <p className="capability-intro">RECAST does not copy these products. It combines the workflow standards teams expect from them into a meaning-aware campaign system.</p>
        <div>{capabilityGroups.map((group, index) => <article key={group.label}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{group.label}</strong><small>{group.sources}</small><p>{group.outcome}</p></div><CheckCircle2 size={17} /></article>)}</div>
      </section>
    </div>
  );
}

export function AssetVault() {
  const assets = useProductionStore((state) => state.assets);
  const addAsset = useProductionStore((state) => state.addAsset);
  const removeAsset = useProductionStore((state) => state.removeAsset);
  const updatePoster = useProductionStore((state) => state.updatePoster);
  const poster = useProductionStore((state) => state.poster);
  const draft = useWorkspaceStore((state) => state.draft);
  const inputRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<CreativeAssetKind>("Product");
  const [message, setMessage] = useState("PNG, JPEG or WebP · maximum 2 MB per file");

  const handleFile = (file?: File) => {
    if (!file) return;
    if (!(["image/png", "image/jpeg", "image/webp"] as string[]).includes(file.type)) {
      setMessage("Use a PNG, JPEG or WebP image. SVG is disabled for upload safety.");
      return;
    }
    if (file.size > 2_000_000) {
      setMessage("That file is larger than 2 MB. Compress it before adding it to this browser workspace.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      const id = `asset-upload-${Date.now()}`;
      addAsset({ id, name: file.name, kind, mimeType: file.type, size: file.size, url: reader.result, createdAt: new Date().toISOString() });
      updatePoster({ assetId: id });
      setMessage(`${file.name} added and placed into the poster studio.`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="view production-view">
      {sectionHeading("01 · BRAND SYSTEM", "Bring the real brand.", "RECAST learns the boundaries.", "Upload campaign photography, product shots, logos and existing posters. Assets stay local to this browser workspace and become available to every production surface.")}

      <section className="brand-vault-summary">
        <div><span>Active brand</span><strong>{draft.brandName}</strong><small>{draft.productName}</small></div>
        <div><span>Brand palette</span><strong className="palette-readout"><i style={{ background: draft.primaryColor }} /><i style={{ background: draft.accentColor }} />{draft.primaryColor} · {draft.accentColor}</strong><small>{draft.tone}</small></div>
        <div><span>Library health</span><strong>{assets.length} approved assets</strong><small>Images are available to posters and launch pages</small></div>
      </section>

      <section className="asset-workspace">
        <div className="asset-upload-panel">
          <div className="panel-heading"><div><span>INGEST</span><strong>Upload campaign material</strong></div><Upload size={18} /></div>
          <label className="asset-kind-label"><span>Asset role</span><select value={kind} onChange={(event) => setKind(event.target.value as CreativeAssetKind)}>{assetKinds.map((item) => <option key={item}>{item}</option>)}</select></label>
          <button className="asset-dropzone" onClick={() => inputRef.current?.click()} type="button">
            <ImagePlus size={25} />
            <strong>Choose an image</strong>
            <span>Product photography, logo, poster or visual reference</span>
          </button>
          <input ref={inputRef} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleFile(event.target.files?.[0])} data-testid="asset-upload" />
          <p className="asset-message" aria-live="polite">{message}</p>
          <div className="asset-safety"><ShieldCheck size={16} /><p><strong>Private by default.</strong> Uploads are stored in this browser session. Production storage should use signed uploads, malware scanning and rights metadata.</p></div>
        </div>

        <div className="asset-library-panel">
          <div className="panel-heading"><div><span>LIBRARY</span><strong>Brand-ready assets</strong></div><span>{assets.length} / 8</span></div>
          <div className="asset-library-grid">
            {assets.map((asset) => (
              <article key={asset.id} className={poster.assetId === asset.id ? "asset-library-selected" : ""}>
                <button className="asset-preview-button" onClick={() => updatePoster({ assetId: asset.id })} aria-label={`Use ${asset.name} in poster studio`}>
                  <img src={asset.url} alt="" />
                  {poster.assetId === asset.id && <span><Check size={13} /> In poster</span>}
                </button>
                <div><span>{asset.kind}</span><strong>{asset.name}</strong><small>{formatBytes(asset.size)}</small></div>
                {!asset.id.startsWith("asset-stride") && !asset.id.startsWith("asset-recast") && <button className="asset-remove" onClick={() => removeAsset(asset.id)} aria-label={`Remove ${asset.name}`}><Trash2 size={14} /></button>}
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function AgentRoom() {
  const draft = useWorkspaceStore((state) => state.draft);
  const result = useProductionStore((state) => state.agentResult);
  const setResult = useProductionStore((state) => state.setAgentResult);
  const setView = useCampaignStore((state) => state.setView);
  const [running, setRunning] = useState(false);
  const [activeAgent, setActiveAgent] = useState(0);
  const [error, setError] = useState("");
  const [copiedChannel, setCopiedChannel] = useState("");

  const brief = useMemo(() => ({
    brandName: draft.brandName,
    productName: draft.productName,
    challenge: draft.challenge,
    audience: draft.audience,
    objective: draft.objective,
    promise: draft.promise,
    proof: draft.proof,
    tone: draft.tone,
    market: draft.market,
    channels: draft.channels.length ? draft.channels : ["Instagram"],
  }), [draft]);

  const runCouncil = async () => {
    setRunning(true);
    setError("");
    try {
      const response = await fetch("/api/agents", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(brief) });
      if (!response.ok) throw new Error("Agent service unavailable");
      setResult(await response.json() as AgentCouncilResult);
      setActiveAgent(0);
    } catch {
      setResult(runLocalCampaignCouncil(brief));
      setError("The model provider was unavailable, so RECAST completed the council with its local governed planner.");
    } finally {
      setRunning(false);
    }
  };

  const current = result?.findings[activeAgent];
  const channelCopy = (channel: NonNullable<typeof result>["channelPlan"][number]) => [
    channel.deliverable.headline,
    "",
    channel.deliverable.body,
    "",
    channel.deliverable.cta,
    channel.deliverable.hashtags.join(" "),
  ].filter(Boolean).join("\n");
  const copyDeliverable = async (channel: NonNullable<typeof result>["channelPlan"][number]) => {
    await navigator.clipboard.writeText(channelCopy(channel));
    setCopiedChannel(channel.channel);
    window.setTimeout(() => setCopiedChannel(""), 1800);
  };
  const exportChannelPack = () => {
    if (!result) return;
    const content = [
      `# ${draft.brandName} — ${draft.productName}`,
      "",
      `> ${result.campaignThesis}`,
      "",
      `Generated: ${new Date(result.generatedAt).toLocaleString("en-IN")}`,
      `Mode: ${result.mode === "ai" ? "Model-assisted" : "Governed deterministic fallback"}`,
      "",
      ...result.channelPlan.flatMap((channel) => [
        `## ${channel.channel} — ${channel.format}`,
        "",
        `**Job:** ${channel.job}`,
        "",
        `**Headline:** ${channel.deliverable.headline}`,
        "",
        channel.deliverable.body,
        "",
        `**CTA:** ${channel.deliverable.cta}`,
        channel.deliverable.hashtags.length ? channel.deliverable.hashtags.join(" ") : "",
        "",
        `**Production notes:** ${channel.deliverable.productionNotes.join(" · ")}`,
        "",
      ]),
      "---",
      `Approved proof source: ${draft.proof}`,
    ].join("\n");
    downloadTextFile(`${draft.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "campaign"}-channel-pack.md`, content);
  };

  return (
    <div className="view production-view">
      {sectionHeading("02 · AGENT COUNCIL", "Six specialists.", "One governed campaign.", "Research, strategy, copy, art direction, claims and activation agents work from the same brand brief. They propose; your source of truth and human approval decide.")}

      <section className="agent-command">
        <div>
          <span>{draft.brandName} · {draft.market}</span>
          <strong>{draft.objective}</strong>
          <small>{draft.channels.join(" · ")}</small>
        </div>
        <button className="button button-primary" onClick={runCouncil} disabled={running} data-testid="run-agent-council">
          {running ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}
          {running ? "Agents are working" : result ? "Run council again" : "Run agent council"}
        </button>
      </section>

      {!result ? (
        <section className="agent-empty">
          <div className="agent-orbit" aria-hidden="true"><Bot size={36} /><i /><i /><i /></div>
          <h2>Turn the brief into a production plan.</h2>
          <p>The council will return a single campaign thesis, six accountable recommendations and a native role for every selected channel.</p>
          <div><span>01 Research</span><span>02 Strategy</span><span>03 Voice</span><span>04 Art</span><span>05 Claims</span><span>06 Activation</span></div>
        </section>
      ) : (
        <>
          <section className="agent-thesis">
            <div><span>{result.mode === "ai" ? "MODEL-GROUNDED RUN" : "LOCAL GOVERNED RUN"}</span><strong>Campaign thesis</strong></div>
            <p>{result.campaignThesis}</p>
            <small>{result.mode === "ai" ? "Generated through the configured AI provider and validated against RECAST’s response schema." : "Deterministic fallback active. Add OPENAI_API_KEY to enable model-assisted council runs."}</small>
          </section>
          {error && <p className="agent-error" role="status">{error}</p>}
          <section className="agent-workspace">
            <div className="agent-roster" role="tablist" aria-label="Campaign agents" onKeyDown={(event) => {
              if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
              event.preventDefault();
              const direction = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
              const next = (activeAgent + direction + result.findings.length) % result.findings.length;
              setActiveAgent(next);
              document.getElementById(`agent-tab-${next}`)?.focus();
            }}>
              {result.findings.map((finding, index) => <button id={`agent-tab-${index}`} aria-controls="agent-report-panel" key={finding.id} role="tab" tabIndex={activeAgent === index ? 0 : -1} aria-selected={activeAgent === index} className={activeAgent === index ? "agent-active" : ""} onClick={() => setActiveAgent(index)}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{finding.agent}</strong><small>{finding.role}</small></div><CheckCircle2 size={15} /></button>)}
            </div>
            {current && <article id="agent-report-panel" role="tabpanel" aria-labelledby={`agent-tab-${activeAgent}`} className="agent-report"><span>{current.role}</span><h2>{current.title}</h2><p>{current.summary}</p><div>{current.outputs.map((output) => <span key={output}><Check size={13} />{output}</span>)}</div></article>}
          </section>
          <section className="channel-plan channel-pack">
            <div className="panel-heading"><div><span>PUBLISH-READY CHANNEL PACK</span><strong>One idea. Finished native executions.</strong></div><Megaphone size={18} /></div>
            <div className="channel-pack-grid">{result.channelPlan.map((channel, index) => <article key={channel.channel} className="channel-deliverable">
              <div className="channel-deliverable-head"><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{channel.channel}</strong><small>{channel.format} · {channel.job}</small></div><button type="button" onClick={() => copyDeliverable(channel)} aria-label={`Copy ${channel.channel} deliverable`}><Copy size={14} />{copiedChannel === channel.channel ? "Copied" : "Copy"}</button></div>
              <h3>{channel.deliverable.headline}</h3>
              <p className="channel-body">{channel.deliverable.body}</p>
              <div className="channel-cta"><span>CTA</span><strong>{channel.deliverable.cta}</strong></div>
              {channel.deliverable.hashtags.length > 0 && <p className="channel-tags">{channel.deliverable.hashtags.join(" ")}</p>}
              <ul>{channel.deliverable.productionNotes.map((note) => <li key={note}>{note}</li>)}</ul>
            </article>)}</div>
            <div className="channel-pack-actions"><button className="button button-outline" type="button" onClick={exportChannelPack}><Download size={16} /> Export complete channel pack</button><button className="button button-primary" onClick={() => setView("poster")}>Build the campaign poster <ArrowRight size={16} /></button></div>
          </section>
        </>
      )}
    </div>
  );
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

function drawCover(context: CanvasRenderingContext2D, image: HTMLImageElement, width: number, height: number) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/);
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (context.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);
  }
  return lines.slice(0, 5);
}

async function exportPoster(poster: PosterDraft, assetUrl: string, brand: string) {
  const { width, height } = posterDimensions[poster.format];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.fillStyle = poster.backgroundColor;
  context.fillRect(0, 0, width, height);
  try {
    const image = await loadImage(assetUrl);
    drawCover(context, image, width, height);
  } catch { /* The color field remains a valid export fallback. */ }
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "rgba(2,5,10,.08)");
  gradient.addColorStop(.52, "rgba(2,5,10,.16)");
  gradient.addColorStop(1, "rgba(2,5,10,.9)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  const padding = Math.round(width * .075);
  context.fillStyle = poster.accentColor;
  context.font = `700 ${Math.round(width * .026)}px Arial`;
  context.fillText(brand.toUpperCase(), padding, padding + Math.round(width * .026));
  context.fillStyle = poster.textColor;
  context.font = `700 ${Math.round(width * (poster.format === "landscape" ? .068 : .074))}px Georgia`;
  const lines = wrapCanvasText(context, poster.headline, width * (poster.layout === "split" ? .55 : .82));
  const lineHeight = Math.round(width * .08);
  const startY = poster.layout === "minimal" ? Math.round(height * .28) : Math.round(height * .62);
  lines.forEach((line, index) => context.fillText(line, padding, startY + index * lineHeight));
  context.font = `600 ${Math.round(width * .019)}px Arial`;
  context.fillStyle = poster.accentColor;
  context.fillText(poster.subheadline.toUpperCase(), padding, height - padding * 1.45);
  context.fillStyle = poster.textColor;
  context.fillText(poster.cta, padding, height - padding * .72);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${brand.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "campaign"}-${poster.format}.png`;
  link.click();
}

export function PosterStudio() {
  const draft = useWorkspaceStore((state) => state.draft);
  const assets = useProductionStore((state) => state.assets);
  const poster = useProductionStore((state) => state.poster);
  const updatePoster = useProductionStore((state) => state.updatePoster);
  const setView = useCampaignStore((state) => state.setView);
  const revokeCreativeApproval = useCampaignStore((state) => state.revokeCreativeApproval);
  const asset = assets.find((item) => item.id === poster.assetId) ?? assets[0];
  const dimensions = posterDimensions[poster.format];
  const style = { "--poster-bg": poster.backgroundColor, "--poster-accent": poster.accentColor, "--poster-text": poster.textColor, aspectRatio: `${dimensions.width} / ${dimensions.height}` } as React.CSSProperties;
  const applyPosterPatch = (patch: Partial<PosterDraft>) => {
    updatePoster(patch);
    revokeCreativeApproval();
  };

  return (
    <div className="view production-view poster-studio-view">
      {sectionHeading("03 · POSTER STUDIO", "Design the campaign.", "Keep every fact connected.", "Choose a format, apply the brand system, use an uploaded campaign image and export a production-sized PNG without leaving RECAST.")}
      <section className="poster-workspace">
        <div className="poster-controls">
          <div className="panel-heading"><div><span>ART DIRECTION</span><strong>Poster controls</strong></div><Palette size={18} /></div>
          <fieldset><legend>Format</legend><div className="poster-choice-grid">{posterFormats.map(([id, item]) => <button type="button" key={id} className={poster.format === id ? "selected" : ""} onClick={() => applyPosterPatch({ format: id })}><strong>{id}</strong><small>{item.label}</small></button>)}</div></fieldset>
          <fieldset><legend>Layout system</legend><div className="poster-layout-list">{posterLayouts.map((layout) => <button type="button" key={layout.id} className={poster.layout === layout.id ? "selected" : ""} onClick={() => applyPosterPatch({ layout: layout.id })}><Layers3 size={15} /><span><strong>{layout.label}</strong><small>{layout.note}</small></span></button>)}</div></fieldset>
          <label><span>Headline</span><textarea value={poster.headline} maxLength={110} onChange={(event) => applyPosterPatch({ headline: event.target.value })} /></label>
          <label><span>Support line</span><input value={poster.subheadline} maxLength={100} onChange={(event) => applyPosterPatch({ subheadline: event.target.value })} /></label>
          <label><span>Call to action</span><input value={poster.cta} maxLength={50} onChange={(event) => applyPosterPatch({ cta: event.target.value })} /></label>
          <div className="poster-colors"><label><span>Background</span><input type="color" value={poster.backgroundColor} onChange={(event) => applyPosterPatch({ backgroundColor: event.target.value })} /></label><label><span>Accent</span><input type="color" value={poster.accentColor} onChange={(event) => applyPosterPatch({ accentColor: event.target.value })} /></label><label><span>Type</span><input type="color" value={poster.textColor} onChange={(event) => applyPosterPatch({ textColor: event.target.value })} /></label></div>
          <label><span>Campaign image</span><select value={poster.assetId} onChange={(event) => applyPosterPatch({ assetId: event.target.value })}>{assets.filter((item) => item.kind !== "Logo").map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        </div>

        <div className="poster-stage">
          <div className="poster-stage-toolbar"><div><span>LIVE MASTER</span><strong>{dimensions.width} × {dimensions.height}px</strong></div><span>SAFE ZONES ON</span></div>
          <article className={`poster-preview poster-${poster.layout}`} style={style} data-testid="poster-preview">
            {asset && <img src={asset.url} alt="Selected campaign visual" />}
            <div className="poster-overlay" />
            <div className="poster-brand"><span>{draft.brandName}</span><i /></div>
            <div className="poster-copy"><h2>{poster.headline.split("\n").map((line) => <span key={line}>{line}</span>)}</h2><p>{poster.subheadline}</p><strong>{poster.cta} <ArrowRight size={14} /></strong></div>
            <div className="poster-safe-zone" aria-hidden="true" />
          </article>
          <div className="poster-actions"><button className="button button-primary" onClick={() => asset && exportPoster(poster, asset.url, draft.brandName)} data-testid="export-poster"><Download size={16} /> Export production PNG</button><button className="button button-outline" onClick={() => setView("review")}><ShieldCheck size={16} /> Continue to review</button></div>
        </div>
      </section>
    </div>
  );
}

export function LaunchHub() {
  const draft = useWorkspaceStore((state) => state.draft);
  const poster = useProductionStore((state) => state.poster);
  const assets = useProductionStore((state) => state.assets);
  const launch = useProductionStore((state) => state.launch);
  const setLaunch = useProductionStore((state) => state.setLaunch);
  const agentResult = useProductionStore((state) => state.agentResult);
  const campaign = useCampaignStore((state) => state.campaign);
  const humanApproval = useCampaignStore((state) => state.humanApproval);
  const setView = useCampaignStore((state) => state.setView);
  const [notice, setNotice] = useState("");
  const [cloudEmail, setCloudEmail] = useState("");
  const [cloudSession, setCloudSession] = useState<Session | null>(null);
  const [cloudNotice, setCloudNotice] = useState("");
  const [cloudBusy, setCloudBusy] = useState(false);
  const cloudConfigured = isSupabaseConfigured();
  const asset = assets.find((item) => item.id === poster.assetId) ?? assets[0];
  const path = `/c/${launch.slug || "campaign"}`;
  const staleApprovals = campaign.approvals.filter((approval) => approval.status !== "approved").length;
  const launchChecks = [
    { label: "Brief", ready: Boolean(draft.brandName.trim() && draft.productName.trim() && draft.proof.trim()) },
    { label: "Agent council", ready: Boolean(agentResult) },
    { label: "Production master", ready: Boolean(asset && poster.headline.trim() && poster.cta.trim()) },
    { label: "Human approval", ready: humanApproval && staleApprovals === 0 },
    { label: "Destination", ready: Boolean(launch.slug.trim() && launch.channels.length) },
  ];
  const readyCount = launchChecks.filter((check) => check.ready).length;
  const launchReady = readyCount === launchChecks.length;
  const payload = {
    brandName: draft.brandName,
    productName: draft.productName,
    headline: poster.headline,
    subheadline: poster.subheadline,
    cta: poster.cta,
    imageUrl: asset?.url.startsWith("data:") ? undefined : asset?.url,
    backgroundColor: poster.backgroundColor,
    accentColor: poster.accentColor,
    proof: draft.proof,
    thesis: agentResult?.campaignThesis ?? draft.promise,
    publishedAt: launch.publishedAt ?? new Date().toISOString(),
  };
  const sharePath = `${path}?campaign=${encodeSharePayload(payload)}`;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setCloudSession(data.session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setCloudSession(session));

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const saveWorkspace = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !cloudSession) throw new Error("Sign in to save this campaign to the cloud.");

    const workspacePayload = {
      schemaVersion: 1,
      draft,
      poster,
      launch,
      agentResult,
      sourceVersion: campaign.version,
      assets: assets.filter((item) => !item.url.startsWith("data:")).map(({ id, name, kind, mimeType, size, url, createdAt }) => ({ id, name, kind, mimeType, size, url, createdAt })),
      savedAt: new Date().toISOString(),
    };
    const title = `${draft.brandName} — ${draft.productName}`.trim().slice(0, 160) || "Untitled campaign";
    const { data, error } = await supabase
      .from("campaign_workspaces")
      .upsert({ owner_id: cloudSession.user.id, slug: launch.slug, title, payload: workspacePayload }, { onConflict: "owner_id,slug" })
      .select("id")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Cloud workspace could not be saved.");
    return data.id as string;
  };

  const savePublishedCampaign = async (publishedPayload: typeof payload) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !cloudSession) throw new Error("Sign in to publish a durable campaign page.");
    const workspaceId = await saveWorkspace();
    const { error } = await supabase
      .from("campaign_publications")
      .upsert({
        workspace_id: workspaceId,
        owner_id: cloudSession.user.id,
        slug: launch.slug,
        payload: publishedPayload,
        status: "published",
        published_at: publishedPayload.publishedAt,
      }, { onConflict: "slug" });

    if (error) throw new Error(error.message);
  };

  const requestCloudSignIn = async () => {
    const supabase = getSupabaseBrowserClient();
    const email = cloudEmail.trim();
    if (!supabase) return;
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setCloudNotice("Enter a valid work email to receive the secure sign-in link.");
      return;
    }
    setCloudBusy(true);
    setCloudNotice("");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setCloudBusy(false);
    setCloudNotice(error ? error.message : "Secure sign-in link sent. Open it in this browser to enable cloud sync.");
  };

  const publish = async () => {
    if (!launchReady) return;
    const publishedPayload = { ...payload, publishedAt: new Date().toISOString() };
    localStorage.setItem(`recast:published:${launch.slug}`, JSON.stringify(publishedPayload));
    setLaunch({ status: "published", publishedAt: publishedPayload.publishedAt });
    if (!cloudSession) {
      setNotice(`Shareable campaign route is live at ${path}. Sign in to make this launch durable in RECAST Cloud.`);
      return;
    }
    setCloudBusy(true);
    try {
      await savePublishedCampaign(publishedPayload);
      setNotice(`Campaign is live at ${path} and persisted to RECAST Cloud.`);
    } catch (error) {
      setNotice(`Local share route is live at ${path}. Cloud sync needs attention: ${error instanceof Error ? error.message : "unknown error"}`);
    } finally {
      setCloudBusy(false);
    }
  };

  const schedule = () => {
    if (!launchReady) return;
    setLaunch({ status: "scheduled" });
    setNotice(`Launch queued for ${new Date(launch.launchAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.`);
  };

  return (
    <div className="view production-view">
      {sectionHeading("06 · LAUNCH CONTROL", "From approved work", "to a shareable campaign.", "Publish a deployment-relative campaign route, prepare channel-native activation slots and keep human approval between agent output and public activation.")}
      <section className="launch-status-row">
        <div><span>Campaign state</span><strong>{launch.status}</strong><small>{launch.status === "published" ? launch.publishedAt ? `Live since ${new Date(launch.publishedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}` : "Live now" : "Human activation required"}</small></div>
        <div><span>Release gates</span><strong>{readyCount} / {launchChecks.length} ready</strong><small>{launchReady ? "Brief, council, master, approval and destination" : launchChecks.filter((check) => !check.ready).map((check) => check.label).join(" · ")}</small></div>
        <div><span>Agent handoff</span><strong>{agentResult ? "Council complete" : "Not run yet"}</strong><small>{agentResult?.mode === "ai" ? "Model-assisted" : "Governed local plan"}</small></div>
      </section>

      <section className="launch-gates" aria-label="Launch readiness gates">
        {launchChecks.map((check) => <button key={check.label} type="button" className={check.ready ? "gate-ready" : ""} onClick={() => {
          if (check.label === "Brief") setView("builder");
          if (check.label === "Agent council") setView("agents");
          if (check.label === "Production master") setView("poster");
          if (check.label === "Human approval") setView("review");
        }}><span>{check.ready ? <Check size={13} /> : <LockKeyhole size={13} />}</span><strong>{check.label}</strong><small>{check.ready ? "Ready" : "Open to complete"}</small></button>)}
      </section>

      <section className="launch-grid">
        <div className="launch-settings">
          <div className="panel-heading"><div><span>HOSTING</span><strong>Campaign destination</strong></div><Rocket size={18} /></div>
          <label><span>Campaign slug</span><div className="slug-control"><small>/c/</small><input value={launch.slug} maxLength={64} onChange={(event) => setLaunch({ slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") })} /></div></label>
          <label><span>Launch date and time</span><input type="datetime-local" value={launch.launchAt} onChange={(event) => setLaunch({ launchAt: event.target.value })} /></label>
          <fieldset><legend>Activation destinations</legend><div className="launch-channels">{["Campaign page", "Instagram", "LinkedIn", "YouTube Shorts", "Email"].map((channel) => { const selected = launch.channels.includes(channel); return <button type="button" key={channel} className={selected ? "selected" : ""} onClick={() => setLaunch({ channels: selected ? launch.channels.filter((item) => item !== channel) : [...launch.channels, channel] })}>{selected && <Check size={13} />}{channel}</button>; })}</div></fieldset>
          <div className="launch-actions"><button className="button button-outline" onClick={schedule} disabled={!launchReady}><CalendarClock size={16} /> Schedule activation</button><button className="button button-primary" onClick={publish} disabled={!launchReady || cloudBusy} data-testid="publish-campaign"><Rocket size={16} /> {cloudBusy ? "Saving launch" : "Publish shareable campaign"}</button></div>
          {!launchReady && <p className="launch-blocked"><LockKeyhole size={14} /> Launch is intentionally locked. Complete every release gate above.</p>}
          {notice && <p className="launch-notice" role="status"><CheckCircle2 size={15} />{notice}</p>}
          {launch.status === "published" && <div className="published-actions"><a className="published-link" href={sharePath} target="_blank" rel="noreferrer"><Link2 size={15} />Open published campaign <ExternalLink size={14} /></a><button type="button" onClick={async () => { await navigator.clipboard.writeText(`${window.location.origin}${sharePath}`); setNotice("Share link copied to clipboard."); }}><Copy size={14} /> Copy share link</button></div>}
        </div>

        <div className="launch-preview">
          <div className="panel-heading"><div><span>LIVE PREVIEW</span><strong>{path}</strong></div><span>{launchReady ? launch.status.toUpperCase() : "LOCKED"}</span></div>
          <article style={{ background: poster.backgroundColor }}>
            {asset && <img src={asset.url} alt="Campaign page preview" />}
            <div><span>{draft.brandName} / {draft.productName}</span><h2>{poster.headline.split("\n")[0]}</h2><p>{agentResult?.campaignThesis ?? draft.promise}</p><strong>{poster.cta} <ArrowRight size={14} /></strong></div>
          </article>
          <div className="activation-list">
            {launch.channels.map((channel, index) => <div key={channel}><span>{index === 0 ? <Play size={14} /> : <CalendarClock size={14} />}</span><div><strong>{channel}</strong><small>{channel === "Campaign page" ? path : `Native ${channel} package · ${launch.launchAt.replace("T", " ")}`}</small></div><b>{launch.status === "published" && channel === "Campaign page" ? "LIVE" : launch.status === "scheduled" ? "QUEUED" : "DRAFT"}</b></div>)}
          </div>
        </div>
      </section>

      <section className="cloud-sync-panel">
        <div className="panel-heading"><div><span>RECAST CLOUD</span><strong>Private workspace. Durable launch.</strong></div>{cloudSession ? <Cloud size={18} /> : <CloudOff size={18} />}</div>
        {!cloudConfigured ? (
          <p>Cloud sync is not configured for this deployment. Your campaign stays in this browser session and portable share links continue to work.</p>
        ) : cloudSession ? (
          <div className="cloud-signed-in">
            <div><span><CheckCircle2 size={16} /> Connected</span><strong>{cloudSession.user.email ?? "Authenticated RECAST owner"}</strong><small>Only this signed-in owner can read or change the private workspace.</small></div>
            <div><button className="button button-outline" type="button" disabled={cloudBusy} onClick={async () => { setCloudBusy(true); setCloudNotice(""); try { await saveWorkspace(); setCloudNotice("Private campaign workspace saved to RECAST Cloud."); } catch (error) { setCloudNotice(error instanceof Error ? error.message : "Cloud workspace could not be saved."); } finally { setCloudBusy(false); } }}><Cloud size={15} /> {cloudBusy ? "Saving" : "Save workspace"}</button><button className="text-button" type="button" onClick={async () => { const supabase = getSupabaseBrowserClient(); await supabase?.auth.signOut(); setCloudSession(null); setCloudNotice("Signed out of RECAST Cloud on this device."); }}>Sign out</button></div>
          </div>
        ) : (
          <div className="cloud-sign-in"><div><strong>Keep this campaign beyond this tab.</strong><p>Use a passwordless work-email sign-in. RECAST’s row-level policies keep every draft private to its owner.</p></div><label><span className="sr-only">Work email</span><Mail size={15} /><input value={cloudEmail} type="email" autoComplete="email" maxLength={120} onChange={(event) => setCloudEmail(event.target.value)} placeholder="you@brand.com" /></label><button className="button button-outline" type="button" disabled={cloudBusy} onClick={requestCloudSignIn}><Mail size={15} /> {cloudBusy ? "Sending" : "Send sign-in link"}</button></div>
        )}
        {cloudNotice && <p className="cloud-sync-notice" role="status">{cloudNotice}</p>}
      </section>

      <section className="production-contract"><LockKeyhole size={18} /><div><strong>Production activation contract</strong><p>This build publishes a deployment-relative campaign page with a portable approved text payload. Browser-only uploaded media falls back to deployment assets. Production social publishing still requires OAuth channel connections, encrypted tokens, queue workers, retry policies, webhooks and platform review—those boundaries are not simulated.</p></div></section>
    </div>
  );
}

const demoSignals = [
  { source: "Instagram", author: "@cityuniform", tone: "positive", text: "The shift from office to evening without a costume change is the real story.", reach: "18.4K", topic: "Identity shift" },
  { source: "Editorial", author: "The New Form", tone: "neutral", text: "Adaptive tailoring is moving from technical promise to visible personal style.", reach: "42.1K", topic: "Category movement" },
  { source: "LinkedIn", author: "Arjun / Creative Ops", tone: "positive", text: "Show the modular proof. The audience will reward usefulness over another mood film.", reach: "6.8K", topic: "Product proof" },
  { source: "Community", author: "Hybrid India", tone: "risk", text: "Water-resistant is useful, but buyers will ask what conditions the claim covers.", reach: "3.2K", topic: "Claim clarity" },
];

export function SignalRadar() {
  const draft = useWorkspaceStore((state) => state.draft);
  const updateDraft = useWorkspaceStore((state) => state.updateDraft);
  const setView = useCampaignStore((state) => state.setView);
  const [windowDays, setWindowDays] = useState(30);
  const [query, setQuery] = useState(draft.brandName);
  const [activeTone, setActiveTone] = useState<"all" | "positive" | "neutral" | "risk">("all");
  const [notice, setNotice] = useState("");
  const filteredSignals = demoSignals.filter((signal) => activeTone === "all" || signal.tone === activeTone);

  const turnIntoBrief = () => {
    const insight = "Audience conversation prioritises identity shifts and visible modular proof; clarify the limits of every performance claim.";
    updateDraft({ challenge: `${draft.challenge}. Live signal: ${insight}`.slice(0, 500) });
    setNotice("Signal added to the campaign brief. The agent council will now reason from it.");
  };

  return (
    <div className="view production-view">
      {sectionHeading("05 · SIGNAL RADAR", "Launch is not the finish.", "The campaign learns in public.", "Track the conversations, risks and creative opportunities that should influence the next revision. This prototype uses clearly labelled demo signals until a listening provider is connected.")}

      <section className="radar-command">
        <div><Search size={17} /><input value={query} maxLength={80} onChange={(event) => setQuery(event.target.value)} aria-label="Brand monitoring query" /><span>DEMO SIGNALS</span></div>
        <div className="radar-window" aria-label="Listening period">{[7, 30, 90].map((days) => <button type="button" key={days} className={windowDays === days ? "selected" : ""} onClick={() => setWindowDays(days)}>{days}D</button>)}</div>
      </section>

      <section className="radar-metrics">
        <article><span>MENTIONS</span><strong>{windowDays === 7 ? "286" : windowDays === 30 ? "1,284" : "3,911"}</strong><small>Demo volume · +18% baseline</small></article>
        <article><span>NET SENTIMENT</span><strong>+62</strong><small>71% positive · 21% neutral</small></article>
        <article><span>SHARE OF VOICE</span><strong>18.7%</strong><small>Adaptive fashion conversation</small></article>
        <article className="risk-metric"><span>CLAIM RISKS</span><strong>01</strong><small>Needs human response</small></article>
      </section>

      <section className="radar-grid">
        <div className="signal-stream">
          <div className="panel-heading"><div><span>LISTENING STREAM</span><strong>What deserves action</strong></div><Radar size={18} /></div>
          <div className="tone-filters">{(["all", "positive", "neutral", "risk"] as const).map((tone) => <button type="button" key={tone} className={activeTone === tone ? "selected" : ""} onClick={() => setActiveTone(tone)}>{tone}</button>)}</div>
          <div className="signal-list">{filteredSignals.map((signal) => <article key={signal.author}><div><span className={`signal-tone signal-tone-${signal.tone}`} /> <strong>{signal.source}</strong><small>{signal.reach} estimated reach</small></div><p>“{signal.text}”</p><footer><span>{signal.author}</span><b>{signal.topic}</b></footer></article>)}</div>
        </div>

        <aside className="radar-actions-panel">
          <div className="panel-heading"><div><span>AGENT RECOMMENDATION</span><strong>Act on meaning, not noise</strong></div><WandSparkles size={18} /></div>
          <div className="radar-opportunity"><span>OPPORTUNITY 01</span><h2>Own the identity shift.</h2><p>Conversation is responding to the transition between roles more strongly than generic versatility. Lead the launch with that human tension, then prove modularity.</p><div><span>Confidence 86%</span><span>Evidence 3 signals</span></div></div>
          <div className="radar-risk"><ShieldCheck size={17} /><div><strong>Claims response required</strong><p>Define the test conditions behind “water-resistant” before activation.</p></div></div>
          <button className="button button-primary" type="button" onClick={turnIntoBrief}><Sparkles size={16} /> Add insight to agent brief</button>
          {notice && <p className="radar-notice" role="status">{notice}</p>}
          {notice && <button className="button button-outline" type="button" onClick={() => setView("agents")}>Re-run campaign council <ArrowRight size={15} /></button>}
        </aside>
      </section>

      <section className="connector-ledger">
        <div className="panel-heading"><div><span>CONNECTION LAYER</span><strong>Production integrations</strong></div><SlidersHorizontal size={18} /></div>
        <div>
          {[{ name: "Buffer", job: "Approval and publishing queue", state: "OAuth required" }, { name: "Sprout Social", job: "Inbox, analytics and governance", state: "Enterprise connector" }, { name: "Hootsuite", job: "Publishing and social intelligence", state: "OAuth required" }, { name: "Brand24", job: "Mention and sentiment stream", state: "API key required" }, { name: "Mention", job: "Web monitoring and alerts", state: "API key required" }].map((connector) => <article key={connector.name}><span><Link2 size={15} /></span><div><strong>{connector.name}</strong><small>{connector.job}</small></div><b>{connector.state}</b></article>)}
        </div>
        <p>RECAST keeps connectors explicit: no external publishing or listening is claimed until an authorised account and server-side credentials are configured.</p>
      </section>
    </div>
  );
}
