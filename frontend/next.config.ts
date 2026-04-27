import type { NextConfig } from "next";
import path from "node:path";

const repoRoot = path.resolve(__dirname, "..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
  },
};

export default nextConfig;
