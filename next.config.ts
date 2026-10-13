import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Placeholder editorial photography is served from Unsplash until
    // real campaign images are dropped into /public/images.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
