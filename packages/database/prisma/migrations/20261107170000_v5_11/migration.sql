-- V5.10 (passe 5) : note de table du lieu ; type du duo (pastille).
-- CreateEnum
CREATE TYPE "DuoKind" AS ENUM ('FRIENDS', 'STORY');

-- AlterTable
ALTER TABLE "Duo" ADD COLUMN "kind" "DuoKind";

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN "tableNote" TEXT,
ADD COLUMN "tableNoteUpdatedAt" TIMESTAMPTZ(3);

-- Reprise : un duo né d'une sortie résulte d'un vote « plus » mutuel (su des deux) → « Pour une histoire ».
UPDATE "Duo" SET "kind" = 'STORY' WHERE "origin" = 'OUTING_VOTE';
