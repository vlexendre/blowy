-- V5.6 (concept-v5.6, agent C) — enums (fichier séparé : ADD VALUE hors de leur usage).
ALTER TYPE "KnowsSomeoneStatus" ADD VALUE IF NOT EXISTS 'SAFETY_REVIEW';
CREATE TYPE "KidsHorizon" AS ENUM ('IN_1_2_YEARS', 'IN_3_5_YEARS', 'NO_PLAN', 'DONT_KNOW', 'HAS_ALREADY');
CREATE TYPE "ShareCardKind" AS ENUM ('INVITE', 'CONFIRMED', 'TEASER', 'HERE', 'EVENING', 'BAND', 'HELP_CITY', 'TEAM');
