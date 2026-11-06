-- V5.8 (suite de mission, agent C) — additive : centre de quartier pour l'estimation des temps de trajet (E11).
ALTER TABLE "Neighborhood" ADD COLUMN "centerLat" DOUBLE PRECISION,
ADD COLUMN "centerLng" DOUBLE PRECISION;
ALTER TABLE "Neighborhood" ADD CONSTRAINT "Neighborhood_center_check" CHECK (("centerLat" IS NULL) = ("centerLng" IS NULL) AND ("centerLat" IS NULL OR ("centerLat" BETWEEN -90 AND 90 AND "centerLng" BETWEEN -180 AND 180)));
