import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Keep Next from resolving the parent workspace as its Turbopack root during
  // Vercel builds. RECAST is a self-contained application inside this folder.
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
