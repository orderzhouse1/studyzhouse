import { createHmac, randomBytes } from "node:crypto";

import { loadEnv } from "../config/env.js";

const SEGMENT_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSegment(len: number): string {
  let s = "";
  const buf = randomBytes(len * 2);
  for (let i = 0; i < len; i++) {
    s += SEGMENT_ALPHABET[buf[i]! % SEGMENT_ALPHABET.length];
  }
  return s;
}

/** تنسيق مقروء مثل STUDY-AB12-XY89 */
export function generateActivationPlain(): string {
  return `STUDY-${randomSegment(4)}-${randomSegment(4)}`;
}

export function normalizeActivationCode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/−/g, "-");
}

export function hashActivationCode(normalized: string): string {
  const env = loadEnv();
  const pepper = env.ACTIVATION_CODE_PEPPER ?? env.JWT_ACCESS_SECRET;
  return createHmac("sha256", pepper).update(normalized).digest("hex");
}
