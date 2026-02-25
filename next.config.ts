import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  async rewrites() {
    return [
      {
        source: "/bomberman/:path*",
        destination: "/bomberman/:path*",
      },
    ]
  },
};

export default nextConfig;
