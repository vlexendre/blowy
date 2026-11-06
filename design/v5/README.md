# Maquettes V5 — « Ton pet te trouve une bande »

Référence pixel-perfect pour le développement. Loi produit : `docs/product/concept-v5.md`.
Langage visuel repris tel quel de la V4 (`design/v4-reference/`) : fond `#FFF7EC`, encre `#16110D`, corail `#FF5A3C`, citron `#C8F542`, mangue `#FFB347`, rose `#FF3D7F`, violet `#7C3AED`, vert `#2EAD6A`, rouge `#D92D2D` ; Bricolage Grotesque 800 (`.d`) + Inter ; boutons `.btn .b1 .b2 .b3 .bl`, `.chip`, `.tag`, `.back`, `.card`, `.grp/.row`, `.them/.me`, barre `.gnav` en verre, blobs flous, animations `pop / sq / bounce`.

- 50 artboards 390 × 844 dans `project/` (48 écrans d'app + 2 pages web, états compris), tous `lang="fr"`, `is_interactive`.
- `project/canvas.json` : une page « v5 — Bande », 7 rangées (A à G) dans l'ordre du parcours, titres numérotés, 4 notes de synthèse à droite (casting, promesses, argent, boucles virales).
- Rendus : `renders/*.png` (@2x). Commande : `DESIGN_ROOT=design/v5 NODE_PATH=$(npm root -g) node tooling/design-render/render.mjs .local/dc-runtime.js design/v5/renders` → 50/50 en 390x844, aucune erreur JS.
- Assets : uniquement ceux de la V4 (`/_blob/<id>`), aucun nouveau dessin. Visages = placeholders (dégradé + initiale + pet en médaillon), à remplacer par les vraies photos.

## Conventions

**Casting (identique partout).** Toi = Alex, 28 ans, il, Paris 11e, pet Nino (raton). Groupe de la sortie du jeudi 13 nov. : L. = Léa (Suzie), M. = Malo (Gaston), S. = Sarah (Pia). Bande : Inès (Bibi), Tom (Miso), Maya (Pompon), puis Sarah après la sortie. Voie Duo : J. = Jade (Caramel), N. (Biscuit). Ange gardien : Sam (coloc, par SMS). Lieu : Café des Oiseaux, 12 rue Oberkampf.

**Navigation.** 4 onglets : Accueil · Chats · Bande · Profil (la Carte est coupée). Même barre en verre que la V4.

**États.** Deux méthodes, au choix selon l'écran :
- *Artboard par état* quand l'état change la structure ou est un moment-clé du parcours : `V5-Sortie` / `-inscrit` / `-complete` / `-annulee`, `V5-Lien` / `-debloque`, `V5-Checkin` / `-ok`, `V5-Apres` / `-resultats`, `W-Ange` / `-alerte`, `V5-RdvDuo` / `-lea`.
- *sc-if piloté par une data-prop enum* quand c'est le même écran à une variable près : `V5-Toi` (`etape` = genre / plus / quartier ; les trois valeurs ont aussi un artboard : `V5-Toi`, `-plus`, `-quartier`), `V5-Eclosion` (`phase` = anime / ne ; `V5-Eclosion-ne` = valeur figée), `W-Ange` (`etat` = arrive / alerte).
- *État interne (state)* jouable en Play sans data-prop : vote un par un dans `V5-Apres`, envoi dans `V5-Rupture`, `V5-Signaler`, `V5-Supprimer`, `V5-Abonnement`, `W-Repondre`, onglets de `V5-Story`.

**Prix.** Jamais en dur : data-props `prixPlace` (12 €), `premiere` (booléen « 1re sortie offerte ») sur `V5-Sortie*` ; `prixPlace`, `prixPlus` (19,99 €), `placesPlus` (2), `prixAccessoire` (2,99 €) sur `V5-Boutique` ; `prix`, `places` sur `V5-Abonnement`. Les valeurs sont des placeholders à fixer par test terrain.

**Typographie.** Espaces insécables ajoutées automatiquement avant `? ! : % €`, dans `« »` et dans « 19 h 30 ».

## Écrans, dans l'ordre du parcours

Légende des sources : *garder* = fichier V4 copié et ajusté ; *changer* = refait avec les composants V4 ; *nouveau*.

### A · Arrivée (2 min, aucun paywall)

| # | Fichier | Source V4 | Ce qui change | États | Liens |
|---|---|---|---|---|---|
| 01 | `V5-Welcome` | 01 Welcome (changer) | Promesse « Ton pet te trouve une bande. En vrai, cette semaine. » ; compteur « en ligne » remplacé par les quartiers ouverts ; orbite = jeudi 19 h 30 · un café du 11e · 5 personnes ; légende « Ami·e ou plus ? Tu le dis en secret, après. » | — | Craft, Accueil |
| 02 | `V5-Invite` | 02 Invite (garder) | « Alex t'emmène à sa sortie » : le café, Nino + Gaston, une place « + toi » ; « 1re sortie offerte, boisson comprise ». Plus de pièces. | — | Craft, Accueil |
| 03 | `V5-Craft` | 03 Craft (garder) | 4 espèces gratuites (badges PLUS retirés) ; « +20 XP » → « 2 min en tout ». | sliders | Vie |
| 04 | `V5-Vie` | 04 Vie (garder) | Texte d'aide des passions : « C'est ce qui compose ton groupe ». | 4 questions (state) | Intention |
| 05 | `V5-Intention` | 05 Intention (changer) | Cases à cocher multiples : DES AMI·ES et/ou PLUS, SI AFFINITÉS (au moins une). « Je laisse venir », XP, chips âge/km/« tous genres » retirés. Bloc « Secret » réécrit sur le vote après la sortie. | cases (state) | Toi |
| 06 | `V5-Toi` (+ `-plus`, `-quartier`) | nouveau | Une question par écran, 3 choix max : « Tu es… » (femme / homme / non-binaire + « autre mot ») ; « En « plus », tu veux rencontrer… » (femmes / hommes / tout le monde, secret) ; « Tu sors où ? » (Paris 11e / Lyon 4e / Ailleurs → liste d'attente). | data-prop `etape` | Éclosion |
| 07 | `V5-Eclosion` (+ `-ne`) | 06 Éclosion (garder) | Sous-titre « Il part te trouver une bande. » | data-prop `phase` | Compte |
| 08 | `V5-Compte` | 07 Compte (garder) | Étape 05 / 05, mène à la sortie trouvée. | Apple / feuille / date (state) | Trouvée |

### B · Ta sortie de la semaine

| # | Fichier | Source V4 | Ce qui change | États | Liens |
|---|---|---|---|---|---|
| 09 | `V5-Trouvee` | 10 Match (changer) | « Nino t'a trouvé une bande » : jeudi 13 nov. 19 h 30, un café du 11e, groupe de pets avec pronoms, case « +1 un·e ami·e », points communs, frise « Ta semaine » (chat → lieu → visages → sortie), promesse de confidentialité courte. | — | Sortie, Story |
| 10 | `V5-Sortie` | nouveau | Fiche de sortie : créneau, lieu (exact la veille), groupe, frise, inclus (1 boisson + quiz de Nino), ange gardien, prix ou « offerte », annulation sans frais jusqu'à mer. 18 h, remboursement. CTA « Je viens · offerte ». | proposée | Verif, Accueil (« Pas cette semaine »), Story (+1) |
| 10b | `V5-Sortie-inscrit` | nouveau | Pastille « Tu y vas » ; CTA chat du groupe ; lien ange gardien. | inscrit·e | Groupe, Ange, Story |
| 10c | `V5-Sortie-complete` | nouveau | « Les 6 places sont prises » → Nino garde jeudi 20 ; carte grisée ; inviter un·e ami·e pour jeudi 20. | complète | Sortie-inscrit, Story |
| 10d | `V5-Sortie-annulee` | nouveau | Lieu fermé : place remboursée, fiabilité intacte, priorité pour la suivante ; heure barrée. | annulée | Sortie, Groupe |
| 11 | `V5-Verif` | 08 Vérif (garder) | Placé après « Je viens » : « Avant ta 1re sortie · 30 s » ; « le selfie sert à vérifier, il n'est montré à personne » ; photos « cachées jusqu'au matin de la sortie ». | à faire / vérifié (state) | Notifs |
| 12 | `V5-Notifs` | 11 Notifs (garder) | « Ta place est réservée · Ton groupe va écrire. » Exemples : message du groupe, lieu exact, visages. Mode discret mentionné. Plus de série. | dialogue iOS (state) | Accueil |
| 13 | `V5-Accueil` | 12 Nid (changer) | Une carte principale (prochaine sortie : 3 messages, pets du groupe, quand arrivent le lieu et les visages), puis Ta bande / Tes duos, puis « Emmène un·e ami·e jeudi ». Aucun compteur, aucune jauge. | — | Sortie-inscrit, Bande, Duo, Story, Fiche, Notifs |
| 14 | `V5-Attente` | 27 Vide (changer) | « Pas de sortie cette semaine » : quartier pas encore ouvert, jauge d'ouverture (212 / 300), « Tu es dans la liste », CTA Inviter. Plus d'« Accélérer ». | état de l'Accueil (quartier fermé) | Story, Bande |
| 15 | `V5-Chats` | 18 Chats (changer) | Trois sections, une ligne chacune : Ta sortie, Ta bande, Tes duos. Plus d'activité de pet. « Rien n'est public ». | — | Groupe, Bande, Lien |
| 16 | `V5-Groupe` | nouveau (composants de 19 Chat) | Chat de groupe avant la sortie. Brise-glace : « Les pets demandent : ton dimanche idéal, en 3 mots » ; réponses de chacun en chips ; tes 3 mots à compléter. Bandeau « Photos cachées jusqu'à jeudi 9 h · lieu demain 18 h ». | — | Révélation, Sortie-inscrit |

### C · Le jour J

| # | Fichier | Source V4 | Ce qui change | États | Liens |
|---|---|---|---|---|---|
| 17 | `V5-Revelation` | 22 Révélation (changer) | Jeudi 9:00 : les 4 visages révélés à tout le groupe en même temps, prénom, âge, selfie vérifié ; adresse exacte. CTA « J'y vais ce soir » ; « Je ne peux plus venir · prévenir le groupe ». | — | Check-in |
| 18 | `V5-Ange` | 23 RdvIRL (garder, recentré) | Choisir n'importe quel contact (SMS, WhatsApp, ta bande). Liste de ce que l'ange gardien reçoit et ne reçoit jamais. | — | W-Ange |
| 19 | `W-Ange` | nouveau (web, modèle W-Repondre) | Page du proche, sans app : lieu et créneau, « 19:32 · Alex est arrivé·e », « tout va bien » attendu à 21:30, SMS à 22 h sans nouvelles, appeler Alex. Encart discret « blowy. : des sorties à 5 près de chez toi ». | data-prop `etat` = arrive | Welcome |
| 19b | `W-Ange-alerte` | nouveau | Alerte : dernier lieu connu, lieu partenaire et équipe prévenus, Appeler Alex / le 17. | `etat` = alerte | — |
| 20 | `V5-Checkin` | 13 Preuve (changer) | Gros bouton « Je suis là » ; « Ta position est vérifiée une seule fois, maintenant. Personne ne la voit. » ; rappel ange gardien ; alerte discrète. | avant | Checkin-ok |
| 20b | `V5-Checkin-ok` | nouveau | Qui est là (sans position), boisson au comptoir, Sam prévenu 19:32, « tout va bien ? » 21:30 ; faux appel / alerte. | après | Souvenir, W-Ange-alerte |

### D · Après la sortie

| # | Fichier | Source V4 | Ce qui change | États | Liens |
|---|---|---|---|---|---|
| 21 | `V5-Souvenir` | 14 Bravo (changer) | « +1 souvenir · Sortie vécue » ; Nino grandit, rien à entretenir ; fiabilité « venu à 1 sortie sur 1 ». | — | Après, Story |
| 22 | `V5-Apres` | nouveau | Vote secret, une personne à la fois (photo + pet), 3 boutons : Ami·e / Plus / Non. « Plus » n'apparaît que si les préférences sont compatibles (absent pour Malo). Échéance « jusqu'à dimanche 21 h 30 » (72 h, date fixe et non compte à rebours). | 3 votes puis « c'est envoyé » (state) | Après-résultats |
| 22b | `V5-Apres-resultats` | nouveau | « 2 accords » : Léa, plus réciproque → duo ouvert ; Sarah, ami·e réciproque → rejoint ta bande. Rien d'autre n'est montré. | après votes | Chat, Bande, Sortie |
| 23 | `V5-Bande` | 30 Quartier + 31 Ami (changer) | Rue des pets (gens rencontrés en sortie + ami·es invité·es), liste avec provenance, « nouvelle » pour Sarah ; CTA « Viens jeudi avec quelqu'un ». Plus de défi ni de ligue. | — | Chat, Story |
| 24 | `V5-Chat` | 19 Chat (garder) | Chat à deux avec Léa après l'accord « plus » : en-tête « Duo · vous vous êtes vus jeudi », raccourci « Proposer un rendez-vous · avant le 20 nov. », vocal actif, souffleur conservé, XP retirés. | menu (state) | RdvDuo-lea, Oeuf, Rupture, Signaler |

### E · Voie Duo

| # | Fichier | Source V4 | Ce qui change | États | Liens |
|---|---|---|---|---|---|
| 25 | `V5-Duo` | 10 Match (changer) | « Tête-à-tête, si tu préfères » : 3 places max (1 en cours, 1 proposée, 1 libre), % de vision, frise 48 h → visages et voix → rendez-vous avant J+7. Plus de cadenas payant. | — | Lien |
| 26 | `V5-Lien` | 20 Lien (changer) | 3 étapes au lieu de 7 niveaux : les pets se parlent (48 h) → visages et voix → rendez-vous à deux. « Rien ne se débloque si un seul des deux parle. » Aperçu de l'échange. | avant déblocage | Lien-débloqué, Rupture |
| 26b | `V5-Lien-debloque` | 22 Révélation (changer) | Visages de Jade et toi + message vocal 0:12, révélés en même temps. | après déblocage | RdvDuo |
| 27 | `V5-RdvDuo` | 23 RdvIRL (garder) | Lieu public partenaire proposé par les pets (modifiable), ange gardien = n'importe quel contact, check-in, alerte, faux appel. | Jade (voie Duo) | Accueil |
| 27b | `V5-RdvDuo-lea` | id. | Même écran pour un duo né d'une sortie (Léa). | Léa | Accueil, Chat |
| 28 | `V5-Oeuf` | 24 Œuf + 25 Bébé (changer) | Clin d'œil facultatif, seulement après 2 rencontres : pas d'exclusivité, de garde ni d'obligation ; « Pas pour nous » à égalité avec « Oui, pour rire ». | — | Chat |
| 29 | `V5-Rupture` | 26 Rupture (garder) | Partir proprement d'un duo ; la bande et la sortie continuent ; plus de pourcentage de fiabilité. | envoyé (state) | Accueil |

### F · Partage

| # | Fichier | Source V4 | Ce qui change | États | Liens |
|---|---|---|---|---|---|
| 30 | `V5-Story` | 28 Story (garder) | 3 modèles : Question (« Décris-moi en 3 mots »), Vision (« Viens à une sortie avec moi ? »), Sortie (« On était 5 au café », sans visages ni prénoms). Retirés : Naissance, Révélation (risque d'outing), indices payants « qui a écrit ? ». | onglets, partagé, réponses (state) | W-Repondre |
| 31 | `W-Repondre` | 29 W-Repondre (garder) | Fin : « Alex t'emmène à sa prochaine sortie · 1re sortie offerte » au lieu des 100 pièces. | choix / envoyé (state) | Invite |

### G · Compte et confiance

| # | Fichier | Source V4 | Ce qui change | États | Liens |
|---|---|---|---|---|---|
| 32 | `V5-Profil` | 34 Profil (changer) | 3 chiffres seulement : sorties où tu es venu, personnes dans ta bande, souvenirs. Pet, vision card à partager, Blowy+. | — | Fiche, Story, Abonnement, Réglages |
| 33 | `V5-Fiche` | 16 Fiche (changer) | Nino + souvenirs (ne s'achètent pas) + fiabilité « venu à N sorties sur M » et règle des 2 absences + accessoires. Plus de faim, santé, XP. | — | Boutique, Story |
| 34 | `V5-Boutique` | 17 Boutique (changer) | Blowy+ (prix/mois, places incluses, sans engagement), place de sortie à l'unité, accessoires. Encadré « Ne s'achète jamais : plus de sorties, plus de visibilité, aller plus vite, les souvenirs ». | prix en data-props | Abonnement |
| 35 | `V5-Reglages` | 35 Réglages (garder) | + « Genre et qui je rencontre » ; notifs : rappels de sortie, messages, mode discret ; ange gardien par défaut. | interrupteurs (state) | Toi, Abonnement, Confidentialité, Rupture, Supprimer |
| 36 | `V5-Abonnement` | 36 Abonnement (garder) | Blowy+ mensuel honnête : « ne donne ni plus de sorties, ni plus de visibilité » ; annulation en un tap, sans offre de rétention. | annulé (state) ; prix en data-props | Boutique |
| 37 | `V5-Confidentialite` | 37 Confidentialité (garder) | Révélation : en sortie, le matin à tout le groupe ; en duo, après 48 h si échange. Position : « jamais montrée · check-in seul ». Mode discret, voie Duo, genre. Plus de carte ni de quartier affiché. | interrupteurs (state) | Toi, Signaler |
| 38 | `V5-Signaler` | 38 Signaler (garder) | + motif « Propos haineux, LGBTphobie » ; bloquer = plus jamais dans la même sortie. | envoyé (state) | Accueil |
| 39 | `V5-Supprimer` | 39 Supprimer (garder) | Ce qui disparaît : souvenirs, bande, duos, messages ; place de jeudi remboursée. Pause de 2 semaines = aucune sortie proposée. | pause / supprimé (state) | Réglages, Welcome |

**Coupés** (pas de fichier V5) : 09 Paywall, 15 Série, 21 Emménager, 32 Carte, 33 Classement.

## Vérification contre le concept

- Aucune carte ni distance (seulement « Paris 11e »). La position n'est vérifiée qu'au check-in et n'est jamais montrée.
- Aucun compte à rebours ni urgence vendue. Les échéances sont des dates fixes (« jusqu'à dimanche 21 h 30 », « avant le 20 nov. »).
- Rien ne fait payer pour aller plus vite : ni XP, ni pièces, ni boost, ni « Accélérer », ni espèce premium. Le quota d'une sortie par semaine est le même pour tous.
- Genre, orientation et « qui je veux rencontrer » sont demandés dans `V5-Toi` et modifiables dans les Réglages et la Confidentialité. Les pronoms sont visibles dans le groupe.
- Les promesses de confidentialité suivent les mêmes règles et les mêmes formules sur Trouvée, Groupe, Verif, Confidentialité, Ange, Check-in et Après : photos « jusqu'au matin de la sortie », position « jamais montrée · check-in seul », votes « seuls les accords mutuels se révèlent ». Les textes de référence sont les clés `promesse.*` ci-dessous.
- L'œuf n'est jamais présenté comme un objectif. Il n'apparaît que dans le menu d'un chat duo, avec la mention « après 2 rencontres », et n'existe pas dans la story.
- Le contrôle automatique ne trouve aucun des mots XP, série, pièces, niveau, Carte, km, Accélérer, Paywall dans le texte affiché. Tous les liens `href` pointent vers un artboard existant.

## Boucles virales (sans dark pattern)

1. **+1 à chaque sortie** : la case pointillée « +1 un·e ami·e » apparaît dans la Trouvée et dans la Sortie. On la retrouve dans le bandeau de l'Accueil, dans la carte de la Bande et dans la Sortie complète (« inviter pour jeudi 20 »). L'invité·e arrive sur `V5-Invite` : « Alex t'emmène à sa sortie », 1re sortie offerte.
2. **Liste d'attente du quartier** : l'écran Attente montre une jauge d'ouverture et un seul CTA « Inviter des ami·es ».
3. **« Décris-moi en 3 mots »** : la story mène à `W-Repondre`, puis à Invite, puis à la sortie offerte.
4. **Story de sortie** « On était 5 au café » : à montrer sans visages ni prénoms. On y arrive depuis le Souvenir, moment où la fierté est la plus forte.
5. **Page web de l'ange gardien** : un proche découvre Blowy en veillant sur toi, avec un encart discret en bas de la page.
6. **Vision card** : partageable depuis le Profil et la Fiche.

## Écarts au concept (et décisions tranchées)

| Sujet | Décision | Pourquoi |
|---|---|---|
| Ordre de l'onboarding | Le selfie passe **après** « Je viens », et non avant le compte. | Montrer la valeur (la sortie trouvée) avant l'effort. Le concept exige seulement le selfie « avant la 1re sortie ». |
| Paywall / Blowy+ | Aucun point de paiement dans l'onboarding. La 1re sortie est offerte et son CTA dit « Je viens · offerte ». | Règle 10. |
| Vote « Plus » | Le bouton n'apparaît que si les deux préférences « plus » sont compatibles (genre × qui je rencontre). Sinon, seulement Ami·e / Non. | Évite un « plus » impossible et ne révèle rien, puisque le bouton manque sans explication pour tout le monde. |
| Visage dans le vote | Les visages sont visibles dans `V5-Apres`, déjà révélés le matin. | Cohérent avec la révélation du jour J. |
| Échéances | Une date fixe (« jusqu'à dimanche 21 h 30 ») plutôt que « 72 h » qui décompte. | Le concept interdit le compte à rebours. |
| Œuf | Réservé aux duos vus 2 fois, il se trouve dans le menu « … » du chat duo. Les deux réponses ont le même poids visuel. | Règle 8 : ni objectif ni récompense. |
| Story | Les modèles « Naissance » et « On s'est vus » sont retirés. Le modèle « Sortie » est ajouté, sans visages. | Risque d'outing relevé par le panel (Yanis). |
| Fiabilité | « Venu à N sorties sur M », sans pourcentage. Une seule formulation partout. | Règle 7 ; vocabulaire unique. |
| Nav | 4 onglets (Carte coupée). « Bande » remplace « Quartier ». | Un mot = un concept. |
| Attente | C'est un **état de l'Accueil** quand ton quartier n'est pas ouvert (Paris 20e dans la maquette). « Pas cette semaine » sur la fiche de sortie renvoie à l'Accueil. | Le concept lie « pas de sortie » à la liste d'attente ; ne pas mélanger « je saute une semaine » et « quartier fermé ». |
| Quartiers ouverts | Le Welcome affiche « Paris 11e · Lyon 4e » (Croix-Rousse). | Règle 11. |

## Vocabulaire (un mot = un concept)

sortie (jamais « événement », « rendez-vous de groupe ») · groupe (les 4 à 6 d'une sortie) · bande (contacts persistants) · duo (tête-à-tête, voie Duo ou accord « plus ») · rendez-vous à deux (la rencontre d'un duo) · souvenir · fiabilité · ange gardien · check-in · alerte · visages (révélation) · ami·e / plus / non (vote) · accord (vote réciproque) · Partir proprement · Blowy+ · place de sortie.

## Textes clés (i18n)

| Clé suggérée | Texte |
|---|---|
| welcome.title | Ton pet te trouve une bande. En vrai, cette semaine. |
| welcome.caption | Ami·e ou plus ? Tu le dis en secret, après. |
| welcome.cta | Commencer · J'ai déjà un compte · Apple |
| invite.title | Alex t'emmène à sa sortie. |
| invite.body | Jeudi 19 h 30, Paris 11e. Crée ton pet en 2 min : vous serez dans le même groupe. |
| invite.offer | Ta 1re sortie est offerte, boisson comprise. 3 autres personnes du quartier vous rejoignent. |
| intention.title / hint | Tu cherches… / Coche l'un, l'autre, ou les deux. |
| intention.ami / .plus | Des ami·es — Une bande dans ton quartier, qui grandit à chaque sortie. / Plus, si affinités — Seulement si c'est réciproque. Sinon, rien ne se voit. |
| intention.secret | Secret. Ton groupe ne voit jamais ce que tu cherches. Après la sortie, tu votes en secret : seuls les accords mutuels se révèlent. |
| toi.genre | Tu es… — Une femme / Un homme / Non-binaire / Autre mot ? Je l'écris — Pour équilibrer les groupes. Ton groupe voit seulement ton pronom. |
| toi.plus | En « plus », tu veux rencontrer… — Des femmes / Des hommes / Tout le monde — Secret. En amitié, c'est tout le monde. |
| toi.quartier | Tu sors où ? — Juste ton quartier. Jamais ta position. |
| eclosion.ne | C'est un Nino ! Il part te trouver une bande. |
| trouvee.title | Nino t'a trouvé une bande. |
| semaine | Maintenant : le chat · Mer. 18 h : le lieu · Jeu. 9 h : les visages · Jeu. 19 h 30 : la sortie |
| promesse.courte | Photos cachées jusqu'au matin de la sortie · aucune carte, aucune distance · votes secrets. |
| promesse.photos | Cachées jusqu'au matin de la sortie, puis révélées à tout le groupe en même temps. |
| promesse.duo | En duo : visages et voix après 48 h, seulement si vous avez échangé tous les deux. |
| promesse.lieu | Le lieu exact arrive la veille. Toujours un lieu public partenaire. |
| promesse.position | Jamais montrée. Aucune carte, aucune distance. Vérifiée une seule fois, au check-in. |
| promesse.votes | Secrets. Seuls les accords mutuels se révèlent. Personne n'apprend jamais un « non ». |
| sortie.annulation | Annulable sans frais jusqu'à mercredi 18 h. Remboursée si la sortie n'a pas lieu. |
| sortie.cta | Je viens · offerte / Je viens · {prix} · Pas cette semaine |
| sortie.complete | Les 6 places sont prises. Nino t'a gardé la sortie de jeudi 20, même café, même heure. |
| sortie.annulee | Le café a dû fermer jeudi. Ta place est remboursée, ta fiabilité ne bouge pas. Tu es prioritaire pour la prochaine. |
| verif.sub | Tout le monde le fait avant de sortir. Le selfie sert à vérifier, il n'est montré à personne. |
| attente.title | Pas de sortie cette semaine. |
| attente.body | {Quartier} n'est pas encore ouvert. Nino attend d'avoir assez de monde pour former de bons groupes. · Tu es dans la liste. On te prévient dès l'ouverture. |
| attente.cta | Inviter des ami·es — Chaque inscription rapproche l'ouverture. Tes ami·es viennent à ta 1re sortie, dans ton groupe. |
| groupe.icebreaker | Les pets demandent : Ton dimanche idéal, en 3 mots ? |
| revelation.title | Les visages sont là. — Révélés à tout le groupe en même temps. |
| ange.sub | N'importe qui, sans installer l'app : il ou elle reçoit un simple lien. |
| ange.recoit / .jamais | L'heure et le lieu exact de ta sortie · Ton arrivée, quand tu fais le check-in · Ton « tout va bien » à la fin, ou ton alerte / Jamais ton groupe, tes messages, ta position en continu |
| w-ange.title | Tu es l'ange gardien d'Alex. — Sans nouvelles à 22 h, on t'envoie un SMS. Si Alex déclenche l'alerte, tu reçois un appel. |
| w-ange.alerte | Alex a déclenché l'alerte. Appelle Alex tout de suite. Sans réponse, appelle le 17. |
| checkin.title / note | Tu es arrivé·e ? Je suis là — Ta position est vérifiée une seule fois, maintenant. Personne ne la voit. |
| souvenir | +1 souvenir · Sortie vécue. Nino grandit avec tes souvenirs. Rien à entretenir. |
| apres.title / rule | Alors, jeudi ? — Seuls les accords mutuels se révèlent. Personne n'apprend jamais un « non ». |
| apres.boutons | Ami·e · Plus · Non |
| apres.envoye | Nino te dit tout dès que les autres ont voté, ou dimanche 21 h 30 au plus tard. |
| resultats.plus / .ami | Vous avez dit « plus » tous les deux. Votre duo est ouvert : chat à deux, et un rendez-vous si vous voulez. / {Prénom} rejoint ta bande. Vous pourrez revenir ensemble à une sortie. |
| duo.title | Tête-à-tête, si tu préfères. — Les pets parlent 48 h · Visages et voix · Rendez-vous avant J+7 |
| lien.rule | Trois étapes, pas une de plus. Rien ne se débloque si un seul des deux parle. |
| oeuf | Un œuf, pour rire ? Un clin d'œil pour les duos qui se sont vus au moins 2 fois. Ça ne change rien à votre duo. — Pas pour nous / Oui, pour rire |
| fiabilite | Venu à {n} sortie(s) sur {m}. Un empêchement ? Préviens avant mercredi 18 h, rien ne bouge. 2 absences sans prévenir : une semaine de pause. |
| boutique.jamais | Ne s'achète jamais : plus de sorties, plus de visibilité, aller plus vite, les souvenirs. Une sortie par semaine, pour tout le monde. |
| blowyplus | Blowy+ · {prix} par mois · sans engagement. Ne donne ni plus de sorties, ni plus de visibilité. Juste des places payées d'avance et des accessoires. |
| story.sortie | On était 5 au café. Jeudi soir, Paris 11e. 5 inconnu·es présenté·es par nos pets. Prochaine sortie jeudi : viens avec moi. |

## Générateur

Les fichiers sont générés par des scripts Python, hors dépôt, conservés dans le scratchpad de la session : composants communs, écrans copiés et ajustés depuis la V4, nouveaux écrans, `canvas.json`. Les `.dc.html` livrés sont autonomes et éditables à la main.
