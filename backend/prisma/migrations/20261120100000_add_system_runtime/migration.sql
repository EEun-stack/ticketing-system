CREATE TABLE "system_runtime" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "totalRuntimeMs" BIGINT NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "lastHeartbeatAt" TIMESTAMP(3),

    CONSTRAINT "system_runtime_pkey" PRIMARY KEY ("id")
);
