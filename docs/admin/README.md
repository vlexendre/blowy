# Back-office Blowy (apps/admin + /v1/admin)

## Lancer en local
```bash
pnpm --filter @blowy/api build && (cd apps/api && node dist/main.js)   # API :3000 (ou pnpm --filter @blowy/api dev)
pnpm --filter @blowy/admin dev                                          # http://localhost:3001 (ADMIN_API_URL, défaut http://localhost:3000)
pnpm dev:all                                                            # API + admin (3001) + web (3002)
```
Connexion : fournisseur « Identité locale » (refusé en production), identifiant `staff.<rôle>` du seed
(`staff.admin`, `staff.support`, `staff.moderator`, `staff.trust_lead`, `staff.content_manager`, `staff.finance`, `staff.analyst`).
À la première connexion, l'enrôlement TOTP est obligatoire : le secret s'affiche une fois (à ajouter dans une app TOTP).
**Développement local uniquement** : `pnpm --filter @blowy/api staff:totp -- staff.admin` imprime le secret et le code courant
(dérivés de la clé maîtresse locale par défaut `STAFF_MFA_KEY`) ; la commande est refusée hors `BLOWY_ENV=local|test`.

## Authentification staff (distincte du mobile)
1. `POST /v1/admin/auth/login {provider, credential}` : preuve d'identité (Firebase en prod, clé locale hors prod) ; le compte doit porter un rôle staff actif → jeton d'attente MFA signé (5 min). Aucune session n'est ouverte.
2. `POST /v1/admin/auth/mfa/enroll` (si non enrôlé) puis `POST /v1/admin/auth/mfa/verify {code}` : TOTP RFC 6238, anti-rejeu du pas (un code ne sert qu'une fois) → session staff (TTL 8 h, inactivité 30 min, `STAFF_SESSION_TTL_MINUTES` / `STAFF_IDLE_TIMEOUT_MINUTES`) + jeton CSRF.
3. Le BFF Next stocke session et CSRF en cookies `HttpOnly`, `SameSite=Strict`, `Secure` hors local ; il les transmet à l'API en en-têtes (`x-blowy-staff-session`, `x-blowy-csrf`) depuis le serveur uniquement. Toute mutation exige le CSRF (HMAC lié à la session) ; les server actions Next ont en plus leur contrôle d'origine.
4. Step-up : `POST /v1/admin/auth/step-up {code}` (nouveau code) → 5 min pour les actions sensibles (suspendre/bannir/rétablir, réparation, correction économique, publication tuning/contenu/missions, redrive). L'UI demande le code inline quand l'API répond `STEP_UP_REQUIRED`.
5. Sessions listables et révocables (`GET /sessions`, `DELETE /sessions/:id|current`). Un bearer mobile n'est jamais accepté par l'admin ; une session staff n'est jamais acceptée par le guard mobile (empreinte à séparation de domaine).

Secrets (≥ 32 caractères, distincts, obligatoires hors local/test, valeurs locales refusées) : `STAFF_SESSION_SECRET`, `STAFF_MFA_KEY` (clé maîtresse de dérivation TOTP — le secret TOTP n'est jamais stocké), `PUBLIC_LINK_SECRET`.

## Attribution des rôles (CLI, aucune route HTTP)
```bash
pnpm --filter @blowy/api staff:roles -- grant  --provider firebase --subject <uid> --role moderator --operator "Prénom N." --reason "ticket #123"
pnpm --filter @blowy/api staff:roles -- revoke --provider firebase --subject <uid> --role moderator --operator … --reason …   # révoque aussi les sessions staff
pnpm --filter @blowy/api staff:roles -- reset-mfa --provider firebase --subject <uid> --operator … --reason …                # réenrôlement obligatoire
pnpm --filter @blowy/api staff:roles -- list
# image de production : node dist/modules/admin/interface/cli/staff-roles.cli.js <commande> …
```
Le compte doit exister (première connexion). Chaque opération est auditée (`staff.cli.*`, acteur `cli:<opérateur>`). `--provider local` est refusé en production. Aucun email n'est codé en dur.

## Permissions (serveur : `apps/api/src/modules/admin/domain/permissions.ts`)
| Rôle | Principales permissions |
|---|---|
| support | lecture utilisateurs/pets/relations, file de modération (sans contexte ni décision), vérifications, social, missions |
| moderator | file + contexte + assignation + décisions de contenu + recours ; masquage de réponses anonymes ; aucune sanction de compte |
| trust_lead | + sanctions de compte (avertir/restreindre/suspendre/bannir/rétablir), revue de vérification, réparation de relation, audit |
| content_manager | missions (CRUD, publication), contenus (draft/publish/archive), lecture du tuning |
| finance | utilisateurs (fiche), économie (ledger, corrections, webhooks, rapprochement) — jamais le chat |
| analyst | dashboard, matching, IA (agrégats), exploitation, lecture tuning — jamais messages/selfies/fiches |
| admin | tout (dont tuning write/publish) |
Aucune permission ne lit un vote privé ni n'impose une relation. Les ports de E revérifient les rôles.

## Sections (§18) et routes
| § | UI | API | Source |
|---|---|---|---|
| 18.1 | `/` | `GET dashboard?from&to&zone` | requêtes SQL réelles ; dénominateur + définition par indicateur ; `NOT_INSTRUMENTED` si aucune source (revenu EUR) ; fictifs et staff exclus |
| 18.2 | `/users`, `/users/:id` | `GET users`, `GET users/:id` (lecture auditée), `POST users/:id/actions` | sanctions déléguées à `ADMIN_MODERATION.sanction` (E) |
| 18.3 | `/pets/:id`, `/relationships/:id` | `GET pets/:id`, `GET relationships/:id`, `POST relationships/:id/repair` | diagnostics par `EngineGateway.levelFor` ; réparation = niveau éligible seulement + événement SYSTEM `relationship.staff_correction` |
| 18.4 | `/moderation`, `/moderation/:id` | `moderation/cases`, `cases/:id?justification=`, `assign`, `decisions`, `appeals`, `appeals/:id/resolve`, `moderation/stats`, `reports` | port `ADMIN_MODERATION` (E) |
| 18.5 | `/verification` | `verifications`, `verifications/:id/review` | port `ADMIN_TRUST` (E) — jamais `IDENTITY_AGE` |
| 18.6 | `/missions` | `missions` (GET/POST), `PUT missions/:id`, `publish`, `archive`, `missions/schedule`, `missions/preview` | `MissionDefinition` versionnée ; bornes = tuning |
| 18.7 | `/content` | `content`, `content/drafts`, `versions/:id/preview|publish|archive` | `ConfigVersion(CONTENT)` ; clés existantes de `@blowy/content` seulement ; variables allowlistées |
| 18.8 | `/tuning`, `/tuning/:id` | `tuning`, `tuning/drafts`, `versions/:id/diff|publish|simulate`, `tuning/rollback` | `ConfigVersion(TUNING)` validée par `TuningSchema` ; rollback = nouvelle version |
| 18.9 | `/matching` | `matching` | zones, admissibles, causes d'exclusion, histogramme d'exposition 14 j, lots |
| 18.10 | `/economy` | `economy/users/:id/ledger|corrections|reconcile`, `economy/webhooks`, `webhooks/:id/redrive` | port `ADMIN_ECONOMY` (G) |
| 18.11 | `/social` | `social`, `social/anonymous/:id/hide` | parrainages (signal ≥ 10 claims/24 h par parrain), réponses signalées, bandes, ligues |
| 18.12 | `/ai` | `ai`, `ai/jobs`, `ai/jobs/:id/retry|cancel` | agrégats `AIJob` ; retry/cancel = `ADMIN_TRUST` (E) |
| 18.13 | `/ops` | `ops`, `ops/outbox/dead`, `ops/outbox/:id/redrive`, `exports`, `deletions` | redrive soumis à `StateAwareRedriveGuard` (liste blanche par topic, état actuel) |
| — | `/audit`, `/account` | `audit`, `auth/*` | AuditLog append-only |

Chaque mutation : `AdminCommandRunner` → permission → step-up si sensible → `CommandBus` (Idempotency-Key, transaction) → `AuditLog` dans la même transaction ; mutations déléguées (E/G) auditées après succès. L'UI fixe l'Idempotency-Key au rendu du formulaire : une double soumission est rejouée. États explicites : chargement (`loading.tsx`), erreur (`error.tsx`), refus (403), « service non branché » (501), session expirée.
