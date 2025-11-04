import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["www.tella.tv"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.tella.tv",
      },
    ],
  },
};

export default nextConfig;
