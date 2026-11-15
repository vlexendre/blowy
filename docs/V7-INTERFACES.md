# V7 — interfaces partagées entre les chantiers

Quatre chantiers back avancent en même temps. Ce fichier fixe les noms qu'ils partagent, pour qu'ils puissent coder les uns contre les autres sans s'attendre. Produit : `docs/V7-SPEC.md`.

## Règles communes

- Chaque chantier crée **ses propres fichiers** : `packages/contract/src/v7/<zone>.ts` (réexporté par une ligne ajoutée à la fin de `index.ts`), `packages/domain/src/<zone>.ts` + son fichier de tests, son dossier `apps/api/src/modules/<zone>/` ou `apps/api/src/integrations/<zone>/`, sa migration `supabase/migrations/<horodatage>_<zone>.sql`.
- Fichiers partagés (`contract/src/index.ts`, `domain/src/index.ts`, `app.module.ts`, `core.module.ts`, `persistence/memory-db.ts`, `persistence/database.types.ts`, `demo/*`, config) : **ajouts seulement**, relire juste avant d'éditer, ne pas reformater.
- Textes vus par l'utilisateur produits par l'API : dans `packages/content/src/v7/<zone>.ts`, en français, sous forme de dictionnaires à clés (une passe de traduction suivra). Jamais le mot « pet » : « minimoa ». Majuscule en début de phrase.
- Vérifier son travail paquet par paquet (`pnpm --filter … typecheck/test`). Une erreur dans le fichier d'un autre chantier se signale dans le rapport, elle ne se corrige pas.
- Horodatages des migrations : vision `20261115130000`, rituels `20261115140000`, plateforme `20261115150000`, facturation-admin `20261115160000`.

## Vision (chantier « vision »)

```ts
// packages/domain/src/vision.ts
export const VISION_AXES = ['foyer', 'ancrage', 'elan', 'rythme', 'cap'] as const;
export type VisionAxis = (typeof VISION_AXES)[number];
export type VisionSource = 'test' | 'daily' | 'habit' | 'care' | 'words';
/** Une observation sur un axe : value de -100 à 100. */
export interface VisionSignal { axis: VisionAxis; value: number; source: VisionSource; at: string /* ISO */ }
```

```ts
// apps/api/src/modules/vision/tokens.ts
export const VISION_SIGNALS = Symbol('VISION_SIGNALS');
export interface VisionSignals { record(userId: string, signals: VisionSignal[]): Promise<void> }
```

Les autres chantiers n'écrivent jamais dans les tables de la vision : ils appellent `VisionSignals.record`.

## Abonnement (chantier « facturation-admin »)

- `hasPlus(profile, now)` existe déjà (`apps/api/src/modules/me/application/plus.ts`) et reste la seule façon de savoir si quelqu'un a Blowy+. La facturation met à jour `profiles.plus_until`.
- Limites selon l'abonnement : `packages/domain/src/entitlements.ts`, `entitlements(plus: boolean)` → `{ habits: 2 | 6, jokersPerWeek: 1 | 3, mapEverywhere, changeCity, freeRename, detailedReview, encounterBonus }`. Créé par le chantier « facturation-admin » dès son démarrage ; les autres l'importent.

## IA (chantier « plateforme »)

```ts
// apps/api/src/integrations/ai/ai-gateway.ts
export const AI_GATEWAY = Symbol('AI_GATEWAY');
export type AiFeature = 'habit_proof' | 'chat_remark' | 'weekly_review' | 'moderation';
export interface AiRequest {
  feature: AiFeature;
  userId: string;
  system: string;            // consigne stable (mise en cache)
  prompt: string;
  image?: { base64: string; mediaType: 'image/jpeg' | 'image/webp' };
  maxTokens: number;
  tier: 'small' | 'medium';
  locale: string;            // 'fr' | 'en' | 'es' | 'pt' | 'nl'
}
export type AiResult = { ok: true; text: string } | { ok: false; reason: 'disabled' | 'budget' | 'error' };
export interface AiGateway { complete(req: AiRequest): Promise<AiResult> }
```

Tout appel à un modèle passe par là. Un appelant doit toujours avoir un comportement sans IA quand `ok` est faux (règle ou modèle de phrase). Créé par le chantier « plateforme » dès son démarrage.

## Notifications (chantier « plateforme »)

```ts
// apps/api/src/integrations/push/notifier.ts
export const NOTIFIER = Symbol('NOTIFIER');
export type NotificationKind =
  | 'daily_challenge' | 'needs_out' | 'new_encounter' | 'waved' | 'message' | 'daily_photo'
  | 'link_in_danger' | 'streak_in_danger' | 'habit_proof' | 'weekly_review' | 'item_unlocked'
  | 'words_received' | 'trial_reminder';
export interface Notifier {
  /** Applique réglages, heures calmes et plafond ; ne lève jamais. */
  notify(userId: string, kind: NotificationKind, vars?: Record<string, string>): Promise<void>;
}
```

## Langue

`profiles.locale` (`'fr' | 'en' | 'es' | 'pt' | 'nl'`, défaut `'fr'`), ajouté par le chantier « vision » avec les autres champs du profil. Les textes de l'API se choisissent avec cette valeur.

## Minuteur

`POST /internal/tick` (secret `INTERNAL_TICK_SECRET`), créé par « plateforme ». Un chantier qui a un travail planifié expose un service `XxxJobs` avec des méthodes idempotentes (`runDue(now)`), que le minuteur appelle ; il l'ajoute lui-même à la liste dans `apps/api/src/modules/tick/jobs.ts` (ajout d'une ligne).
