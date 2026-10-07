import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "ws",
    "bcryptjs",
    "@neondatabase/serverless",
    "@prisma/adapter-neon",
  ],
  experimental: {
    cpus: 1,
  },
};

export default nextConfig;
