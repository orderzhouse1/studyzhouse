import fs from "node:fs";
import path from "node:path";

import type { NextConfig } from "next";

/**
 * Monorepo: `.env` often lives at repo root while Next runs from `apps/web`.
 * Ensures `JWT_ACCESS_SECRET` is available when building middleware (Edge bundle inlines it).
 */
function mergeJwtSecretFromEnvFiles(): void {
  if (
    process.env.JWT_ACCESS_SECRET &&
    process.env.JWT_ACCESS_SECRET.length >= 32
  ) {
    return;
  }
  const candidates = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env"),
    path.resolve(process.cwd(), "../../.env"),
  ];
  for (const envPath of candidates) {
    try {
      const raw = fs.readFileSync(envPath, "utf8");
      const line = raw
        .split("\n")
        .find((l) => /^\s*JWT_ACCESS_SECRET=/.test(l));
      if (!line) continue;
      const eq = line.indexOf("=");
      const v = line
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      if (v.length >= 32) {
        process.env.JWT_ACCESS_SECRET = v;
        break;
      }
    } catch {
      /* missing or unreadable file */
    }
  }
}

mergeJwtSecretFromEnvFiles();

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
