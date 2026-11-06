-- V5.6 (concept-v5.6, spec-v5 révision 6, agent C) — additive.
-- E11 tranches/horizon, week-end sur deux, temps de trajet ; E13 table de 2 Duo ; E15 contrat bilatéral ;
-- E16 liens de partage ; E19 tables de l'espace lieu (copie des événements `DomainEvent` venue.partner*).

-- AlterTable
ALTER TABLE "DuoDate" ADD COLUMN     "reservationLockedAt" TIMESTAMPTZ(3),
ADD COLUMN     "venueSlotId" UUID;

-- AlterTable
ALTER TABLE "MatchPreferences" ADD COLUMN     "kidsHorizon" "KidsHorizon",
ADD COLUMN     "storyAgeBrackets" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "OutingPreferences" ADD COLUMN     "alternateWeekendsOffFrom" TEXT;

-- AlterTable
ALTER TABLE "Venue" ADD COLUMN     "blowySignedAt" TIMESTAMPTZ(3),
ADD COLUMN     "blowySignerName" TEXT,
ADD COLUMN     "contractSignedAt" TIMESTAMPTZ(3),
ADD COLUMN     "contractSignerName" TEXT,
ADD COLUMN     "contractVersion" TEXT;

-- CreateTable
CREATE TABLE "NeighborhoodTravelTime" (
    "id" UUID NOT NULL,
    "fromNeighborhoodId" UUID NOT NULL,
    "toNeighborhoodId" UUID NOT NULL,
    "minutes" INTEGER NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "NeighborhoodTravelTime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "cardKind" "ShareCardKind" NOT NULL,
    "subjectRef" TEXT,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "attributedSignups" INTEGER NOT NULL DEFAULT 0,
    "attributedFirstOutings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareAttribution" (
    "id" UUID NOT NULL,
    "shareLinkId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "firstOutingAt" TIMESTAMPTZ(3),

    CONSTRAINT "ShareAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenuePartnerEvent" (
    "id" UUID NOT NULL,
    "venueId" UUID NOT NULL,
    "seq" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "actorUserId" UUID,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "VenuePartnerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenuePartnerAccess" (
    "venueId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "grantedAt" TIMESTAMPTZ(3) NOT NULL,
    "revokedAt" TIMESTAMPTZ(3),

    CONSTRAINT "VenuePartnerAccess_pkey" PRIMARY KEY ("venueId","userId")
);

-- CreateTable
CREATE TABLE "VenuePartnerMfa" (
    "userId" UUID NOT NULL,
    "generation" INTEGER NOT NULL DEFAULT 0,
    "enrolledAt" TIMESTAMPTZ(3),
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "VenuePartnerMfa_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "VenueWeekday" (
    "venueId" UUID NOT NULL,
    "isoWeekday" INTEGER NOT NULL,
    "open" BOOLEAN NOT NULL,
    "tables" INTEGER,
    "note" TEXT,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "VenueWeekday_pkey" PRIMARY KEY ("venueId","isoWeekday")
);

-- CreateTable
CREATE TABLE "VenueClosure" (
    "id" UUID NOT NULL,
    "venueId" UUID NOT NULL,
    "date" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "VenueClosure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueIncident" (
    "id" UUID NOT NULL,
    "venueId" UUID NOT NULL,
    "outingId" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "motive" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "seatId" UUID,
    "userId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "VenueIncident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NeighborhoodTravelTime_fromNeighborhoodId_toNeighborhoodId_key" ON "NeighborhoodTravelTime"("fromNeighborhoodId", "toNeighborhoodId");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_slug_key" ON "ShareLink"("slug");

-- CreateIndex
CREATE INDEX "ShareLink_ownerUserId_createdAt_idx" ON "ShareLink"("ownerUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShareAttribution_userId_key" ON "ShareAttribution"("userId");

-- CreateIndex
CREATE INDEX "ShareAttribution_shareLinkId_idx" ON "ShareAttribution"("shareLinkId");

-- CreateIndex
CREATE UNIQUE INDEX "VenuePartnerEvent_venueId_seq_key" ON "VenuePartnerEvent"("venueId", "seq");

-- CreateIndex
CREATE INDEX "VenuePartnerAccess_userId_idx" ON "VenuePartnerAccess"("userId");

-- CreateIndex
CREATE INDEX "VenueClosure_venueId_date_idx" ON "VenueClosure"("venueId", "date");

-- CreateIndex
CREATE INDEX "VenueIncident_venueId_createdAt_idx" ON "VenueIncident"("venueId", "createdAt");

-- CreateIndex
CREATE INDEX "VenueIncident_createdAt_idx" ON "VenueIncident"("createdAt");


-- Invariants (CHECK).
ALTER TABLE "NeighborhoodTravelTime" ADD CONSTRAINT "NeighborhoodTravelTime_minutes_check" CHECK ("minutes" > 0 AND "minutes" <= 240);
ALTER TABLE "OutingPreferences" ADD CONSTRAINT "OutingPreferences_alternateWeekendsOffFrom_check" CHECK ("alternateWeekendsOffFrom" IS NULL OR "alternateWeekendsOffFrom" ~ '^[0-9]{4}-W[0-9]{2}$');
ALTER TABLE "VenueWeekday" ADD CONSTRAINT "VenueWeekday_isoWeekday_check" CHECK ("isoWeekday" BETWEEN 1 AND 7);
ALTER TABLE "VenueWeekday" ADD CONSTRAINT "VenueWeekday_tables_check" CHECK ("tables" IS NULL OR "tables" >= 0);
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_counts_check" CHECK ("clickCount" >= 0 AND "attributedSignups" >= 0 AND "attributedFirstOutings" >= 0);

-- E19 : reprise des événements de l'espace lieu (stockage provisoire T6 sur `DomainEvent`), sans les effacer (append-only).
INSERT INTO "VenuePartnerEvent" ("id", "venueId", "seq", "type", "actorUserId", "payload", "occurredAt")
SELECT e."id", e."aggregateId", e."seq", e."type", e."actorUserId", e."payload", e."occurredAt"
FROM "DomainEvent" e WHERE e."aggregateType" = 'venue.partner';

INSERT INTO "VenuePartnerAccess" ("venueId", "userId", "grantedAt", "revokedAt")
SELECT DISTINCT ON (e."aggregateId", e."payload"->>'userId')
  e."aggregateId", (e."payload"->>'userId')::uuid, e."occurredAt",
  CASE WHEN e."type" = 'ACCESS_REVOKED' THEN e."occurredAt" ELSE NULL END
FROM "DomainEvent" e
WHERE e."aggregateType" = 'venue.partner' AND e."type" IN ('ACCESS_GRANTED', 'ACCESS_REVOKED') AND e."payload" ? 'userId'
ORDER BY e."aggregateId", e."payload"->>'userId', e."seq" DESC;

INSERT INTO "VenueWeekday" ("venueId", "isoWeekday", "open", "tables", "note", "updatedAt")
SELECT DISTINCT ON (e."aggregateId", (e."payload"->>'isoWeekday')::int)
  e."aggregateId", (e."payload"->>'isoWeekday')::int, (e."payload"->>'open')::boolean,
  NULLIF(e."payload"->>'tables', '')::int, e."payload"->>'note', e."occurredAt"
FROM "DomainEvent" e
WHERE e."aggregateType" = 'venue.partner' AND e."type" = 'DAY_SET'
ORDER BY e."aggregateId", (e."payload"->>'isoWeekday')::int, e."seq" DESC;

INSERT INTO "VenueClosure" ("id", "venueId", "date", "note", "createdAt")
SELECT e."id", e."aggregateId", e."payload"->>'date', COALESCE(e."payload"->>'note', ''), e."occurredAt"
FROM "DomainEvent" e WHERE e."aggregateType" = 'venue.partner' AND e."type" = 'CLOSURE_ADDED';

INSERT INTO "VenueIncident" ("id", "venueId", "outingId", "firstName", "motive", "note", "seatId", "userId", "createdAt")
SELECT (e."payload"->>'id')::uuid, e."aggregateId", (e."payload"->>'outingId')::uuid, e."payload"->>'firstName', e."payload"->>'motive',
  COALESCE(e."payload"->>'note', ''), NULLIF(e."payload"->>'seatId', '')::uuid, NULLIF(e."payload"->>'userId', '')::uuid, e."occurredAt"
FROM "DomainEvent" e WHERE e."aggregateType" = 'venue.partner' AND e."type" = 'INCIDENT_REPORTED'
ON CONFLICT ("id") DO NOTHING;

UPDATE "Venue" v SET "contractVersion" = c."version", "contractSignedAt" = c."at", "contractSignerName" = c."signer"
FROM (
  SELECT DISTINCT ON (e."aggregateId") e."aggregateId" AS vid, e."payload"->>'version' AS version, e."payload"->>'signerName' AS signer, e."occurredAt" AS at
  FROM "DomainEvent" e WHERE e."aggregateType" = 'venue.partner' AND e."type" = 'CONTRACT_SIGNED'
  ORDER BY e."aggregateId", e."seq" DESC
) c WHERE v."id" = c.vid;

INSERT INTO "VenuePartnerMfa" ("userId", "generation", "enrolledAt", "updatedAt")
SELECT u.uid, u.gen,
  (SELECT max(x."occurredAt") FROM "DomainEvent" x WHERE x."aggregateType" = 'venue.partner_user' AND x."aggregateId" = u.uid AND x."type" = 'MFA_ENROLLED' AND x."seq" > u.last_start),
  u.last_at
FROM (
  SELECT e."aggregateId" AS uid,
    count(*) FILTER (WHERE e."type" = 'MFA_ENROLLMENT_STARTED')::int AS gen,
    COALESCE(max(e."seq") FILTER (WHERE e."type" = 'MFA_ENROLLMENT_STARTED'), 0) AS last_start,
    max(e."occurredAt") AS last_at
  FROM "DomainEvent" e WHERE e."aggregateType" = 'venue.partner_user'
  GROUP BY e."aggregateId"
) u;
