-- V5.10 (jury tour 11) : activités payantes prépayées dans l'app avec la place, reversées au lieu.
-- CreateEnum
CREATE TYPE "ActivityTaxBasis" AS ENUM ('TTC', 'HT');

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN "activityPriceCents" INTEGER,
ADD COLUMN "activityTaxBasis" "ActivityTaxBasis" NOT NULL DEFAULT 'TTC';

-- Prix positif ou nul (centimes entiers).
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_activityPriceCents_check" CHECK ("activityPriceCents" IS NULL OR "activityPriceCents" >= 0);
