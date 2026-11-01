-- CreateEnum
CREATE TYPE "MediaVisibility" AS ENUM ('PRIVATE', 'SHARED_WITH_CONTEXT');

-- AlterEnum
ALTER TYPE "MediaDerivativeKind" ADD VALUE 'BLURRED_MEDIUM';

-- AlterTable
ALTER TABLE "AIJob" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "contextId" UUID,
ADD COLUMN     "policyVersion" TEXT,
ADD COLUMN     "userId" UUID;

-- AlterTable
ALTER TABLE "AIResult" ADD COLUMN     "expiresAt" TIMESTAMPTZ(3),
ADD COLUMN     "invalidatedAt" TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "DataExport" ADD COLUMN     "downloadNonce" TEXT,
ADD COLUMN     "error" TEXT;

-- AlterTable
ALTER TABLE "DeletionRequest" ADD COLUMN     "backupPurgeAfter" TIMESTAMPTZ(3),
ADD COLUMN     "purgeAfter" TIMESTAMPTZ(3),
ADD COLUMN     "stats" JSONB;

-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN     "declaredMime" TEXT,
ADD COLUMN     "maxBytes" INTEGER,
ADD COLUMN     "rejectReason" TEXT,
ADD COLUMN     "restricted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "retentionVersion" TEXT,
ADD COLUMN     "uploadExpiresAt" TIMESTAMPTZ(3),
ADD COLUMN     "visibility" "MediaVisibility" NOT NULL DEFAULT 'PRIVATE';

-- AlterTable
ALTER TABLE "ModerationCase" ADD COLUMN     "restricted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subjectUserId" UUID;

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "VerificationSession" ADD COLUMN     "decisionCode" INTEGER,
ADD COLUMN     "lastProviderEventAt" TIMESTAMPTZ(3),
ADD COLUMN     "providerSessionUrl" TEXT,
ADD COLUMN     "reasonCode" TEXT;

-- CreateTable
CREATE TABLE "MediaAccessToken" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "viewerId" UUID NOT NULL,
    "variant" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageCounter" (
    "key" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "costMicros" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AIUsageCounter_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "MissionProofAssessment" (
    "id" UUID NOT NULL,
    "mediaId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "contextId" UUID,
    "missionKey" TEXT NOT NULL,
    "submittedAt" TIMESTAMPTZ(3) NOT NULL,
    "serverDay" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "assessment" JSONB,
    "promptVersion" TEXT,
    "rewardKey" TEXT,
    "rewardEmittedAt" TIMESTAMPTZ(3),
    "decidedAt" TIMESTAMPTZ(3),
    "decidedById" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionProofAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaAccessToken_tokenHash_key" ON "MediaAccessToken"("tokenHash");

-- CreateIndex
CREATE INDEX "MediaAccessToken_assetId_idx" ON "MediaAccessToken"("assetId");

-- CreateIndex
CREATE INDEX "MediaAccessToken_viewerId_revokedAt_idx" ON "MediaAccessToken"("viewerId", "revokedAt");

-- CreateIndex
CREATE INDEX "AIUsageCounter_day_idx" ON "AIUsageCounter"("day");

-- CreateIndex
CREATE UNIQUE INDEX "MissionProofAssessment_mediaId_key" ON "MissionProofAssessment"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionProofAssessment_rewardKey_key" ON "MissionProofAssessment"("rewardKey");

-- CreateIndex
CREATE INDEX "MissionProofAssessment_userId_serverDay_idx" ON "MissionProofAssessment"("userId", "serverDay");

-- CreateIndex
CREATE INDEX "MissionProofAssessment_status_idx" ON "MissionProofAssessment"("status");

-- CreateIndex
CREATE INDEX "AIJob_userId_status_idx" ON "AIJob"("userId", "status");

-- CreateIndex
CREATE INDEX "AIJob_contextId_status_idx" ON "AIJob"("contextId", "status");

-- CreateIndex
CREATE INDEX "MediaAsset_status_uploadExpiresAt_idx" ON "MediaAsset"("status", "uploadExpiresAt");

-- AddForeignKey
ALTER TABLE "MediaAccessToken" ADD CONSTRAINT "MediaAccessToken_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
