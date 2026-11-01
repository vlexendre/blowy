-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'RESTRICTED', 'SUSPENDED', 'BANNED', 'DELETED');

-- CreateEnum
CREATE TYPE "AuthProviderKind" AS ENUM ('FIREBASE', 'LOCAL');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('WOMAN', 'MAN', 'NON_BINARY', 'UNDISCLOSED');

-- CreateEnum
CREATE TYPE "Intention" AS ENUM ('FRIENDS_ONE', 'FRIENDS_GROUP', 'OPEN_TO_MORE', 'LET_IT_HAPPEN');

-- CreateEnum
CREATE TYPE "PhotoPreference" AS ENUM ('FROM_LEVEL_4_WITH_CONSENT', 'NEVER');

-- CreateEnum
CREATE TYPE "AgeDisplay" AS ENUM ('EXACT', 'RANGE');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'NEEDS_RETRY', 'HUMAN_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VerificationKind" AS ENUM ('SELFIE_QUALITY', 'SELFIE_HUMAN_REVIEW', 'LIVENESS', 'IDENTITY_AGE');

-- CreateEnum
CREATE TYPE "VerificationProvenance" AS ENUM ('PROVIDER', 'STAFF', 'LOCAL_DEMO');

-- CreateEnum
CREATE TYPE "Species" AS ENUM ('GASTON', 'PIA', 'NINO', 'SUZIE');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('BABY', 'YOUNG', 'ADULT');

-- CreateEnum
CREATE TYPE "PetKind" AS ENUM ('PRIMARY', 'CHILD');

-- CreateEnum
CREATE TYPE "PetOwnershipRole" AS ENUM ('OWNER', 'COPARENT');

-- CreateEnum
CREATE TYPE "VirtualLocationKind" AS ENUM ('HOME', 'DATE_SPOT', 'SHARED_HOME', 'FRIEND_HOME', 'GROUP_LOCAL', 'CUSTODY_HOME');

-- CreateEnum
CREATE TYPE "RelationshipContextType" AS ENUM ('DATE', 'NEIGHBORHOOD', 'GROUP', 'COPARENT');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('ACTIVE', 'MOVED_IN', 'PAUSED', 'LEGACY', 'ENDED');

-- CreateEnum
CREATE TYPE "Branch" AS ENUM ('UNDECIDED', 'FRIEND', 'PLUS');

-- CreateEnum
CREATE TYPE "EndReason" AS ENUM ('CLEAN_LEAVE', 'SILENCE_14D', 'MOVED_IN_ELSEWHERE', 'BLOCK', 'REPORT_SAFETY_EXIT', 'ACCOUNT_DELETED', 'TRANSFERRED_TO_NEIGHBORHOOD', 'MODERATION');

-- CreateEnum
CREATE TYPE "ConsentScope" AS ENUM ('MOVE_IN', 'BRANCH_VOTE', 'PHOTO_REVEAL', 'PHOTO_ORIGINAL', 'IRL_DATE', 'EGG', 'TRANSFER_TO_NEIGHBORHOOD');

-- CreateEnum
CREATE TYPE "ConsentSessionStatus" AS ENUM ('OPEN', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'SUPERSEDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConsentDecision" AS ENUM ('ACCEPT', 'DECLINE');

-- CreateEnum
CREATE TYPE "BallotChoice" AS ENUM ('FRIEND', 'PLUS');

-- CreateEnum
CREATE TYPE "BranchRoundStatus" AS ENUM ('OPEN', 'RESOLVED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('PARTICIPANTS', 'ACTOR_ONLY', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MatchBatchStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "MatchProposalKind" AS ENUM ('STRONG', 'DISCOVERY', 'ONBOARDING');

-- CreateEnum
CREATE TYPE "MatchProposalStatus" AS ENUM ('OPEN', 'ACCEPTED', 'EXPIRED', 'INVALIDATED');

-- CreateEnum
CREATE TYPE "ConversationKind" AS ENUM ('DATE', 'NEIGHBORHOOD', 'GROUP', 'COPARENT');

-- CreateEnum
CREATE TYPE "MessageKind" AS ENUM ('TEXT', 'VOICE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('DRAFT_LOCAL', 'PENDING_MODERATION', 'PUBLISHED', 'WARNED', 'QUARANTINED', 'REJECTED', 'HUMAN_REVIEW', 'PROCESSING_FAILED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('ALLOW', 'WARN', 'QUARANTINE', 'REJECT', 'HUMAN_REVIEW');

-- CreateEnum
CREATE TYPE "DecisionSource" AS ENUM ('DETERMINISTIC', 'AUTO', 'HUMAN');

-- CreateEnum
CREATE TYPE "ModerationSubjectType" AS ENUM ('MESSAGE', 'MEDIA', 'MISSION_SUBMISSION', 'BIRTH_NAME', 'PROFILE', 'ANONYMOUS_RESPONSE', 'USER');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('OPEN', 'ASSIGNED', 'RESOLVED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('OPEN', 'UPHELD', 'OVERTURNED');

-- CreateEnum
CREATE TYPE "MediaPurpose" AS ENUM ('PROFILE_PHOTO', 'MISSION_PROOF', 'VOICE_MESSAGE', 'VERIFICATION_SELFIE', 'CHAT_IMAGE');

-- CreateEnum
CREATE TYPE "MediaStatus" AS ENUM ('UPLOAD_PENDING', 'QUARANTINE', 'PROCESSING', 'READY', 'REJECTED', 'PURGED');

-- CreateEnum
CREATE TYPE "MediaDerivativeKind" AS ENUM ('NORMALIZED', 'THUMBNAIL', 'BLURRED', 'TRANSCRIPT');

-- CreateEnum
CREATE TYPE "AIJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "MissionDefinitionStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MissionSubmissionStatus" AS ENUM ('UPLOADED', 'PENDING_ANALYSIS', 'CONSISTENT', 'INCONSISTENT', 'UNCERTAIN', 'HUMAN_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MissionAwardKind" AS ENUM ('BASE', 'COMPLEMENT');

-- CreateEnum
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACTIVE', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "GroupStatus" AS ENUM ('FORMING', 'ACTIVE', 'UNDERSIZED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "GroupMemberStatus" AS ENUM ('INVITED', 'ACTIVE', 'LEFT', 'REMOVED');

-- CreateEnum
CREATE TYPE "ReferralClaimStatus" AS ENUM ('PENDING_ACTIVATION', 'REWARDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LedgerReason" AS ENUM ('MISSION_REWARD', 'STREAK_MILESTONE', 'REFERRAL_REFERRER', 'REFERRAL_REFEREE', 'NEIGHBORHOOD_FEED', 'MONTHLY_BENEFIT', 'STORE_PURCHASE', 'CATALOG_PURCHASE', 'LEAGUE_REWARD', 'SHARE_CARD_CREATED', 'STAFF_CORRECTION', 'REFUND_REVERSAL', 'BOOST_NOT_CONSUMED_REFUND');

-- CreateEnum
CREATE TYPE "LedgerSource" AS ENUM ('SYSTEM', 'STORE', 'CATALOG', 'STAFF', 'SUBSCRIPTION', 'MISSION', 'STREAK', 'REFERRAL', 'SOCIAL', 'LEAGUE');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('OWNED', 'ACTIVE', 'CONSUMED', 'EXPIRED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "StreakFreezeSource" AS ENUM ('CATALOG_PURCHASE', 'MONTHLY_BENEFIT', 'STAFF_GRANT');

-- CreateEnum
CREATE TYPE "StreakFreezeStatus" AS ENUM ('AVAILABLE', 'CONSUMED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "BillingProviderKind" AS ENUM ('REVENUECAT', 'LOCAL_DEMO');

-- CreateEnum
CREATE TYPE "BillingEnvironment" AS ENUM ('PRODUCTION', 'SANDBOX', 'LOCAL_DEMO');

-- CreateEnum
CREATE TYPE "CatalogItemKind" AS ENUM ('STREAK_FREEZE', 'VISIBILITY_BOOST', 'RARE_EGG_COSMETIC', 'ACCESSORY', 'DECORATION', 'GIFT');

-- CreateEnum
CREATE TYPE "StoreProductKind" AS ENUM ('SUBSCRIPTION', 'CONSUMABLE_COINS');

-- CreateEnum
CREATE TYPE "StoreTransactionStatus" AS ENUM ('CREDITED', 'REFUNDED', 'RECORDED');

-- CreateEnum
CREATE TYPE "SubscriptionState" AS ENUM ('NONE', 'TRIAL', 'ACTIVE', 'GRACE_PERIOD', 'CANCELLED_PENDING_EXPIRY', 'EXPIRED', 'REFUNDED', 'REVOKED');

-- CreateEnum
CREATE TYPE "EntitlementSource" AS ENUM ('STORE_SUBSCRIPTION', 'DERIVED_PARTNER', 'STAFF_GRANT', 'LOCAL_DEMO');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('RECEIVED', 'PROCESSED', 'IGNORED', 'FAILED');

-- CreateEnum
CREATE TYPE "LeagueKind" AS ENUM ('PETS', 'FRIENDS', 'NEIGHBORHOODS', 'GROUPS');

-- CreateEnum
CREATE TYPE "LeagueSeasonStatus" AS ENUM ('OPEN', 'FINALIZING', 'FINALIZED');

-- CreateEnum
CREATE TYPE "EggStatus" AS ENUM ('INCUBATING', 'READY_TO_HATCH', 'HATCHED');

-- CreateEnum
CREATE TYPE "IncubationNightStatus" AS ENUM ('OPEN', 'COMPLETED', 'CATCH_UP', 'VALIDATED');

-- CreateEnum
CREATE TYPE "CoparentStatus" AS ENUM ('ACTIVE', 'BLOCKED_INDEPENDENT', 'GONE');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('FAKE_PROFILE', 'INAPPROPRIATE', 'HARASSMENT', 'MONEY_REQUEST', 'MINOR', 'SAFETY', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'IN_REVIEW', 'ACTIONED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ReliabilityReason" AS ENUM ('GHOSTING_72H', 'DAILY_RESPONSIVE', 'STAFF_CORRECTION');

-- CreateEnum
CREATE TYPE "SafetyDateStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'CONFIRMED_AFTER');

-- CreateEnum
CREATE TYPE "GuardianInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "CheckInStatus" AS ENUM ('SCHEDULED', 'OK', 'HELP_REQUESTED', 'MISSED');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationCategory" AS ENUM ('HUMAN_MESSAGE', 'REAL_WAIT', 'STREAK', 'NEIGHBORHOOD', 'MISSION', 'MATCH', 'SAFETY', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'SUPPRESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "ConfigKind" AS ENUM ('TUNING', 'CONTENT');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('REQUESTED', 'RUNNING', 'READY', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "DeletionStatus" AS ENUM ('REQUESTED', 'REVOKING', 'PURGING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CommandStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('support', 'moderator', 'trust_lead', 'content_manager', 'finance', 'analyst', 'admin');

-- CreateTable
CREATE TABLE "Zone" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "email" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "birthDate" DATE,
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "zoneId" UUID,
    "reliability" INTEGER NOT NULL DEFAULT 100,
    "isFictional" BOOLEAN NOT NULL DEFAULT false,
    "onboardedAt" TIMESTAMPTZ(3),
    "lastActiveAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "deletedAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthIdentity" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "AuthProviderKind" NOT NULL,
    "subject" TEXT NOT NULL,
    "signInProvider" TEXT,
    "email" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMPTZ(3),

    CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeviceSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "deviceLabel" TEXT,
    "platform" TEXT,
    "appVersion" TEXT,
    "pushToken" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),

    CONSTRAINT "DeviceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffRoleAssignment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "StaffRole" NOT NULL,
    "grantedBy" UUID,
    "mfaEnrolled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ(3),

    CONSTRAINT "StaffRoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "userId" UUID NOT NULL,
    "displayName" TEXT NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'UNDISCLOSED',
    "publicSlug" TEXT,
    "slugEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "MatchPreferences" (
    "userId" UUID NOT NULL,
    "ageMin" INTEGER NOT NULL DEFAULT 18,
    "ageMax" INTEGER NOT NULL DEFAULT 35,
    "maxDistanceKm" INTEGER NOT NULL DEFAULT 5,
    "seekingGenders" "Gender"[],
    "intention" "Intention" NOT NULL DEFAULT 'LET_IT_HAPPEN',
    "areaCellLat" DOUBLE PRECISION,
    "areaCellLng" DOUBLE PRECISION,
    "areaPrecisionM" INTEGER,
    "widenConsented" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MatchPreferences_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "PrivacySettings" (
    "userId" UUID NOT NULL,
    "photoPreference" "PhotoPreference" NOT NULL DEFAULT 'FROM_LEVEL_4_WITH_CONSENT',
    "ageDisplay" "AgeDisplay" NOT NULL DEFAULT 'RANGE',
    "mapVisible" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PrivacySettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ProcessingConsent" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "purpose" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessingConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PausePeriod" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "contextId" UUID,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "endedAt" TIMESTAMPTZ(3),
    "periodKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PausePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kind" "VerificationKind" NOT NULL,
    "provenance" "VerificationProvenance" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "providerRef" TEXT,
    "verifiedAt" TIMESTAMPTZ(3),
    "expiresAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "VerificationSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pet" (
    "id" UUID NOT NULL,
    "kind" "PetKind" NOT NULL,
    "species" "Species" NOT NULL,
    "stage" "Stage" NOT NULL DEFAULT 'BABY',
    "name" TEXT NOT NULL,
    "primaryOwnerId" UUID,
    "matchable" BOOLEAN NOT NULL DEFAULT true,
    "petXpMilli" INTEGER NOT NULL DEFAULT 0,
    "engineVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Pet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetOwnership" (
    "id" UUID NOT NULL,
    "petId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "PetOwnershipRole" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMPTZ(3),

    CONSTRAINT "PetOwnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetVision" (
    "petId" UUID NOT NULL,
    "kindMischief" INTEGER NOT NULL,
    "sportyContemplative" INTEGER NOT NULL,
    "scienceArt" INTEGER NOT NULL,
    "homeAdventure" INTEGER NOT NULL,
    "school" TEXT NOT NULL,
    "sunday" TEXT NOT NULL,
    "passions" TEXT[],
    "limit" TEXT NOT NULL,
    "contentVersion" TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PetVision_pkey" PRIMARY KEY ("petId")
);

-- CreateTable
CREATE TABLE "PetState" (
    "petId" UUID NOT NULL,
    "satiety" DOUBLE PRECISION NOT NULL,
    "energy" DOUBLE PRECISION NOT NULL,
    "mood" DOUBLE PRECISION NOT NULL,
    "health" DOUBLE PRECISION NOT NULL,
    "lowSatietySince" TIMESTAMPTZ(3),
    "advancedTo" TIMESTAMPTZ(3) NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "tuningVersion" TEXT NOT NULL,
    "engineState" JSONB NOT NULL,
    "rngSeed" TEXT NOT NULL,
    "rngCounter" INTEGER NOT NULL DEFAULT 0,
    "lastCallRefused" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PetState_pkey" PRIMARY KEY ("petId")
);

-- CreateTable
CREATE TABLE "PetAppearance" (
    "petId" UUID NOT NULL,
    "variant" TEXT NOT NULL DEFAULT 'default',
    "accessories" JSONB NOT NULL DEFAULT '[]',
    "layers" JSONB,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PetAppearance_pkey" PRIMARY KEY ("petId")
);

-- CreateTable
CREATE TABLE "VirtualLocation" (
    "petId" UUID NOT NULL,
    "kind" "VirtualLocationKind" NOT NULL DEFAULT 'HOME',
    "contextId" UUID,
    "since" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VirtualLocation_pkey" PRIMARY KEY ("petId")
);

-- CreateTable
CREATE TABLE "PetCareEvent" (
    "id" UUID NOT NULL,
    "petId" UUID NOT NULL,
    "actorUserId" UUID,
    "action" TEXT NOT NULL,
    "contextId" UUID,
    "commandId" UUID,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,
    "effects" JSONB NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "tuningVersion" TEXT NOT NULL,

    CONSTRAINT "PetCareEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PetPair" (
    "id" UUID NOT NULL,
    "petLowId" UUID NOT NULL,
    "petHighId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PetPair_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipContext" (
    "id" UUID NOT NULL,
    "pairId" UUID NOT NULL,
    "type" "RelationshipContextType" NOT NULL,
    "status" "RelationshipStatus" NOT NULL DEFAULT 'ACTIVE',
    "branch" "Branch" NOT NULL DEFAULT 'UNDECIDED',
    "affinity" INTEGER NOT NULL,
    "xpMilli" INTEGER NOT NULL DEFAULT 0,
    "eligibleLevel" INTEGER NOT NULL DEFAULT 1,
    "reachedLevel" INTEGER NOT NULL DEFAULT 1,
    "complicity" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "tension" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dateSpotKey" TEXT,
    "timezone" TEXT NOT NULL,
    "legacy" BOOLEAN NOT NULL DEFAULT false,
    "movedInAt" TIMESTAMPTZ(3),
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "endedAt" TIMESTAMPTZ(3),
    "endReason" "EndReason",
    "lastEventSeq" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "engineVersion" TEXT NOT NULL,
    "tuningVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RelationshipContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipSide" (
    "id" UUID NOT NULL,
    "contextId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "petId" UUID NOT NULL,
    "desire" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "waitingSince" TIMESTAMPTZ(3),
    "replyOwedSince" TIMESTAMPTZ(3),
    "replyOwedEpisode" UUID,
    "pausedMsInEpisode" BIGINT NOT NULL DEFAULT 0,
    "exclusive" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMPTZ(3) NOT NULL,
    "leftAt" TIMESTAMPTZ(3),

    CONSTRAINT "RelationshipSide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentSession" (
    "id" UUID NOT NULL,
    "contextId" UUID NOT NULL,
    "scope" "ConsentScope" NOT NULL,
    "version" INTEGER NOT NULL,
    "subjectRef" TEXT,
    "proposedBy" UUID NOT NULL,
    "status" "ConsentSessionStatus" NOT NULL DEFAULT 'OPEN',
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "resolvedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentResponse" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "decision" "ConsentDecision" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchRound" (
    "id" UUID NOT NULL,
    "contextId" UUID NOT NULL,
    "roundNo" INTEGER NOT NULL,
    "status" "BranchRoundStatus" NOT NULL DEFAULT 'OPEN',
    "deadlineAt" TIMESTAMPTZ(3) NOT NULL,
    "result" "Branch",
    "resolvedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BranchRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchBallot" (
    "id" UUID NOT NULL,
    "roundId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "choice" "BallotChoice" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BranchBallot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipEvent" (
    "id" UUID NOT NULL,
    "contextId" UUID NOT NULL,
    "seq" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "actorUserId" UUID,
    "visibility" "EventVisibility" NOT NULL DEFAULT 'PARTICIPANTS',
    "payload" JSONB NOT NULL,
    "engineVersion" TEXT,
    "tuningVersion" TEXT,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RelationshipEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Memory" (
    "id" UUID NOT NULL,
    "contextId" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "refEventId" UUID,
    "data" JSONB NOT NULL,
    "sensitive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Memory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContributionEvent" (
    "id" UUID NOT NULL,
    "contextId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "dedupKey" TEXT NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ContributionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelationshipDailyCounter" (
    "id" UUID NOT NULL,
    "contextId" UUID NOT NULL,
    "relDay" TEXT NOT NULL,
    "counterKey" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "xpMilli" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RelationshipDailyCounter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchBatch" (
    "id" UUID NOT NULL,
    "zoneId" UUID NOT NULL,
    "localDate" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'DAILY',
    "status" "MatchBatchStatus" NOT NULL DEFAULT 'RUNNING',
    "algoVersion" TEXT NOT NULL,
    "tuningVersion" TEXT NOT NULL,
    "stats" JSONB,
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "finishedAt" TIMESTAMPTZ(3),

    CONSTRAINT "MatchBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchProposal" (
    "id" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "petLowId" UUID NOT NULL,
    "petHighId" UUID NOT NULL,
    "userLowId" UUID NOT NULL,
    "userHighId" UUID NOT NULL,
    "kind" "MatchProposalKind" NOT NULL,
    "visionScore" INTEGER NOT NULL,
    "rankScore" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "status" "MatchProposalStatus" NOT NULL DEFAULT 'OPEN',
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "contextId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMPTZ(3),

    CONSTRAINT "MatchProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchAcceptance" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchExposure" (
    "id" UUID NOT NULL,
    "proposalId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "shownAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "MatchExposure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" UUID NOT NULL,
    "kind" "ConversationKind" NOT NULL,
    "contextId" UUID,
    "groupId" UUID,
    "lastSeq" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMember" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "joinedAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "lastReadSeq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ConversationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "authorUserId" UUID,
    "clientMessageId" TEXT,
    "kind" "MessageKind" NOT NULL DEFAULT 'TEXT',
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING_MODERATION',
    "seq" INTEGER,
    "mediaId" UUID,
    "systemTemplate" TEXT,
    "policyVersion" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMPTZ(3),
    "decidedAt" TIMESTAMPTZ(3),
    "exchangeEvaluatedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageContent" (
    "messageId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "purgedAt" TIMESTAMPTZ(3),

    CONSTRAINT "MessageContent_pkey" PRIMARY KEY ("messageId")
);

-- CreateTable
CREATE TABLE "MessageReceipt" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "deliveredAt" TIMESTAMPTZ(3),
    "readAt" TIMESTAMPTZ(3),
    "revealedAt" TIMESTAMPTZ(3),

    CONSTRAINT "MessageReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "items" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "windowKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invalidatedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationSignal" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "tone" TEXT NOT NULL,
    "evidenceEventIds" TEXT[],
    "proposedReaction" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "purpose" "MediaPurpose" NOT NULL,
    "status" "MediaStatus" NOT NULL DEFAULT 'UPLOAD_PENDING',
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT,
    "bytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "durationMs" INTEGER,
    "sha256" TEXT,
    "retentionClass" TEXT NOT NULL,
    "contextId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedAt" TIMESTAMPTZ(3),
    "purgeAfter" TIMESTAMPTZ(3),
    "purgedAt" TIMESTAMPTZ(3),

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaDerivative" (
    "id" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "kind" "MediaDerivativeKind" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaDerivative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIJob" (
    "id" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" UUID NOT NULL,
    "dedupKey" TEXT NOT NULL,
    "status" "AIJobStatus" NOT NULL DEFAULT 'QUEUED',
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "promptVersion" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastErrorCode" TEXT,
    "durationMs" INTEGER,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "costMicros" INTEGER,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMPTZ(3),
    "cancelledAt" TIMESTAMPTZ(3),

    CONSTRAINT "AIJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIResult" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "output" JSONB NOT NULL,
    "validated" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationDecision" (
    "id" UUID NOT NULL,
    "subjectType" "ModerationSubjectType" NOT NULL,
    "subjectId" UUID NOT NULL,
    "messageId" UUID,
    "action" "ModerationAction" NOT NULL,
    "source" "DecisionSource" NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "provider" TEXT,
    "reasonCode" TEXT NOT NULL,
    "signals" JSONB,
    "decidedById" UUID,
    "supersedesId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationCase" (
    "id" UUID NOT NULL,
    "subjectType" "ModerationSubjectType" NOT NULL,
    "subjectId" UUID NOT NULL,
    "status" "CaseStatus" NOT NULL DEFAULT 'OPEN',
    "priority" INTEGER NOT NULL DEFAULT 2,
    "reasonCode" TEXT NOT NULL,
    "reportId" UUID,
    "assignedToId" UUID,
    "dueAt" TIMESTAMPTZ(3) NOT NULL,
    "resolvedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appeal" (
    "id" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "AppealStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Appeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionDefinition" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "MissionDefinitionStatus" NOT NULL DEFAULT 'DRAFT',
    "titleKey" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "accessibleAlternative" TEXT,
    "linkXpMilli" INTEGER NOT NULL,
    "petXpMilli" INTEGER NOT NULL,
    "coins" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMPTZ(3),

    CONSTRAINT "MissionDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMission" (
    "id" UUID NOT NULL,
    "definitionId" UUID NOT NULL,
    "zoneId" UUID NOT NULL,
    "day" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionSubmission" (
    "id" UUID NOT NULL,
    "dailyMissionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "contextId" UUID,
    "mediaId" UUID,
    "status" "MissionSubmissionStatus" NOT NULL DEFAULT 'UPLOADED',
    "submittedAt" TIMESTAMPTZ(3) NOT NULL,
    "serverDay" TEXT NOT NULL,
    "decidedAt" TIMESTAMPTZ(3),
    "reasonCode" TEXT,

    CONSTRAINT "MissionSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionParticipant" (
    "id" UUID NOT NULL,
    "dailyMissionId" UUID NOT NULL,
    "contextId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "validatedAt" TIMESTAMPTZ(3),

    CONSTRAINT "MissionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionRewardContext" (
    "id" UUID NOT NULL,
    "contextId" UUID NOT NULL,
    "dailyMissionId" UUID NOT NULL,
    "relDay" TEXT NOT NULL,
    "kMilli" INTEGER NOT NULL,
    "affinityMultMilli" INTEGER NOT NULL,
    "rulesVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionRewardContext_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MissionAward" (
    "id" UUID NOT NULL,
    "rewardKey" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "kind" "MissionAwardKind" NOT NULL,
    "linkXpMilli" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MissionAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" UUID NOT NULL,
    "userLowId" UUID NOT NULL,
    "userHighId" UUID NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMPTZ(3),
    "endedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Group" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "GroupStatus" NOT NULL DEFAULT 'FORMING',
    "localKey" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMPTZ(3),

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMember" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "GroupMemberStatus" NOT NULL DEFAULT 'INVITED',
    "joinedAt" TIMESTAMPTZ(3),
    "leftAt" TIMESTAMPTZ(3),

    CONSTRAINT "GroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupPairState" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "pairId" UUID NOT NULL,
    "complicity" DOUBLE PRECISION NOT NULL DEFAULT 20,

    CONSTRAINT "GroupPairState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralLink" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralClaim" (
    "id" UUID NOT NULL,
    "linkId" UUID NOT NULL,
    "referrerUserId" UUID NOT NULL,
    "refereeUserId" UUID NOT NULL,
    "status" "ReferralClaimStatus" NOT NULL DEFAULT 'PENDING_ACTIVATION',
    "claimedAt" TIMESTAMPTZ(3) NOT NULL,
    "rewardedAt" TIMESTAMPTZ(3),

    CONSTRAINT "ReferralClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnonymousResponse" (
    "id" UUID NOT NULL,
    "targetUserId" UUID NOT NULL,
    "words" TEXT[],
    "visitorTokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hiddenAt" TIMESTAMPTZ(3),
    "reportedAt" TIMESTAMPTZ(3),

    CONSTRAINT "AnonymousResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReputationAggregate" (
    "userId" UUID NOT NULL,
    "wordCounts" JSONB NOT NULL,
    "respondents" INTEGER NOT NULL DEFAULT 0,
    "scoreMilli" INTEGER NOT NULL DEFAULT 500,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ReputationAggregate_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "reason" "LedgerReason" NOT NULL,
    "source" "LedgerSource" NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "causeType" TEXT NOT NULL,
    "causeId" TEXT,
    "reversesEntryId" UUID,
    "actorUserId" UUID,
    "note" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "kind" "CatalogItemKind" NOT NULL,
    "priceCoins" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "perUserLimit" INTEGER,
    "stockLimit" INTEGER,
    "soldCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "catalogItemId" TEXT NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'OWNED',
    "acquiredAt" TIMESTAMPTZ(3) NOT NULL,
    "activatedAt" TIMESTAMPTZ(3),
    "consumedAt" TIMESTAMPTZ(3),
    "consumedRef" TEXT,
    "expiresAt" TIMESTAMPTZ(3),
    "ledgerEntryId" UUID,
    "commandId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreProduct" (
    "id" TEXT NOT NULL,
    "kind" "StoreProductKind" NOT NULL,
    "coinsAmount" INTEGER,
    "entitlementId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreTransaction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "BillingProviderKind" NOT NULL,
    "environment" "BillingEnvironment" NOT NULL,
    "store" TEXT NOT NULL,
    "storeTransactionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "kind" "StoreProductKind" NOT NULL,
    "purchasedAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "StoreTransactionStatus" NOT NULL DEFAULT 'RECORDED',
    "coinsCredited" INTEGER NOT NULL DEFAULT 0,
    "ledgerEntryId" UUID,
    "refundLedgerEntryId" UUID,
    "refundedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" "BillingProviderKind" NOT NULL,
    "environment" "BillingEnvironment" NOT NULL,
    "entitlementId" TEXT NOT NULL,
    "productId" TEXT,
    "store" TEXT,
    "state" "SubscriptionState" NOT NULL,
    "periodType" TEXT,
    "originalTransactionId" TEXT,
    "startedAt" TIMESTAMPTZ(3),
    "currentPeriodEndsAt" TIMESTAMPTZ(3),
    "gracePeriodEndsAt" TIMESTAMPTZ(3),
    "cancelledAt" TIMESTAMPTZ(3),
    "refundedAt" TIMESTAMPTZ(3),
    "revokedAt" TIMESTAMPTZ(3),
    "lastProviderEventAt" TIMESTAMPTZ(3),
    "lastReconciledAt" TIMESTAMPTZ(3),
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntitlementGrant" (
    "id" UUID NOT NULL,
    "beneficiaryUserId" UUID NOT NULL,
    "entitlementId" TEXT NOT NULL,
    "source" "EntitlementSource" NOT NULL,
    "environment" "BillingEnvironment" NOT NULL,
    "subscriptionId" UUID,
    "derivedFromUserId" UUID,
    "relationshipId" UUID,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3),
    "revokedAt" TIMESTAMPTZ(3),
    "revokeReason" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntitlementGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyBenefitGrant" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "period" TEXT NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "ledgerEntryId" UUID NOT NULL,
    "freezesGranted" INTEGER NOT NULL,
    "coinsGranted" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonthlyBenefitGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderWebhookEvent" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "environment" "BillingEnvironment" NOT NULL,
    "eventType" TEXT NOT NULL,
    "appUserId" TEXT,
    "eventTimestamp" TIMESTAMPTZ(3) NOT NULL,
    "receivedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ(3),
    "status" "WebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "payload" JSONB NOT NULL,

    CONSTRAINT "ProviderWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Streak" (
    "userId" UUID NOT NULL,
    "length" INTEGER NOT NULL DEFAULT 0,
    "longestLength" INTEGER NOT NULL DEFAULT 0,
    "lastQualifiedDay" TEXT,
    "lastCoveredDay" TEXT,
    "timeZone" TEXT NOT NULL,
    "calendarVersion" INTEGER NOT NULL DEFAULT 1,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Streak_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "StreakFreeze" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "source" "StreakFreezeSource" NOT NULL,
    "status" "StreakFreezeStatus" NOT NULL DEFAULT 'AVAILABLE',
    "grantedAt" TIMESTAMPTZ(3) NOT NULL,
    "consumedAt" TIMESTAMPTZ(3),
    "protectedDay" TEXT,
    "inventoryItemId" UUID,
    "monthlyBenefitGrantId" UUID,
    "expiresAt" TIMESTAMPTZ(3),

    CONSTRAINT "StreakFreeze_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueSeason" (
    "id" UUID NOT NULL,
    "kind" "LeagueKind" NOT NULL,
    "tier" INTEGER NOT NULL DEFAULT 1,
    "weekKey" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "status" "LeagueSeasonStatus" NOT NULL DEFAULT 'OPEN',
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "finalizedAt" TIMESTAMPTZ(3),

    CONSTRAINT "LeagueSeason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueMembership" (
    "id" UUID NOT NULL,
    "seasonId" UUID NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" UUID NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LeagueMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueScore" (
    "id" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "eventKey" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueReward" (
    "id" UUID NOT NULL,
    "seasonId" UUID NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" UUID NOT NULL,
    "rank" INTEGER NOT NULL,
    "coins" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeagueReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Egg" (
    "id" UUID NOT NULL,
    "contextId" UUID NOT NULL,
    "status" "EggStatus" NOT NULL DEFAULT 'INCUBATING',
    "timezone" TEXT NOT NULL,
    "warmthRaw" INTEGER NOT NULL DEFAULT 0,
    "nightsValidated" INTEGER NOT NULL DEFAULT 0,
    "seed" TEXT NOT NULL,
    "childPetId" UUID,
    "readyAt" TIMESTAMPTZ(3),
    "hatchedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Egg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncubationNight" (
    "id" UUID NOT NULL,
    "eggId" UUID NOT NULL,
    "logicalIndex" INTEGER NOT NULL,
    "status" "IncubationNightStatus" NOT NULL DEFAULT 'OPEN',
    "opensAt" TIMESTAMPTZ(3) NOT NULL,
    "closesAt" TIMESTAMPTZ(3) NOT NULL,
    "validatedOnRelDay" TEXT,
    "warmthGained" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "IncubationNight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncubationAnswer" (
    "id" UUID NOT NULL,
    "nightId" UUID NOT NULL,
    "questionKey" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncubationAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BirthVote" (
    "id" UUID NOT NULL,
    "eggId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "moderationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BirthVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChildPetData" (
    "petId" UUID NOT NULL,
    "eggId" UUID NOT NULL,
    "inheritedAxes" JSONB NOT NULL,
    "bodyFromPetId" UUID,
    "detailFromPetId" UUID,
    "seed" TEXT NOT NULL,

    CONSTRAINT "ChildPetData_pkey" PRIMARY KEY ("petId")
);

-- CreateTable
CREATE TABLE "CustodySchedule" (
    "id" UUID NOT NULL,
    "childPetId" UUID NOT NULL,
    "timezone" TEXT NOT NULL,
    "currentHolderUserId" UUID,
    "weekKey" TEXT NOT NULL,
    "operationalOverride" BOOLEAN NOT NULL DEFAULT false,
    "transferredAt" TIMESTAMPTZ(3),

    CONSTRAINT "CustodySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoparentLink" (
    "id" UUID NOT NULL,
    "childPetId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "CoparentStatus" NOT NULL DEFAULT 'ACTIVE',
    "independentProjection" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoparentLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" UUID NOT NULL,
    "blockerId" UUID NOT NULL,
    "blockedId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "reportedUserId" UUID NOT NULL,
    "contextId" UUID,
    "category" "ReportCategory" NOT NULL,
    "safetyExit" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "subjectRef" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReliabilityEvent" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "contextId" UUID,
    "reason" "ReliabilityReason" NOT NULL,
    "delta" INTEGER NOT NULL,
    "episodeKey" TEXT NOT NULL,
    "correctedById" UUID,
    "correctsEventId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReliabilityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyDate" (
    "id" UUID NOT NULL,
    "contextId" UUID NOT NULL,
    "placeRef" TEXT NOT NULL,
    "scheduledAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "SafetyDateStatus" NOT NULL DEFAULT 'PROPOSED',
    "confirmations" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SafetyDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianInvitation" (
    "id" UUID NOT NULL,
    "safetyDateId" UUID NOT NULL,
    "sharerUserId" UUID NOT NULL,
    "guardianUserId" UUID NOT NULL,
    "status" "GuardianInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuardianInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationShare" (
    "id" UUID NOT NULL,
    "invitationId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(3) NOT NULL,
    "endsAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),

    CONSTRAINT "LocationShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyLocationPoint" (
    "id" UUID NOT NULL,
    "shareId" UUID NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "accuracyM" INTEGER,
    "recordedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SafetyLocationPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SafetyCheckIn" (
    "id" UUID NOT NULL,
    "safetyDateId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "dueAt" TIMESTAMPTZ(3) NOT NULL,
    "status" "CheckInStatus" NOT NULL DEFAULT 'SCHEDULED',
    "respondedAt" TIMESTAMPTZ(3),

    CONSTRAINT "SafetyCheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommandRecord" (
    "id" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "operation" TEXT NOT NULL,
    "commandId" UUID NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "status" "CommandStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "result" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(3),

    CONSTRAINT "CommandRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DomainEvent" (
    "id" UUID NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" UUID NOT NULL,
    "seq" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "actorUserId" UUID,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "DomainEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" UUID NOT NULL,
    "topic" TEXT NOT NULL,
    "aggregateType" TEXT NOT NULL,
    "aggregateId" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "availableAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMPTZ(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsumerDeduplication" (
    "consumer" TEXT NOT NULL,
    "eventId" UUID NOT NULL,
    "processedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsumerDeduplication_pkey" PRIMARY KEY ("consumer","eventId")
);

-- CreateTable
CREATE TABLE "ProjectionEntry" (
    "id" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "seq" INTEGER NOT NULL,
    "sourceEventId" UUID NOT NULL,
    "room" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "aggregateId" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ProjectionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectionCursor" (
    "recipientId" UUID NOT NULL,
    "lastSeq" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProjectionCursor_pkey" PRIMARY KEY ("recipientId")
);

-- CreateTable
CREATE TABLE "JobExecution" (
    "id" UUID NOT NULL,
    "jobKey" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'RUNNING',
    "startedAt" TIMESTAMPTZ(3) NOT NULL,
    "finishedAt" TIMESTAMPTZ(3),
    "stats" JSONB,
    "error" TEXT,

    CONSTRAINT "JobExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "dedupKey" TEXT NOT NULL,
    "groupKey" TEXT,
    "templateKey" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "localDay" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMPTZ(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "category" "NotificationCategory" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigVersion" (
    "id" UUID NOT NULL,
    "kind" "ConfigKind" NOT NULL,
    "version" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "authorId" UUID,
    "activatedAt" TIMESTAMPTZ(3),
    "minClientVersion" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConfigVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorUserId" UUID,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "reason" TEXT,
    "data" JSONB,
    "requestId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataExport" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "ExportStatus" NOT NULL DEFAULT 'REQUESTED',
    "storageKey" TEXT,
    "requestedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readyAt" TIMESTAMPTZ(3),
    "expiresAt" TIMESTAMPTZ(3),

    CONSTRAINT "DataExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeletionRequest" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "DeletionStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(3),

    CONSTRAINT "DeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Zone_code_key" ON "Zone"("code");

-- CreateIndex
CREATE INDEX "User_zoneId_status_idx" ON "User"("zoneId", "status");

-- CreateIndex
CREATE INDEX "User_lastActiveAt_idx" ON "User"("lastActiveAt");

-- CreateIndex
CREATE INDEX "AuthIdentity_userId_idx" ON "AuthIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthIdentity_provider_subject_key" ON "AuthIdentity"("provider", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceSession_tokenHash_key" ON "DeviceSession"("tokenHash");

-- CreateIndex
CREATE INDEX "DeviceSession_userId_revokedAt_idx" ON "DeviceSession"("userId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StaffRoleAssignment_userId_role_key" ON "StaffRoleAssignment"("userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_publicSlug_key" ON "Profile"("publicSlug");

-- CreateIndex
CREATE INDEX "ProcessingConsent_userId_purpose_createdAt_idx" ON "ProcessingConsent"("userId", "purpose", "createdAt");

-- CreateIndex
CREATE INDEX "PausePeriod_userId_endsAt_idx" ON "PausePeriod"("userId", "endsAt");

-- CreateIndex
CREATE INDEX "PausePeriod_contextId_endsAt_idx" ON "PausePeriod"("contextId", "endsAt");

-- CreateIndex
CREATE INDEX "VerificationSession_userId_status_idx" ON "VerificationSession"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationSession_provenance_providerRef_key" ON "VerificationSession"("provenance", "providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "Pet_primaryOwnerId_key" ON "Pet"("primaryOwnerId");

-- CreateIndex
CREATE INDEX "PetOwnership_userId_idx" ON "PetOwnership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PetOwnership_petId_userId_key" ON "PetOwnership"("petId", "userId");

-- CreateIndex
CREATE INDEX "PetState_advancedTo_idx" ON "PetState"("advancedTo");

-- CreateIndex
CREATE INDEX "VirtualLocation_contextId_idx" ON "VirtualLocation"("contextId");

-- CreateIndex
CREATE INDEX "PetCareEvent_petId_occurredAt_idx" ON "PetCareEvent"("petId", "occurredAt");

-- CreateIndex
CREATE INDEX "PetPair_petHighId_idx" ON "PetPair"("petHighId");

-- CreateIndex
CREATE UNIQUE INDEX "PetPair_petLowId_petHighId_key" ON "PetPair"("petLowId", "petHighId");

-- CreateIndex
CREATE INDEX "RelationshipContext_pairId_type_status_idx" ON "RelationshipContext"("pairId", "type", "status");

-- CreateIndex
CREATE INDEX "RelationshipContext_status_type_idx" ON "RelationshipContext"("status", "type");

-- CreateIndex
CREATE INDEX "RelationshipSide_userId_active_idx" ON "RelationshipSide"("userId", "active");

-- CreateIndex
CREATE INDEX "RelationshipSide_replyOwedSince_idx" ON "RelationshipSide"("replyOwedSince");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipSide_contextId_userId_key" ON "RelationshipSide"("contextId", "userId");

-- CreateIndex
CREATE INDEX "ConsentSession_status_expiresAt_idx" ON "ConsentSession"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentSession_contextId_scope_version_key" ON "ConsentSession"("contextId", "scope", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentResponse_sessionId_userId_key" ON "ConsentResponse"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "BranchRound_status_deadlineAt_idx" ON "BranchRound"("status", "deadlineAt");

-- CreateIndex
CREATE UNIQUE INDEX "BranchRound_contextId_roundNo_key" ON "BranchRound"("contextId", "roundNo");

-- CreateIndex
CREATE UNIQUE INDEX "BranchBallot_roundId_userId_key" ON "BranchBallot"("roundId", "userId");

-- CreateIndex
CREATE INDEX "RelationshipEvent_contextId_occurredAt_idx" ON "RelationshipEvent"("contextId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipEvent_contextId_seq_key" ON "RelationshipEvent"("contextId", "seq");

-- CreateIndex
CREATE INDEX "Memory_contextId_createdAt_idx" ON "Memory"("contextId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ContributionEvent_dedupKey_key" ON "ContributionEvent"("dedupKey");

-- CreateIndex
CREATE INDEX "ContributionEvent_contextId_occurredAt_idx" ON "ContributionEvent"("contextId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipDailyCounter_contextId_relDay_counterKey_key" ON "RelationshipDailyCounter"("contextId", "relDay", "counterKey");

-- CreateIndex
CREATE UNIQUE INDEX "MatchBatch_zoneId_localDate_kind_key" ON "MatchBatch"("zoneId", "localDate", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "MatchProposal_contextId_key" ON "MatchProposal"("contextId");

-- CreateIndex
CREATE INDEX "MatchProposal_userLowId_status_idx" ON "MatchProposal"("userLowId", "status");

-- CreateIndex
CREATE INDEX "MatchProposal_userHighId_status_idx" ON "MatchProposal"("userHighId", "status");

-- CreateIndex
CREATE INDEX "MatchProposal_status_expiresAt_idx" ON "MatchProposal"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MatchAcceptance_proposalId_userId_key" ON "MatchAcceptance"("proposalId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchExposure_proposalId_userId_key" ON "MatchExposure"("proposalId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_contextId_key" ON "Conversation"("contextId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_groupId_key" ON "Conversation"("groupId");

-- CreateIndex
CREATE INDEX "ConversationMember_userId_revokedAt_idx" ON "ConversationMember"("userId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationMember_conversationId_userId_key" ON "ConversationMember"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_status_createdAt_idx" ON "Message"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Message_authorUserId_clientMessageId_key" ON "Message"("authorUserId", "clientMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_conversationId_seq_key" ON "Message"("conversationId", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "MessageReceipt_messageId_userId_key" ON "MessageReceipt"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Suggestion_conversationId_userId_windowKey_key" ON "Suggestion"("conversationId", "userId", "windowKey");

-- CreateIndex
CREATE INDEX "ConversationSignal_conversationId_expiresAt_idx" ON "ConversationSignal"("conversationId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");

-- CreateIndex
CREATE INDEX "MediaAsset_ownerUserId_purpose_idx" ON "MediaAsset"("ownerUserId", "purpose");

-- CreateIndex
CREATE INDEX "MediaAsset_sha256_idx" ON "MediaAsset"("sha256");

-- CreateIndex
CREATE INDEX "MediaAsset_purgeAfter_idx" ON "MediaAsset"("purgeAfter");

-- CreateIndex
CREATE UNIQUE INDEX "MediaDerivative_storageKey_key" ON "MediaDerivative"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "MediaDerivative_assetId_kind_key" ON "MediaDerivative"("assetId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "AIJob_dedupKey_key" ON "AIJob"("dedupKey");

-- CreateIndex
CREATE INDEX "AIJob_status_createdAt_idx" ON "AIJob"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AIJob_subjectType_subjectId_idx" ON "AIJob"("subjectType", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "AIResult_jobId_key" ON "AIResult"("jobId");

-- CreateIndex
CREATE INDEX "ModerationDecision_subjectType_subjectId_createdAt_idx" ON "ModerationDecision"("subjectType", "subjectId", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationCase_status_priority_dueAt_idx" ON "ModerationCase"("status", "priority", "dueAt");

-- CreateIndex
CREATE INDEX "ModerationCase_subjectType_subjectId_idx" ON "ModerationCase"("subjectType", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Appeal_caseId_userId_key" ON "Appeal"("caseId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionDefinition_key_version_key" ON "MissionDefinition"("key", "version");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMission_zoneId_day_key" ON "DailyMission"("zoneId", "day");

-- CreateIndex
CREATE INDEX "MissionSubmission_userId_serverDay_idx" ON "MissionSubmission"("userId", "serverDay");

-- CreateIndex
CREATE INDEX "MissionSubmission_status_idx" ON "MissionSubmission"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MissionParticipant_dailyMissionId_contextId_userId_key" ON "MissionParticipant"("dailyMissionId", "contextId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "MissionRewardContext_contextId_dailyMissionId_relDay_key" ON "MissionRewardContext"("contextId", "dailyMissionId", "relDay");

-- CreateIndex
CREATE UNIQUE INDEX "MissionAward_rewardKey_key" ON "MissionAward"("rewardKey");

-- CreateIndex
CREATE INDEX "Friendship_userHighId_idx" ON "Friendship"("userHighId");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_userLowId_userHighId_key" ON "Friendship"("userLowId", "userHighId");

-- CreateIndex
CREATE INDEX "GroupMember_userId_idx" ON "GroupMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMember_groupId_userId_key" ON "GroupMember"("groupId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "GroupPairState_groupId_pairId_key" ON "GroupPairState"("groupId", "pairId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralLink_code_key" ON "ReferralLink"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralClaim_refereeUserId_key" ON "ReferralClaim"("refereeUserId");

-- CreateIndex
CREATE INDEX "AnonymousResponse_targetUserId_createdAt_idx" ON "AnonymousResponse"("targetUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousResponse_targetUserId_visitorTokenHash_key" ON "AnonymousResponse"("targetUserId", "visitorTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_idempotencyKey_key" ON "LedgerEntry"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerEntry_reversesEntryId_key" ON "LedgerEntry"("reversesEntryId");

-- CreateIndex
CREATE INDEX "LedgerEntry_walletId_createdAt_id_idx" ON "LedgerEntry"("walletId", "createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_ledgerEntryId_key" ON "InventoryItem"("ledgerEntryId");

-- CreateIndex
CREATE INDEX "InventoryItem_userId_catalogItemId_status_idx" ON "InventoryItem"("userId", "catalogItemId", "status");

-- CreateIndex
CREATE INDEX "InventoryItem_status_expiresAt_idx" ON "InventoryItem"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "StoreTransaction_ledgerEntryId_key" ON "StoreTransaction"("ledgerEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreTransaction_refundLedgerEntryId_key" ON "StoreTransaction"("refundLedgerEntryId");

-- CreateIndex
CREATE INDEX "StoreTransaction_userId_idx" ON "StoreTransaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StoreTransaction_provider_environment_storeTransactionId_key" ON "StoreTransaction"("provider", "environment", "storeTransactionId");

-- CreateIndex
CREATE INDEX "Subscription_state_currentPeriodEndsAt_idx" ON "Subscription"("state", "currentPeriodEndsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_provider_environment_entitlementId_key" ON "Subscription"("userId", "provider", "environment", "entitlementId");

-- CreateIndex
CREATE INDEX "EntitlementGrant_beneficiaryUserId_revokedAt_idx" ON "EntitlementGrant"("beneficiaryUserId", "revokedAt");

-- CreateIndex
CREATE INDEX "EntitlementGrant_derivedFromUserId_idx" ON "EntitlementGrant"("derivedFromUserId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyBenefitGrant_ledgerEntryId_key" ON "MonthlyBenefitGrant"("ledgerEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyBenefitGrant_userId_period_key" ON "MonthlyBenefitGrant"("userId", "period");

-- CreateIndex
CREATE INDEX "ProviderWebhookEvent_status_receivedAt_idx" ON "ProviderWebhookEvent"("status", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderWebhookEvent_provider_providerEventId_key" ON "ProviderWebhookEvent"("provider", "providerEventId");

-- CreateIndex
CREATE UNIQUE INDEX "StreakFreeze_inventoryItemId_key" ON "StreakFreeze"("inventoryItemId");

-- CreateIndex
CREATE INDEX "StreakFreeze_userId_status_idx" ON "StreakFreeze"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueSeason_kind_tier_weekKey_key" ON "LeagueSeason"("kind", "tier", "weekKey");

-- CreateIndex
CREATE INDEX "LeagueMembership_seasonId_points_idx" ON "LeagueMembership"("seasonId", "points");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueMembership_seasonId_subjectType_subjectId_key" ON "LeagueMembership"("seasonId", "subjectType", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueScore_eventKey_key" ON "LeagueScore"("eventKey");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueReward_seasonId_subjectType_subjectId_key" ON "LeagueReward"("seasonId", "subjectType", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Egg_childPetId_key" ON "Egg"("childPetId");

-- CreateIndex
CREATE INDEX "Egg_contextId_idx" ON "Egg"("contextId");

-- CreateIndex
CREATE INDEX "IncubationNight_status_closesAt_idx" ON "IncubationNight"("status", "closesAt");

-- CreateIndex
CREATE UNIQUE INDEX "IncubationNight_eggId_logicalIndex_key" ON "IncubationNight"("eggId", "logicalIndex");

-- CreateIndex
CREATE UNIQUE INDEX "IncubationAnswer_nightId_questionKey_userId_key" ON "IncubationAnswer"("nightId", "questionKey", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "BirthVote_eggId_userId_key" ON "BirthVote"("eggId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChildPetData_eggId_key" ON "ChildPetData"("eggId");

-- CreateIndex
CREATE UNIQUE INDEX "CustodySchedule_childPetId_key" ON "CustodySchedule"("childPetId");

-- CreateIndex
CREATE UNIQUE INDEX "CoparentLink_childPetId_userId_key" ON "CoparentLink"("childPetId", "userId");

-- CreateIndex
CREATE INDEX "Block_blockedId_idx" ON "Block"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "Block_blockerId_blockedId_key" ON "Block"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "Report_reportedUserId_status_idx" ON "Report"("reportedUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ReliabilityEvent_userId_reason_episodeKey_key" ON "ReliabilityEvent"("userId", "reason", "episodeKey");

-- CreateIndex
CREATE INDEX "SafetyLocationPoint_shareId_recordedAt_idx" ON "SafetyLocationPoint"("shareId", "recordedAt");

-- CreateIndex
CREATE INDEX "SafetyCheckIn_status_dueAt_idx" ON "SafetyCheckIn"("status", "dueAt");

-- CreateIndex
CREATE INDEX "CommandRecord_createdAt_idx" ON "CommandRecord"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CommandRecord_actorId_operation_commandId_key" ON "CommandRecord"("actorId", "operation", "commandId");

-- CreateIndex
CREATE INDEX "DomainEvent_occurredAt_idx" ON "DomainEvent"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "DomainEvent_aggregateType_aggregateId_seq_key" ON "DomainEvent"("aggregateType", "aggregateId", "seq");

-- CreateIndex
CREATE INDEX "OutboxEvent_publishedAt_availableAt_idx" ON "OutboxEvent"("publishedAt", "availableAt");

-- CreateIndex
CREATE INDEX "ProjectionEntry_recipientId_room_seq_idx" ON "ProjectionEntry"("recipientId", "room", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectionEntry_recipientId_seq_key" ON "ProjectionEntry"("recipientId", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectionEntry_recipientId_sourceEventId_key" ON "ProjectionEntry"("recipientId", "sourceEventId");

-- CreateIndex
CREATE UNIQUE INDEX "JobExecution_jobKey_key" ON "JobExecution"("jobKey");

-- CreateIndex
CREATE INDEX "JobExecution_jobName_startedAt_idx" ON "JobExecution"("jobName", "startedAt");

-- CreateIndex
CREATE INDEX "Notification_userId_localDay_status_idx" ON "Notification"("userId", "localDay", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_dedupKey_key" ON "Notification"("userId", "dedupKey");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_category_key" ON "NotificationPreference"("userId", "category");

-- CreateIndex
CREATE INDEX "ConfigVersion_kind_activatedAt_idx" ON "ConfigVersion"("kind", "activatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigVersion_kind_version_key" ON "ConfigVersion"("kind", "version");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "DataExport_status_idx" ON "DataExport"("status");

-- CreateIndex
CREATE INDEX "DeletionRequest_status_idx" ON "DeletionRequest"("status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthIdentity" ADD CONSTRAINT "AuthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceSession" ADD CONSTRAINT "DeviceSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffRoleAssignment" ADD CONSTRAINT "StaffRoleAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPreferences" ADD CONSTRAINT "MatchPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PrivacySettings" ADD CONSTRAINT "PrivacySettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcessingConsent" ADD CONSTRAINT "ProcessingConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PausePeriod" ADD CONSTRAINT "PausePeriod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PausePeriod" ADD CONSTRAINT "PausePeriod_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "RelationshipContext"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationSession" ADD CONSTRAINT "VerificationSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_primaryOwnerId_fkey" FOREIGN KEY ("primaryOwnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetOwnership" ADD CONSTRAINT "PetOwnership_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetOwnership" ADD CONSTRAINT "PetOwnership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetVision" ADD CONSTRAINT "PetVision_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetState" ADD CONSTRAINT "PetState_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetAppearance" ADD CONSTRAINT "PetAppearance_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualLocation" ADD CONSTRAINT "VirtualLocation_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualLocation" ADD CONSTRAINT "VirtualLocation_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "RelationshipContext"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetCareEvent" ADD CONSTRAINT "PetCareEvent_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetCareEvent" ADD CONSTRAINT "PetCareEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetPair" ADD CONSTRAINT "PetPair_petLowId_fkey" FOREIGN KEY ("petLowId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PetPair" ADD CONSTRAINT "PetPair_petHighId_fkey" FOREIGN KEY ("petHighId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipContext" ADD CONSTRAINT "RelationshipContext_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "PetPair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipSide" ADD CONSTRAINT "RelationshipSide_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "RelationshipContext"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipSide" ADD CONSTRAINT "RelationshipSide_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipSide" ADD CONSTRAINT "RelationshipSide_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentSession" ADD CONSTRAINT "ConsentSession_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "RelationshipContext"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentResponse" ADD CONSTRAINT "ConsentResponse_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ConsentSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentResponse" ADD CONSTRAINT "ConsentResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchRound" ADD CONSTRAINT "BranchRound_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "RelationshipContext"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchBallot" ADD CONSTRAINT "BranchBallot_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "BranchRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchBallot" ADD CONSTRAINT "BranchBallot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipEvent" ADD CONSTRAINT "RelationshipEvent_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "RelationshipContext"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Memory" ADD CONSTRAINT "Memory_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "RelationshipContext"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionEvent" ADD CONSTRAINT "ContributionEvent_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "RelationshipContext"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContributionEvent" ADD CONSTRAINT "ContributionEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelationshipDailyCounter" ADD CONSTRAINT "RelationshipDailyCounter_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "RelationshipContext"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchBatch" ADD CONSTRAINT "MatchBatch_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchProposal" ADD CONSTRAINT "MatchProposal_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "MatchBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchProposal" ADD CONSTRAINT "MatchProposal_petLowId_fkey" FOREIGN KEY ("petLowId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchProposal" ADD CONSTRAINT "MatchProposal_petHighId_fkey" FOREIGN KEY ("petHighId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchProposal" ADD CONSTRAINT "MatchProposal_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "RelationshipContext"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchAcceptance" ADD CONSTRAINT "MatchAcceptance_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "MatchProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchAcceptance" ADD CONSTRAINT "MatchAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchExposure" ADD CONSTRAINT "MatchExposure_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "MatchProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchExposure" ADD CONSTRAINT "MatchExposure_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "RelationshipContext"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMember" ADD CONSTRAINT "ConversationMember_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMember" ADD CONSTRAINT "ConversationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageContent" ADD CONSTRAINT "MessageContent_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReceipt" ADD CONSTRAINT "MessageReceipt_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageReceipt" ADD CONSTRAINT "MessageReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationSignal" ADD CONSTRAINT "ConversationSignal_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaDerivative" ADD CONSTRAINT "MediaDerivative_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "MediaAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIResult" ADD CONSTRAINT "AIResult_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "AIJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationDecision" ADD CONSTRAINT "ModerationDecision_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationCase" ADD CONSTRAINT "ModerationCase_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "ModerationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMission" ADD CONSTRAINT "DailyMission_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "MissionDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyMission" ADD CONSTRAINT "DailyMission_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionSubmission" ADD CONSTRAINT "MissionSubmission_dailyMissionId_fkey" FOREIGN KEY ("dailyMissionId") REFERENCES "DailyMission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionSubmission" ADD CONSTRAINT "MissionSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionSubmission" ADD CONSTRAINT "MissionSubmission_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "RelationshipContext"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionParticipant" ADD CONSTRAINT "MissionParticipant_dailyMissionId_fkey" FOREIGN KEY ("dailyMissionId") REFERENCES "DailyMission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionParticipant" ADD CONSTRAINT "MissionParticipant_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "RelationshipContext"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionParticipant" ADD CONSTRAINT "MissionParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionRewardContext" ADD CONSTRAINT "MissionRewardContext_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "RelationshipContext"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionRewardContext" ADD CONSTRAINT "MissionRewardContext_dailyMissionId_fkey" FOREIGN KEY ("dailyMissionId") REFERENCES "DailyMission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionAward" ADD CONSTRAINT "MissionAward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MissionAward" ADD CONSTRAINT "MissionAward_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "MissionSubmission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userLowId_fkey" FOREIGN KEY ("userLowId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_userHighId_fkey" FOREIGN KEY ("userHighId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMember" ADD CONSTRAINT "GroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPairState" ADD CONSTRAINT "GroupPairState_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPairState" ADD CONSTRAINT "GroupPairState_pairId_fkey" FOREIGN KEY ("pairId") REFERENCES "PetPair"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralLink" ADD CONSTRAINT "ReferralLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralClaim" ADD CONSTRAINT "ReferralClaim_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "ReferralLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralClaim" ADD CONSTRAINT "ReferralClaim_referrerUserId_fkey" FOREIGN KEY ("referrerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralClaim" ADD CONSTRAINT "ReferralClaim_refereeUserId_fkey" FOREIGN KEY ("refereeUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnonymousResponse" ADD CONSTRAINT "AnonymousResponse_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReputationAggregate" ADD CONSTRAINT "ReputationAggregate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_reversesEntryId_fkey" FOREIGN KEY ("reversesEntryId") REFERENCES "LedgerEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "CatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreTransaction" ADD CONSTRAINT "StoreTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntitlementGrant" ADD CONSTRAINT "EntitlementGrant_beneficiaryUserId_fkey" FOREIGN KEY ("beneficiaryUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntitlementGrant" ADD CONSTRAINT "EntitlementGrant_derivedFromUserId_fkey" FOREIGN KEY ("derivedFromUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntitlementGrant" ADD CONSTRAINT "EntitlementGrant_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntitlementGrant" ADD CONSTRAINT "EntitlementGrant_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "RelationshipContext"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyBenefitGrant" ADD CONSTRAINT "MonthlyBenefitGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonthlyBenefitGrant" ADD CONSTRAINT "MonthlyBenefitGrant_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Streak" ADD CONSTRAINT "Streak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakFreeze" ADD CONSTRAINT "StreakFreeze_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakFreeze" ADD CONSTRAINT "StreakFreeze_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakFreeze" ADD CONSTRAINT "StreakFreeze_monthlyBenefitGrantId_fkey" FOREIGN KEY ("monthlyBenefitGrantId") REFERENCES "MonthlyBenefitGrant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMembership" ADD CONSTRAINT "LeagueMembership_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "LeagueSeason"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueScore" ADD CONSTRAINT "LeagueScore_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "LeagueMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueReward" ADD CONSTRAINT "LeagueReward_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "LeagueSeason"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Egg" ADD CONSTRAINT "Egg_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "RelationshipContext"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Egg" ADD CONSTRAINT "Egg_childPetId_fkey" FOREIGN KEY ("childPetId") REFERENCES "Pet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncubationNight" ADD CONSTRAINT "IncubationNight_eggId_fkey" FOREIGN KEY ("eggId") REFERENCES "Egg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncubationAnswer" ADD CONSTRAINT "IncubationAnswer_nightId_fkey" FOREIGN KEY ("nightId") REFERENCES "IncubationNight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncubationAnswer" ADD CONSTRAINT "IncubationAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BirthVote" ADD CONSTRAINT "BirthVote_eggId_fkey" FOREIGN KEY ("eggId") REFERENCES "Egg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BirthVote" ADD CONSTRAINT "BirthVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildPetData" ADD CONSTRAINT "ChildPetData_petId_fkey" FOREIGN KEY ("petId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildPetData" ADD CONSTRAINT "ChildPetData_eggId_fkey" FOREIGN KEY ("eggId") REFERENCES "Egg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodySchedule" ADD CONSTRAINT "CustodySchedule_childPetId_fkey" FOREIGN KEY ("childPetId") REFERENCES "Pet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustodySchedule" ADD CONSTRAINT "CustodySchedule_currentHolderUserId_fkey" FOREIGN KEY ("currentHolderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoparentLink" ADD CONSTRAINT "CoparentLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "RelationshipContext"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReliabilityEvent" ADD CONSTRAINT "ReliabilityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyDate" ADD CONSTRAINT "SafetyDate_contextId_fkey" FOREIGN KEY ("contextId") REFERENCES "RelationshipContext"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianInvitation" ADD CONSTRAINT "GuardianInvitation_safetyDateId_fkey" FOREIGN KEY ("safetyDateId") REFERENCES "SafetyDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianInvitation" ADD CONSTRAINT "GuardianInvitation_sharerUserId_fkey" FOREIGN KEY ("sharerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianInvitation" ADD CONSTRAINT "GuardianInvitation_guardianUserId_fkey" FOREIGN KEY ("guardianUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationShare" ADD CONSTRAINT "LocationShare_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "GuardianInvitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyLocationPoint" ADD CONSTRAINT "SafetyLocationPoint_shareId_fkey" FOREIGN KEY ("shareId") REFERENCES "LocationShare"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyCheckIn" ADD CONSTRAINT "SafetyCheckIn_safetyDateId_fkey" FOREIGN KEY ("safetyDateId") REFERENCES "SafetyDate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SafetyCheckIn" ADD CONSTRAINT "SafetyCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommandRecord" ADD CONSTRAINT "CommandRecord_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectionEntry" ADD CONSTRAINT "ProjectionEntry_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataExport" ADD CONSTRAINT "DataExport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletionRequest" ADD CONSTRAINT "DeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
