-- V5.2 (concept-v5.2 C.10, H.23) — ajout : motif « incident sur place », « je connais quelqu'un ici ».
-- CreateEnum
CREATE TYPE "KnowsSomeoneStatus" AS ENUM ('AUTO_ACCEPTED', 'IN_REVIEW', 'ACCEPTED', 'REJECTED', 'COUNTED_AS_CANCEL');

-- AlterEnum
ALTER TYPE "ReportCategory" ADD VALUE 'ON_SITE_INCIDENT';

-- CreateTable
CREATE TABLE "KnowsSomeoneRequest" (
    "id" UUID NOT NULL,
    "seatId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "targetUserId" UUID NOT NULL,
    "status" "KnowsSomeoneStatus" NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    "resolvedAt" TIMESTAMPTZ(3),

    CONSTRAINT "KnowsSomeoneRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KnowsSomeoneRequest_seatId_key" ON "KnowsSomeoneRequest"("seatId");

-- CreateIndex
CREATE INDEX "KnowsSomeoneRequest_userId_createdAt_idx" ON "KnowsSomeoneRequest"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "KnowsSomeoneRequest" ADD CONSTRAINT "KnowsSomeoneRequest_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "OutingSeat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KnowsSomeoneRequest" ADD CONSTRAINT "KnowsSomeone_self_chk" CHECK ("userId" <> "targetUserId");
