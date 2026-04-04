import type { NextConfig } from "next";

const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "";
const basePath = rawBasePath.startsWith("/") ? rawBasePath : "";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone',
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
};

export default nextConfig;
