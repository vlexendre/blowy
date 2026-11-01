# Rétention des données — table par catégorie (version `retention-2026.11.0`)

Ces durées sont opérationnelles et doivent être validées juridiquement avant le lancement. Ce document de préparation n'est pas une certification de conformité, et aucune obligation légale uniforme n'est supposée. Le code de référence est `apps/api/src/modules/media/domain/media-policy.ts` (`RETENTION_DAYS`). Les jobs de purge sont `media.purge` et `privacy.purge` (horaires, clé `JobExecution`).

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
| Position gardien | `SafetyLocationPoint` | ≤ 3 h de partage (CHECK) | Révoquée au blocage |
| Événements financiers | ledger append-only, transactions store | durée comptable à valider | Conservés pseudonymisés : exception justifiée (comptabilité, litiges) |
| Dossiers de confiance | signalements (note privée), dossiers, décisions, recours | 2 ans après clôture | Note du signaleur effacée à la suppression de son compte ; décisions sans contenu conservées (sécurité) |
| Audit staff | `AuditLog` append-only | 3 ans | Exception : traçabilité des accès aux données |
| Exports | archive JSON privée `exports/<user>/` | lien valable 7 j | Supprimée à expiration (`privacy.purge`) |
| Logs applicatifs | pino expurgé (identifiants, codes) | 30 j (infra) | Aucun contenu privé journalisé |
| Sauvegardes | base et stockage | rotation 35 j | `DeletionRequest.backupPurgeAfter` = demande + 35 j |

Procédure de suppression : `POST /v1/deletion-requests {confirm:"SUPPRIMER"}` déclenche une révocation **immédiate** (sessions, push, sockets WS, liens publics et de parrainage, propositions de matching, jetons médias, exports). Les relations sont fermées (ACCOUNT_DELETED) sans pénalité. Les jobs IA sont annulés. `privacy.purge` efface et anonymise ensuite. Les données des autres personnes sont préservées, sans accès au compte supprimé. Les demandes de suppression chez les fournisseurs (Veriff, OpenAI) sont à exécuter selon leurs API et contrats au moment du lancement (voir ai-data.md).
