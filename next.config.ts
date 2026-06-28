import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Optimize images served from our Vercel Blob store (wildcard subdomain so
    // we don't hardcode a store id). Pasted external URLs are rendered
    // `unoptimized`, so they deliberately do NOT need a remote pattern.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
