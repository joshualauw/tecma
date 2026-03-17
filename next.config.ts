import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    authInterrupts: true,
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
};

export default nextConfig;
