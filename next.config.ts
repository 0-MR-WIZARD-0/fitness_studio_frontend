import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [new URL(`${apiUrl.replace(/\/$/, "")}/uploads/**`)],
    formats: ["image/webp"],
    minimumCacheTTL: 2592000,
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
