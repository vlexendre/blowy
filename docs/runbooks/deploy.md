# Runbook déploiement

Aucun déploiement payant n'est effectué depuis ce dépôt sans instruction explicite.

## Images
- API + worker : `infra/docker/api.Dockerfile` (même image ; worker = `node dist/worker.js`).
- Web / admin : `infra/docker/next.Dockerfile` avec `--build-arg APP=@blowy/admin --build-arg APP_DIR=apps/admin`.

## Ordre de mise en production
1. Sauvegarde Postgres (`pg_dump -Fc`) + versionnage du bucket S3 actif.
2. `pnpm db:migrate:deploy` (jamais `migrate reset` / `db push` en production).
3. Rollout API (readiness `/v1/healthz/ready` doit passer avant bascule).
4. Rollout workers : arrêt gracieux (SIGTERM → fin des jobs en cours, pas de nouveaux).
5. Web/admin.

## Rollback
- Code : redéployer l'image précédente. Les migrations sont additives (expand/contract) ; une migration destructive exige une version intermédiaire.
- Config tuning/content : rollback vers une version publiée depuis l'admin (versions immuables).

## Sauvegarde / restauration
- Postgres : PITR fournisseur + `pg_dump` quotidien chiffré, test de restauration mensuel sur staging.
- S3 : versionnage + règle de cycle de vie alignée sur la table de rétention (`docs/privacy/retention.md`). Les purges de suppression de compte s'appliquent aussi aux sauvegardes à l'expiration de leur fenêtre (documenté, pas instantané).

## Variables requises en production
Voir `apps/api/.env.example`. Démarrage refusé si : adaptateur local actif (auth, achats, vérification, modération), `DEV_AUTH_BYPASS` présent, secret manquant.
