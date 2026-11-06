-- V5 T5 (C2) : connections — rendez-vous duo, bulletins duo, essais de check-in duo, « passer » voie Duo, colonnes Duo (additif).

-- CreateEnum
CREATE TYPE "DuoDateStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'DECLINED', 'SUPERSEDED', 'CANCELLED', 'DONE');

-- AlterTable
ALTER TABLE "Duo" ADD COLUMN     "eggOptInHigh" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "eggOptInLow" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "endedAt" TIMESTAMPTZ(3),
ADD COLUMN     "proposalId" UUID,
ADD COLUMN     "together" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DuoDate" (
    "id" UUID NOT NULL,
    "duoId" UUID NOT NULL,
    "proposedByUserId" UUID NOT NULL,
    "venueId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "DuoDateStatus" NOT NULL,
    "checkinLowAt" TIMESTAMPTZ(3),
    "checkinHighAt" TIMESTAMPTZ(3),
    "votesCloseAt" TIMESTAMPTZ(3),
    "votesClosedAt" TIMESTAMPTZ(3),
    "ballotsPurgedAt" TIMESTAMPTZ(3),
    "cancelledByUserId" UUID,
    "lateCancel" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DuoDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuoVote" (
    "id" UUID NOT NULL,
    "duoDateId" UUID NOT NULL,
    "voterUserId" UUID NOT NULL,
    "choice" "VoteChoice" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DuoVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuoDateCheckInAttempt" (
    "id" UUID NOT NULL,
    "duoDateId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "method" "CheckInMethod" NOT NULL,
    "result" "CheckInResult" NOT NULL,
    "accuracyBucket" "AccuracyBucket",
    "createdAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DuoDateCheckInAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuoLanePass" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DuoLanePass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DuoDate_duoId_idx" ON "DuoDate"("duoId");

-- CreateIndex
CREATE INDEX "DuoDate_status_startsAt_idx" ON "DuoDate"("status", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "DuoVote_duoDateId_voterUserId_key" ON "DuoVote"("duoDateId", "voterUserId");

-- CreateIndex
CREATE INDEX "DuoDateCheckInAttempt_duoDateId_userId_method_idx" ON "DuoDateCheckInAttempt"("duoDateId", "userId", "method");

-- CreateIndex
CREATE INDEX "DuoLanePass_userId_idx" ON "DuoLanePass"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DuoLanePass_proposalId_userId_key" ON "DuoLanePass"("proposalId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Duo_proposalId_key" ON "Duo"("proposalId");

-- CreateIndex
CREATE INDEX "Duo_status_exchangeEndsAt_idx" ON "Duo"("status", "exchangeEndsAt");

-- CreateIndex
CREATE INDEX "Duo_status_dateDeadline_idx" ON "Duo"("status", "dateDeadline");

-- AddForeignKey
ALTER TABLE "DuoDate" ADD CONSTRAINT "DuoDate_duoId_fkey" FOREIGN KEY ("duoId") REFERENCES "Duo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuoDate" ADD CONSTRAINT "DuoDate_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuoVote" ADD CONSTRAINT "DuoVote_duoDateId_fkey" FOREIGN KEY ("duoDateId") REFERENCES "DuoDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuoDateCheckInAttempt" ADD CONSTRAINT "DuoDateCheckInAttempt_duoDateId_fkey" FOREIGN KEY ("duoDateId") REFERENCES "DuoDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Contraintes (SQL brut)
CREATE UNIQUE INDEX "DuoDate_live_key" ON "DuoDate" ("duoId") WHERE status IN ('PROPOSED', 'CONFIRMED');
ALTER TABLE "DuoDate" ADD CONSTRAINT "DuoDate_times_chk" CHECK ("endsAt" > "startsAt" AND ("votesCloseAt" IS NULL OR "votesCloseAt" > "startsAt"));
ALTER TABLE "DuoDate" ADD CONSTRAINT "DuoDate_late_chk" CHECK (NOT "lateCancel" OR "status" = 'CANCELLED');

-- « Ta rue » (V5.3 F.24) : ranger ses souvenirs, offrir un accessoire gagné (sans notification ni jauge)
CREATE TABLE "StreetArrangement" (
    "userId" UUID NOT NULL,
    "memoryIds" UUID[],
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "StreetArrangement_pkey" PRIMARY KEY ("userId")
);

CREATE TABLE "StreetGift" (
    "id" UUID NOT NULL,
    "fromUserId" UUID NOT NULL,
    "toUserId" UUID NOT NULL,
    "linkId" UUID NOT NULL,
    "accessoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "StreetGift_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StreetGift_toUserId_createdAt_idx" ON "StreetGift"("toUserId", "createdAt");
CREATE UNIQUE INDEX "StreetGift_fromUserId_toUserId_accessoryId_key" ON "StreetGift"("fromUserId", "toUserId", "accessoryId");
ALTER TABLE "StreetGift" ADD CONSTRAINT "StreetGift_self_chk" CHECK ("fromUserId" <> "toUserId");
ALTER TABLE "StreetArrangement" ADD CONSTRAINT "StreetArrangement_size_chk" CHECK (cardinality("memoryIds") <= 30);
