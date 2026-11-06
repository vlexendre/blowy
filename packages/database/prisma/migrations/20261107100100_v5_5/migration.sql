-- V5.5 (concept-v5.5, agent C) — additive.
-- D-053 : composition glissante (jour local du créneau).
ALTER TABLE "CompositionRun" ADD COLUMN "slotDate" DATE;
-- D-055 : ambiance (lieu ; préférence, ANY par défaut).
ALTER TABLE "Venue" ADD COLUMN "ambiance" "Ambiance";
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_ambiance_chk" CHECK ("ambiance" IS NULL OR "ambiance" <> 'ANY');
ALTER TABLE "OutingPreferences" ADD COLUMN "ambiance" "Ambiance" NOT NULL DEFAULT 'ANY';
-- D-061 : « sortir quand même, en amitié » cette semaine.
ALTER TABLE "OutingRequest" ADD COLUMN "mode" "OutingRequestMode" NOT NULL DEFAULT 'NORMAL';
-- D-058 : astreinte mutualisée par fuseau.
CREATE TABLE "SafetyOnCallShift" (
    "id" UUID NOT NULL,
    "timezone" TEXT NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "teamLabel" TEXT NOT NULL,
    "phoneRef" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SafetyOnCallShift_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "SafetyOnCallShift_range_chk" CHECK ("endsAt" > "startsAt")
);
CREATE INDEX "SafetyOnCallShift_timezone_startsAt_idx" ON "SafetyOnCallShift"("timezone", "startsAt");
-- D-059 : photographie quotidienne des indicateurs de ville (serveur seulement).
CREATE TABLE "CityInsightSnapshot" (
    "cityZoneId" UUID NOT NULL,
    "day" DATE NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CityInsightSnapshot_pkey" PRIMARY KEY ("cityZoneId","day")
);
-- D-064 : parrainage = prochaine sortie offerte (≤ 1 par mois).
CREATE TABLE "ReferralReward" (
    "id" UUID NOT NULL,
    "referrerUserId" UUID NOT NULL,
    "refereeUserId" UUID NOT NULL,
    "period" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "consumedSeatId" UUID,
    "consumedAt" TIMESTAMPTZ(3),
    CONSTRAINT "ReferralReward_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ReferralReward_refereeUserId_key" ON "ReferralReward"("refereeUserId");
CREATE UNIQUE INDEX "ReferralReward_consumedSeatId_key" ON "ReferralReward"("consumedSeatId");
CREATE UNIQUE INDEX "ReferralReward_referrerUserId_period_key" ON "ReferralReward"("referrerUserId", "period");
CREATE INDEX "ReferralReward_referrerUserId_consumedSeatId_idx" ON "ReferralReward"("referrerUserId", "consumedSeatId");
