import type { Metadata } from "next";
import PublishedCampaign from "./PublishedCampaign";

export const metadata: Metadata = {
  title: "Campaign published with RECAST",
  description: "A brand campaign created, governed and published through RECAST.",
};

export default function CampaignPage() {
  return <PublishedCampaign />;
}
