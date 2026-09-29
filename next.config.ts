import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Next from resolving the parent workspace as its Turbopack root during
  // Vercel builds. RECAST is a self-contained application inside this folder.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
