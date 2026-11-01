# Données envoyées aux fournisseurs IA et de vérification

Document de préparation, à valider (bases légales, AIPD/DPIA, sous-traitance) avant la diffusion publique. Une case à cocher ne remplace pas une décision de traitement réglementaire.

## Consentements (§9.6)
Les consentements sont versionnés (`CURRENT_CONSENT_VERSIONS`, append-only `ProcessingConsent`, commande `me.record_consents`). `GET /v1/consents/ai` affiche les usages, les types de données, le fournisseur et la version.

| Finalité | Nature | Si refusée |
|---|---|---|
| `AI_MODERATION` | nécessaire au flux social | Pet et fonctions autorisées conservés ; chat bloqué et expliqué (`CONSENT_REQUIRED`) ; rien n'est envoyé en cachette, aucun chat non modéré |
| `AI_SUGGESTIONS` | facultative, **par auteur** | Fallback éditorial ; les messages du partenaire ne sont envoyés que s'il a lui-même accepté |
| `AI_NARRATION` | facultative, par auteur | Pas de signal d'humeur IA ; répliques éditoriales |

Retrait : l'événement `user.consent_withdrawn` déclenche, dans la transaction du consommateur, l'annulation des `AIJob` en attente, l'invalidation des `AIResult`, des suggestions et des signaux de cet auteur. Ces dérivés ne sont jamais réinjectés dans un prompt facultatif.

## Ce qui est envoyé (minimal, pseudonymisé)
| Tâche | Envoyé | Jamais envoyé |
|---|---|---|
| Modération texte | texte du message ; contexte limité = ≤ 8 messages publiés de la même conversation, locuteurs « A/B » | noms, âge, date de naissance, position, votes, autres conversations, signalements |
| Modération image | image **normalisée** (EXIF/GPS retirés) | selfie de vérification, contenu soupçonné d'exploitation de mineurs |
| Transcription | fichier audio du vocal | identité, analyse de voix |
| Vision mission | image normalisée + critères éditoriaux | visage requis, texte utilisateur comme instruction |
| Suggestions | messages consentis, vision publique, souvenirs (ids), mission | choix romantiques, score de modération, position, co-parent, autre rendez-vous |
| Signaux | messages publiés d'auteurs consentants | idem |

## Fournisseurs
- **OpenAI** (API serveur). `store: false` est appliqué sur la Responses API. Ce paramètre limite la conservation d'état applicatif ; **il ne garantit pas une absence universelle de conservation**. Selon la doc « Your data » consultée le 2026-11-01 :
  - les journaux de surveillance des abus sont conservés jusqu'à 30 jours, sauf Zero Data Retention ou Modified Abuse Monitoring (sur approbation OpenAI) ;
  - les endpoints `/v1/moderations`, `/v1/responses` et `/v1/audio/transcriptions` sont éligibles ZDR ;
  - les données API ne servent pas à l'entraînement sans opt-in.

  À contractualiser : DPA, région de traitement, ZDR si possible.
- **Veriff** (vérification d'identité). Seuls un identifiant non sémantique de session (`vendorData`/`endUserId`) et l'URL de retour sont transmis à la création. La capture se fait dans le parcours Veriff. Blowy conserve le résultat, le code de décision, le type exact (`IDENTITY_AGE`), la provenance `PROVIDER` et l'échéance. La date de naissance renvoyée sert **uniquement** au contrôle 18+, puis n'est pas stockée. Webhooks dédupliqués (`ProviderWebhookEvent`, charge minimisée). À contractualiser : durée de conservation chez Veriff, API de suppression.

## Ce que l'IA ne fait pas
Elle ne prend aucune décision de sanction de compte (seul un humain sanctionne). Elle ne contrôle pas l'âge, ne détermine pas les sentiments réels, ne produit ni diagnostic ni score amoureux. Elle n'infère jamais le genre ou les préférences. Elle n'écrit pas d'XP, de pièces, de jauges ni de consentements.

## Pas de chiffrement de bout en bout
Le serveur et les fournisseurs analysent les contenus en clair (transport TLS, chiffrement au repos S3 `AES256`). L'application ne doit pas annoncer de chiffrement de bout en bout.
