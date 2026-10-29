import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, max-age=0, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "fal.media",
      },
      {
        protocol: "https",
        hostname: "*.fal.media",
      },
      {
        protocol: "https",
        hostname: "fal.run",
      },
      {
        protocol: "https",
        hostname: "image.pollinations.ai",
      },
      {
        protocol: "https",
        hostname: "replicate.delivery",
      },
    ],
  },

  turbopack: {
    resolveAlias: {
      fs: {
        browser: "./empty-module.js",
      },
      path: {
        browser: "./empty-module.js",
      },
    },
  },
};

export default nextConfig;
