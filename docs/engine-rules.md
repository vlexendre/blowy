# Règles moteur Blowy (`@blowy/pet-engine`, `@blowy/matching`, `@blowy/tuning`)

Version moteur `engine-2026.11.0` · tuning `tuning-2026.11.0` · matrices `matrices-2026.11.0` · contenus `content-2026.11.0`.
Toute valeur chiffrée vit dans `packages/tuning/src/defaults.ts` ; les valeurs absentes du brief y sont marquées `HYPOTHÈSE`. Le moteur ne contient aucun nombre de règle.

## 1. Principes d'exécution
- `reduce(world, event, {now, seed, engineVersion, tuning}) → {state, effects}` : pur, déterministe. `reduceMut` est la variante en place (copie de travail sous verrou).
- Ordre : (1) idempotence locale (`recentEventIds`, la contrainte unique DB reste l'autorité) → (2) avance du temps jusqu'à `now` → (3) handler enregistré pour `event.type` (registre Command/Strategy, `actions/registry.ts`).
- Unités entières : jauges en « unités » = points × 12 h en ms (un taux r/h ÷ d, avec d | 12, donne r·12/d unités/ms, valeur entière) ; XP en milli-points ; k et m en permille.
- Aléa : PRNG `sfc32` initialisé par `cyrb128(seed serveur ␟ sels)`. Le tirage d'un appel utilise (seed, petId, rang d'appel), jamais l'identifiant d'idempotence client.

## 2. Temps
- Heure locale IANA via `Intl.DateTimeFormat` (cache par quart d'heure ; hypothèse : transitions sur des quarts d'heure). `wallToUtc` : heure inexistante (mars) → décalée vers l'avant ; heure ambiguë (octobre) → première occurrence.
- Nuit personnelle 23 h–8 h : à Paris, la nuit de mars dure 8 h réelles et celle d'octobre 10 h (testé).
- Intégration exacte des jauges : découpage jour/nuit, puis aux points de rupture internes (satiété passant sous 15, fin des 12 h de grâce). Les pauses sont la réunion d'intervalles (les chevauchements sont acceptés) et en sont soustraites.
- Accumulateurs relationnels en ms admissibles (hors pauses relation ∪ pauses globales des deux côtés) : inactivité/absence, silence 14 j, attente par côté, dette de réponse par côté. Le monde avance de franchissement en franchissement, d'où **ticks de 15 min == rattrapage d'un coup** (testé en propriété, et autour de mars et octobre).
- Idempotence : `advancedToMs` par entité. Deux ticks identiques ne produisent aucun effet.
- Rattrapage : notifications dédupliquées par clé ; seules celles des 60 dernières minutes (`catchUpCoalesceAfterMinutes`) sont conservées.

## 3. Jauges et poses
| Règle | Valeur |
|---|---|
| Initial | satiété 100, énergie 100, humeur 80, santé 100, stade bébé |
| Jour | faim −4/h (Gaston −5), énergie −3/h, humeur −2/h |
| Nuit | baisses ÷4 ; énergie **+6/h net** (remplace la baisse) |
| Santé | −2/h (÷4 la nuit) seulement si satiété < 15 depuis > 12 h ; borne 1 ; nourrir au-dessus de 15 remet le minuteur à 0 |
| Soin gratuit | santé +40 (1 → 41 > 30 : sort de maladie) — HYPOTHÈSE ; 0 XP |
| Nourrir | satiété +30, XP pet +5 (3 fois/jour) — HYPOTHÈSE |

Pose (chaîne de responsabilité) : malade (santé < 30) > endormi (nuit ou énergie < 15) > affamé (< 25) > réaction TTL 4 s (HYPOTHÈSE) > triste (< 30) > joyeux (> 75) > présentation.

## 4. Appel et refus
`E=(kindMischief+1)/2`, `A=clamp(attente h,0,100)`, `p=clamp(0.10+0.15E+0.35V/100−0.25A/100+B,0,0.60)` ; B : Nino +0.10, Suzie +0.05, Pia 0, Gaston −0.05.
V = envie pour le pet présent au lieu actuel (0 si seul) ; A = attente de l'autre au lieu de destination.
Jamais deux refus consécutifs (le 2ᵉ appel cède, `forcedAccept`). Jamais de refus si le pet est malade ou affamé, ou si l'objectif est `CARE`. Un refus ajoute tension +2 (HYPOTHÈSE). Pet emménagé : seuls la maison commune et le Quartier sont autorisés (le soin reste toujours possible).

## 5. Actions (plafond de gain / plafond d'action)
| Action | Conditions | Effets | Gains/j | Actions/j |
|---|---|---|---|---|
| Câlin | N≥2, même lieu, complicité≥20 | +4 XP Lien, complicité +6, tension −10, humeur +10 ×2 | 3 | 10 (HYP.) |
| Jouer | même lieu | +2 XP, humeur +8, énergie −5 ×2 | 5 | 15 (HYP.) |
| Aller-retour messages | réponse humaine publiée de l'autre < 24 h | +2 XP, +10 au 1ᵉʳ AR du jour, plafond 20 XP bonus inclus | — | — |
| Mission | validée (backend) | +6 XP Lien, faim ou humeur +20, XP pet +20 (HYP.), 20 pièces | 1/personne | — |
| Cadeau | N≥2, objet débité | complicité +10, tension −5 (HYP.), souvenir ; **0 XP** | 2 | 2 |
| Visite | nouvelle attente admissible > 6 h de l'autre, présent | +3 XP, attentes remises à 0 | — | — |
| Nourrir ami Quartier | paire Quartier | amitié +5, +10 pièces chacun | 3/donneur, 1/paire | — |
| Absence | 24 h sans interaction | complicité −5/j, tension +5/j ; XP jamais baissée | — | — |
| Inactivité 48 h | — | **un** franchissement par épisode : humeur −10, plafond global 20/j/pet (HYP.) | — | — |

Au-delà du plafond de gain, l'animation se joue et l'effet `NO_GAIN_CAP_REACHED` est émis (UI honnête). Au-delà du plafond d'action : `ACTION_REJECTED/ACTION_CAP_REACHED`. Les plafonds de base s'appliquent **avant** k·m.
Messages : une suite de messages du même auteur ne crée qu'un seul tour ; A,B,A,B = 2 allers-retours. `human:false` (système, suggestion non envoyée, spam, refus) : aucun gain ni contribution.

## 6. Gain du Lien
- `k = 1 − 0.5·|a−b|/(a+b)`, `k=1` si `a+b=0` ; contributions pondérées message 1 / jeu 1 / mission 3, plafonnées par jour (20/8/3, HYP.), sur 7 jours locaux de relation. **Snapshot pris avant l'enregistrement de la contribution courante.**
- `m = 0.8 + 0.4·affinité/100` (affinité figée au match).
- `gain_milli = floor(base·1000 · k‰ · m‰ / 10⁶)`.
- Gel : XP Lien gelée si l'un des deux pets principaux est malade, ou si la relation est en pause (`XP_FROZEN`) ; XP pet gelée si ce pet est malade.
- Mission commune : `MissionRewardContext(relation, mission, jour)` créé à la 1ʳᵉ validation, il fige k, m et les versions. Le 1ᵉʳ reçoit base·k·m ; le 2ᵉ reçoit 2·base·k·m et le 1ᵉʳ son complément. Le total vaut 4·base·k·m dans les deux ordres (testé). Un côté gelé ne reçoit pas de complément ultérieur.

## 7. Progression et capacités (P-5.3)
Seuils 0/150/500/900/1400/2000/3000. `eligibleLevel` (XP seule) ≠ `reachedLevel` (monotone, franchi seulement si la porte d'entrée est ouverte) ≠ capacités actuelles (révocables).

| Entrée au niveau | Porte |
|---|---|
| 3 | `moveInAccepted` (deux oui) |
| 4 | branche effective publiée (FRIEND/PLUS) |
| 5 | FRIEND, ou PLUS + `plusRevealAccepted` |
| 6 | FRIEND, ou PLUS + `irlDateConfirmed` |
| 7 | PLUS + RDV confirmé + `eggAccepted` (Ami plafonne à 6) |

Matrice `capabilitiesFor(rel, {paused, tuning})` (`progression/capabilities.ts`, une règle par capacité) :
| Capacité | Règle |
|---|---|
| CHAT_TEXT | relation non terminée (conservée en pause et après transfert) |
| VOICE | N≥3 (conservée en pause et après transfert) |
| SHARED_NEST | non transférée |
| PLAY / HUG(N≥2) / GIFT(N≥2) | hors pause |
| MOVE_IN_PROPOSAL | ACTIVE, hors pause, non emménagée, non transférée |
| BRANCH_VOTE | N≥3, hors pause, non transférée |
| PHOTO_CLEAR | Ami, N≥4, préférences des deux ≠ « jamais », consentement des deux |
| PHOTO_BLURRED | Plus, N≥4, mêmes conditions |
| PHOTO_ORIGINAL | Plus, N≥5, révélation acceptée, + double accord original |
| IRL_QUEST | Ami N≥5 · IRL_DATE/GUARDIAN : Plus N≥6 (+ révélation) |
| EGG | Plus N≥7, RDV confirmé, accord œuf |
| XP_GAIN, NUDGES | hors pause |

Transitions : **pause** = texte et voix conservés, XP et relances suspendues. **Transfert Ami N6 → Quartier** (`canTransferToNeighborhood`, accord mutuel côté backend) = communication conservée, sans nid ni exclusivité. **Entrée en Plus** = chaque capacité Plus exige ses propres portes, même avec un niveau historique élevé atteint en Ami. « Jamais » l'emporte sur tout. Aucun paiement n'intervient.

XP pet : stades jeune 300, adulte 1500 (HYP.) ; bonus Blowy+ ×2 le week-end local, **XP pet uniquement** (`petXpWeekendMultiplier`).

## 8. Fiabilité et fin de relation
Dette de réponse armée par un message humain publié de l'autre ; −8 **une seule fois** à 72 h admissibles (`RELIABILITY_PENALTY`), aucune pénalité si personne n'attend. Réponse < 24 h : `RELIABILITY_RECOVERY_ELIGIBLE` (+1/j, plafond 100, appliqué par le backend). Silence 14 j admissibles : `RELATIONSHIP_SILENCE_CLOSE` une seule fois. Une fin de relation annule la dette ; le pet rentre chez lui sans perte. Pause ≤ 14 j (`PAUSE_TOO_LONG` sinon), sans rattrapage punitif.

## 9. Œuf, bande, notifications
- Œuf : séance logique par journée de relation (bascule à 21 h, timezone stable de la relation), au plus 1 courante + 1 rattrapage ouvertes, au plus 2 validations par journée de relation. Une seule chaleur par question pour la paire : +15 si les réponses sont identiques, +8 sinon, révélée quand les deux ont répondu, plafond 180 (96 à 180 sur 12 questions). Naissance après 3 nuits complètes et deux tapotements dans une fenêtre de 60 s. Naissance unique (moteur et contrainte DB).
- Hérédité : moyenne des axes parentaux + deltas bornés ±0.3 (HYP.), bornés [−1,1] ; passion majoritaire, égalité départagée par PRNG seedé ; seed persistée. Nom : identique → ce nom ; sinon composé en ordre lexicographique fr (« Biscotte-Pépite »), 24 caractères max, repli sur le premier.
- Bande : cohésion = moyenne des complicités des arêtes entre membres actifs ; gains collectifs seulement de 3 à 5 membres ; mission de groupe ≥ 3 participants distincts.
- Notifications (`planNotifications`) : 3/jour, rien entre 23 h et 8 h locales, regroupement par (relation, catégorie), priorité message humain > attente réelle > série > Quartier > mission. « X attend Y » n'est émis que si X est présent et Y absent au lieu partagé, et jamais en pause.

## 10. Matching (`@blowy/matching`)
Filtres réciproques (liste `FILTERS` de `CandidateFilter`) : majorité, vérification, compte actif, activité < 7 j, exclusivité, place libre, âge, genre déclaré (UNDISCLOSED ne satisfait pas une préférence restrictive), distance, intentions (matrice §5.7), limite ghoster (fiabilité ≥ 70), blocage ou signalement, déjà croisés, quota de propositions entrantes + sortantes (6, HYP.). Mentir, juger et retard : aucun filtre (pas de critère mesurable).
Score = `100·(0.30C+0.25P+0.10D+0.05E+0.10R+0.10G+0.05S+0.05M)`. C = moyenne de (1−|x−y|/2) sur sportif/casanier et de (1−|x+y|/2) sur gentil/scientifique. P = Jaccard. D, E, S = matrices versionnées. R = recouvrement des histogrammes horaires (0.5 si < 20 événements). G = 1 jusqu'à 1 km, puis linéaire jusqu'au min des distances max (sans division si ≤ 1 km). M = 0.5 si < 3 mots, saturation à 30.
Lot : 2 meilleures priorités + 1 découverte (score ≥ 40, HYP.), départage FNV seedé. La priorité = score + équité d'exposition (±10) + boost (+8), mais le **% affiché reste le score**. Zone vide : `EMPTY_ZONE`, aucun candidat inventé.

## 11. Simulateur (`pnpm simulate:balance`)
2000 relations × 60 j, seed `blowy-balance-2026`, 4 profils d'engagement (HYPOTHÈSES : assidu 20 %, régulier 35 %, occasionnel 30 %, fantôme 15 % ; le profil d'une relation est le moins engagé des deux), affinités centrées sur 62, pauses, absences et churn. Durée mesurée ≈ 12 s sur 2 vCPU.

| Indicateur | Résultat |
|---|---|
| Médiane (relations ayant atteint) | N2 9 j · N3 23 j · N5 46 j · N7 57 j |
| Part atteinte à J60 | N2 42 % · N3 19,3 % · N5 6,5 % · N7 0,3 % |
| **N3 à J14** | **2,2 %** (hypothèse produit 20 %) — assidu×assidu 64 %, régulier 0,4 % |
| Pièces | 8,4 créées/pers./j ; 55 % dépensées (gel/boost) |
| Maladie | 15 % du temps-pet actif malade ; 88 % des relations touchées au moins une fois |
| Sorties silencieuses (14 j) | 32,7 % |

Lecture : avec le seuil 500 **inchangé**, l'objectif « 20 % au N3 en 14 jours » n'est atteint que par les paires très engagées. Deux points ralentissent la progression : la porte d'emménagement (deux oui) et les plafonds journaliers de messages (20 XP), qui bornent le gain quotidien d'une paire non assidue. Leviers à arbitrer par le produit (sans toucher au seuil) : plafond de messages, bonus du premier AR, XP de mission, ou cible révisée. Le taux de maladie élevé chez les occasionnels vient de la faim −4/h. Pistes possibles : un decay plus doux pour les nouveaux comptes ou des notifications de soin, à arbitrer.
