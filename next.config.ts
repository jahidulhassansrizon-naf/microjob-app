import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
