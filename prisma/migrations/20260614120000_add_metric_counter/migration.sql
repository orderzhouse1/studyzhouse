-- Aggregate metric counters (one row per key; no per-visit rows).
CREATE TABLE "MetricCounter" (
    "key" TEXT NOT NULL,
    "count" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetricCounter_pkey" PRIMARY KEY ("key")
);
