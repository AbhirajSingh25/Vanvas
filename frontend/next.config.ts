import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const rawApi = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    const backendBase = rawApi.replace(/\/api\/v1\/?$/, "");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendBase}/api/v1/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "commons.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "*.openstreetmap.org",
      },
    ],
  },
};

export default nextConfig;
