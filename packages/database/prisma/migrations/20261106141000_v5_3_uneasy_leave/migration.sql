-- V5.3 (concept-v5.3 B.9, agent E T4) — « Je pars, mal à l'aise » : une trace par place, sans pénalité.
CREATE TABLE "SafetyUneasyLeave" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "outingId" UUID NOT NULL,
    "seatId" UUID NOT NULL,
    "notifyGuardian" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SafetyUneasyLeave_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SafetyUneasyLeave_seatId_key" ON "SafetyUneasyLeave"("seatId");
CREATE INDEX "SafetyUneasyLeave_userId_createdAt_idx" ON "SafetyUneasyLeave"("userId", "createdAt");
