import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "";
const basePath = rawBasePath.startsWith("/") ? rawBasePath : "";
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactCompiler: false,
  turbopack: {
    root: projectRoot,
  },
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
