-- V5 T4 (agent E) — module safety : ange gardien par lien web, alertes, « tout va bien », retraits système,
-- incidents sur place ; signalements V5 (contexte sortie, absences répétées). Additive uniquement.
-- CreateEnum
CREATE TYPE "GuardianSubjectKind" AS ENUM ('OUTING', 'DUO_DATE');

-- CreateEnum
CREATE TYPE "SafetyAlertStatus" AS ENUM ('OPEN', 'SAFE', 'HANDLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ModerationSubjectType" ADD VALUE 'SAFETY_ALERT';
ALTER TYPE "ModerationSubjectType" ADD VALUE 'OUTING';

-- AlterEnum
ALTER TYPE "ReportCategory" ADD VALUE 'REPEATED_NO_SHOW';

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "outingId" UUID;

-- CreateTable
CREATE TABLE "GuardianLink" (
    "id" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "subjectKind" "GuardianSubjectKind" NOT NULL,
    "subjectId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT,
    "activeFrom" TIMESTAMPTZ(3) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "revokeReason" TEXT,
    "lastViewedAt" TIMESTAMPTZ(3),
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "GuardianLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianPushSubscription" (
    "id" UUID NOT NULL,
    "guardianLinkId" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "purgeAfter" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "GuardianPushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyAlert" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "subjectKind" "GuardianSubjectKind" NOT NULL,
    "subjectId" UUID NOT NULL,
    "status" "SafetyAlertStatus" NOT NULL DEFAULT 'OPEN',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "accuracyM" INTEGER,
    "positionPurgeAfter" TIMESTAMPTZ(3),
    "positionPurgedAt" TIMESTAMPTZ(3),
    "moderationCaseId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "ackAt" TIMESTAMPTZ(3),
    "resolvedAt" TIMESTAMPTZ(3),
    "handledById" UUID,

    CONSTRAINT "SafetyAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyOkSignal" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "subjectKind" "GuardianSubjectKind" NOT NULL,
    "subjectId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SafetyOkSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetySystemRemoval" (
    "id" UUID NOT NULL,
    "outingId" UUID NOT NULL,
    "seatId" UUID NOT NULL,
    "removedUserId" UUID NOT NULL,
    "triggeredByUserId" UUID NOT NULL,
    "cause" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SafetySystemRemoval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyIncident" (
    "id" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "outingId" UUID NOT NULL,
    "venueId" UUID,
    "note" TEXT,
    "moderationCaseId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SafetyIncident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuardianLink_tokenHash_key" ON "GuardianLink"("tokenHash");

-- CreateIndex
CREATE INDEX "GuardianLink_subjectKind_subjectId_idx" ON "GuardianLink"("subjectKind", "subjectId");

-- CreateIndex
CREATE INDEX "GuardianLink_ownerUserId_subjectId_idx" ON "GuardianLink"("ownerUserId", "subjectId");

-- CreateIndex
CREATE INDEX "GuardianLink_expiresAt_idx" ON "GuardianLink"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianPushSubscription_guardianLinkId_key" ON "GuardianPushSubscription"("guardianLinkId");

-- CreateIndex
CREATE INDEX "SafetyAlert_status_createdAt_idx" ON "SafetyAlert"("status", "createdAt");

-- CreateIndex
CREATE INDEX "SafetyAlert_userId_createdAt_idx" ON "SafetyAlert"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SafetyAlert_subjectKind_subjectId_idx" ON "SafetyAlert"("subjectKind", "subjectId");

-- CreateIndex
CREATE INDEX "SafetyOkSignal_subjectKind_subjectId_userId_idx" ON "SafetyOkSignal"("subjectKind", "subjectId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "SafetySystemRemoval_seatId_key" ON "SafetySystemRemoval"("seatId");

-- CreateIndex
CREATE INDEX "SafetySystemRemoval_triggeredByUserId_createdAt_idx" ON "SafetySystemRemoval"("triggeredByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "SafetyIncident_outingId_idx" ON "SafetyIncident"("outingId");

-- CreateIndex
CREATE INDEX "Report_outingId_idx" ON "Report"("outingId");

-- AddForeignKey
ALTER TABLE "GuardianPushSubscription" ADD CONSTRAINT "GuardianPushSubscription_guardianLinkId_fkey" FOREIGN KEY ("guardianLinkId") REFERENCES "GuardianLink"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Contraintes (spec-v5 §8.2) : fenêtre d'un lien ≤ 18 h ; position complète ou absente ; précision bornée.
ALTER TABLE "GuardianLink" ADD CONSTRAINT "GuardianLink_window_chk" CHECK ("expiresAt" > "activeFrom" AND "expiresAt" - "activeFrom" <= interval '18 hours');
ALTER TABLE "GuardianLink" ADD CONSTRAINT "GuardianLink_label_chk" CHECK ("label" IS NULL OR char_length("label") BETWEEN 1 AND 30);
ALTER TABLE "GuardianLink" ADD CONSTRAINT "GuardianLink_views_chk" CHECK ("viewCount" >= 0);
ALTER TABLE "SafetyAlert" ADD CONSTRAINT "SafetyAlert_position_chk" CHECK ((("lat" IS NULL) = ("lng" IS NULL)) AND (("lat" IS NULL) = ("accuracyM" IS NULL)) AND ("lat" IS NULL OR "positionPurgeAfter" IS NOT NULL));
ALTER TABLE "SafetyAlert" ADD CONSTRAINT "SafetyAlert_accuracy_chk" CHECK ("accuracyM" IS NULL OR "accuracyM" BETWEEN 0 AND 100000);
ALTER TABLE "SafetySystemRemoval" ADD CONSTRAINT "SafetySystemRemoval_cause_chk" CHECK ("cause" IN ('BLOCK', 'KNOWS_SOMEONE'));
