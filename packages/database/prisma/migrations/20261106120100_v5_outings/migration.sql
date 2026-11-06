-- V5 (spec-v5 §8.2–8.3, concept-v5.1) — tables, colonnes, contraintes. Migration ADDITIVE.
-- Généré par prisma migrate diff puis complété (CHECK, index partiels) en fin de fichier.


-- CreateEnum
CREATE TYPE "NeighborhoodStatus" AS ENUM ('WAITLIST', 'LIVE', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "VenueStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ActivityKind" AS ENUM ('DRINK_COFFEE', 'BRUNCH', 'CLIMBING', 'WORKSHOP', 'GAMES', 'EXHIBITION');

-- CreateEnum
CREATE TYPE "LookingFor" AS ENUM ('FRIENDS', 'STORY', 'BOTH');

-- CreateEnum
CREATE TYPE "StorySeriousness" AS ENUM ('SERIOUS', 'SEE_HOW_IT_GOES');

-- CreateEnum
CREATE TYPE "KidsSomeday" AS ENUM ('YES', 'NO', 'DONT_KNOW');

-- CreateEnum
CREATE TYPE "MeetingMode" AS ENUM ('GROUP', 'DUO', 'BOTH');

-- CreateEnum
CREATE TYPE "TeamStatus" AS ENUM ('FORMING', 'ACTIVE', 'DISSOLVED');

-- CreateEnum
CREATE TYPE "OutingRequestStatus" AS ENUM ('OPEN', 'PLACED', 'UNPLACED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "UnplacedReason" AS ENUM ('POOL_TOO_SMALL', 'NO_COMPATIBLE_GROUP', 'NO_SLOT_CAPACITY', 'TEAM_INCOMPATIBLE');

-- CreateEnum
CREATE TYPE "CompositionRunKind" AS ENUM ('WEEKLY', 'RERUN', 'SEEDING');

-- CreateEnum
CREATE TYPE "CompositionRunStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "OutingStatus" AS ENUM ('PROPOSED', 'FORMING', 'CONFIRMED', 'CHECKIN_OPEN', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OutingCancelReason" AS ENUM ('UNDERSIZED', 'VENUE_UNAVAILABLE', 'STAFF', 'NEIGHBORHOOD_CLOSED', 'SAFETY');

-- CreateEnum
CREATE TYPE "SeatStatus" AS ENUM ('INVITED', 'HELD', 'CONFIRMED', 'CHECKED_IN', 'ATTENDED', 'NO_SHOW', 'DECLINED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SeatFunding" AS ENUM ('FREE_FIRST', 'PLUS_INCLUDED', 'CREDIT', 'PAID', 'STAFF_COMP');

-- CreateEnum
CREATE TYPE "SeatCancelKind" AS ENUM ('EARLY', 'LATE', 'SAFETY_EXIT', 'SYSTEM_REMOVAL', 'ACCOUNT_DELETED');

-- CreateEnum
CREATE TYPE "RefundState" AS ENUM ('NONE', 'PENDING', 'REFUNDED', 'RECREDITED', 'NOT_ELIGIBLE');

-- CreateEnum
CREATE TYPE "CheckInMethod" AS ENUM ('GEO', 'VENUE_CODE', 'STAFF');

-- CreateEnum
CREATE TYPE "CheckInResult" AS ENUM ('ACCEPTED', 'TOO_FAR', 'LOW_ACCURACY', 'CODE_INVALID');

-- CreateEnum
CREATE TYPE "AccuracyBucket" AS ENUM ('LE_50', 'LE_150', 'GT_150');

-- CreateEnum
CREATE TYPE "VoteChoice" AS ENUM ('FRIEND', 'PLUS', 'NO');

-- CreateEnum
CREATE TYPE "ConnectionKind" AS ENUM ('FRIEND', 'PLUS');

-- CreateEnum
CREATE TYPE "BandOrigin" AS ENUM ('OUTING_VOTE', 'DUO_VOTE', 'PLUS_ONE', 'LEGACY_V4');

-- CreateEnum
CREATE TYPE "DuoOrigin" AS ENUM ('LANE', 'OUTING_VOTE');

-- CreateEnum
CREATE TYPE "DuoStatus" AS ENUM ('EXCHANGE', 'UNLOCKED', 'DATE_PROPOSED', 'DATE_CONFIRMED', 'AFTER_VOTE', 'TOGETHER', 'EXPIRED', 'CLOSED', 'LEFT');

-- CreateEnum
CREATE TYPE "AttendanceDisputeStatus" AS ENUM ('OPEN', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PetMemoryKind" AS ENUM ('HATCHED', 'OUTING_LIVED', 'DUO_DATE_LIVED', 'BAND_NEW_MEMBER', 'PROMISE_KEPT', 'EGG');

-- CreateEnum
CREATE TYPE "AccessorySource" AS ENUM ('MEMORY', 'PLUS_MONTHLY', 'REFERRAL', 'STAFF');

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "duoId" UUID,
ADD COLUMN     "friendshipId" UUID,
ADD COLUMN     "outingId" UUID;

-- AlterTable
ALTER TABLE "Friendship" ADD COLUMN     "endedReason" TEXT,
ADD COLUMN     "origin" "BandOrigin",
ADD COLUMN     "sourceDuoId" UUID,
ADD COLUMN     "sourceOutingId" UUID;

-- AlterTable
ALTER TABLE "MatchPreferences" ADD COLUMN     "kidsSomeday" "KidsSomeday",
ADD COLUMN     "lookingFor" "LookingFor",
ADD COLUMN     "meetGenders" "Gender"[] DEFAULT ARRAY[]::"Gender"[],
ADD COLUMN     "meetingMode" "MeetingMode",
ADD COLUMN     "romanceGenders" "Gender"[] DEFAULT ARRAY[]::"Gender"[],
ADD COLUMN     "storySeriousness" "StorySeriousness";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "promptId" TEXT;

-- AlterTable
ALTER TABLE "PetState" ADD COLUMN     "engineStateV5" JSONB;

-- AlterTable
ALTER TABLE "PrivacySettings" ADD COLUMN     "discreetMode" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "neighborhoodChangedAt" TIMESTAMPTZ(3),
ADD COLUMN     "neighborhoodId" UUID;

-- CreateTable
CREATE TABLE "Neighborhood" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "cityZoneId" UUID NOT NULL,
    "timezone" TEXT NOT NULL,
    "status" "NeighborhoodStatus" NOT NULL DEFAULT 'WAITLIST',
    "densityThreshold" INTEGER NOT NULL DEFAULT 120,
    "estimatedLaunchAt" TIMESTAMPTZ(3),
    "launchedAt" TIMESTAMPTZ(3),
    "pausedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Neighborhood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeighborhoodSlotTemplate" (
    "id" UUID NOT NULL,
    "neighborhoodId" UUID NOT NULL,
    "isoWeekday" INTEGER NOT NULL,
    "localMinute" INTEGER NOT NULL,
    "activity" "ActivityKind" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NeighborhoodSlotTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" UUID NOT NULL,
    "neighborhoodId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "addressLine" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "offerKey" TEXT NOT NULL,
    "photoUrl" TEXT,
    "activities" "ActivityKind"[],
    "tablesPerSlot" INTEGER NOT NULL DEFAULT 1,
    "status" "VenueStatus" NOT NULL DEFAULT 'ACTIVE',
    "accessibilityTags" TEXT[],
    "checkinSecretRef" TEXT NOT NULL,
    "staffContact" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueSlot" (
    "id" UUID NOT NULL,
    "venueId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "activity" "ActivityKind" NOT NULL,
    "capacityOutings" INTEGER NOT NULL,
    "reservedOutings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VenueSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "neighborhoodId" UUID NOT NULL,
    "joinedAt" TIMESTAMPTZ(3) NOT NULL,
    "notifiedLaunchAt" TIMESTAMPTZ(3),

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutingPreferences" (
    "userId" UUID NOT NULL,
    "groupAgeMin" INTEGER NOT NULL,
    "groupAgeMax" INTEGER NOT NULL,
    "activities" "ActivityKind"[],
    "maxTravelMinutes" INTEGER NOT NULL DEFAULT 30,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "OutingPreferences_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UserAcceptableNeighborhood" (
    "userId" UUID NOT NULL,
    "neighborhoodId" UUID NOT NULL,

    CONSTRAINT "UserAcceptableNeighborhood_pkey" PRIMARY KEY ("userId","neighborhoodId")
);

-- CreateTable
CREATE TABLE "UserSlotAvailability" (
    "userId" UUID NOT NULL,
    "slotTemplateId" UUID NOT NULL,

    CONSTRAINT "UserSlotAvailability_pkey" PRIMARY KEY ("userId","slotTemplateId")
);

-- CreateTable
CREATE TABLE "UserWeekOff" (
    "userId" UUID NOT NULL,
    "weekKey" TEXT NOT NULL,

    CONSTRAINT "UserWeekOff_pkey" PRIMARY KEY ("userId","weekKey")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" UUID NOT NULL,
    "cityZoneId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "status" "TeamStatus" NOT NULL DEFAULT 'FORMING',
    "inviteCode" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dissolvedAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "joinedAt" TIMESTAMPTZ(3) NOT NULL,
    "leftAt" TIMESTAMPTZ(3),

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutingRequest" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "neighborhoodId" UUID NOT NULL,
    "weekKey" TEXT NOT NULL,
    "slotStartsAt" TIMESTAMPTZ(3)[],
    "teamId" UUID,
    "status" "OutingRequestStatus" NOT NULL DEFAULT 'OPEN',
    "unplacedReason" "UnplacedReason",
    "missedWeeks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "OutingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompositionRun" (
    "id" UUID NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "weekKey" TEXT NOT NULL,
    "kind" "CompositionRunKind" NOT NULL,
    "status" "CompositionRunStatus" NOT NULL DEFAULT 'RUNNING',
    "algoVersion" TEXT NOT NULL,
    "tuningVersion" TEXT NOT NULL,
    "seed" TEXT NOT NULL,
    "stats" JSONB,
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "finishedAt" TIMESTAMPTZ(3),

    CONSTRAINT "CompositionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outing" (
    "id" UUID NOT NULL,
    "neighborhoodId" UUID NOT NULL,
    "weekKey" TEXT NOT NULL,
    "kind" "CompositionRunKind" NOT NULL DEFAULT 'WEEKLY',
    "venueSlotId" UUID NOT NULL,
    "venueId" UUID NOT NULL,
    "activity" "ActivityKind" NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "OutingStatus" NOT NULL DEFAULT 'PROPOSED',
    "capacity" INTEGER NOT NULL,
    "composedAt" TIMESTAMPTZ(3) NOT NULL,
    "acceptDeadline" TIMESTAMPTZ(3) NOT NULL,
    "lockAt" TIMESTAMPTZ(3) NOT NULL,
    "photoRevealAt" TIMESTAMPTZ(3) NOT NULL,
    "checkinOpensAt" TIMESTAMPTZ(3) NOT NULL,
    "checkinClosesAt" TIMESTAMPTZ(3) NOT NULL,
    "votesCloseAt" TIMESTAMPTZ(3) NOT NULL,
    "votesClosedAt" TIMESTAMPTZ(3),
    "ballotsPurgedAt" TIMESTAMPTZ(3),
    "cancelReason" "OutingCancelReason",
    "cancelledAt" TIMESTAMPTZ(3),
    "compositionRunId" UUID,
    "tuningVersion" TEXT NOT NULL,
    "algoVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Outing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutingSeat" (
    "id" UUID NOT NULL,
    "outingId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "weekKey" TEXT NOT NULL,
    "teamId" UUID,
    "status" "SeatStatus" NOT NULL DEFAULT 'INVITED',
    "funding" "SeatFunding",
    "paymentRef" TEXT,
    "creditRef" TEXT,
    "holdExpiresAt" TIMESTAMPTZ(3),
    "acceptDeadline" TIMESTAMPTZ(3) NOT NULL,
    "invitedAt" TIMESTAMPTZ(3) NOT NULL,
    "confirmedAt" TIMESTAMPTZ(3),
    "respondedAt" TIMESTAMPTZ(3),
    "cancelledAt" TIMESTAMPTZ(3),
    "checkedInAt" TIMESTAMPTZ(3),
    "cancelKind" "SeatCancelKind",
    "refundState" "RefundState" NOT NULL DEFAULT 'NONE',
    "refundRef" TEXT,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OutingSeat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutingCheckIn" (
    "seatId" UUID NOT NULL,
    "method" "CheckInMethod" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "OutingCheckIn_pkey" PRIMARY KEY ("seatId")
);

-- CreateTable
CREATE TABLE "OutingCheckInAttempt" (
    "id" UUID NOT NULL,
    "seatId" UUID NOT NULL,
    "method" "CheckInMethod" NOT NULL,
    "result" "CheckInResult" NOT NULL,
    "accuracyBucket" "AccuracyBucket",
    "createdAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "OutingCheckInAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutingVote" (
    "id" UUID NOT NULL,
    "outingId" UUID NOT NULL,
    "voterUserId" UUID NOT NULL,
    "targetUserId" UUID NOT NULL,
    "choice" "VoteChoice" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "OutingVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectionReveal" (
    "id" UUID NOT NULL,
    "sourceKind" TEXT NOT NULL,
    "sourceId" UUID NOT NULL,
    "userLowId" UUID NOT NULL,
    "userHighId" UUID NOT NULL,
    "result" "ConnectionKind" NOT NULL,
    "revealedAt" TIMESTAMPTZ(3) NOT NULL,
    "friendshipId" UUID,
    "duoId" UUID,

    CONSTRAINT "ConnectionReveal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Duo" (
    "id" UUID NOT NULL,
    "userLowId" UUID NOT NULL,
    "userHighId" UUID NOT NULL,
    "origin" "DuoOrigin" NOT NULL,
    "status" "DuoStatus" NOT NULL,
    "exchangeEndsAt" TIMESTAMPTZ(3),
    "dateDeadline" TIMESTAMPTZ(3),
    "messagesLow" INTEGER NOT NULL DEFAULT 0,
    "messagesHigh" INTEGER NOT NULL DEFAULT 0,
    "datesAttended" INTEGER NOT NULL DEFAULT 0,
    "sourceOutingId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Duo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReliabilityStat" (
    "userId" UUID NOT NULL,
    "attended" INTEGER NOT NULL DEFAULT 0,
    "noShows" INTEGER NOT NULL DEFAULT 0,
    "lateCancels" INTEGER NOT NULL DEFAULT 0,
    "episodeAbsences" INTEGER NOT NULL DEFAULT 0,
    "lastAbsenceAt" TIMESTAMPTZ(3),
    "pausedUntil" TIMESTAMPTZ(3),
    "pauseEpisode" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ReliabilityStat_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "AttendanceDispute" (
    "id" UUID NOT NULL,
    "seatId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "note" TEXT NOT NULL,
    "status" "AttendanceDisputeStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedById" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "resolvedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AttendanceDispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetMemory" (
    "id" UUID NOT NULL,
    "petId" UUID NOT NULL,
    "kind" "PetMemoryKind" NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" UUID NOT NULL,
    "dedupKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PetMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetAccessory" (
    "id" UUID NOT NULL,
    "petId" UUID NOT NULL,
    "accessoryId" TEXT NOT NULL,
    "source" "AccessorySource" NOT NULL,
    "unlockedAt" TIMESTAMPTZ(3) NOT NULL,
    "equipped" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PetAccessory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Neighborhood_slug_key" ON "Neighborhood"("slug");

-- CreateIndex
CREATE INDEX "Neighborhood_cityZoneId_status_idx" ON "Neighborhood"("cityZoneId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "NeighborhoodSlotTemplate_neighborhoodId_isoWeekday_localMin_key" ON "NeighborhoodSlotTemplate"("neighborhoodId", "isoWeekday", "localMinute");

-- CreateIndex
CREATE INDEX "Venue_neighborhoodId_status_idx" ON "Venue"("neighborhoodId", "status");

-- CreateIndex
CREATE INDEX "VenueSlot_startsAt_idx" ON "VenueSlot"("startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "VenueSlot_venueId_startsAt_key" ON "VenueSlot"("venueId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_userId_key" ON "WaitlistEntry"("userId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_neighborhoodId_idx" ON "WaitlistEntry"("neighborhoodId");

-- CreateIndex
CREATE INDEX "UserAcceptableNeighborhood_neighborhoodId_idx" ON "UserAcceptableNeighborhood"("neighborhoodId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_inviteCode_key" ON "Team"("inviteCode");

-- CreateIndex
CREATE INDEX "Team_cityZoneId_status_idx" ON "Team"("cityZoneId", "status");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_idx" ON "TeamMember"("teamId");

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE INDEX "OutingRequest_neighborhoodId_weekKey_status_idx" ON "OutingRequest"("neighborhoodId", "weekKey", "status");

-- CreateIndex
CREATE UNIQUE INDEX "OutingRequest_userId_weekKey_key" ON "OutingRequest"("userId", "weekKey");

-- CreateIndex
CREATE UNIQUE INDEX "CompositionRun_scopeKey_weekKey_kind_key" ON "CompositionRun"("scopeKey", "weekKey", "kind");

-- CreateIndex
CREATE INDEX "Outing_status_lockAt_idx" ON "Outing"("status", "lockAt");

-- CreateIndex
CREATE INDEX "Outing_neighborhoodId_weekKey_idx" ON "Outing"("neighborhoodId", "weekKey");

-- CreateIndex
CREATE INDEX "OutingSeat_outingId_status_idx" ON "OutingSeat"("outingId", "status");

-- CreateIndex
CREATE INDEX "OutingSeat_status_holdExpiresAt_idx" ON "OutingSeat"("status", "holdExpiresAt");

-- CreateIndex
CREATE INDEX "OutingSeat_userId_status_idx" ON "OutingSeat"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "OutingSeat_outingId_userId_key" ON "OutingSeat"("outingId", "userId");

-- CreateIndex
CREATE INDEX "OutingCheckInAttempt_seatId_method_idx" ON "OutingCheckInAttempt"("seatId", "method");

-- CreateIndex
CREATE INDEX "OutingVote_outingId_idx" ON "OutingVote"("outingId");

-- CreateIndex
CREATE UNIQUE INDEX "OutingVote_outingId_voterUserId_targetUserId_key" ON "OutingVote"("outingId", "voterUserId", "targetUserId");

-- CreateIndex
CREATE INDEX "ConnectionReveal_userLowId_idx" ON "ConnectionReveal"("userLowId");

-- CreateIndex
CREATE INDEX "ConnectionReveal_userHighId_idx" ON "ConnectionReveal"("userHighId");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectionReveal_sourceKind_sourceId_userLowId_userHighId_key" ON "ConnectionReveal"("sourceKind", "sourceId", "userLowId", "userHighId");

-- CreateIndex
CREATE INDEX "Duo_userLowId_idx" ON "Duo"("userLowId");

-- CreateIndex
CREATE INDEX "Duo_userHighId_idx" ON "Duo"("userHighId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceDispute_seatId_key" ON "AttendanceDispute"("seatId");

-- CreateIndex
CREATE INDEX "AttendanceDispute_status_createdAt_idx" ON "AttendanceDispute"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PetMemory_dedupKey_key" ON "PetMemory"("dedupKey");

-- CreateIndex
CREATE INDEX "PetMemory_petId_createdAt_id_idx" ON "PetMemory"("petId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "PetAccessory_petId_accessoryId_key" ON "PetAccessory"("petId", "accessoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_outingId_key" ON "Conversation"("outingId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_duoId_key" ON "Conversation"("duoId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_friendshipId_key" ON "Conversation"("friendshipId");

-- CreateIndex
CREATE INDEX "User_neighborhoodId_idx" ON "User"("neighborhoodId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_outingId_fkey" FOREIGN KEY ("outingId") REFERENCES "Outing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_duoId_fkey" FOREIGN KEY ("duoId") REFERENCES "Duo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_friendshipId_fkey" FOREIGN KEY ("friendshipId") REFERENCES "Friendship"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Neighborhood" ADD CONSTRAINT "Neighborhood_cityZoneId_fkey" FOREIGN KEY ("cityZoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeighborhoodSlotTemplate" ADD CONSTRAINT "NeighborhoodSlotTemplate_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueSlot" ADD CONSTRAINT "VenueSlot_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutingPreferences" ADD CONSTRAINT "OutingPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAcceptableNeighborhood" ADD CONSTRAINT "UserAcceptableNeighborhood_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAcceptableNeighborhood" ADD CONSTRAINT "UserAcceptableNeighborhood_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSlotAvailability" ADD CONSTRAINT "UserSlotAvailability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSlotAvailability" ADD CONSTRAINT "UserSlotAvailability_slotTemplateId_fkey" FOREIGN KEY ("slotTemplateId") REFERENCES "NeighborhoodSlotTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserWeekOff" ADD CONSTRAINT "UserWeekOff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_cityZoneId_fkey" FOREIGN KEY ("cityZoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutingRequest" ADD CONSTRAINT "OutingRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutingRequest" ADD CONSTRAINT "OutingRequest_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outing" ADD CONSTRAINT "Outing_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outing" ADD CONSTRAINT "Outing_venueSlotId_fkey" FOREIGN KEY ("venueSlotId") REFERENCES "VenueSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outing" ADD CONSTRAINT "Outing_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Outing" ADD CONSTRAINT "Outing_compositionRunId_fkey" FOREIGN KEY ("compositionRunId") REFERENCES "CompositionRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutingSeat" ADD CONSTRAINT "OutingSeat_outingId_fkey" FOREIGN KEY ("outingId") REFERENCES "Outing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutingSeat" ADD CONSTRAINT "OutingSeat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutingCheckIn" ADD CONSTRAINT "OutingCheckIn_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "OutingSeat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutingCheckInAttempt" ADD CONSTRAINT "OutingCheckInAttempt_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "OutingSeat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutingVote" ADD CONSTRAINT "OutingVote_outingId_fkey" FOREIGN KEY ("outingId") REFERENCES "Outing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Duo" ADD CONSTRAINT "Duo_userLowId_fkey" FOREIGN KEY ("userLowId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Duo" ADD CONSTRAINT "Duo_userHighId_fkey" FOREIGN KEY ("userHighId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReliabilityStat" ADD CONSTRAINT "ReliabilityStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceDispute" ADD CONSTRAINT "AttendanceDispute_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "OutingSeat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetMemory" ADD CONSTRAINT "PetMemory_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetAccessory" ADD CONSTRAINT "PetAccessory_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- =============================================================================
-- Contraintes non exprimables en Prisma
-- =============================================================================

-- Quartiers, lieux, créneaux
ALTER TABLE "Neighborhood" ADD CONSTRAINT "Neighborhood_density_chk" CHECK ("densityThreshold" > 0);
ALTER TABLE "Neighborhood" ADD CONSTRAINT "Neighborhood_slug_chk" CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
ALTER TABLE "NeighborhoodSlotTemplate" ADD CONSTRAINT "SlotTemplate_weekday_chk" CHECK ("isoWeekday" BETWEEN 1 AND 7);
ALTER TABLE "NeighborhoodSlotTemplate" ADD CONSTRAINT "SlotTemplate_minute_chk" CHECK ("localMinute" BETWEEN 0 AND 1439);
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_coords_chk" CHECK (lat BETWEEN -90 AND 90 AND lng BETWEEN -180 AND 180);
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_tables_chk" CHECK ("tablesPerSlot" BETWEEN 1 AND 20);
ALTER TABLE "VenueSlot" ADD CONSTRAINT "VenueSlot_capacity_chk" CHECK ("reservedOutings" >= 0 AND "reservedOutings" <= "capacityOutings");

-- Profil V5 : intentions cohérentes (romanceGenders exigé pour « une histoire » ; sous-choix réservés à l'histoire)
ALTER TABLE "MatchPreferences" ADD CONSTRAINT "MatchPreferences_romance_chk"
  CHECK ("lookingFor" IS NULL OR "lookingFor" = 'FRIENDS' OR cardinality("romanceGenders") > 0);
ALTER TABLE "MatchPreferences" ADD CONSTRAINT "MatchPreferences_story_sub_chk"
  CHECK (("storySeriousness" IS NULL AND "kidsSomeday" IS NULL) OR "lookingFor" IN ('STORY', 'BOTH'));
ALTER TABLE "OutingPreferences" ADD CONSTRAINT "OutingPreferences_age_chk" CHECK ("groupAgeMin" >= 18 AND "groupAgeMin" <= "groupAgeMax" AND "groupAgeMax" <= 99);
ALTER TABLE "OutingPreferences" ADD CONSTRAINT "OutingPreferences_travel_chk" CHECK ("maxTravelMinutes" IN (20, 30, 45));
ALTER TABLE "UserWeekOff" ADD CONSTRAINT "UserWeekOff_key_chk" CHECK ("weekKey" ~ '^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$');

-- Teams : au plus une team active par personne ; pas deux fois le même membre actif
CREATE UNIQUE INDEX "TeamMember_active_user_key" ON "TeamMember" ("userId") WHERE "leftAt" IS NULL;
CREATE UNIQUE INDEX "TeamMember_active_team_user_key" ON "TeamMember" ("teamId", "userId") WHERE "leftAt" IS NULL;

-- Demandes
ALTER TABLE "OutingRequest" ADD CONSTRAINT "OutingRequest_week_chk" CHECK ("weekKey" ~ '^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$');
ALTER TABLE "OutingRequest" ADD CONSTRAINT "OutingRequest_slots_chk" CHECK (cardinality("slotStartsAt") BETWEEN 1 AND 7);
ALTER TABLE "OutingRequest" ADD CONSTRAINT "OutingRequest_missed_chk" CHECK ("missedWeeks" >= 0);

-- Sorties : taille 4–6 et ordre des instants figés
ALTER TABLE "Outing" ADD CONSTRAINT "Outing_capacity_chk" CHECK (capacity BETWEEN 4 AND 6);
ALTER TABLE "Outing" ADD CONSTRAINT "Outing_instants_chk" CHECK (
  "acceptDeadline" <= "lockAt" AND "photoRevealAt" >= "lockAt" AND "photoRevealAt" <= "startsAt"
  AND "lockAt" < "checkinOpensAt" AND "checkinOpensAt" < "startsAt" AND "startsAt" < "endsAt"
  AND "startsAt" < "checkinClosesAt" AND "checkinClosesAt" < "votesCloseAt");
ALTER TABLE "Outing" ADD CONSTRAINT "Outing_cancel_chk" CHECK ((status = 'CANCELLED') = ("cancelReason" IS NOT NULL));

-- Places : I-O2 au plus une place active par personne et par semaine (quota non achetable)
CREATE UNIQUE INDEX "OutingSeat_active_week_key" ON "OutingSeat" ("userId", "weekKey")
  WHERE status IN ('INVITED', 'HELD', 'CONFIRMED', 'CHECKED_IN', 'ATTENDED', 'NO_SHOW');
-- Financement fixé à la confirmation ; source exigée selon le financement
ALTER TABLE "OutingSeat" ADD CONSTRAINT "OutingSeat_funding_chk"
  CHECK (status NOT IN ('CONFIRMED', 'CHECKED_IN', 'ATTENDED', 'NO_SHOW') OR funding IS NOT NULL);
ALTER TABLE "OutingSeat" ADD CONSTRAINT "OutingSeat_paid_ref_chk" CHECK (funding IS DISTINCT FROM 'PAID' OR "paymentRef" IS NOT NULL);
ALTER TABLE "OutingSeat" ADD CONSTRAINT "OutingSeat_credit_ref_chk" CHECK (funding IS DISTINCT FROM 'CREDIT' OR "creditRef" IS NOT NULL);
ALTER TABLE "OutingSeat" ADD CONSTRAINT "OutingSeat_cancel_chk" CHECK ((status = 'CANCELLED') = ("cancelKind" IS NOT NULL));
CREATE UNIQUE INDEX "OutingSeat_paymentRef_key" ON "OutingSeat" ("paymentRef") WHERE "paymentRef" IS NOT NULL;
CREATE UNIQUE INDEX "OutingSeat_creditRef_key" ON "OutingSeat" ("creditRef") WHERE "creditRef" IS NOT NULL;

-- Votes : jamais sur soi
ALTER TABLE "OutingVote" ADD CONSTRAINT "OutingVote_self_chk" CHECK ("voterUserId" <> "targetUserId");

-- Accords et duos : paires canoniques
ALTER TABLE "ConnectionReveal" ADD CONSTRAINT "ConnectionReveal_pair_chk" CHECK ("userLowId" < "userHighId");
ALTER TABLE "ConnectionReveal" ADD CONSTRAINT "ConnectionReveal_link_chk" CHECK (("result" = 'FRIEND') = ("friendshipId" IS NOT NULL) AND ("result" = 'PLUS') = ("duoId" IS NOT NULL));
ALTER TABLE "Duo" ADD CONSTRAINT "Duo_pair_chk" CHECK ("userLowId" < "userHighId");
ALTER TABLE "Duo" ADD CONSTRAINT "Duo_counters_chk" CHECK ("messagesLow" >= 0 AND "messagesHigh" >= 0 AND "datesAttended" >= 0);
CREATE UNIQUE INDEX "Duo_live_pair_key" ON "Duo" ("userLowId", "userHighId") WHERE status NOT IN ('EXPIRED', 'CLOSED', 'LEFT');

-- Conversations : au plus un contexte
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_single_context_chk" CHECK (
  (("contextId" IS NOT NULL)::int + ("groupId" IS NOT NULL)::int + ("outingId" IS NOT NULL)::int
   + ("duoId" IS NOT NULL)::int + ("friendshipId" IS NOT NULL)::int) <= 1);
ALTER TABLE "Message" ADD CONSTRAINT "Message_promptId_chk" CHECK ("promptId" IS NULL OR "promptId" ~ '^[a-z0-9_.]{1,64}$');

-- Fiabilité : compteurs positifs
ALTER TABLE "ReliabilityStat" ADD CONSTRAINT "ReliabilityStat_counters_chk"
  CHECK (attended >= 0 AND "noShows" >= 0 AND "lateCancels" >= 0 AND "episodeAbsences" >= 0 AND "pauseEpisode" >= 0);

-- Souvenirs : append-only (un souvenir ne se perd jamais, §2.13)
CREATE OR REPLACE FUNCTION blowy_pet_memory_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'PetMemory est append-only';
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "PetMemory_no_update" BEFORE UPDATE ON "PetMemory" FOR EACH ROW EXECUTE FUNCTION blowy_pet_memory_append_only();

-- Contestations : note bornée
ALTER TABLE "AttendanceDispute" ADD CONSTRAINT "AttendanceDispute_note_chk" CHECK (char_length(note) BETWEEN 1 AND 500);
