# Rétention des données — table par catégorie (version `retention-2026.11.1`, V5)

Ces durées sont opérationnelles et doivent être validées juridiquement avant le lancement. Ce document de préparation n'est pas une certification de conformité, et aucune obligation légale uniforme n'est supposée. Le code de référence est `apps/api/src/modules/media/domain/media-policy.ts` (`RETENTION_DAYS`). Les jobs de purge sont `media.purge`, `privacy.purge`, `outings.purge` et `safety.purge` (horaires, clé `JobExecution`). Le code de référence V5 sécurité est `apps/api/src/modules/safety/domain/guardian.ts` et `[T] safety.*` (`@blowy/tuning`).

| Catégorie | Données | Durée en ligne | Purge / exception |
|---|---|---|---|
| Profil | prénom, genre déclaré, préférences, zone | vie du compte | Suppression : anonymisation (`Compte supprimé`), préférences et identités supprimées par `privacy.purge` |
| Date de naissance | contrôle 18+ serveur | vie du compte | Effacée à la suppression ; celle du document Veriff n'est **jamais** stockée |
| Messages (corps) | `MessageContent` | vie de la relation + compte | Effacés au retrait (WITHDRAWN) et à la suppression du compte de l'auteur. Le journal de statut reste, sans contenu |
| Messages non publiés | pending / revue / échec | jusqu'à décision | Passent en WITHDRAWN à la suppression du compte |
| Photos de profil | dérivés normalisé / miniature / flous (original brut **non conservé**) | tant que photo courante | 30 j après remplacement ou suppression |
| Preuves de mission | dérivés | 90 j après dépôt | Dossier ouvert : jusqu'à sa clôture |
| Vocaux | fichier audio privé | 365 j | Supprimés avec le compte ; transcription non conservée (journal IA sans texte) |
| Selfie / vérification | résultat, type, provenance, référence fournisseur, échéance | 2 ans (validité) | Média selfie 30 j après décision ; aucune copie biométrique, jamais réutilisé comme photo ; référence fournisseur effacée à la suppression |
| Médias rejetés | aucun dérivé conservé (REJECT) | 30 j (métadonnées) | Sauf dossier ouvert ; dossier mineur : accès spécialisé, procédure dédiée |
| Uploads abandonnés | quarantaine | 15 min de session, puis purge à 24 h | `media.purge` |
| Résultats IA | `AIResult` validé (sorties structurées, sans texte d'entrée) | cache ≤ 24 h (modération), 12 h (suggestions) | Invalidés au retrait de consentement ou au blocage ; supprimés à la suppression du compte |
| Journal IA | `AIJob` : modèle, version, durée, tokens, coût, codes | 13 mois (pilotage coûts/qualité) | Désassocié de l'utilisateur à la suppression |
| Suggestions / signaux | `Suggestion`, `ConversationSignal` | 12 h / 15 min de validité | Invalidés au retrait, supprimés au blocage et à la suppression |
| Position gardien (V4) | `SafetyLocationPoint` | ≤ 3 h de partage (CHECK) | Révoquée au blocage ; table morte en V5 (plus écrite) |
| Événements financiers | ledger append-only, transactions store | durée comptable à valider | Conservés pseudonymisés : exception justifiée (comptabilité, litiges) |
| Dossiers de confiance | signalements (note privée), dossiers, décisions, recours | 2 ans après clôture | Note du signaleur effacée à la suppression de son compte ; décisions sans contenu conservées (sécurité) |
| Audit staff | `AuditLog` append-only | 3 ans | Exception : traçabilité des accès aux données |
| Exports | archive JSON privée `exports/<user>/` | lien valable 7 j | Supprimée à expiration (`privacy.purge`) |
| Logs applicatifs | pino expurgé (identifiants, codes) | 30 j (infra) | Aucun contenu privé journalisé |
| Sauvegardes | base et stockage | rotation 35 j | `DeletionRequest.backupPurgeAfter` = demande + 35 j |

Procédure de suppression : `POST /v1/deletion-requests {confirm:"SUPPRIMER"}` déclenche une révocation **immédiate** (sessions, push, sockets WS, liens publics et de parrainage, propositions de matching, jetons médias, exports). Les relations sont fermées (ACCOUNT_DELETED) sans pénalité. Les jobs IA sont annulés. `privacy.purge` efface et anonymise ensuite. Les données des autres personnes sont préservées, sans accès au compte supprimé. Les demandes de suppression chez les fournisseurs (Veriff, OpenAI) sont à exécuter selon leurs API et contrats au moment du lancement (voir ai-data.md).

## V5 — sorties, ange gardien, sécurité (spec-v5 §8.5, V5.1 G, V5.2 C.8, V5.3 A.4 / B.9)

| Catégorie | Données | Durée en ligne | Purge / exception |
|---|---|---|---|
| Position de check-in | — | **jamais stockée** | Aucune colonne lat/lng (`OutingCheckInAttempt` garde seulement une tranche de précision et le résultat) ; jamais dans l'empreinte d'idempotence ni dans les logs |
| Position jointe à une alerte | `SafetyAlert.lat/lng/accuracyM` (choix explicite) | 72 h (`positionPurgeAfter`, `[T] safety.alertPositionRetentionHours`) | `safety.purge` ; retenue tant que le dossier SAFETY_ALERT est ouvert, purgée à l'heure suivant sa clôture. Visible du seul trust_lead/admin, lecture motivée et auditée. **Jamais montrée au proche** (V5.3 A.4) ; jamais dans la mémoire d'idempotence |
| Alerte « besoin d'aide » | `SafetyAlert` (sans position après purge), dossier `ModerationCase` | 2 ans après clôture (règle « dossiers de confiance ») | Suppression du compte : pseudonymisée |
| Lien ange gardien | `GuardianLink` : empreinte SHA-256 du jeton (jamais le jeton, ni dans `CommandRecord`), libellé privé, fenêtre, compteur de vues **sans IP ni empreinte** | métadonnées 30 j après expiration | `safety.purge` ; révoqué à la demande, à l'annulation de la place ou de la sortie, au retrait système, à la suppression du compte. Aucun numéro ni email du proche n'est jamais stocké |
| Abonnement Web Push du proche | `GuardianPushSubscription.endpoint` seul (notifications sans contenu : aucune clé) | expiration du lien + 24 h | `safety.purge` ; supprimé immédiatement à la révocation du lien ou si le navigateur le déclare expiré (404/410) |
| « Tout va bien » | `SafetyOkSignal` (horodatage) | 30 j | `safety.purge` (même horizon que les métadonnées de lien) |
| Retrait système / « je pars, mal à l'aise » / incident sur place | `SafetySystemRemoval`, `SafetyUneasyLeave`, `SafetyIncident` (note privée) | 2 ans (dossiers de confiance) | Jamais exposés aux autres membres ; note d'incident effacée à la suppression du compte du signaleur |
| Bulletins de vote (`OutingVote`, `DuoVote`) | choix privés | 7 j après clôture | `outings.purge` ; résultats mutuels gardés (lien/duo) |
| Chat de groupe (corps) | messages | lecture 7 j après clôture, purge 90 j après clôture | sauf message signalé (dossier) |
| Chats bande/duo | messages | vie du lien + compte | à `band.leave`/`duos.leave` : fermeture, purge 90 j |
| `OutingRequest`, `CompositionRun.stats` | demandes, agrégats | 13 mois | agrégats seulement |
| Places / présences (`OutingSeat`, `ReliabilityStat`) | statuts | vie du compte | à la suppression : places pseudonymisées (userId conservé pour l'unicité « déjà vus » des autres) |
| Paiements | ledger, `Payment` | durée comptable (10 ans, C. com. L123-22 — à valider) | pseudonymisés, exception justifiée |
| Genres recherchés, intentions (`romanceGenders`, `lookingFor`, `storySeriousness`) | donnée art. 9 (orientation) | vie du compte, **consentement explicite `SENSITIVE_PREFERENCES`** | Refus sans consentement (403 `CONSENT_REQUIRED`) ; **retrait = effacement immédiat dans la même transaction** (genres romance vidés, « une histoire » retirée) ; effacés à la suppression. `meetGenders` (amis) n'est pas soumis à ce consentement : effacé à la suppression du compte |
| Contestations d'absence (note) | texte privé | 1 an après résolution | |
| Photos révélées en sortie | dérivés de la photo de profil | règle « photos de profil » | Servies seulement aux participant·es confirmé·es à partir de `startsAt − 3 h`, par jeton court (5 min) revérifié à chaque lecture, **filigranées au prénom du regardeur côté serveur** (JPEG ré-encodé, sans métadonnée, `no-store`) |

Export RGPD (art. 15) : doit inclure ses demandes, places, présences, bulletins non purgés, liens, duos, souvenirs, **liens gardien (sans jeton)**, alertes (sans position purgée), paiements — l'ajout des tables V5 à l'export reste à faire (voir handoff V5-T4).
