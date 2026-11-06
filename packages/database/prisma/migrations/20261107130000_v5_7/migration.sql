-- V5.7 (concept-v5.7, spec révision 7, agent C) — additive.
-- E30 message d'accueil du lieu ; E32 badge « je préfère le calme ».
ALTER TABLE "Venue" ADD COLUMN "welcomeMessage" TEXT,
ADD COLUMN "welcomeMessageUpdatedAt" TIMESTAMPTZ(3);
ALTER TABLE "OutingPreferences" ADD COLUMN "showCalmBadge" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_welcomeMessage_len_check" CHECK ("welcomeMessage" IS NULL OR char_length("welcomeMessage") BETWEEN 1 AND 280);
