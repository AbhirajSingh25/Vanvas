import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const defaultBackend = "https://vanvas-api.onrender.com/api/v1";
    const rawApi = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== "")
      ? process.env.NEXT_PUBLIC_API_URL.trim()
      : defaultBackend;
    const backendBase = rawApi.replace(/\/+$/, "").replace(/\/api\/v1$/, "");
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
