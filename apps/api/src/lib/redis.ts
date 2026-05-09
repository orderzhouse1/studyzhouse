/**
 * Redis placeholder — Phase 2+ will swap this for a real client (ioredis/node-redis)
 * for sessions, rate limiting, and caching.
 */
export type RedisClientStub = {
  /** False until a real connection is implemented. */
  readonly connected: boolean;
};

export function createRedisClient(connectionUrl?: string): RedisClientStub | null {
  const trimmed = connectionUrl?.trim();
  if (!trimmed) {
    return null;
  }
  return { connected: false };
}
