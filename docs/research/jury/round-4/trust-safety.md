# Jury V5.3 · tour 4 · Responsable Trust & Safety

**Verdict.** Mon bloquant du tour 3 est levé (garantie jamais affichée, check-facts la bannit) et presque toutes mes demandes sont faites (page d'aide sans position, N. à l'initiale, captures « détectées », invitation sans Story, accord avant duo, spec à J −3 h), mais la carte de proposition de duo montre encore tranche, pronom, activités et intention avant le oui, la Fiche annonce une règle d'absence fausse, Confidentialité oublie le lieu, et l'absence du bandeau « entre amis » reste un signal.

**Note globale : 8/10** (tour 1 : 4/10 · tour 2 : 6/10 · tour 3 : 7/10)

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 9 | Promesses dites au bon moment ; Confidentialité presque complète. |
| Charge cognitive | 9 | Sécurité en 4 gestes, « je pars » sans pénalité. |
| Envie (J+1/J+7/J+30) | 8 | La couche confiance reste l'argument. |
| Vraie rencontre (2 semaines) | 9 | Lieu public, prénoms la veille, visages à J −3 h, code : le meilleur format que j'aie audité. |
| Sécurité et confiance | 8 | Bloquant levé ; restent la carte duo avant oui, le bit « entre amis », le lieu absent de Confidentialité, la Fiche, les slugs courts. |
| Viralité / distribution | 9 | Cartes sans tiers ni lieu ni heure ; invitation par message seulement. |
| Argent | 9 | Aucun dark pattern ; résiliation renvoyée vers les réglages Apple. |
| Finition visuelle | 9 | Écrans d'urgence lisibles. |

## Outils de cohérence

Exécutés le 6 nov. 2026 : `node design/v5/check-facts.mjs` → « 86 fichiers, 3549 vérifications, 0 contradiction(s) » ; `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js` → « 86 écrans, 1207 textes, 469 cibles, 1255 blocs de texte mesurés, 0 problème(s), contraste minimum 4.53:1 ». Les 86 rendus ont été ouverts un par un. Les deux outils passent ; voici ce qu'ils ne voient pas, trouvé à la main (écrans, spec-v5 rév. 4, business-model) :

1. **Règle d'absence fausse sur V5-Fiche** : « Une absence prévenue avant les visages, ou un retrait pour ta sécurité, ne compte jamais. » C'est la règle V5.2. V5.3 B.6 et spec §1/§5 (D-043) : annuler après la confirmation (mer. 18 h), donc avant les visages (jeu. 16 h 30), **est** une absence. check-facts contrôle « annulation gratuite jusqu'à… » mais pas « absence prévenue avant les visages ».
2. **Trois horaires de composition** : V5-Sortie-complete « composition des groupes du jeu. 12 nov. (lundi 9 novembre, 21 h) » et V5-Notifs « lun. 21:00 » ; V5-Chargement « Nino compose ton groupe… quelques secondes » (composition instantanée à l'inscription) ; spec-v5 §1 « Mardi 12 h : composition de la semaine » et §9 job `outings.compose (mardi 12 h)`.
3. **Spec et écrans encore en désaccord** : « rentable dès la 2ᵉ sortie du mois » (spec §6.2) contre « Rentable à partir de 3 sorties par mois » (V5-Abonnement ; 2 × 4,99 = 9,98 € < 9,99 €, l'écran a raison) ; proposition duo « 48 h » (spec §5) contre « La proposition reste 7 jours » (V5-Duo-choix) ; `ShareLink` « slug aléatoire base36 ≥ 8 » contre `s/Hq3vT8` (6 car., casse mixte), `i/r8Tz4w` (6), `m/k7f2q` (5) ; en-tête de spec « révision 3 » alors que l'historique dit « 4 — cette révision ».
4. **Proposition de duo au-delà de « pet + initiale »** (V5-Duo, carte N.) : « 30–34 ans · il · musique live, volley · en amitié ». V5.3 A.3 et spec §5 : avant le double oui, « on ne voit que le pet et l'initiale ». check-facts ne vérifie que le prénom.
5. **Le lieu reçoit ton prénom, Confidentialité ne le dit pas** : L-Effectif liste « Alex, Tom, Léa, Malo, Sarah » (+ pets) ; V5-Confidentialite « Qui voit quoi » n'a que Ton groupe / Ta bande / Personne, et L-Effectif dit « prénoms seulement… aucune autre donnée » en affichant aussi les pets.
6. **Canal auxiliaire de la garantie** : V5-Trouvee-amis affiche « Cette semaine, sortie entre amis pour toi » quand la garantie n'est pas tenue (spec §3 : « moi seul·e, si la garantie n'a pas pu être tenue »). Son **absence** sur V5-Trouvee dit donc à Alex que des personnes compatibles « histoire » sont là. Avec « 2 femmes », c'est « au moins l'une des deux » (k = 2) au lieu de « exactement les deux » ; avec une seule personne du genre recherché (1 femme, 3 hommes, 1 non-binaire, permis par « jamais plus de 3 du même genre »), c'est exact.
7. **Activités jamais demandées** : l'onboarding ne demande plus d'activité (Pet = 1 question, Affiner « Activités · à choisir »), mais V5-Trouvee propose « Jeux de société » et V5-Amorcage-solo dit « une activité que tu as cochée ».
8. **Contrat lieu incomplet ou contradictoire** : L-Contrat « 3 € (1re sortie offerte) » ne dit rien des places Blowy+ (spec §6.5 : 3 € aussi pour `PLUS_INCLUDED`) ; « Préavis : 72 h… pour que Blowy en annule un. Dans les deux sens » (L-Creneaux) contre V5-Sortie-annulee « Pas assez de confirmations » (connu au plus tard à la veille 18 h, donc < 72 h) sans compensation lieu ; L-Effectif « Virement le lundi » contre spec §6.5/§10.2 « relevé mensuel » (`period 'YYYY-MM'`), relevé absent de l'écran ; « Signaler un participant » sans bouton ni numéro.
9. **P&L** : business-model compte une absence payée comme « revenu déjà perdu ≈ 3,84 € ». Or Blowy reverse **4,99 €** au lieu et a déjà payé ≈ 0,32 € de frais et doit ≈ 0,83 € de TVA : la place coûte ≈ −1,15 € de plus (≈ −0,28 € par sortie à 8 % d'absence, 60 % payées). Les tables à deux (« même règle de compensation », L-Creneaux) et l'astreinte 18 h–2 h « par soir » restent comptées à 0 ou par participant.
10. **Défauts de pixel restants** : césures « toi / compris » (Trouvée, Trouvée-amis), « 2 femmes, 3 / hommes » (Trouvée-lyon, Amorçage), « check- / in. » et « 4 / chiffres » (Sortie), « mer. / 21 h 30 » (Accueil, carte Ton duo), « à / décider » (Affiner) ; « 1 sur 1 / sortie où tu / es venu » sur 3 lignes (Profil, T3) ; deux interrupteurs indépendants (Oeuf, T2-T3) ; sélecteur « Autres cartes › » jamais dessiné (Story, T2-T3) ; même illustration de café pour Café des Oiseaux et Le Comptoir Gabriel (Confirmation, Checkin, RdvDuo) ; vignette du café posée comme un timbre sur le trottoir de Ta rue ; « Tom, ton pote, est prévenu » (Sortie-annulee) contre « proches » partout ; « Tu viens seul » sur Lille en solo (persona Sarah).

## Mes exigences du tour 3 : vérification point par point

- **k-anonymat garantie × composition** : réglé par suppression (garantie jamais affichée, D-038, bannie par check-facts). Résidu : le bandeau « entre amis » est un bit sur la garantie (voir Trouvée).
- **Position** : réglé (W-Ange-aide « Lieu de la sortie · pas de position », Confidentialité « seul le lieu de la sortie est envoyé », spec : position jamais collectée).
- **Prénom avant le oui** : réglé pour le prénom (« N. » partout) ; **non réglé** pour le reste de la carte (tranche, pronom, activités, intention).
- **Lien « usage unique » et Story** : réglé (invitation message seulement, slugs distincts).
- **Captures « bloquées »** : réglé (« détectées et signalées »).
- **Accord art. 9 avant tout duo** : réglé (accord lun. 20 h 50, duo 21 h 30 ; check-facts le vérifie).
- **Spec `photoRevealAt = startsAt − 3 h`** : réglé (§1).
- **18+ déclaratif sur W-Repondre** : non réglé.
- **Composition de l'amorçage** : réglé (« Les 2 autres savent que 3 personnes viennent ensemble »).
- **Ma condition du 10 au tour 3** : audit croisé sans donnée déductible : presque (carte duo, bit « entre amis ») ; spec J −3 h : oui ; aucun lien à la fois unique et en Story : oui ; aucune donnée art. 9 avant l'accord : oui.

## Lecture d'ensemble

Les deux fuites restantes sont de la même famille que celle du tour 3, en plus petit. (1) La carte de proposition de duo montre l'intention de l'autre avant son oui ; pour une proposition « pour une histoire », c'est l'orientation d'un tiers qui n'a rien accepté, et la règle écrite juste en dessous dit le contraire. (2) Le bandeau « entre amis » n'apparaît que si la garantie échoue : son absence est une information sur le groupe. Je ne le classe pas bloquant parce que, dans la démo (2 femmes), il ne désigne personne ; il le devient dans le cas « une seule personne du genre recherché », que la règle « jamais plus de 3 du même genre » permet. La règle de Fiche est un problème de confiance, pas de vie privée, mais c'est l'écran où l'on vérifie sa fiabilité.

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 9/10 · « 18 ans et plus · selfie vérifié », « Ce que tu cherches reste secret ». → —
- **V5-Ville** · 9/10 · « On ne demande jamais ta position » : tenu. → —
- **V5-Ville-bordeaux** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Toi** · 10/10 · Date avant toute donnée sensible ; tranche jamais l'âge. → —
- **V5-Genre** · 9/10 · « Ton groupe voit… le nombre de femmes et d'hommes du groupe, jamais qui » : juste, mais c'est ce décompte qui alimente le canal auxiliaire (voir Trouvée). → —
- **V5-Pet** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Rencontrer** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Intention** · 8/10 · « Personne ne le voit, ni ne peut le deviner » : promesse absolue, que le message « entre amis » de Trouvée-amis affaiblit par son absence (outils n° 6). → Tenir la promesse par la règle de composition (voir Trouvée) ou l'adoucir (« personne ne le voit »).
- **V5-Consentement** · 9/10 · Avant la question sensible ; « Une seule exception : la personne avec qui tu as un duo » : mais une proposition de duo montre déjà l'intention de l'autre avant tout duo (voir V5-Duo). → « … ou à qui Nino te propose en duo, après ton oui ».
- **V5-Toi-plus** · 9/10 · Plus aucune garantie chiffrée : réglé. → —
- **V5-Dispos** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Erreur-age** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Trouvee** · 8/10 · Garantie retirée : mon bloquant T3 est levé. Reste un canal à 1 bit : l'absence du bandeau « sortie entre amis pour toi » (affiché seulement si la garantie échoue) dit qu'une personne compatible est là. Avec « 2 femmes » : l'une des deux (k = 2). Avec une seule personne du genre recherché (1 f, 3 h, 1 non-binaire, permis) : elle, exactement. → Règle moteur testée : sans bandeau « entre amis », au moins 2 personnes du genre recherché dans le groupe ; sinon bandeau forcé. Ajouter le cas 1 f / 3 h / 1 nb aux tests (spec §4).
- **V5-Trouvee-amis** · 9/10 · Visible pour l'intéressé seul, sans chiffre : conforme à A.1. → —
- **V5-Trouvee-lyon** · 9/10 · Lieu et prénoms à J −1 18 h, visages J −3 h : calendrier B tenu. → —
- **V5-Sortie** · 9/10 · Une seule règle d'annulation ; composition sans garantie. → —
- **V5-Team** · 9/10 · Selfie et tranche pour chacun ; règle d'équilibre générale. → —
- **V5-Partage-invitation** · 10/10 · « Par message seulement, jamais en story » : ma demande T2-T3 réglée. → —
- **V5-Invite** · 10/10 · Promesse « une fois, à toi seul » enfin vraie. → —
- **V5-Compte** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Verif** · 9/10 · Vivacité, 18+, 30 j ; « ta photo ici ». → —
- **V5-Notifs** · 9/10 · Aperçus masqués, discret à l'état réel. → —
- **V5-Sortie-inscrit** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Accueil** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Accueil-discret** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Accueil-duo** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Pause** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Chats** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Groupe** · 8/10 · « pas de numéro ni de réseau avant jeudi » : et après jeudi ? (T3, non réglé). → « Levé seulement entre accords mutuels ».
- **V5-Groupe-menu** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Attente** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Partage-ville** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Amorcage** · 10/10 · « Les 2 autres personnes savent que 3 personnes viennent ensemble » + composition : ma demande T3 réglée. → —
- **V5-Amorcage-solo** · 9/10 · Composition et règle affichées. → —
- **V5-Sortie-complete** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Sortie-annulee** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Affiner** · 9/10 · « Éviter… à décider » : plus d'import silencieux. → —
- **V5-Affiner-histoire** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Eviter** · 9/10 · Empreintes sur l'appareil, opt-in. « On compare seulement les empreintes » : un hash de numéro à 10 chiffres se renverse par force brute. → Dire « empreintes salées, comparées côté serveur puis effacées » ou PSI ; ne pas écrire « chiffrée ».
- **V5-Confirmation** · 9/10 · Prénoms, tranches, pets à J −1 18 h, sans visages : B.7 tenu. → —
- **V5-Partage-confirmation** · 9/10 · « Cette semaine », sans jour par défaut : réglé. → —
- **V5-Revelation** · 10/10 · « Les captures sont détectées et signalées » (au lieu de « bloquées ») + filigrane : réglé. → —
- **V5-Partage-checkin** · 9/10 · « Ni lieu, ni quartier, ni heure », « jamais pendant » : réglé. « Ce soir » reste un calendrier public d'Alex. → —
- **V5-Ange** · 9/10 · « Jamais… ta position en continu » cohérent avec la page d'aide. → —
- **W-Ange** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **W-Ange-aide** · 9/10 · « Lieu de la sortie · pas de position » : mon point T3 réglé. Si Alex a déjà tapé « Je pars, mal à l'aise », le lieu affiché n'est plus là où il est. → Si départ enregistré : « Alex a quitté le lieu à 20 h 52 » au-dessus de l'adresse.
- **V5-Checkin** · 9/10 · Code d'abord, position une fois en option. → —
- **V5-Checkin-ok** · 9/10 · « Je pars, mal à l'aise · sans pénalité », rappel à 3 fois : B.9 tenu ; partage retiré. → —
- **V5-Souvenir** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Apres** · 10/10 · Aucun état par défaut, « Un problème ? » par personne. → —
- **V5-Apres-resultats** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Partage** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Partage-dimanche** · 9/10 · Sans chiffre ni pet. Proposée aussi quand le seul accord est « plus » ? Alors « ma bande s'agrandit » est faux ou révèle un accord. → Carte proposée seulement s'il y a un accord « amitié ».
- **V5-Apres-aucun** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Bande** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Rue** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Duo** · 7/10 · Carte N. avant tout oui : « 30–34 ans · il · musique live, volley · en amitié ». V5.3 A.3 et spec §5 : « seulement le pet et l'initiale ». Pour une proposition « pour une histoire », cette carte dirait à Alex l'intention et l'orientation de N. avant que N. ait dit oui, contre la phrase exacte de Consentement (« une seule exception : la personne avec qui tu as un duo »). check-facts ne vérifie que le prénom. → Avant le double oui : pet + initiale + score ; intention et tranche après ; règle dans check-facts.
- **V5-Duo-choix** · 9/10 · « N. n'en sait rien » : bon. « 7 jours » contre 48 h (spec). → Une durée.
- **V5-Lien** · 10/10 · « Depuis lundi 9 novembre, 21 h 30 », après l'accord de 20 h 50 : ma demande T3 réglée. → —
- **V5-Lien-debloque** · 10/10 · Filigrane, vocal facultatif. → —
- **V5-RdvDuo** · 9/10 · Lieu public, ange facultatif. → —
- **V5-Chat** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-RdvDuo-lea** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Oeuf** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Rupture** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Story** · 8/10 · Slug `m/k7f2q` (5 caractères) lié à « 3 mots pour Alex » : ≈ 60 millions de valeurs en base36, énumérable ; spec : ≥ 8. → Slug ≥ 8 (≥ 12 pour les liens nominatifs), rate limit sur `/m/`.
- **W-Repondre** · 8/10 · « 18 ans et plus » reste un badge, pas une déclaration (T3, non réglé). → Case « J'ai 18 ans ou plus » avant les mots.
- **V5-Profil** · 9/10 · « Ton groupe voit : prénom, pronom, tranche… » ; ne cite pas le pet ni le lieu. → Même liste que Confidentialité corrigée.
- **V5-Fiche** · 7/10 · « Une absence prévenue avant les visages… ne compte jamais » : règle V5.2, contraire à la spec (D-043). Un utilisateur qui s'y fie annule mer. 20 h, prend une absence et une pause de fiabilité qu'il croyait impossible. → « Une annulation avant la veille 18 h… ne compte jamais ».
- **V5-Tarifs** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Abonnement** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Paiement** · 9/10 · « BLW Réservation » en mode discret : bon. → —
- **V5-Paiement-ok** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Reglages** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Confidentialite** · 8/10 · Position réglée (« seul le lieu de la sortie est envoyé »). Mais « Qui voit quoi » oublie un destinataire : le lieu reçoit ton prénom la veille (L-Effectif). Le nombre f/h du groupe et le pet non plus. → Ligne « Le lieu : ton prénom, la veille 18 h, rien d'autre » ; ligne Groupe complétée (pet, nombre f/h).
- **V5-Signaler** · 10/10 · Rappel lisible, « Bloquer aussi » neutre, 114, 3919. → —
- **V5-Supprimer** · 9/10 · Signalements gardés le temps légal. → —
- **V5-Chargement** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Erreur-reseau** · 10/10 · Code hors ligne + 17/112. → —
- **V5-Paiement-echec** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Verif-echec** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Notifs-refus** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **V5-Chats-vide** · 9/10 · Aucune donnée au-delà de la promesse sur cet écran. → —
- **L-Effectif** · 8/10 · « prénoms seulement… Aucune autre donnée » mais pets affichés ; base légale de la transmission au lieu non dite (sous-traitance ? intérêt légitime ?). « Signaler un participant » sans bouton. → Pets retirés ou annoncés ; clause données au contrat ; bouton Signaler avec motifs.
- **L-Creneaux** · 9/10 · Rien de sensible. → —
- **L-Contrat** · 8/10 · Pas de clause données (le lieu reçoit des prénoms et le code ; durée de conservation ? interdiction de recontacter ?). → Article 6 « Données : prénoms effacés après la sortie, aucun recontact ».

## Les 3 changements qui feraient le plus monter ma note

1. Carte de proposition de duo réduite à pet + initiale (+ score), intention et tranche après le double oui ; test check-facts sur V5-Duo au-delà du prénom.
2. Règle moteur et test : pas de bandeau « entre amis » ⇒ au moins 2 personnes du genre recherché dans le groupe (cas 1 f / 3 h / 1 nb couvert) ; Intention adoucie si la règle n'est pas tenue.
3. Confidentialité complète (le lieu reçoit ton prénom la veille ; ton groupe voit ton pet et le nombre f/h), clause données au contrat lieu, Fiche corrigée, slugs ≥ 8 (≥ 12 pour les liens nominatifs), case 18+ sur W-Repondre.

## Je mets 10 si…

Je mets 10 si un audit croisé des 86 écrans, de spec-v5 et du contrat lieu contre « Qui voit quoi » ne trouve aucune donnée déductible au-delà de la promesse (carte de duo avant le oui, bit « entre amis » quand une seule personne du genre recherché est là, prénom transmis au lieu non déclaré), si chaque règle de sécurité ou de fiabilité n'a qu'une version (absence, durée d'une proposition), et si aucun lien nominatif n'est énumérable.

## Sources

- [Apple — UIApplication.userDidTakeScreenshotNotification (détection après coup)](https://developer.apple.com/documentation/uikit/uiapplication/userdidtakescreenshotnotification)
- [CNIL — données sensibles (art. 9 RGPD)](https://www.cnil.fr/fr/definition/donnee-sensible)
