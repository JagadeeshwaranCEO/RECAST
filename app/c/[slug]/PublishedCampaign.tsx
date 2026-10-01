"use client";

/* eslint-disable @next/next/no-img-element -- campaign publishers may use browser-local uploaded data URLs. */

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import {
  decodePublishedCampaignPayload,
  parsePublishedCampaignPayload,
  parseStoredCampaignPayload,
  type PublishedCampaignPayload,
} from "@/lib/published-campaign";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const fallback: PublishedCampaignPayload = {
  brandName: "Stride",
  productName: "The New Formal",
  headline: "YOUR DAY CHANGES.\nYOUR STYLE SHOULD KEEP UP.",
  subheadline: "STRIDE / THE NEW FORMAL · LIMITED LAUNCH",
  cta: "Meet the collection",
  imageUrl: "/assets/stride-fashion-editorial-v2.jpg",
  backgroundColor: "#080c13",
  accentColor: "#63e6cb",
  proof: "Three adaptable looks designed to move from street to studio to evening.",
  thesis: "A single point of view that adapts with the day.",
  publishedAt: "2026-09-29T00:00:00.000Z",
};

export default function PublishedCampaign() {
  const savedCampaign = useSyncExternalStore(
    () => () => undefined,
    () => {
      const slug = window.location.pathname.split("/").filter(Boolean).pop() ?? "campaign";
      return new URLSearchParams(window.location.search).get("campaign") ?? localStorage.getItem(`recast:published:${slug}`) ?? "";
    },
    () => "",
  );
  const [cloudCampaign, setCloudCampaign] = useState<PublishedCampaignPayload | null>(null);

  useEffect(() => {
    if (savedCampaign) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const slug = window.location.pathname.split("/").filter(Boolean).pop() ?? "campaign";
    let active = true;

    void supabase
      .from("campaign_publications")
      .select("payload")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const parsed = parsePublishedCampaignPayload(data?.payload);
        if (parsed) setCloudCampaign(parsed);
      });

    return () => { active = false; };
  }, [savedCampaign]);

  const campaign = useMemo(() => {
    if (savedCampaign) {
      return decodePublishedCampaignPayload(savedCampaign) ?? parseStoredCampaignPayload(savedCampaign) ?? fallback;
    }
    return cloudCampaign ?? fallback;
  }, [cloudCampaign, savedCampaign]);

  return (
    <main className="published-campaign" style={{ "--launch-bg": campaign.backgroundColor, "--launch-accent": campaign.accentColor } as React.CSSProperties}>
      <nav><strong>{campaign.brandName}</strong><span>{campaign.productName}</span><a href="#campaign-proof">Explore <ArrowRight size={15} /></a></nav>
      <section className="published-hero">
        {campaign.imageUrl && <img src={campaign.imageUrl} alt={`${campaign.brandName} ${campaign.productName} campaign`} />}
        <div className="published-shade" />
        <div className="published-copy"><span>{campaign.subheadline}</span><h1>{campaign.headline.split("\n").map((line) => <span key={line}>{line}</span>)}</h1><p>{campaign.thesis}</p><a href="#campaign-proof">{campaign.cta} <ArrowRight size={17} /></a></div>
        <small>Published with RECAST · {new Date(campaign.publishedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</small>
      </section>
      <section className="published-proof" id="campaign-proof"><span><CheckCircle2 size={18} /> VERIFIED CAMPAIGN PROOF</span><h2>Built from approved truth,<br />not invented claims.</h2><p>{campaign.proof}</p><Link href="/">Return to RECAST studio <ArrowRight size={15} /></Link></section>
    </main>
  );
}
