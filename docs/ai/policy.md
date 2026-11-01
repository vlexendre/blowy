# Politique IA et modération — Blowy (agent E)

Version de politique : **`blowy-policy-2026.11.1`** (`packages/ai/src/policy.ts`). Prompts : `packages/ai/src/prompts.ts` (une version par prompt). Toute modification change la version, donc les clés de cache. Elle doit passer `pnpm --filter @blowy/ai test`. Avant activation en production, il faut aussi lancer l'évaluation réelle opt-in.

## Principes
- Intégration **API OpenAI côté serveur** (SDK officiel `openai@7.47`). Aucune automatisation de ChatGPT.
- Six services distincts : `ContentModerationProvider`, `MissionVisionProvider`, `MessageSuggestionProvider`, `ConversationSignalProvider`, `PetNarrationProvider`, `SpeechTranscriptionProvider`. `IdentityVerificationProvider` (Veriff) est hors IA généraliste.
- **Responses API + Structured Outputs** : `text.format = zodTextFormat(schéma, nom)` (json_schema strict), `store: false`, sortie **revalidée par Zod côté serveur**.
- Les cas suivants lèvent une `AiError` typée : refus (contenu `refusal`, `content_filter`), réponse incomplète (`status ≠ completed`), timeout, format non conforme, contexte trop long, erreur fournisseur. **Aucune AiError ne vaut approbation.**
- Modération : `moderations.create`, modèle configurable `OPENAI_MODERATION_MODEL` (défaut documenté : `omni-moderation-latest`). Seules les catégories que `category_applied_input_types` déclare pour la modalité sont considérées comme **évaluées**.
  - Sur image, `harassment`, `hate`, `illicit` et `sexual/minors` sont « text only ». Un 0 sur ces catégories n'est **pas** une preuve d'innocuité, d'où une politique image plus stricte (contenu sexuel faible → revue).
- Modèles génératifs, vision et transcription : **aucun nom codé par défaut**. Ils sont choisis dans la doc « Models » du moment et fournis par `OPENAI_TEXT_MODEL`, `OPENAI_VISION_MODEL` et `OPENAI_TRANSCRIPTION_MODEL`.
  - La doc du 2026-11-01 recommande `gpt-transcribe` et marque `gpt-4o-*-transcribe` et `whisper-1` comme dépréciés au 2027-02-26.
- Les contenus utilisateur (texte, OCR, transcriptions, métadonnées) sont des **données non fiables**. Ils sont passés dans un bloc JSON `{"data": …}` séparé des instructions. Le modèle n'a **aucun outil**, aucun réseau, aucune écriture. Aucune sortie n'est une commande, un droit, un consentement ni une preuve d'identité.

## Machine d'états des messages (§9.1)
`DRAFT_LOCAL → PENDING_MODERATION → PUBLISHED | WARNED | QUARANTINED | REJECTED | HUMAN_REVIEW | PROCESSING_FAILED` ; `PUBLISHED/WARNED → WITHDRAWN` (retrait, final).
Les décisions humaines (correction, recours) passent par `canHumanTransition`. Elles sont append-only (`ModerationDecision`, source HUMAN, `decidedById`). L'aller-retour XP n'est évalué **qu'une fois** (`Message.exchangeEvaluatedAt` réclamé atomiquement) : une correction tardive ne réattribue jamais l'XP.

## Pipeline (étapes 3-5)
1. **Contrôles déterministes** :
   - URL, e-mail, téléphone, pseudo de messagerie ;
   - mention d'argent, marqueur de coercition, marqueur de détresse, menace urgente ;
   - répétition (≥ 2 corps identiques en 10 min) ;
   - lexique de protection des mineurs.

   Les liens ne sont **jamais visités**.
2. **Protection des mineurs** : un soupçon (indicateur d'âge mineur + terme sexuel, ou `sexual/minors ≥ 0.2`) ⇒ **aucun envoi au fournisseur généraliste**. Le message passe en QUARANTINE, avec un dossier `restricted=true` priorité 1, visible du seul rôle `trust_lead`, et aucun contenu dans les vues staff ordinaires ni dans `AIJob`. Les fixtures n'utilisent que des indicateurs génériques, sans contenu illicite.
3. **Classification** `moderations.create` (texte ou image).
4. **Analyse contextuelle limitée**. Elle ne se déclenche que si l'un de ces signaux est présent : argent, coercition, coordonnées, répétition, `harassment ≥ 0.3`, ou insistance (≥ 2 messages de l'auteur à la suite après une réponse de l'autre). Fenêtre : ≤ 8 messages publiés de **cette** conversation, pseudonymisés A/B, tronqués à 500 caractères. Schéma strict `ContextRisk`.
5. **Politique** (seuils en millièmes, scores ≠ probabilités de culpabilité, jamais de sanction de compte automatique) :

| Signal | Action |
|---|---|
| soupçon mineur / menace explicite (« je sais où tu habites ») | QUARANTINE p1 (mineur : `restricted`) |
| classification indisponible | **HUMAN_REVIEW** (jamais ALLOW) |
| `self-harm/instructions ≥ 0.5` | HUMAN_REVIEW p1 (détresse) |
| `harassment/threatening ≥ 0.7`, `hate/threatening ≥ 0.5`, `illicit/violent ≥ 0.7` | QUARANTINE p1 |
| `hate ≥ 0.7` | REJECT (+ dossier) |
| `violence/graphic ≥ 0.8` | REJECT |
| contexte `coercion` (conf ≥ 0.6) | QUARANTINE p1 |
| contexte `money_request` + demande explicite | HUMAN_REVIEW p1 |
| contexte `harassment_repeated` | WARN + dossier |
| `illicit ≥ 0.8` | HUMAN_REVIEW |
| `harassment ≥ 0.8` / `violence ≥ 0.8` / `sexual ≥ 0.8` avant N4 | WARN |
| coordonnées avant N3 | WARN (`EARLY_CONTACT_DETAILS` / `CIRCUMVENTION`) |
| répétition | WARN |
| détresse (marqueur, `self-harm ≥ 0.5`, contexte `distress`) | **ALLOW**, `distress=true` (aide proposée, jamais sanctionnée) |
| sinon | ALLOW |

Une mention ordinaire d'argent (« 12 € la place ») ou un téléphone après N3 restent ALLOW.

## Panne IA
- Erreur, timeout, refus, format invalide, budget atteint ou circuit ouvert ⇒ `PROCESSING_FAILED`. Le message n'est pas publié, et l'auteur voit son statut.
- Si l'analyse contextuelle était requise (argent ou coercition) mais a échoué ⇒ même traitement.
- Les soins du pet et les fonctions sans IA continuent. Les suggestions retombent sur la bibliothèque éditoriale (`@blowy/content` NUDGE).

## WARNED
Le destinataire ne reçoit qu'un placeholder (`body:null`, `mediaId:null`). « Afficher quand même » passe par `POST /v1/messages/:id/reveal`, sans XP. Les statuts REJECTED, QUARANTINED, HUMAN_REVIEW, PENDING et FAILED ne sont **jamais** livrés : ni corps, ni fichier, ni projection WS.

## Voix (§9.2)
- Vocal ouvert à N3 avec droit `VOICE` (matrice de capacités), ≤ 60 s et ≤ 3 Mo.
- Type réel par signature (WAV/MP4). Durée réelle lue dans l'en-tête RIFF ou la boîte `mvhd`.
- Stockage privé, puis transcription serveur, puis modération du texte.
- Les cas `SILENCE`, `UNCERTAIN` (aucune langue détectée ou confiance < 0.6), `UNSUPPORTED_LANGUAGE` (langue ≠ fr/en) et `NON_VERBAL` partent en **HUMAN_REVIEW** (dossier `VOICE_*`).
- Le modèle de modération ne classe pas l'audio. La transcription n'est pas une modération parfaite du son.
- Aucune analyse d'identité, d'âge, d'orientation, d'origine, de santé ni d'attirance.

## Vision des preuves (§9.3)
- Schéma strict `MissionAssessment {status, visibleEvidence, missingEvidence, qualityIssues, confidenceSignal, requiresReview, reasonCode}` (raisons versionnées `mission-reasons-2026.11.0`).
- Critères **observables** tirés de `@blowy/content` (jamais du texte utilisateur), image normalisée sans métadonnées, `detail: low`. Un texte OCR qui donne des instructions ⇒ `TEXT_INSTRUCTIONS_IGNORED`.
- Statuts :
  - `consistent` avec confiance ≥ 0.7 et sans revue ⇒ CONSISTENT ;
  - `inconsistent` ⇒ refaire ;
  - `uncertain` ⇒ refaire, alternative accessible ou revue.
- Réutilisation exacte (même hash) ⇒ revue, jamais une sanction automatique.
- **Aucune XP n'est écrite depuis l'IA.** La validation émet un **événement outbox unique** `mission.proof_validated {proofId, rewardKey, userId, contextId|null, missionKey, submittedAt, serverDay}`.
  - `rewardKey = mission-proof:<user>:<mission>:<jour serveur>` est unique en base.
  - La relation est revérifiée à l'émission : terminée ou bloquée ⇒ `contextId:null`, gain personnel seulement.
  - Le réexamen staff n'émet jamais deux fois.
  - **Le module missions consomme cet événement** et applique pause et éligibilité.

## Suggestions (§9.4)
- Déclenchement : demande de l'utilisateur, ou `AUTO` après 12 h sans message publié, ≤ 2 par jour.
- Interdites sur relation close, bloquée ou en pause.
- Contexte : ≤ 10 derniers messages publiés de cette conversation. Les messages **du partenaire** n'y entrent que s'il a consenti à `AI_SUGGESTIONS`. S'y ajoutent la vision publique, les souvenirs non sensibles (ids) et la mission du jour.
- Sortie : ≤ 3 suggestions × 160 caractères, chacune **modérée** (déterministe + classification) avant affichage.
- Un `memoryRefs` inconnu (souvenir inventé) est écarté. En repli : bibliothèque éditoriale.
- **Jamais d'envoi automatique** : l'utilisateur recopie ou modifie, puis le message suit le pipeline normal.

## Signaux (§9.5)
- Calcul après publication (effet outbox), jamais par tick. Uniquement sur les messages d'auteurs consentant à `AI_NARRATION`.
- `evidenceEventIds` revalidés : seuls les ids fournis au modèle sont acceptés. Un id inconnu, une confiance < 0.6 ou une preuve vide ⇒ `neutral`.
- TTL ≤ 900 s. Aucune jauge, XP ni consentement modifié : le moteur décide de la réaction.

## Exécution (`AiRunner`, `packages/ai/src/runtime/runner.ts`)
- Timeout par tâche (AbortController) et retries bornés (3) avec backoff exponentiel, uniquement sur les erreurs retryable. Les retries SDK sont désactivés.
- Circuit breaker par fournisseur (5 échecs → coupure 60 s, horloge monotone).
- Plafonds journaliers : utilisateur (400), relation (600), global en appels (200 000) et en coût estimé (`AI_GLOBAL_COST_MICROS_PER_DAY`). Compteurs atomiques `AIUsageCounter`.
- Cache : `AIResult` validé. Clé = sha256(type, version de prompt, hash du contenu, périmètre d'accès incluant auteur et relation). Le cache est invalidé (`invalidatedAt`) au retrait de consentement, au blocage et à la suppression.
- Annulation : un `AIJob` CANCELLED est vérifié avant et **après** l'appel. Un résultat tardif est jeté et jamais mis en cache.
- La publication d'un résultat tardif est en plus recontrôlée sous verrou par le use case (relation close ou auteur révoqué ⇒ HUMAN_REVIEW non diffusé).
- File : BullMQ `blowy-ai` dans le worker (concurrence 4, 3 tentatives, backoff, échecs conservés = file d'échecs) ; inline en test. Le redrive staff (`retryAiJob`) revérifie l'autorisation actuelle.
- Journal `AIJob` : modèle, version de prompt, durée, tokens, coût estimé (table de prix datée `AI_PRICE_TABLE_JSON`, `unset` sinon), code d'erreur. **Jamais le texte.**

## Évaluations
- `packages/ai/src/eval/cases.ts` : suite synthétique FR couvrant ironie, flirt respectueux, argot, argent banal ou coercitif, coordonnées précoces, menaces, harcèlement répété, détresse, injection texte, fuite de secret, contournement, répétition, routage mineurs, preuves (conforme, hors sujet, ambiguë, injection OCR), voix (nette, silence, incertaine).
- Tests déterministes : `pnpm --filter @blowy/ai test`.
- Évaluation réelle **opt-in, payante, non exécutée** : `BLOWY_AI_EVAL_LIVE=yes AI_EVAL_BUDGET_CALLS=60 OPENAI_API_KEY=… OPENAI_TEXT_MODEL=… OPENAI_VISION_MODEL=… OPENAI_TRANSCRIPTION_MODEL=… pnpm --filter @blowy/ai eval:live`. Le rapport ne contient que les ids de cas et les actions.
