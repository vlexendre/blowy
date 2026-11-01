-- Contraintes non exprimables en Prisma (CHECK, index partiels, triggers append-only).
-- Toute évolution passe par une NOUVELLE migration ; ne jamais réécrire celle-ci une fois appliquée.

-- Paires canoniques : low < high (une paire n'est jamais sa propre paire).
ALTER TABLE "PetPair" ADD CONSTRAINT "PetPair_canonical_chk" CHECK ("petLowId" < "petHighId");
ALTER TABLE "MatchProposal" ADD CONSTRAINT "MatchProposal_canonical_chk" CHECK ("petLowId" < "petHighId" AND "userLowId" <> "userHighId");
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_canonical_chk" CHECK ("userLowId" < "userHighId");

-- Une seule proposition ouverte par paire de pets.
CREATE UNIQUE INDEX "MatchProposal_open_pair_uq" ON "MatchProposal" ("petLowId", "petHighId") WHERE status = 'OPEN';

-- Un seul contexte non terminé par (paire, type).
CREATE UNIQUE INDEX "RelationshipContext_live_uq" ON "RelationshipContext" ("pairId", "type") WHERE status <> 'ENDED';

-- Exclusivité d'emménagement : au plus un côté exclusif actif par utilisateur.
CREATE UNIQUE INDEX "RelationshipSide_exclusive_uq" ON "RelationshipSide" ("userId") WHERE exclusive AND active;

-- Bornes de relation.
ALTER TABLE "RelationshipContext" ADD CONSTRAINT "RelationshipContext_bounds_chk" CHECK (
  affinity BETWEEN 0 AND 100 AND "xpMilli" >= 0 AND "reachedLevel" BETWEEN 1 AND 7 AND "eligibleLevel" BETWEEN 1 AND 7
  AND complicity BETWEEN 0 AND 100 AND tension BETWEEN 0 AND 100);
ALTER TABLE "RelationshipSide" ADD CONSTRAINT "RelationshipSide_desire_chk" CHECK (desire BETWEEN 0 AND 100);

-- Jauges du pet [0,100], axes de vision [-1000,1000], 1 à 4 passions.
ALTER TABLE "PetState" ADD CONSTRAINT "PetState_gauges_chk" CHECK (
  satiety BETWEEN 0 AND 100 AND energy BETWEEN 0 AND 100 AND mood BETWEEN 0 AND 100 AND health BETWEEN 0 AND 100);
ALTER TABLE "PetVision" ADD CONSTRAINT "PetVision_axes_chk" CHECK (
  "kindMischief" BETWEEN -1000 AND 1000 AND "sportyContemplative" BETWEEN -1000 AND 1000
  AND "scienceArt" BETWEEN -1000 AND 1000 AND "homeAdventure" BETWEEN -1000 AND 1000
  AND cardinality(passions) BETWEEN 1 AND 4);
-- Pet principal : primaryOwnerId renseigné ssi kind = PRIMARY.
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_primary_owner_chk" CHECK ((kind = 'PRIMARY') = ("primaryOwnerId" IS NOT NULL));
ALTER TABLE "Pet" ADD CONSTRAINT "Pet_child_not_matchable_chk" CHECK (kind = 'PRIMARY' OR matchable = false);

-- Fiabilité [0,100].
ALTER TABLE "User" ADD CONSTRAINT "User_reliability_chk" CHECK (reliability BETWEEN 0 AND 100);

-- Pause ≤ 14 jours.
ALTER TABLE "PausePeriod" ADD CONSTRAINT "PausePeriod_max14d_chk" CHECK ("endsAt" > "startsAt" AND "endsAt" - "startsAt" <= interval '14 days');

-- Partage de position gardien ≤ 3 h.
ALTER TABLE "LocationShare" ADD CONSTRAINT "LocationShare_max3h_chk" CHECK ("endsAt" > "startsAt" AND "endsAt" - "startsAt" <= interval '3 hours');

-- Parrainage : pas d'auto-parrainage.
ALTER TABLE "ReferralClaim" ADD CONSTRAINT "ReferralClaim_no_self_chk" CHECK ("referrerUserId" <> "refereeUserId");

-- Blocage : pas de soi-même.
ALTER TABLE "Block" ADD CONSTRAINT "Block_no_self_chk" CHECK ("blockerId" <> "blockedId");

-- Économie (demande agent G).
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_balance_nonneg_chk" CHECK (balance >= 0);
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_amount_nonzero_chk" CHECK (amount <> 0 AND "balanceAfter" >= 0);
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_price_pos_chk" CHECK ("priceCoins" > 0);
ALTER TABLE "EntitlementGrant" ADD CONSTRAINT "EntitlementGrant_derived_chk" CHECK (
  (source = 'DERIVED_PARTNER') = ("derivedFromUserId" IS NOT NULL AND "relationshipId" IS NOT NULL)
  AND ("derivedFromUserId" IS NULL OR "derivedFromUserId" <> "beneficiaryUserId"));
CREATE UNIQUE INDEX "EntitlementGrant_active_uq" ON "EntitlementGrant"
  ("beneficiaryUserId", "entitlementId", source, coalesce("subscriptionId"::text, ''), coalesce("relationshipId"::text, ''))
  WHERE "revokedAt" IS NULL;
CREATE UNIQUE INDEX "StreakFreeze_protected_day_uq" ON "StreakFreeze" ("userId", "protectedDay") WHERE "protectedDay" IS NOT NULL;

-- Append-only : ledger et journaux.
CREATE OR REPLACE FUNCTION blowy_forbid_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'append-only table %: % interdit', TG_TABLE_NAME, TG_OP USING ERRCODE = 'P0001';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "LedgerEntry_append_only" BEFORE UPDATE OR DELETE ON "LedgerEntry"
  FOR EACH ROW EXECUTE FUNCTION blowy_forbid_mutation();
CREATE TRIGGER "RelationshipEvent_append_only" BEFORE UPDATE ON "RelationshipEvent"
  FOR EACH ROW EXECUTE FUNCTION blowy_forbid_mutation();
CREATE TRIGGER "DomainEvent_append_only" BEFORE UPDATE ON "DomainEvent"
  FOR EACH ROW EXECUTE FUNCTION blowy_forbid_mutation();
CREATE TRIGGER "ModerationDecision_append_only" BEFORE UPDATE OR DELETE ON "ModerationDecision"
  FOR EACH ROW EXECUTE FUNCTION blowy_forbid_mutation();
CREATE TRIGGER "AuditLog_append_only" BEFORE UPDATE OR DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION blowy_forbid_mutation();
