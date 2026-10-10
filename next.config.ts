import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@libsql/client", "libsql"],
  experimental: {
    serverActions: { bodySizeLimit: "600mb" },
  },
  images: { unoptimized: true },
};

export default nextConfig;
