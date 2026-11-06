-- V5 alignement (agent C) — additive. Journal économique V5 conservé sur la table append-only « DomainEvent »
-- (aggregateType = 'economy.journal', décision consignée dans docs/agents/handoffs/V5-alignement.md) :
-- index de lecture par titulaire et nature (crédits, paiements, remboursements d'un utilisateur).
CREATE INDEX "DomainEvent_aggregateType_actorUserId_type_idx" ON "DomainEvent"("aggregateType", "actorUserId", "type");
