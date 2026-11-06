# Jury V5.2 · tour 3 · Patron de bar partenaire

**Verdict.** Côté client, tout ce que je demandais y est (code du chevalet d'abord, incident sur place, table de duo confirmée par le lieu, amorçage dans un lieu qui a confirmé), mais le côté lieu reste renvoyé en V5.3 : pas de contrat, pas d'écran, une compensation de 15 € non financée et une annulation gratuite qui court 22 h 30 après mon effectif.

**Note globale : 7/10** (tour 1 : 4/10 · tour 2 : 6/10)

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 8 | Le client comprend ce qu'il paie (4,99 €) et ce qu'il ne paie pas (sa conso). |
| Charge cognitive | 8 | Mon staff n'a rien à faire, sauf indiquer la table Blowy (non briefé). |
| Envie (J+1/J+7/J+30) | 7 | Des groupes et des bandes qui reviennent : des habitués potentiels, si on les ramène chez moi. |
| Vraie rencontre (2 semaines) | 8 | Table nommée, chevalet, code : la rencontre a lieu chez moi, proprement. |
| Sécurité et confiance | 8 | « Incident sur place », « le personnel n'intervient pas à ta place » ; je ne peux toujours rien signaler moi-même. |
| Viralité / distribution | 7 | « Citer le lieu » après la sortie : visibilité gratuite. |
| Argent | 5 | 15 € par place non honorée : promis dans le concept, absent des écrans, non financé ; duos gratuits sur table réservée ; annulation gratuite après mon effectif. |
| Finition visuelle | 8 | Fiche lieu lisible ; illustration générique au lieu de ma photo. |

## Outils de cohérence

Exécutés le 6 nov. 2026 : `node design/v5/check-facts.mjs` → « 75 fichiers, 2480 vérifications, 0 contradiction(s) » ; `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js` → « 75 écrans, 1038 textes, 420 cibles, 0 problème(s), contraste minimum 4.53:1 ». J'ai aussi re-rendu les 75 sources (Playwright, @2x) et comparé aux PNG livrés : identiques au texte près (7 écrans diffèrent de quelques centaines de pixels d'illustration). Les deux outils passent. Ils ne voient pas ce qui suit, trouvé à la main :

- **Garantie « au moins 2 » + composition** (Trouvée, Sortie, Sortie-inscrit, Confirmation) : « 2 femmes, 3 hommes » et « Au moins 2 personnes du groupe cherchent aussi une histoire compatible avec la tienne ». Alex (il) cherche des femmes (ses duos : Jade, Léa) ; il n'y a que 2 femmes : ce sont forcément elles. check-facts vérifie « au moins N = garantie », pas que N reste inférieur à l'effectif du genre recherché.
- **Consentement après le duo** : Lien « Depuis dimanche 8 novembre, 21 h » (duo Jade) ; Confidentialité et Affiner-histoire « Accord donné le lundi 9 novembre ». La chronologie de facts.json ne contient pas la date d'accord.
- **Un seul lien pour deux promesses** : `blowy.app/i/r8Tz4w` est imprimé sur les 4 cartes publiques (Partage-confirmation, Partage-checkin, Partage, Partage-invitation), alors que V5-Invite dit « Lien à usage unique, réservé à toi ».
- **Position** : W-Ange-aide affiche « Position au moment de la demande · 21:04 · 12 rue Oberkampf » ; Confidentialité dit « Position · jamais stockée » et Check-in « Ta position n'est jamais demandée si tu tapes le code ».
- **Prénom avant le oui** : V5-Duo, carte « avec N. », pied de page « Dire oui à Nils ouvrirait un 2e duo ».
- **spec-v5.md non mise à jour** (en-tête : 2026-11-06, source `concept-v5.md`) : `photoRevealAt = min(9 h, startsAt − 3 h)` (= 9 h pour 19 h 30) et parcours J2 « 9 h photos simultanées » ; précondition « quartier `LIVE` », seuil 120, erreur `NEIGHBORHOOD_NOT_LIVE` ; `duo.maxActive` 3 ; place en placeholder 12 € « conso incluse » ; Blowy+ 19,99 € = 2 crédits + 1 accessoire mensuel ; annulation ≥ 24 h → crédit 90 j. Les écrans disent : visages à J −3 h, partout dès 5 personnes, 1 duo actif, 4,99 € conso non incluse, 9,99 € toutes les sorties, accessoires jamais vendus, annulation gratuite jusqu'aux visages.
- **Défauts de pixel du tour 2 toujours là** : légende chevauchée par l'ombre du bouton (Apres y≈1600–1625 @2x ; Abonnement y≈1615–1640) ; « Être rappelé par l'équipe… » collé au bord gauche de son fond (Signaler) ; chips inclinées (W-Repondre) ; titre bicolore (Souvenir) ; deux interrupteurs indépendants (Oeuf) ; 5 actions sous stress (Check-in-ok). Nouveaux : heures et dates coupées (« 21 / h. » Lien, « 10 / min. » Erreur-reseau, « mar. 10 / nov. » Accueil, « nov. / 21 h » Duo et Accueil-duo), « ; pour ta sécurité » en début de ligne (Groupe-menu), « Tom vient avec / toi » et « + 1 place pour un / pote » (Sortie, Sortie-inscrit), « nouvelle » ×3 sous les « ? » alors qu'un des trois est Malo.

## Mes exigences du tour 2 : vérification point par point

- **Contrat d'une page + écran lieu** : non. H.24 le renvoie à « admin web à maquetter en V5.3 ». Rien à signer aujourd'hui.
- **Créneaux hors coup de feu** : partiellement (« les créneaux des lieux de ta ville », mardi soir, dimanche brunch), mais la démo reste un jeudi 19 h 30.
- **Plafond de tables / répartition** : « 6 lieux partenaires » au 11e ; plafond non dessiné.
- **Effectif à J −1 avant 18 h** : dans le concept (H.24), pas à l'écran ; et il est figé 22 h 30 avant la fin de l'annulation gratuite (jeu. 16 h 30).
- **Forfait garanti si table < 4 présents ou annulée < 24 h** : remplacé par « 15 € par place non honorée après la confirmation ». Mieux qu'avant, mais pas couvert (voir l'investisseur : les absents payants sont déjà comptés dans le revenu ; les absents à la 1re offerte ne laissent rien) et silencieux sur les annulations gratuites après mer. 18 h.
- **Zéro animation** : réglé. **Code du chevalet principal** : réglé. **Incident sur place** : réglé. **Table duo confirmée par le lieu** : réglé.
- **Astreinte Blowy** : dans le concept, pas pour moi (W-Ange-aide parle au proche, pas au gérant).
- **72 h de préavis dans les deux sens** : absent.
- **Canal lieu → équipe** : absent.
- **Vraie photo la veille** : non (illustration commune à deux lieux).

## Lecture d'ensemble

Côté client, tout ce que je demandais est là : pas d'animation, chacun paie ce qu'il boit, chevalet et code, incident sur place, ma table protégée après les visages, un amorçage qui ne promet que des tables confirmées. Côté lieu, rien n'est dessiné et la seule règle d'argent (15 €) n'est pas financée sur le papier. Je monte à 7 parce que la promesse existe ; je ne signe pas sans contrat.

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Ville** · 9/10 · « Paris 11e · 6 lieux partenaires » : la charge est répartie, ma demande T2. → —
- **V5-Ville-nantes** · 7/10 · « Une sortie se forme dès 5 personnes » à Nantes : chez qui ? Aucun lieu nantais nommé ni signé. → « Nino choisit parmi N lieux partenaires à Nantes », ou pas de promesse sans lieu.
- **V5-Toi** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Pet** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Rencontrer** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Consentement** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Toi-plus** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Dispos** · 8/10 · « Les créneaux des lieux de ta ville » : enfin dit. Mardi soir et dimanche brunch proposés ; toute la démo reste un jeudi 19 h 30. → Montrer un mardi dans la démo.
- **V5-Compte** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Erreur-age** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Trouvee** · 8/10 · Mon nom caché jusqu'à la veille : logique. → —
- **V5-Trouvee-potes** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Sortie** · 7/10 · « Chacun paie ce qu'il boit », « Personne n'anime », code du chevalet : réglé. « Annulation gratuite jusqu'à l'arrivée des visages (jeu. 12 nov. 16 h 30) » alors que H.24 me donne l'effectif à J −1 18 h : pendant 22 h 30, ma table fond gratuitement. → Effectif lieu figé à J −3 h, ou compensation de toute place annulée après mer. 18 h.
- **V5-Verif** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Notifs** · 8/10 · Le client reçoit le lieu mer. 18 h ; moi, l'effectif : rien de dessiné (admin V5.3). → Écran ou SMS lieu « 5 confirmés, table au fond ».
- **V5-Sortie-inscrit** · 7/10 · « Annuler · gratuit jusqu'à jeu. 12 nov. 16 h 30 » : même trou entre mon effectif et l'annulation gratuite. → Idem Sortie.
- **V5-Team** · 9/10 · Des potes qui viennent ensemble consomment plus. → —
- **V5-Invite** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Accueil** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Accueil-discret** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Accueil-duo** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Pause** · 8/10 · « Tu peux l'annuler gratuitement jusqu'à l'arrivée des visages » : même trou. → —
- **V5-Chats** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Groupe** · 8/10 · Aucun message du lieu à la confirmation (« table au fond à gauche »). → Message de bienvenue du lieu.
- **V5-Groupe-menu** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Attente** · 6/10 · « Dès que 5 personnes compatibles sont là, Nino choisit le lieu » : dans une ville où aucun lieu n'est signé, qui reçoit 5 inconnus un samedi 15 h ? → Lieux signés affichés avant de promettre une sortie.
- **V5-Amorcage** · 9/10 · « Le lieu a confirmé la table » + La Fabrique, Lille-Wazemmes : exactement ce que je voulais pour l'amorçage. → —
- **V5-Sortie-complete** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Sortie-annulee** · 8/10 · « Pas assez de confirmations » : et la table bloquée chez moi ? (règle lieu absente, normal côté client). → —
- **V5-Affiner** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Affiner-histoire** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Confirmation** · 7/10 · Nom, adresse, métro, table, chevalet, charte : bien. L'image est une illustration générique (la même que pour Le Comptoir Gabriel), pas la photo de mon bar promise en H.24. → Vraie photo fournie par le lieu.
- **V5-Partage-confirmation** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Revelation** · 8/10 · « Je ne peux plus venir · compte comme une absence » : ma table est protégée après 16 h 30. → —
- **V5-Ange** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **W-Ange** · 8/10 · Mon adresse sur une page web : lieu public, OK. → —
- **W-Ange-aide** · 7/10 · « Le personnel du lieu n'intervient pas à ta place » : clair pour mon staff. Mais personne ne prévient le gérant qu'une demande d'aide a lieu à sa table. → Alerte au référent du lieu + numéro d'astreinte Blowy.
- **V5-Checkin** · 9/10 · Code du chevalet en méthode principale : ma demande T2, réglée. « Demande au comptoir la table Blowy » : mon staff doit être briefé (rien de prévu). → Fiche staff d'une page.
- **V5-Checkin-ok** · 8/10 · « Range ton téléphone : la soirée est à la table » : bon pour moi. → —
- **V5-Partage-checkin** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Souvenir** · 8/10 · « Café des Oiseaux » sur le souvenir. → —
- **V5-Partage** · 8/10 · « Citer le lieu » après coup : de la visibilité pour moi. → —
- **V5-Apres** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Apres-resultats** · 8/10 · « Vous pourrez revenir ensemble à une sortie » : pas forcément chez moi. → « Retrouvez-vous au Café des Oiseaux ».
- **V5-Apres-aucun** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Bande** · 8/10 · Sortie de bande : des habitués potentiels, sans lieu proposé. → Proposer le lieu de leur 1re sortie.
- **V5-Rue** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Duo** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Lien** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Lien-debloque** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-RdvDuo** · 6/10 · « Lieu partenaire · table confirmée par Le Comptoir Gabriel » : réglé. Mais « Rendez-vous gratuit » un samedi 15 h : que gagne le lieu, et si personne ne vient ? Les 15 € valent-ils pour une table à deux ? → Règle duo au contrat (forfait), ou « lieu suggéré » sans réservation.
- **V5-Chat** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-RdvDuo-lea** · 9/10 · Parc public : aucune table bloquée. → —
- **V5-Oeuf** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Rupture** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Partage-invitation** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Story** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **W-Repondre** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Profil** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Fiche** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Tarifs** · 6/10 · Rien ne dit au client que le lieu ne touche rien sur les 4,99 €, ni qu'il est dédommagé si une place reste vide. → « Le lieu ne prend pas de commission ; il est dédommagé si ta place réservée reste vide ».
- **V5-Abonnement** · 6/10 · Blowy+ : un habitué paie ~2,30 € la sortie ; même table chez moi, même compensation à financer. → —
- **V5-Paiement** · 8/10 · « Consommation non incluse » au paiement : pas de malentendu au comptoir. → —
- **V5-Paiement-ok** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Reglages** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Confidentialite** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Signaler** · 8/10 · « Incident sur place (lieu, personnel, autre client) » : réglé. Moi, je ne peux toujours rien signaler (canal lieu → équipe renvoyé en V5.3). → Canal lieu, même par SMS.
- **V5-Supprimer** · 7/10 · « Ta place du jeu. 19 nov. : remboursée » : si la suppression a lieu après mer. 18 h, ma table reste vide et le client est remboursé. → Après le lieu révélé : compensation lieu explicite.
- **V5-Chargement** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Erreur-reseau** · 9/10 · « Le code du chevalet marche hors ligne » : mon sous-sol sans réseau est couvert. → —
- **V5-Paiement-echec** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Verif-echec** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Notifs-refus** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —
- **V5-Chats-vide** · 8/10 · Rien qui me concerne ; ma note plafonne tant que le côté lieu n'existe pas. → —

## Les 3 changements qui feraient le plus monter ma note

1. Dessiner le côté lieu, même une page web : contrat d'une page, créneaux, plafond de tables, effectif, compensation, astreinte, canal de signalement, photo.
2. Aligner effectif et annulation : effectif lieu figé à J −3 h (quand l'annulation devient une absence), ou compensation de chaque place annulée après mer. 18 h ; et une règle écrite pour les tables à deux du Duo.
3. Ma vraie photo la veille (pas l'illustration commune au Café des Oiseaux et au Comptoir Gabriel) et des lieux signés nommés avant de promettre une sortie à Nantes.

## Je mets 10 si…

Je mets 10 si j'ai devant moi un contrat d'une page et un écran lieu qui disent : mes créneaux (hors coup de feu), mon plafond de tables, l'effectif au moment où l'annulation cesse d'être gratuite, 15 € par place vide financés sans dépendre des seuls absents payants, la même règle pour les tables à deux, zéro animation, un numéro d'astreinte Blowy, 72 h de préavis dans les deux sens, un canal pour signaler un participant, et ma vraie photo affichée la veille.
