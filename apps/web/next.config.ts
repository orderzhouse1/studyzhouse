import type { NextConfig } from "next";

const apiInternal =
  process.env.API_INTERNAL_URL ?? "http://127.0.0.1:4000";

const nextConfig: NextConfig = {
  transpilePackages: ["@studyhouse/shared"],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiInternal}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
