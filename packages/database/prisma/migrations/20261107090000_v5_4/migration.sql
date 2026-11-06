-- V5.4 (concept-v5.4, agent C) — additive.
-- B.8 : « imprévu » après la confirmation (1 par trimestre, sans fiabilité, place non remboursée, lieu compensé).
ALTER TYPE "SeatCancelKind" ADD VALUE IF NOT EXISTS 'EMERGENCY';

-- A.5 : mode discret = choix explicite à l'onboarding (null = pas encore choisi ; aucun défaut présélectionné).
ALTER TABLE "PrivacySettings" ADD COLUMN "discreetModeChosenAt" TIMESTAMPTZ(3);

-- B.9 : garde alternée « une semaine sur deux » à partir d'une semaine ISO (elle-même off).
ALTER TABLE "OutingPreferences" ADD COLUMN "alternateWeeksOffFrom" TEXT;
ALTER TABLE "OutingPreferences" ADD CONSTRAINT "OutingPreferences_alternateWeeksOffFrom_format"
  CHECK ("alternateWeeksOffFrom" IS NULL OR "alternateWeeksOffFrom" ~ '^[0-9]{4}-W(0[1-9]|[1-4][0-9]|5[0-3])$');

-- C.10 : Blowy+ via Stripe Billing (client fournisseur ; l'abonnement `sub_…` est dans originalTransactionId).
ALTER TABLE "Subscription" ADD COLUMN "providerCustomerRef" TEXT;

-- A.6 (D-049) : « éviter les personnes que je connais ». Aucune colonne de numéro ni d'empreinte de contact.
CREATE TABLE "PhoneIdentity" (
    "userId" UUID NOT NULL,
    "tokenDigest" TEXT NOT NULL,
    "verifiedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "PhoneIdentity_pkey" PRIMARY KEY ("userId")
);
CREATE UNIQUE INDEX "PhoneIdentity_tokenDigest_key" ON "PhoneIdentity"("tokenDigest");

CREATE TABLE "AvoidPair" (
    "userLowId" UUID NOT NULL,
    "userHighId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "AvoidPair_pkey" PRIMARY KEY ("userLowId","userHighId"),
    CONSTRAINT "AvoidPair_ordered" CHECK ("userLowId" < "userHighId")
);
CREATE INDEX "AvoidPair_userHighId_idx" ON "AvoidPair"("userHighId");
