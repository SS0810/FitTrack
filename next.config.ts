import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // Add this for Docker
  reactStrictMode: true,
    typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    unoptimized: true,
    domains: ["lh3.googleusercontent.com", "192.168.1.12", "localhost", "www.facebook.com", "api.dicebear.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.vercel.app",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
  },
};

export default nextConfig;
