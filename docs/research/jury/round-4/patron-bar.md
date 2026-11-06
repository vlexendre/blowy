# Jury V5.3 · tour 4 · Patron de bar partenaire

**Verdict.** Le côté lieu existe enfin (contrat d'une page, créneaux et plafond, effectif de la veille 18 h avec prénoms, astreinte, photo) et l'annulation gratuite s'arrête pile quand je reçois mon effectif ; je ne signe pas encore parce que le contrat oublie les places Blowy+, les annulations par Blowy pour sous-effectif et les tables à deux, et que l'écran promet un virement le lundi sans relevé.

**Note globale : 8/10** (tour 1 : 4/10 · tour 2 : 6/10 · tour 3 : 7/10)

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 9 | Mes trois écrans se lisent en 10 s ; le client sait qu'il paie sa conso. |
| Charge cognitive | 9 | Mon staff n'a rien à faire sauf indiquer la table (fiche staff absente). |
| Envie (J+1/J+7/J+30) | 8 | Bandes et sorties de bande « au Café des Oiseaux » : des habitués. |
| Vraie rencontre (2 semaines) | 9 | Table nommée, chevalet, code, effectif figé la veille. |
| Sécurité et confiance | 8 | Astreinte 18 h–2 h affichée ; je ne suis pas prévenu d'une demande d'aide chez moi. |
| Viralité / distribution | 8 | « Citer le lieu » après la sortie ; ma photo à 18 h. |
| Argent | 7 | 4,99 € / 3 € par place vide : réel, mais trous (Blowy+, annulation par Blowy, je connais quelqu'un, duos) et relevé absent. |
| Finition visuelle | 9 | Écrans lieu propres, même langage ; une colonne déborde. |

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

- **Contrat d'une page + écran lieu** : réglé (L-Contrat, L-Creneaux, L-Effectif).
- **Créneaux hors coup de feu** : réglé (vendredi « coup de feu, fermé » ; mardi à Lyon).
- **Plafond de tables** : réglé (« 2 tables Blowy au plus, par créneau »).
- **Effectif au moment où l'annulation cesse d'être gratuite** : réglé (mer. 18 h des deux côtés).
- **Compensation financée sans dépendre des seuls absents payants** : réglé sur le principe (4,99 € / 3 €, P&L refait) ; trous ci-dessous.
- **Même règle pour les tables à deux** : écrite (L-Creneaux) mais non opérable (pas de ligne duo dans la grille).
- **Zéro animation, astreinte, 72 h dans les deux sens, canal de signalement, vraie photo la veille** : réglés à l'écran (le canal de signalement n'a pas de bouton ; la photo de la maquette reste l'illustration commune).
- **Ma condition du 10 au tour 3** : 9 points sur 10 dessinés ; le 10e (« financés sans dépendre des seuls absents payants ») tient pour les absences, pas pour les annulations par Blowy ni pour Blowy+.

## Lecture d'ensemble

Je passe de « je ne signe pas sans contrat » à « je signe après trois corrections ». Ce qui me rassure : l'heure unique (mer. 18 h) qui fige mon effectif et arrête l'annulation gratuite, et une compensation chiffrée à la place. Ce qui me coûte encore : une table bloquée un jeudi pour une sortie que Blowy annule à 18 h la veille, faute de confirmations, sans un euro ; un habitué Blowy+ qui ne vient pas, dont le contrat ne dit pas ce qu'il me rapporte ; et des tables à deux réservées le samedi sans place dans ma grille. Et un « virement le lundi » sans relevé, c'est une promesse que je ne peux pas vérifier.

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Ville** · 9/10 · « 6 lieux partenaires » au 11e : la charge est répartie. → —
- **V5-Ville-bordeaux** · 9/10 · « 3 lieux partenaires » avant de promettre : ma demande T3 réglée. → —
- **V5-Toi** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Genre** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Pet** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Rencontrer** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Intention** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Consentement** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Toi-plus** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Dispos** · 9/10 · « Les créneaux des lieux de ta ville » ; mardi, samedi, dimanche proposés. → —
- **V5-Erreur-age** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Trouvee** · 9/10 · Mon nom caché jusqu'à la veille. → —
- **V5-Trouvee-amis** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Trouvee-lyon** · 10/10 · Un mardi, hors coup de feu : ma demande T3 réglée. → —
- **V5-Sortie** · 10/10 · « Annulation gratuite jusqu'au mer. 11 nov. 18 h… Ensuite, c'est une absence : le lieu a reçu l'effectif » : effectif et annulation alignés, ma demande n°2 T3 réglée. « Chacun paie ce qu'il boit », « Personne n'anime ». → —
- **V5-Team** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Partage-invitation** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Invite** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Compte** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Verif** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Notifs** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Sortie-inscrit** · 10/10 · Même règle, même heure. → —
- **V5-Accueil** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Accueil-discret** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Accueil-duo** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Pause** · 10/10 · « jusqu'au mer. 11 nov. 18 h » : aligné. → —
- **V5-Chats** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Groupe** · 8/10 · Aucun message du lieu à la confirmation (« table au fond à gauche ») (T3). → Message de bienvenue du lieu à 18 h.
- **V5-Groupe-menu** · 10/10 · « Quitter est gratuit jusqu'au mer. 11 nov. 18 h » : aligné. → —
- **V5-Attente** · 9/10 · « 3 lieux partenaires » à Bordeaux : réglé. → —
- **V5-Partage-ville** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Amorcage** · 9/10 · Lieu nommé la veille, « comme partout ». → —
- **V5-Amorcage-solo** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Sortie-complete** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Sortie-annulee** · 6/10 · « Pas assez de confirmations » : connu au plus tard à la veille 18 h. Ma table était bloquée ; le contrat promet 72 h de préavis « dans les deux sens » et ne prévoit rien quand Blowy annule pour sous-effectif. → Règle écrite : sortie annulée par Blowy après J −3 j → 3 € par place prévue au lieu (ou forfait), dans L-Contrat et business-model.
- **V5-Affiner** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Affiner-histoire** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Eviter** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Confirmation** · 8/10 · Nom, adresse, métro, table, chevalet, « Photo fournie par le lieu » ; l'image reste l'illustration commune (la même que pour Le Comptoir Gabriel). « Je connais quelqu'un ici » : si accepté après 18 h, ma table perd une place sans compensation (spec §6.5 l'exclut). → Vraie photo dans la maquette (ou cadre « photo du lieu ») ; « je connais quelqu'un » accepté après 18 h → 3 € au lieu.
- **V5-Partage-confirmation** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Revelation** · 9/10 · « Je ne peux plus venir · compte comme une absence » : ma table est protégée. → —
- **V5-Partage-checkin** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Ange** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **W-Ange** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **W-Ange-aide** · 8/10 · « Le personnel du lieu n'intervient pas à ta place » ; l'astreinte appelle Alex, pas le gérant : je ne sais pas qu'une demande d'aide a lieu chez moi. → SMS au référent du lieu : « demande d'aide à la table Blowy, l'équipe gère ».
- **V5-Checkin** · 9/10 · « Demande au comptoir la table Blowy » : mon staff doit être briefé ; aucune fiche staff. → Fiche staff d'une page dans l'espace lieu.
- **V5-Checkin-ok** · 9/10 · « Range ton téléphone » : bon pour moi. → —
- **V5-Souvenir** · 9/10 · « Café des Oiseaux » sur le souvenir. → —
- **V5-Apres** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Apres-resultats** · 10/10 · « Vous pourrez revenir ensemble au Café des Oiseaux » : ma demande T3 réglée. → —
- **V5-Partage** · 9/10 · « Citer le lieu : possible à partir du ven. 13 nov. 9 h 30 » : visibilité gratuite. → —
- **V5-Partage-dimanche** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Apres-aucun** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Bande** · 10/10 · « Sortie de bande… au Café des Oiseaux » : des habitués. → —
- **V5-Rue** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Duo** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Duo-choix** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Lien** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Lien-debloque** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-RdvDuo** · 7/10 · « table confirmée par Le Comptoir Gabriel », « Rendez-vous gratuit », samedi 15 h ; L-Creneaux dit « les tables à deux suivent la même règle de compensation », mais aucune ligne « tables à deux » dans ma grille de créneaux ni dans mon plafond. Illustration identique au Café des Oiseaux. → Ligne « Tables à deux » par créneau dans L-Creneaux, comptée dans le plafond ; photo propre au lieu.
- **V5-Chat** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-RdvDuo-lea** · 10/10 · Parc public : aucune table bloquée. → —
- **V5-Oeuf** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Rupture** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Story** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **W-Repondre** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Profil** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Fiche** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Tarifs** · 9/10 · « Le lieu ne prend rien sur ta place. Si ta place reste vide… son prix est reversé au lieu (3 € si elle était offerte) » : ma demande T3 réglée. Et une place Blowy+ ? → « (3 € si elle était offerte ou incluse dans Blowy+) ».
- **V5-Abonnement** · 8/10 · Un habitué Blowy+ ne paie pas sa place ; s'il ne vient pas, je touche 3 € ou 4,99 € ? Pas dit au client. → Règle Blowy+ écrite ici aussi.
- **V5-Paiement** · 9/10 · « Consommation non incluse » au paiement. → —
- **V5-Paiement-ok** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Reglages** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Confidentialite** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Signaler** · 9/10 · « Incident sur place (lieu, personnel, autre client) ». → —
- **V5-Supprimer** · 10/10 · « remboursée, avant la confirmation de la veille » : ma table n'est pas lésée. → —
- **V5-Chargement** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Erreur-reseau** · 10/10 · « Le code du chevalet marche hors ligne » : mon sous-sol est couvert. → —
- **V5-Paiement-echec** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Verif-echec** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Notifs-refus** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **V5-Chats-vide** · 9/10 · Rien qui me concerne directement ; côté client, rien ne gêne mon service. → —
- **L-Effectif** · 8/10 · Enfin : effectif arrêté mer. 18 h, table, chevalet, prénoms, astreinte, compensation, ma photo. Mais : « Virement le lundi » alors que la spec prévoit un relevé mensuel (et aucun relevé n'est affiché) ; aucune vue des présences après la soirée (comment je vérifie qu'une place était vide ?) ; « Signaler un participant » sans bouton ni numéro. → Bloc « Ce mois-ci : 3 places vides, 12,98 € » avec détail par soirée ; présences à J +1 ; bouton « Signaler » (motifs + rappel sous 1 h).
- **L-Creneaux** · 8/10 · Créneaux hors coup de feu, plafond, préavis 72 h dans les deux sens : ma liste T3. Les tables à deux n'y sont pas ; « coup de feu, fermé » déborde de sa colonne. → Ligne tables à deux ; libellé dans la colonne état.
- **L-Contrat** · 7/10 · Une page, cinq articles, astreinte, zéro animation, charte, préavis : ma demande n°1 T3. Manquent : places Blowy+ (« 3 € (1re sortie offerte) » seulement), annulation par Blowy pour sous-effectif (< 72 h, rien prévu), « je connais quelqu'un » accepté après 18 h, données des participants (prénoms : durée, interdiction de recontact), responsabilité/assurance, signataire Blowy. → Article 3 complété (offerte ou Blowy+ : 3 € ; sortie annulée par Blowy après J −3 j : 3 € par place) ; article 6 données ; signature des deux parties.

## Les 3 changements qui feraient le plus monter ma note

1. Compléter l'article Argent : place Blowy+ vide = 3 € ; sortie annulée par Blowy après J −3 j (sous-effectif) = 3 € par place prévue ; « je connais quelqu'un » accepté après 18 h = 3 € ; chiffrer ces lignes dans business-model.
2. Relevé dans L-Effectif (places vides du mois, montants, date de virement unique, cohérente avec la spec) et présences à J +1 pour vérifier ; bouton « Signaler un participant ».
3. Ligne « tables à deux » dans L-Creneaux, comptée dans le plafond ; alerte au référent du lieu lors d'une demande d'aide ; fiche staff d'une page.

## Je mets 10 si…

Je mets 10 si le contrat d'une page couvre toutes les places vides après la confirmation (payée, offerte, Blowy+, annulation par Blowy, retrait « je connais quelqu'un »), si l'espace lieu me montre un relevé vérifiable (présences, montants, date de virement unique) et mes tables à deux dans ma grille, si je suis prévenu d'une demande d'aide à ma table, et si ma vraie photo est celle que voient les participants à 18 h.
