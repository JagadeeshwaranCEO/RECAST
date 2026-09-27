import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const socialImage = `${protocol}://${host}/og.png`;

  return {
    title: "RECAST — Meaning-Aware Campaign Studio",
    description: "Change the campaign’s meaning. Not twenty individual files.",
    icons: { icon: "/favicon.png" },
    openGraph: {
      title: "RECAST — Meaning-Aware Campaign Studio",
      description: "One campaign source. Selective revision. Protected creative.",
      type: "website",
      images: [{ url: socialImage, width: 1672, height: 941, alt: "RECAST meaning-aware campaign studio" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "RECAST — Meaning-Aware Campaign Studio",
      description: "Change the campaign’s meaning. Not twenty individual files.",
      images: [socialImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
