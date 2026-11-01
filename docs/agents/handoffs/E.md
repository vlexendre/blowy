# Handoff — agent E (IA / confiance / médias) — 2026-11-01

## Résumé
- Nouveau paquet `packages/ai` (server-only) : 6 interfaces, adaptateurs **OpenAI réels** et **locaux déterministes**, prompts versionnés, politique de modération versionnée et `AiRunner` (timeout, retries/backoff, circuit breaker, plafonds, cache, annulation, résultat tardif jeté).
- Suite d'évaluation FR synthétique et runner live opt-in.
- Modules API `media` et `trust` en clean architecture, branchés sur les briques de `shared`.
- Modération IA branchée derrière `MODERATION_GATEWAY` de conversations, avec le minimum de modifications là-bas.
- Ports staff `ADMIN_MODERATION` et `ADMIN_TRUST` fournis à l'agent F.

## Documentation consultée (2026-11-01)
- OpenAI : guides moderation, structured-outputs, images-vision, your-data, speech-to-text, models.
- SDK `openai@7.47.0` : types `responses.parse`, `ResponseOutputRefusal`, `incomplete_details`, `transcriptions.languages/logprobs`.
- Veriff : `/v1/sessions` (X-AUTH-CLIENT, POST sans signature), HMAC (`X-HMAC-SIGNATURE` = HMAC-SHA256 hex du **corps brut**, vecteur de test officiel vérifié en test unitaire), décision webhook (`verification.status`, `code`, `vendorData`, `person.dateOfBirth`).
- Constat : il n'existe pas de nom de modèle « mini » ; `gpt-transcribe` est recommandé et `gpt-4o-*-transcribe` / `whisper-1` sont dépréciés au 2027-02-26. Aucun nom génératif n'est donc codé par défaut (variables d'env obligatoires).

## Fichiers (propriété E)
- `packages/ai/**` (nouveau) : `errors, schemas, providers, prompts, policy, cost, factory, runtime/runner, pipeline/moderation-pipeline, openai/openai-adapters, local/{local-adapters,audio}, eval/{cases,live}, ai.test.ts`.
- `apps/api/src/modules/trust/**` : `domain/{verification,staff,trust-rules}` ; `application/{block-and-report,verification,staff,privacy,ai-features}.use-cases.ts` et `ports/trust.repository.ts` ; `infrastructure/{prisma-trust,prisma-privacy,prisma-ai-features}.repository.ts`, `{veriff.provider,ai-moderation.gateway,trust.consumers}.ts` ; `interface/trust.controller.ts` ; `trust.module.ts`.
- `apps/api/src/modules/media/**` : `domain/media-policy.ts` ; `application/{media.use-cases.ts,ports/media.ports.ts}` ; `infrastructure/{prisma-media.repository,sharp-image.processor,audio-probe}.ts` ; `interface/media.controller.ts` ; `media.module.ts`.
- `apps/api/src/shared` (briques communes ajoutées) :
  - ports : `application/ports/{admin-trust,ai,identity-verification,object-storage}.port.ts` ;
  - infrastructure : `infrastructure/ai/{ai.factory,prisma-ai-journal,ai-task-queue}.ts`, `infrastructure/storage/object-storage.ts` (S3 + FS de test) ;
  - interface : `interface/raw-body.middleware.ts`.
- `packages/api-contract/src/{media,trust,ai}.ts` + lignes d'export.
- Docs : `docs/ai/policy.md`, `docs/privacy/{retention,ai-data}.md`, ce fichier.
- Tests : `apps/api/test/integration/{trust-media.test.ts,e-helpers.ts}`, `apps/api/test/unit/trust-media.test.ts`.
- Dépendances (via flock) : `openai@7.47.0` (ai), `sharp@0.35.5` et `@blowy/ai` (api).

## Modifications minimales hors de mes dossiers (à relire par C/A)
- **conversations** :
  - `ModerationVerdict` + `case`/`distress`/source HUMAN ; `moderateVoice?` ; jetons `AI_MODERATION_GATEWAY`, `MODERATION_CASE_SINK`, `VOICE_MESSAGE_GATE` (optionnels, `Symbol.for`) ;
  - `ModerateMessageUseCase` : routage voix, `applyHuman` (correction, WITHDRAW), ouverture de dossier, **XP une seule fois** (`claimExchange` sur `exchangeEvaluatedAt`), purge du corps au retrait, pas d'XP si relation close ;
  - `canHumanTransition` ; repository : `kind/mediaId`, `claimExchange`, `purgeBody`, `recentVisible`, `decidedById` ;
  - `MessageView.mediaId` (défaut null) ; route `POST /v1/conversations/:id/voice-messages`.
- **users** : `StartVerificationUseCase` délègue à `VERIFICATION_STARTER` (trust) ; `VerificationView.sessionUrl` (défaut null) ; exports du module (`VERIFICATION_GATEWAY`, `GetSelfProfileQuery`, `RecordConsentsUseCase`).
- **config/env.ts** : variables AI_*, OPENAI_*, VERIFF_*, STORAGE_*, S3_*, PUBLIC_API_URL, MEDIA_TOKEN_SECRET. La **production refuse** `AI_PROVIDER=local`, `STORAGE_DRIVER=fs` et l'absence de `MEDIA_TOKEN_SECRET` (`test/unit/config.test.ts` étendu). `.env.example` mis à jour.
- **bootstrap** : `rawBody: true` (HMAC webhooks) ; collecteur d'octets borné sur `PUT /v1/media/uploads/*`.
- **realtime** : type `disconnect` (suppression de compte / suspension ferme toutes les sockets) ; topic outbox `realtime.disconnect`.
- **worker** : file BullMQ `blowy-ai` ; `worker-runtime` ajoute les consommateurs/effets trust et les jobs `media.purge` / `privacy.purge`. Le harnais de test accepte des surcharges d'env et un stockage FS temporaire.

## Migration (additive, 3e)
`20261101013448_trust_media_ai` :
- enum `MediaVisibility` ;
- `MediaDerivativeKind += BLURRED_MEDIUM` ;
- colonnes : `MediaAsset` (session d'upload, visibilité, restricted, rejectReason, retentionVersion), `AIJob` (userId, contextId, policyVersion, cancelReason), `AIResult` (expiresAt, invalidatedAt), `ModerationCase` (restricted, subjectUserId), `Report.note`, `VerificationSession` (providerSessionUrl, decisionCode, reasonCode, lastProviderEventAt), `DataExport` (downloadNonce, error), `DeletionRequest` (purgeAfter, backupPurgeAfter, stats) ;
- tables : `MediaAccessToken`, `AIUsageCounter`, `MissionProofAssessment` (`rewardKey` unique).

Les deux migrations existantes sont intactes. `migrate deploy` passe sur une base vierge `blowy_e_check` (créée puis supprimée), `migrate diff` ne détecte aucune différence.

## Endpoints /v1 (nouveaux)
- **Médias** :
  - `POST media/uploads` (session liée à un usage, TTL 15 min) ; `PUT media/uploads/:id` (octets bruts vers la quarantaine) ; `POST media/:id/finalize` ; `GET media/:id` (propriétaire) ;
  - `GET media/:id/content?variant&relationshipId` (ACL à chaque accès, `no-store`, 404 uniforme) ; `POST media/:id/access-tokens` et `GET media/content/:token` (jeton 5 min révocable, ACL revérifiée) ;
  - `POST media/:id/share` (preuve de mission) ; `GET|POST relationships/:id/photo-reveal` (PHOTO_REVEAL / PHOTO_ORIGINAL, effet simultané au 2e accord).
- **Vocal** : `POST conversations/:id/voice-messages`.
- **Confiance** : `POST reports` (catégories, safetyExit, alsoBlock) ; `POST|GET blocks` ; `POST appeals`.
- **Vérification** : `POST verifications` (désormais Veriff / démo / 501) ; `POST webhooks/veriff`.
- **Export et suppression** : `POST|GET exports`, `GET exports/:id/download` ; `POST deletion-requests {confirm:"SUPPRIMER"}`.
- **IA** : `POST suggestions` ; `GET conversations/:id/signal` ; `GET|POST consents/ai`.
- Toutes les commandes passent par le CommandBus (Idempotency-Key).

## Événements outbox
- **Émis** : `trust.blocked`, `mission.proof_validated` (**unique par rewardKey — à consommer par le module missions**, qui applique pause et éligibilité), `media.photo_revealed`, `privacy.export_requested`, `privacy.deletion_requested`, `realtime.disconnect`.
- **Consommés** : `user.consent_withdrawn`, `social.anonymous_response_reported` (agent F) et `message.submitted` (signal, après la modération).

## Tests exécutés (résultats réels)
- `pnpm --filter @blowy/ai test` → **48/48**. Couvre :
  - les 25 cas texte FR + 4 vision + 3 voix ;
  - le runner (timeout, refus, breaker, plafond, cache, annulation, résultat tardif) ;
  - les contrats OpenAI avec fetch mocké : body `store:false`, `json_schema strict`, `input_image`, modalités évaluées, 429 ;
  - la factory prod.
- `pnpm --filter @blowy/api test` → **51/51** (architecture en couches incluse, Veriff/ACL/sniff).
- `pnpm --filter @blowy/api test:integration` → **10 fichiers, 47/47, deux passages consécutifs** (dont 15 nouveaux scénarios E). Ils couvrent :
  - **n°8** : photo cachée par id, jeton, tiers, URL directe ; EXIF/GPS absents des fichiers stockés ; flou Plus N4 identique au dérivé flou ; « jamais » révoque un jeton émis ; preuve privée par défaut ; SVG et type usurpé refusés ; selfie jamais servi ; IDOR upload/finalize/share ;
  - **voix** : verrou N3, transcription, silence → revue, durée > 60 s refusée ;
  - **n°9/10** : timeout/refus/invalide → PROCESSING_FAILED ; argent coercitif → revue + dossier ; détresse publiée ; injection sans effet ; soupçon mineur → aucun AIJob + dossier restreint ; suggestions jamais envoyées, fallback, retrait ;
  - **signal** : preuve fictive → neutral ;
  - **n°11** : décision tardive après blocage non publiée, sans XP ni projection ;
  - **n°12** : blocage et sortie de sécurité sans pénalité ni message, signaleur jamais exposé ;
  - **staff** : rôles, motif, idempotence, WITHDRAW, XP inchangée, audit ; revue staff = SELFIE_HUMAN_REVIEW/STAFF ;
  - **Veriff** : HMAC, rejeu DUPLICATE, état final non réversible, date de naissance non stockée, 501 sans fournisseur ;
  - **n°20** : export sans données d'autrui, suppression (401 immédiat, relation ACCOUNT_DELETED, puis purge médias, corps, IA, identités).
- ESLint de mes dossiers (et des fichiers touchés) : 0 erreur. Typecheck/build `@blowy/ai`, `@blowy/database`, `@blowy/api-contract` : OK.
- `@blowy/api` typecheck/build : **mes fichiers sont propres**. Il reste des erreurs transitoires dans `modules/social` et `modules/admin` (agent F, en chantier, signalées à F).
- Démarrage : `tsx src/main.ts` en local → `/v1/healthz` ok, `GET /v1/consents/ai` ok (un compte local `e.smoke` a été créé dans la base de dev).

## Décisions
- **ObjectStorage** : aucun port n'existait (contrairement à la consigne) ; créé dans `shared` (S3 via `@aws-sdk/client-s3` déjà présent, FS de test interdit en prod). Défaut `STORAGE_DRIVER=fs` hors prod pour fonctionner sans Docker (D-006).
- L'original brut d'une image n'est **pas conservé** : seuls les dérivés nettoyés (normalisé 1600 px, miniature 320, flou fort 24 px et flou moyen 48 px agrandis) restent.
- La photo de profil n'est servie qu'au sein d'une relation passée en `relationshipId`, revérifiée à chaque accès.
- Une revue staff de vérification crée une **nouvelle** session `SELFIE_HUMAN_REVIEW/STAFF` (badge « selfie contrôlé »), jamais `IDENTITY_AGE`. Veriff = `IDENTITY_AGE/PROVIDER`. Un document mineur approuvé devient REJECTED.
- Les consentements IA passent par la commande existante `me.record_consents` (une seule source d'émission de `user.consent_withdrawn`).
- Le dossier mineur `restricted` est visible du seul rôle `trust_lead`, sans contenu même pour lui dans l'outil ordinaire.
- Les clés de cache IA incluent l'auteur et la relation (aucune fuite inter-personnes).

## Limites / restant
- **Clés et fournisseurs requis** :
  - `OPENAI_API_KEY` + `OPENAI_TEXT_MODEL` / `OPENAI_VISION_MODEL` / `OPENAI_TRANSCRIPTION_MODEL`, et `AI_PRICE_TABLE_JSON` (tarifs datés) ;
  - `VERIFF_API_KEY`, `VERIFF_SHARED_SECRET`, `VERIFF_BASE_URL`, `VERIFF_CALLBACK_URL` (configurer l'URL webhook `…/v1/webhooks/veriff` dans le portail Veriff) ;
  - `MEDIA_TOKEN_SECRET` et un S3 privé en production.
- **Non exécuté** : `eval:live` (payant, opt-in) ; contrat Veriff réel (sandbox) ; MinIO (pas de Docker ici, l'adaptateur S3 est codé sans être testé en réel).
- HEIC accepté si libvips le décode (sinon UNDECODABLE). Vocal limité à WAV PCM et MP4/M4A.
- Projection bébé indépendante : figée dans `CoparentLink.independentProjection` au blocage. L'évolution propre à chaque parent revient au module œuf/bébé (G).
- `MEDIA_TOKEN_SECRET` est validé mais les jetons sont des aléas 256 bits stockés en empreinte (pas de HMAC requis) ; la variable sert de réserve aux liens signés.
- Suggestions AUTO : pas de job planifié (le use case accepte `trigger='AUTO'`) ; à déclencher par le module notifications.

## Demandes aux autres propriétaires
- **Missions (G)** : consommer `mission.proof_validated` (clé `rewardKey`) pour `MissionAward`, en appliquant pause et revalidation ; ne jamais écrire d'XP depuis l'IA.
- **A (domain)** : ajouter `WITHDRAWN` est déjà fait ; aucune autre demande.
- **D (mobile)** : utiliser les flux suivants :
  - upload : session → PUT → finalize ;
  - images : `GET media/:id/content` avec Bearer, ou `access-tokens` pour `<Image>` ;
  - vocal : `voice-messages` ;
  - révélation : `photo-reveal` ;
  - signalement, blocage, export et suppression : endpoints trust ;
  - suggestions : `POST suggestions`, insérées dans le champ de saisie, **jamais envoyées automatiquement**.

  Afficher `providerMode` des consentements IA.
- **F (admin)** : ports consommés via `Symbol.for` (accord confirmé par message), `getCase(..., {justification})` exigé pour MEDIA et MISSION_SUBMISSION.
