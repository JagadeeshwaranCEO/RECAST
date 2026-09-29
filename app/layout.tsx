import type { Metadata } from "next";
import "./globals.css";

const fallbackSiteUrl = "https://recast-campaign-studio.kavitha1975-vlr.chatgpt.site";

function metadataBase(): URL {
  try {
    const candidate = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? fallbackSiteUrl);
    return candidate.protocol === "https:" || candidate.protocol === "http:" ? candidate : new URL(fallbackSiteUrl);
  } catch {
    return new URL(fallbackSiteUrl);
  }
}

export const metadata: Metadata = {
  metadataBase: metadataBase(),
  applicationName: "RECAST",
  title: "RECAST — Meaning-Aware Campaign Studio",
  description: "Build, research, revise and approve connected brand campaigns with a meaning-aware AI studio.",
  keywords: ["AI campaign studio", "brand content", "creative operations", "campaign intelligence", "selective revision"],
  authors: [{ name: "Team PARADOX" }],
  creator: "Team PARADOX",
  category: "technology",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "512x512" }],
    shortcut: "/favicon.png",
    apple: [{ url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    title: "RECAST — Meaning-Aware Campaign Studio",
    description: "Five decades of campaign intelligence, one connected creative source and a complete team studio.",
    siteName: "RECAST",
    type: "website",
    images: [{ url: "/og.png", width: 1672, height: 941, alt: "RECAST meaning-aware campaign studio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "RECAST — Meaning-Aware Campaign Studio",
    description: "Research-backed campaign creation, selective revision and team approvals in one studio.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
