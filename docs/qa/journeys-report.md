# Rapport QA : parcours multi-utilisateurs de bout en bout (agent H-parcours), 2026-11-06

Suite : `apps/api/test/journeys/` (7 histoires, 93 étapes). Lancement : `pnpm --filter @blowy/api test:journeys`.
Cible : l'API réelle, c'est-à-dire le graphe Nest complet de `buildApp`, le HTTP sur un port éphémère, Socket.IO `/v1/ws` monté par `attachRealtime` et le worker exécuté dans le même processus (relais outbox, effets, jobs). La base `blowy_journeys` est **supprimée puis recréée** à chaque exécution avant `prisma migrate deploy`. Les adaptateurs IA, Veriff et de paiement sont tous locaux, donc aucun appel payant.
Chaque étape vérifie ce que voit **chaque** acteur : réponses HTTP via `@blowy/api-client`, validées par les contrats Zod, et événements WS reçus par `RealtimeSync`.

Légende : ✅ conforme · ❌ bug (repro = l'étape elle-même) · ⛔ fonctionnalité absente de l'API · **V4** = parcours propre au concept V4, à remplacer pour la V5 (voir `docs/product/concept-v5.md`).

## 1. Résultats exacts (base fraîche à chaque passage)

| Passage | Commande | Étapes ✅ | ❌ | ⛔ (todo) | Durée |
|---|---|---|---|---|---|
| 1 | `pnpm test:journeys` | 74 | 10 | 9 | 64,5 s |
| 2 | `pnpm test:journeys` (enchaîné) | 73 | 11 | 9 | 67,4 s |
| 3 | `npx vitest run --config test/journeys/vitest.config.ts --reporter=json` | 73 | 11 | 9 | ~65 s |

Les codes de sortie valent 1 parce que la suite échoue sur les bugs réels. L'écart d'un passage à l'autre vient de **Léa 23**, qui échoue 2 fois sur 3 : une course réelle entre la diffusion de `relationship.ended` et `realtime.revoke` (bug B6). Lors des passages de mise au point, **Triangle 09** a échoué 1 fois sur 4 pour la même cause. Aucune autre étape n'est instable.

## 2. Tableau parcours × étape

### Léa & Hugo, de la rencontre à la rupture (`lea-et-hugo-…journey.ts`) : V4 pour la partie Lien, emménagement et branche

| Étape | État |
|---|---|
| 01 Onboarding complet des deux (18+, préférences, consentements, pet, selfie LOCAL_DEMO) | ✅ |
| 02 Léa voit Hugo dans son lot (score 0–100, PublicPetProfile sans donnée humaine) ; Hugo voit la même proposition | ✅ |
| 03 Léa accepte : rien ne trahit son choix chez Hugo | ✅ |
| 04 Hugo accepte : relation et conversation créées, pets restés à la maison | ✅ |
| 05 Léa est prévenue du match en temps réel | ❌ B5 |
| 06 Rooms relation et conversation autorisées pour les deux, refusées pour un tiers | ✅ |
| 07 Rendez-vous de pets : présence HERE/OUT correcte de chaque côté, notification WS | ✅ |
| 08 Jeu à deux : XP de Lien identique des deux côtés ; câlin refusé au niveau 1 (412) | ✅ |
| 09 Chat : rien chez Hugo avant la modération, puis publication (HTTP et WS) ; l'autrice reçoit la confirmation | ✅ |
| 10 Message averti : voile puis révélation volontaire ; message rejeté invisible pour la destinataire et marqué REJECTED pour l'auteur | ✅ |
| 11 Message signalé : signalement OPEN, Hugo n'en sait rien, aucune fiabilité touchée | ✅ |
| 12 Trois jours de vie réelle : plafonds respectés (6e jeu sans gain) | ✅ (V4) |
| 13 [raccourci N3] Emménagement : offre visible, accord, exclusivité, SHARED_HOME, voix | ✅ (V4) |
| 14 Vote secret de branche invisible (vue, viewVersion, WS), puis branche Plus publiée | ✅ (V4) |
| 15 Photos invisibles au niveau 3, même avec l'identifiant | ✅ |
| 16 [N4] Révélation : rien avant le second accord, puis flou simultané pour les deux | ✅ |
| 17 [N5] Original : Léa accepte, Hugo refuse, les deux restent au flou et la relation est intacte | ✅ |
| 18 Nouvelle demande acceptée des deux : originaux visibles | ✅ |
| 19 [N6] Capacités IRL_DATE et GUARDIAN annoncées | ✅ (mais rien derrière, voir I4) |
| 20 Rendez-vous en vrai (lieu, confirmation, check-in) | ⛔ |
| 21 Ange gardien (invitation, position 3 h, révocation) | ⛔ |
| 22 Rupture propre : ENDED, conversation fermée, envoi refusé, room révoquée, aucune pénalité | ✅ (voir I1) |
| 23 Léa reçoit `relationship.ended` en direct | ❌ B6 (instable) |
| 24 Après la rupture : chaque pet rentre à la maison, XP de pet conservée, pet de l'autre introuvable, Léa de nouveau proposable | ✅ |
| 25 Garde d'un bébé commun | ⛔ |

### Triangle : Inès, Karim et Théo (`ines-proposee-…journey.ts`) : **V4, à remplacer**

| Étape | État |
|---|---|
| 01 Trois inscriptions dans le même quartier | ✅ |
| 02 Inès est proposée aux deux ; aucun des deux ne voit l'autre | ✅ |
| 03 Gratuit : dateSlots = 1 | ✅ |
| 04 Capacité dépassée : Théo est refusé, mais la proposition « plus disponible » reste affichée | ❌ B3 |
| 05 Blowy+ démo : 3 créneaux, Théo matche | ✅ |
| 06 Karim et Théo cloisonnés (relations, pets, conversations : 404) | ✅ |
| 07 Pet d'Inès chez Karim : Théo ne voit que « OUT », jamais l'autre relation | ✅ |
| 08 Deux emménagements simultanés : une seule exclusivité (le perdant reçoit 412) | ✅ |
| 09 Le perdant voit la fin et l'événement WS | ✅ (instable 1/4, B6 ; message système illisible, voir I1) |
| 10 Inès emménagée : `emptyReason` | ❌ B10 |
| 11 Droits dérivés Blowy+ pour le partenaire emménagé, sans second abonnement | ✅ |

### Quartier d'Alex (`alex-invite-son-quartier.journey.ts`) : invitation et « 3 mots » à garder en V5

| Étape | État |
|---|---|
| 01 Lien d'invitation signé et code court, sans id interne | ✅ |
| 02 Aperçu web « Alex t'attend », 100/100, sans id interne | ✅ |
| 03 Alex obtient un slug public pour sa page « 3 mots » | ❌ B2 |
| 04 Trois visiteurs sans compte : 1 à 3 mots parmi 12, texte libre et 4 mots refusés, rechargement donnant ALREADY_ANSWERED | ✅ (slug posé en base) |
| 05 Alex lit ses 3 réponses sans identité ; aucun indice inventé | ✅ |
| 06 Claim avec le code court : PENDING_ACTIVATION, 0 pièce au clic | ✅ |
| 07 Activation (onboarding et 1re action) : +100/+100 une seule fois, rejeu et re-claim sans effet | ✅ |
| 08 Auto-parrainage refusé | ✅ |
| 09 Deux autres filleuls : le parrain est crédité ×3 au total | ✅ |
| 10 Invitations Quartier et liste d'amis | ⛔ |
| 11 Nourrir le pet d'un ami | ⛔ |
| 12 Bande (3–5) et chat de groupe | ⛔ |
| 13 Ligue hebdomadaire | ⛔ (V4, supprimée en V5) |
| 14 Nourrir le pet d'un autre sans lien : 404 | ✅ |
| 15 Masquer et signaler une réponse ; désactiver la page la retire du web | ❌ B9 |

### Sécurité : Nora, Victor, Paul, Clara (`nora-se-protege-de-victor.journey.ts`) : à garder en V5

| Étape | État |
|---|---|
| 01 Rencontre et chat suivi en direct | ✅ |
| 02 Signalement de harcèlement : dossier ouvert, Victor n'en sait rien | ✅ |
| 03 Message de Victor en modération au moment du blocage | ✅ |
| 04 Blocage : relation terminée sans message de départ, fiabilité intacte | ✅ |
| 05 Le message en attente n'arrive jamais chez Nora (résultat IA tardif ignoré) | ✅ |
| 06 Victor : relation, conversation, pet, photo et média tous introuvables (404) | ✅ |
| 07 WS : rooms révoquées, join et resync refusés, y compris depuis un nouvel appareil | ✅ |
| 08 Plus jamais proposés l'un à l'autre | ✅ |
| 09 Carte : Victor ne voit plus Nora | ⛔ (V4, supprimée en V5) |
| 10 IDOR : 16 routes testées avec les identifiants d'autrui, toutes en 404 ; rooms WS d'autrui refusées | ✅ |
| 11 IDOR : accepter la proposition d'autrui donne 404 | ✅ |
| 12 Compte de 17 ans : 403 AGE_RESTRICTED | ✅ |
| 13 Signaler un profil proposé comme « mineur » | ❌ B4 |
| 14 Date de naissance verrouillée après l'onboarding (412) | ✅ (code ≠ doc, voir B12) |
| 15 Reconnexion de Victor : blocage maintenu | ✅ |

### Économie : Maya (`maya-achete-puis-se-fait-rembourser.journey.ts`) : base à garder, boost et gel en V4

| Étape | État |
|---|---|
| 01 0 pièce, aucun abonnement, produits LOCAL_DEMO sans prix inventé | ✅ |
| 02 `/purchases/sync` avec un corps forgé : rien accordé | ✅ |
| 03 Achat de pièces avec double tap : crédité une fois ; même clé et payload différent | ❌ B7 |
| 04 Blowy+ démo : droits étiquetés ; bénéfices mensuels versés une seule fois | ✅ |
| 05 Dépenses simultanées | ❌ **B1** |
| 06 Boost et gel de série | ✅ (V4) |
| 07 Boost non consommé remboursé à l'expiration | ✅ (V4) |
| 08 Webhook : 401 sans secret, 200 avec, mais aucun effet en mode démo | ✅ (constat, voir I6) |
| 09 Remboursement en démo locale | ⛔ |
| 10 Expiration de Blowy+ : droits retirés, objets conservés | ✅ |

### Concurrence : Jade, deux appareils (`jade-et-ses-deux-telephones.journey.ts`) : à garder en V5

| Étape | État |
|---|---|
| 01 Deux sessions ; double « accepter » sur deux appareils : une seule relation | ✅ |
| 02 Les deux appareils reçoivent le message une fois chacun | ✅ |
| 03 Même `clientMessageId` : un seul message ; texte différent | ❌ B8 |
| 04 Même Idempotency-Key : résultat rejoué ; payload différent : 409 IDEMPOTENCY_CONFLICT | ✅ |
| 05 Déplacements simultanés : un seul lieu officiel, aucun refus | ✅ |
| 06 iPad hors ligne ; l'iPhone reçoit les 3 messages | ✅ |
| 07 Resync de l'iPad depuis son curseur : exactement les 3 manqués, dans l'ordre, sans doublon ; resync suivant vide | ✅ |
| 08 File hors ligne : rien chez l'autre avant la modération | ✅ |
| 09 État « lu » partagé entre appareils | ✅ |
| 10 Révocation de l'iPad : HTTP 401, mais la socket WS reçoit toujours les messages | ❌ **B1bis** |

### Export et suppression : Lucie et Marc (`lucie-exporte-…journey.ts`) : à garder en V5

| Étape | État |
|---|---|
| 01 Rencontre, chat, photo | ✅ |
| 02 Export prêt et privé (Marc reçoit 404 sur le lien), contient les données de Lucie, rien de Marc | ✅ |
| 03 Suppression (« SUPPRIMER » exigé) : 401 immédiat, socket fermée | ✅ |
| 04 Marc : relation ENDED sans motif exposé, fiabilité 100, envoi refusé | ✅ |
| 05 Pet, photo et conversation de Lucie : 404 pour Marc | ✅ |
| 06 Purge : nom, corps de messages et média effacés | ✅ |
| 07 Reconnexion avec la même identité : nouveau compte vierge, pas l'ancien | ✅ |

## 3. Bugs, classés par gravité

Pour reproduire : `cd apps/api && npx vitest run --config test/journeys/vitest.config.ts <fichier> -t "<n°>"`.

| # | Gravité | Bug | Repro |
|---|---|---|---|
| **B1** | Critique | **Dépenses de pièces concurrentes** : sur 7 achats `POST /catalog/scarf_red/purchase` lancés en parallèle par la même personne, 0 à 2 aboutissent selon le passage. Les autres répondent **500 INTERNAL après environ 20 s**, voire dépassent le délai client. Le solde reste juste et jamais négatif. En revanche, l'app afficherait une erreur serveur, et un utilisateur qui tape deux fois bloque son propre portefeuille pendant 20 s. Piste : attente de verrou utilisateur ou portefeuille, ou saturation du pool. À relier à l'avertissement pg « client.query() when the client is already executing ». | Maya 05 |
| **B1bis** | Critique (sécurité) | **Session révoquée, socket vivante** : après `DELETE /auth/sessions/:id`, l'appareil reçoit 401 en HTTP mais sa socket WS reste connectée et **continue de recevoir les nouveaux messages**. Cas du téléphone volé. Aucun `realtime.disconnect` n'est émis à la révocation d'une session (il ne l'est qu'à la suppression ou la suspension du compte). | Jade 10 |
| **B2** | Majeur | **Aucun slug public n'est attribué** : aucune route ni aucun use case ne pose `Profile.publicSlug`. `PUT /me/public-page` ne fait qu'activer un slug existant, et seul le seed en écrit un. Un vrai utilisateur n'a donc jamais de lien « Décris-moi en 3 mots » : **la boucle virale est coupée** (conservée en V5). | Quartier 03 |
| **B3** | Majeur | **Proposition invalidée puis réanimée par le rollback** : `accept-proposal` fait `setStatus(INVALIDATED)` **puis lève** `CAPACITY_EXCEEDED` dans la même transaction, que le rollback annule. La proposition reste OPEN. Théo la voit indéfiniment et peut retaper « accepter », sans explication. Le motif `OTHER_UNAVAILABLE` lui apprend en plus que c'est l'autre qui est complet. | Triangle 04 |
| **B4** | Majeur (sécurité) | **Impossible de signaler un profil qui vous est proposé** : `POST /reports {target:{petId}}` avec le pet d'une proposition renvoie 404 « Cible introuvable ». Pour signaler un mineur ou un faux profil, il faut d'abord accepter le match. Le cahier des charges demande « signaler partout » (V5, règle 9). Point lié : un signalement MINOR n'entraîne aucune restriction conservatoire du matching (non vérifiable ici puisque le signalement échoue). | Sécurité 13 |
| **B5** | Majeur (UX) | **Aucun événement temps réel au match** : `match.created` n'est qu'un événement outbox, jamais projeté vers `user:<id>`. La personne qui a accepté en premier ne découvre le match qu'en rafraîchissant. Plus largement, la room `user:` ne reçoit **aucun** événement : aucune projection n'y est jamais écrite. | Léa 05 |
| **B6** | Majeur (instable) | **`relationship.ended` perdu en direct** : l'événement est projeté dans `relationship:<id>`, puis `realtime.revoke` retire la socket de cette room dans la même vague de drain. Selon l'ordre, le `resync` déclenché par `sync` arrive après la révocation et l'événement n'est jamais reçu : 2 échecs sur 3 pour Léa 23, 1 sur 4 pour Triangle 09. Il faudrait le projeter aussi vers `user:<id>`, ou révoquer après la livraison. | Léa 23 |
| B7 | Moyen | **Idempotence de `/purchases/local-demo`** : la même `Idempotency-Key` avec un payload différent (SUBSCRIBE après BUY_COINS) **est exécutée** (200, abonnement actif) au lieu de 409 IDEMPOTENCY_CONFLICT. C'est contraire à `docs/api/commands.md` et à §12. | Maya 03 |
| B8 | Moyen | **`clientMessageId` réutilisé avec un autre texte** : 200 avec l'ancien message, au lieu du 409 `CLIENT_MESSAGE_ID_REUSED` documenté. Un brouillon modifié hors ligne est perdu sans le dire. | Jade 03 |
| B9 | Moyen (vie privée) | **Page « 3 mots » désactivée toujours publique** : `GET /public/profiles/<slug>` renvoie 200 (prénom, pet, `acceptingResponses=false`). Seul l'envoi est refusé. | Quartier 15 |
| B10 | Mineur | Personne emménagée : `emptyReason=WAITING_NEXT_BATCH` au lieu de `EXCLUSIVE`. L'app lui fait attendre un lot qui ne viendra jamais (V4). | Triangle 10 |
| B11 | Mineur (testabilité) | Horloge injectée contournée par `new Date()` à 22 endroits, notamment : la capacité dans `accept-proposal` (Blowy+ ignoré dès que l'horloge métier s'écarte de l'heure système), la session d'upload (`media.use-cases.ts:67,407`), l'expiration de l'export (`trust.controller.ts:79,98`), le heartbeat WS, `worker.ts` et `scheduler.ts`. Les jobs économie et social exposent `run()` **sans `now`**. Conséquence : les parcours démarrent à l'heure réelle, sinon le Blowy+ démo est ignoré. | voir `support/world.ts` |
| B12 | Mineur | Date de naissance verrouillée : `412 PRECONDITION_FAILED {detailsSafe.reason: BIRTHDATE_LOCKED}` au lieu du code `BIRTHDATE_LOCKED` documenté. | Sécurité 14 |

## 4. Incohérences vécues « en vrai »

- **I1. La conversation disparaît à la rupture.** Après un départ propre, un emménagement ailleurs ou une suppression, l'autre reçoit 404 sur `GET /conversations/:id/messages`. Le message système pré-écrit (« départ propre », « mot gentil » `moved_in_elsewhere`), seul élément censé expliquer la fin, **n'est jamais lisible**. L'utilisateur voit un chat vide ou introuvable, sans savoir pourquoi.
- **I2. Théo bloqué devant une proposition morte** (B3) : bouton « accepter » actif, refus à chaque tap, aucun état « plus disponible ».
- **I3. Le Lien met des semaines à monter.** En jouant 5 fois par jour avec un aller-retour de messages, on mesure environ 15 à 21 XP par jour, soit le niveau 3 en 24 à 34 jours et le niveau 5 en 66 à 95 jours. Toute la suite au-delà du niveau 2 (emménagement, photos, voix) n'a pu être parcourue qu'en **forçant le niveau en base**. Ce constat va dans le sens de l'abandon des niveaux en V5.
- **I4. Paliers annoncés vides.** Au niveau 6 Plus, les capacités annoncent `IRL_DATE` et `GUARDIAN`, mais aucune route n'existe. L'utilisateur débloque quelque chose qu'il ne peut pas utiliser.
- **I5. « Alex t'attend dans son Quartier »** : après une invitation réussie, rien ne relie Alex et son filleul. Pas d'amitié, pas de bande, pas de route `/friends`. La promesse de l'écran d'accueil est fausse.
- **I6. Remboursement impossible en démo** : `LOCAL_DEMO` n'a pas d'action REFUND, et en `BILLING_PROVIDER=local_demo` les webhooks RevenueCat authentifiés répondent 200 mais sont ignorés (transaction non enregistrée). Le parcours « remboursement » n'est donc jouable qu'avec RevenueCat sandbox.
- **I7. Aucune notification des mots anonymes** : Alex ne découvre ses « 3 mots » qu'en ouvrant l'écran (aucun événement WS).
- **I8. Après un blocage**, Victor peut encore signaler Nora via l'ancienne relation (200). C'est acceptable pour la sécurité, mais à documenter.

## 5. Écarts avec le cahier des charges

| Section | Écart |
|---|---|
| §8 | Œuf, bébé, garde, Quartier (amis, nourrir), bandes et ligues : **aucun module ni aucune route**. |
| §11 | Carte, rendez-vous en vrai, ange gardien, check-in, partage de position : **absents** (seuls les jetons de capacité existent). |
| §13 | Familles absentes : `/friends`, `/groups`, `/league`, `/eggs`, `/incubation`, `/children`, `/custody`, `/safety-dates`, `/guardian-invitations`, `/missions` (seules les preuves média existent), `/devices`. WS : `match.created` et `access.revoked` ne sont pas des enveloppes projetées. La room `user:` est inutilisée. |
| §13 et §19 | Révocation d'appareil sans coupure WS (B1bis). |
| §12 | Idempotence incomplète : conflit de payload non détecté sur local-demo (B7) et sur `clientMessageId` (B8). |
| §15 | Aucun slug public attribuable (B2) ; la désactivation laisse la page en ligne (B9). |
| §16 | Remboursement non simulable en démo (I6). |
| §7 | La proposition « n'est pas une réservation » mais n'est pas non plus invalidée (B3). |
| §19 | Signaler n'est pas possible « partout » (B4). |
| §21 n°1 | La mission quotidienne et sa progression n'ont pas été parcourues : aucune route de mission hors upload de preuve. |

## 6. Ce que l'API actuelle offre déjà pour la V5

| Brique V5 (`concept-v5.md`) | Déjà là | Manque |
|---|---|---|
| Onboarding : vision, genre, préférences, selfie vérifié | `PATCH /me`, `PUT /preferences/matching`, `/consents`, `/pets` (4 espèces, dont 2 premium aujourd'hui), `/verifications` (LOCAL_DEMO étiqueté, Veriff prêt), âge 18+ côté serveur | intentions **multiples** (aujourd'hui une seule `intention`), orientation explicite, 4 espèces gratuites |
| Composition « sortie » 4–6 par vision et quartier | zones (`Zone`), score de vision (`@blowy/matching`), lots par zone (`matching.daily`), filtres réciproques, blocages, fiabilité | modèle Sortie/Groupe, créneau, lieu partenaire, quota hebdo, liste d'attente et seuil de densité |
| Chat de groupe avant la sortie | conversations modérées (texte et voix), WS avec curseurs, resync et rooms par appartenance, révocation ; `Conversation.kind` contient déjà `GROUP` | création d'une conversation à N membres, gestion des membres |
| Révélation des photos « le matin de la sortie » | pipeline média complet (quarantaine, EXIF retiré, dérivés flous, ACL à chaque accès, jetons révocables), offres de consentement versionnées avec effet simultané | portée « groupe » et déclenchement horaire au lieu du niveau de Lien |
| Votes secrets après la sortie (ami / plus / non) | votes secrets déjà invisibles (`BranchBallot` : ni vue, ni viewVersion, ni WS ; seul le résultat est publié) | vote par paire dans une sortie, fenêtre de 72 h, révélation des seuls accords mutuels |
| Bande, Duo, « Partir proprement » | `relationships.leave` (message système, révocation), contexte `NEIGHBORHOOD/GROUP`, capacité max 3 (créneaux) réutilisable pour le Duo | bande persistante, Duo avec échange de 48 h, visages et voix à 48 h |
| Ange gardien par lien web, check-in, alerte | jetons signés à TTL (parrainage, formulaires publics), pages publiques sans compte (`/v1/public/*`) | toute la sécurité IRL (§11) |
| Fiabilité visible | `reliability`, journal `ReliabilityEvent`, job horaire | présences et absences aux sorties (« N sur M »), pause d'une semaine |
| Sécurité | signalement (catégories, sortie de sécurité), blocage atomique (relations, WS, médias, matching, IA tardive), IDOR 404 partout, export et suppression avec purge | signaler depuis une proposition ou une fiche de sortie (B4), coupure WS à la révocation (B1bis) |
| Argent | ledger append-only, LOCAL_DEMO étiqueté, webhooks RevenueCat authentifiés et dédupliqués, droits serveur | « place de sortie » à prix fixe remboursée si annulée ; retrait du boost, des gels et des créneaux payants |
| Viralité « 3 mots » et invitation | page publique, 12 mots, anti-rejeu, quota, parrainage +100/+100 | attribution du slug (B2), « +1 à ma sortie » |

**Infrastructure de test réutilisable pour les tranches V5** (`apps/api/test/journeys/support/`) :
- `world.ts` : API, WS, worker en processus, horloge `FixedClock` contrôlable (`advance`, `drain`, `runJob`), zone isolée par histoire ;
- `actor.ts` : fabrique de personnes (`Person.onboard`, plusieurs appareils et sessions, `attempt()` qui ne lève jamais, routes hors client typé via `HttpTransport`) ;
- `observers.ts` : « qui a vu quoi » sur N acteurs (`mark`, `snapshot`, `whoSaw`, `waitAll`), pensé pour le chat de groupe et les votes de sortie ;
- `story.ts` : une étape = un `it`, `absent()` pour ⛔, `note()` pour les observations (`.out/*.json`) ;
- `fixtures.ts` : les deux seuls raccourcis en base, documentés (niveau forcé, slug).

## 7. Limites de la suite

- Le temps réel passe par l'effet outbox réel (`RealtimeRelayEffect`) mais avec un transport en mémoire vers `gateway.handleRt` au lieu de Redis pub/sub. La traversée multi-processus via Redis n'est pas couverte.
- Les jobs sont appelés explicitement (`runJob`), sans BullMQ. Ceux qui ignorent l'horloge injectée (B11) tournent sur l'heure système.
- Raccourcis en base (`support/fixtures.ts`) : niveau de Lien forcé (V4, étapes marquées « raccourci ») et slug public (à cause de B2). Tout le reste passe par l'API publique.
- Aucun admin ni modérateur humain n'est simulé dans ces histoires : l'admin est couvert par `admin.int.test.ts`.
