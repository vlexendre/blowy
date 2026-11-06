-- V5.5 (concept-v5.5, agent C) — enums (fichier séparé : ADD VALUE hors de leur usage).
ALTER TYPE "CompositionRunKind" ADD VALUE IF NOT EXISTS 'ROLLING';
ALTER TYPE "SeatFunding" ADD VALUE IF NOT EXISTS 'REFERRAL_FREE';
CREATE TYPE "Ambiance" AS ENUM ('CALM', 'LIVELY', 'ANY');
CREATE TYPE "OutingRequestMode" AS ENUM ('NORMAL', 'FRIENDS_THIS_WEEK');
