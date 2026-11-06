# Jury V5.1 · tour 2 · Responsable Trust & Safety

**Verdict.** Mes trois bloquants du tour 1 sont levés (vote « Plus » identique pour tous, signalement IRL avec rappel humain < 1 h, jeton d'ange gardien aléatoire), mais la V5.1 recrée trois fuites : les tranches d'âge sont centrées sur l'âge (donc l'âge exact se lit), la carte « +1 dans ma bande » montre le pet de Sarah et révèle son vote au groupe, et les visages arrivent 25 h 30 avant la sortie au lieu des 3 h que je demandais.

**Note globale : 6/10** (tour 1 : 4/10)

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 8 | Les promesses sont dites une fois et au même endroit (Consentement, Toi-plus, Confidentialité « Qui voit quoi »). |
| Charge cognitive | 8 | Le parcours sécurité tient en 4 gestes : ange gardien facultatif, check-in, alerte en appui long, signaler dans l'en-tête. |
| Envie (J+1/J+7/J+30) | 7 | La couche sécurité visible reste l'argument pour les femmes, sans qui il n'y a pas de groupe mixte. |
| Vraie rencontre (2 semaines) | 7 | Lieu public, table nommée, code du chevalet, retrait discret « Je connais quelqu'un ici » : le meilleur format du marché. |
| Sécurité et confiance | 5 | Tranches centrées (Alex 28 → « 26–30 », Jade → « 24–28 », Tom → « 31–35 » hors de la composition « 26–31 ») = âge exact déductible ; pet de Sarah sur la carte d'accords ; visages à J-1 18 h ; date de naissance demandée à 8/8, après les réponses art. 9 ; « Corriger ma date » juste après le refus. |
| Viralité / distribution | 6 | NGL retiré, mots physiques retirés, lien 3 mots 18+ et désactivable. Mais les cartes « pets seulement » ne sont pas anonymes pour qui a vu le groupe, et l'invitation publique « Viens jeudi avec moi et Tom » nomme un tiers et ouvre une place à n'importe qui. |
| Argent | 8 | Aucun dark pattern ; offre de rétention retirée ; remboursement automatique écrit. |
| Finition visuelle | 7 | Écrans d'urgence lisibles ; la ligne « Être rappelé·e par l'équipe » est collée au bord de son fond et l'icône ⚠ du bouton « Besoin d'aide » chevauche sa bordure. |

## Outils de cohérence

Exécutés le 6 nov. 2026 : `node design/v5/check-facts.mjs` → « 75 fichiers, 786 vérifications, 0 contradiction » ; `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js` → « 75 écrans, 1042 textes, 420 cibles, 0 problème, contraste minimum 4.53:1 ». Les deux passent. Ils ne contrôlent ni la chronologie entre écrans, ni les tranches d'âge, ni le sens des phrases dérivées : les contradictions relevées ci-dessous leur échappent.

## Mes exigences du tour 1 : vérification point par point

- **« Plus » selon mes seules préférences, compatibilité résolue en silence** : réglé. Toi-plus et Confidentialité : « tout le monde voit les mêmes 3 boutons » ; Apres affiche Ami·e / Plus / Non sur chaque ligne.
- **Âge en tranche, jamais exact** : réglé en apparence, fuite en pratique. Les tranches de facts.json sont des fenêtres de 4 ans centrées sur l'âge réel (Alex 28 → 26–30). Le centre donne l'âge exact. Il faut une grille fixe (25–29, 30–34).
- **Aucun statut « en route »** : réglé. Check-in-ok : coches « arrivé·e » seulement, Malo sans étiquette.
- **Jeton ange gardien aléatoire, noindex, expiration, révocation** : réglé. blowy.app/a/7Qm2xK9fPz4Lw8vR, « expire vendredi 13 novembre, 0 h 30 », « Ce lien ne m'est pas destiné ». noindex non vérifiable sur maquette.
- **Aucune info de groupe hors place confirmée** : réglé. Sortie-complete et Sortie-annulee n'affichent plus aucun groupe.
- **Signalement IRL, motifs physiques/sexuels en tête, rien de présélectionné** : réglé. « Geste ou contact non voulu », « Pression sexuelle », « M'a suivi·e », « Semble avoir moins de 18 ans », outing, arnaque. « Bloquer aussi » est pré-coché : défendable, mais à assumer.
- **Voie urgente + SLA humain** : réglé. 17 / 112 / 3919 + rappel < 1 h les soirs de sortie. Manque le 114 (urgence par SMS, personnes sourdes ou qui ne peuvent pas parler).
- **Signaler depuis Groupe, Check-in-ok, Après, Bande** : réglé. Drapeau en en-tête (Revelation, Checkin, Lien, Chat), « Un problème ? » par ligne de vote, menu par ligne de bande.
- **SAFETY_EXIT « Je pars, remboursé·e, sans effet »** : réglé. Check-in-ok, Sortie, Groupe-menu.
- **Consentement art. 9 explicite et révocable** : réglé, mal placé. Écran dédié + retrait dans Confidentialité. Mais Intention-rempli pose « sérieuse / on verra » et « enfants » avant le consentement.
- **Date de naissance + 18+ vérifié avant la 1re sortie** : partiellement. Selfie : vivacité, 18+, ressemblance ; pièce d'identité en repli. Mais la date est saisie à 8/8 : un·e mineur·e a déjà répondu aux questions art. 9. Et Erreur-age propose « Corriger ma date » en CTA principal.
- **Révélation ≤ startsAt − 3 h, filigrane, alerte capture** : inversé. Visages et adresse à mer. 18 h pour jeu. 19 h 30 (25 h 30). « Les captures d'écran sont signalées au groupe » : bien, mais aucun filigrane. Le motif (pas d'annulation gratuite après) est produit, pas sécurité.
- **Ange gardien par sortie, jamais par défaut (contrôle coercitif)** : réglé. « Facultatif, pour cette sortie seulement », « Tu peux le retirer sans que Sam soit prévenu·e », Réglages « choisi à chaque sortie ».
- **Story 3 mots : pas de filiation NGL, 18+, mots physiques retirés** : réglé. « la personne qu'on appelle » remplace « beau sourire » ; « Lien réservé aux 18 ans et plus · désactivable ».
- **Mode discret à l'onboarding, aperçus masqués** : réglé. Notifs (ON), Confidentialité (ON par défaut), Accueil-discret.
- **Conserver signalements et vérification après suppression** : réglé. Supprimer : « gardés le temps exigé par la loi ».

**Ma condition du 10 au tour 1** : « un audit croisé maquette ↔ spec §3 (qui voit quoi) ne trouve aucune donnée affichée au-delà de la spec, le signalement couvre les incidents physiques avec une réponse humaine en moins d'une heure pendant les créneaux de sortie, le consentement art. 9 est explicite et révocable à l'écran, et l'âge 18+ est vérifié avant la première sortie, pas seulement déclaré »  
**Statut** : 3 sur 4. Signalement IRL + SLA : oui. Consentement : oui (ordre à corriger). 18+ vérifié : oui (selfie + pièce). Audit qui-voit-quoi : non, trois données vont au-delà de ce qui est promis (âge exact déductible des tranches centrées, vote de Sarah déductible de la carte d'accords, prénom de Tom sur une carte « sans prénoms »). De plus la spec §3 dit encore `photoRevealAt` à 9 h / startsAt − 3 h et concept-v5.1 E.16 dit veille 18 h : les deux documents se contredisent.

## Lecture d'ensemble

Scénarios rejoués.

**Stalking.** Un inscrit malveillant reçoit mercredi 18 h : prénom, visage, adresse du café, et une tranche « 26–30 » qui donne l'âge (28). Il a 25 h 30 pour chercher la personne sur Instagram. Le signalement des captures est utile mais ne protège pas d'une photo d'écran prise avec un 2e téléphone. Il faut au minimum une grille fixe et un filigrane nominatif ; idéalement les visages à J-3 h et le lieu seul à J-1.

**Fuite de vote.** Le vote est bien protégé dans l'app. Mais Partage-accords (« +1 dans ma bande. +1 duo », Nino + la pigeonne) est partagé en Story : Léa et Malo, qui ont vu Pia la pigeonne au groupe, savent que Sarah et Alex ont matché ; Léa sait que le « +1 duo » la concerne. La règle « personne n'apprend jamais un non » devient « tout le monde déduit les oui ».

**Mineur·e.** Une personne de 16 ans répond Intention, sous-choix « sérieuse », enfants, Consentement art. 9, genre et genres recherchés avant de saisir sa date à 8/8. Erreur-age dit « On a supprimé ce que tu as saisi » (bien) puis propose « Corriger ma date » : la retentative est l'action principale.

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 9/10 · « 18+ · selfie vérifié pour tous » et « Ce que tu cherches reste secret » : réglé. → —
- **V5-Ville** · 8/10 · « On ne demande jamais ta position » : réglé ; « près de chez toi » subsiste sur Welcome et W-Ange. → « dans ton quartier » partout.
- **V5-Ville-fermee** · 8/10 · Compteur agrégé, aucune donnée individuelle. Avant toute vérification d'âge. → Demander la date de naissance avant toute inscription (même liste d'attente).
- **V5-Team-amorcage** · 7/10 · Une team de 3 amis + une autre team de 2 = deux blocs qui se connaissent ; « Yacine · vérifié » affiché au créateur : bien. Aucune règle sur qui compose l'autre team (âges, genres). → Afficher la composition anonyme de la sortie d'amorçage comme pour une sortie normale.
- **V5-Rencontrer** · 8/10 · Rien de sensible ; Duo désactivé par défaut pour « groupe ». → —
- **V5-Intention** · 8/10 · Rien de coché, « Personne ne le voit » : réglé. → —
- **V5-Intention-rempli** · 5/10 · Sous-choix « sérieuse / on verra » et « enfants » (projet familial, donnée intime) posés AVANT l'écran de consentement art. 9 et AVANT la date de naissance. → Ordre : date de naissance → Consentement → sous-choix.
- **V5-Consentement** · 7/10 · Bon texte, alternative « Amitié seule » à égalité ; arrive après des réponses qu'il prétend précéder. → Le placer avant Intention-rempli.
- **V5-Toi** · 8/10 · Genre sans présélection, « Je préfère ne pas dire » : réglé. « Un autre mot… » = champ libre affiché ? Non (« Personne ne voit ta réponse ») : OK. → Modération du champ libre côté serveur.
- **V5-Toi-plus** · 9/10 · Ancien bloquant levé : « tout le monde voit les mêmes 3 boutons … compatibilité en silence ». → —
- **V5-Craft** · 9/10 · « Tu ne dis jamais son nom à voix haute » : bien vu. → —
- **V5-Vie** · 8/10 · Activités : rien de sensible. → —
- **V5-Dispos** · 8/10 · « garde alternée » : donnée familiale indirecte, mais non affichée. → Ne jamais l'exposer au groupe.
- **V5-Eclosion** · 9/10 · — → —
- **V5-Compte** · 8/10 · « L'âge est vérifié au selfie, avant ta 1re sortie » : réglé. → —
- **V5-Compte-age** · 5/10 · Date de naissance à la 8e et dernière étape : un·e mineur·e a déjà fourni des données art. 9 ; tranche montrée « 26–30 » = âge ± 2 (centrée), donc l'âge exact se déduit. → Date de naissance en 1re question ; tranches sur grille fixe (25–29, 30–34).
- **V5-Trouvee** · 8/10 · Composition anonyme sans prénom : réglé. « 26–31 ans » alors que Tom est 31–35 à la Révélation. → Composition calculée sur les mêmes tranches.
- **V5-Sortie** · 9/10 · « Mal à l'aise sur place ? Tu pars quand tu veux, sans effet » et « sauf pour ta sécurité » : réglé ; menu « … » = Signaler. → —
- **V5-Verif** · 9/10 · Vivacité, 18+, ressemblance, conservation 30 j : réglé. → —
- **V5-Notifs** · 9/10 · Mode discret ON par défaut, exemples neutres : réglé. → —
- **V5-Sortie-inscrit** · 8/10 · Ange gardien proposé en ligne, facultatif ; « Ajouter à mon agenda sans le mot blowy » : bon réflexe anti-outing. → —
- **V5-Team** · 7/10 · Un ami de team contourne la composition (âge du groupe secret, genres) : rien ne dit qu'il est soumis aux mêmes filtres. → « Ton ami·e passe le selfie et entre dans la tranche d'âge du groupe ».
- **V5-Accueil** · 8/10 · Hors mode discret, « Jeudi, on joue. » et Nino : acceptable puisque le discret est ON par défaut. → —
- **V5-Accueil-discret** · 9/10 · Aucun pet ni prénom, icône Agenda : réglé. → —
- **V5-Pause** · 9/10 · — → —
- **V5-Chats** · 8/10 · « Rien n'est public » ; aperçus masqués par défaut dans Confidentialité : réglé. → —
- **V5-Groupe** · 9/10 · « Messages modérés · pas de numéro ni de réseau avant jeudi » + menu : réglé. → Préciser ce qui se passe après jeudi (filtre levé seulement entre accords mutuels).
- **V5-Groupe-menu** · 9/10 · Signaler, Bloquer, Quitter, Couper : réglé ; « Personne ne sait qui a signalé ». → —
- **V5-Sortie-complete** · 9/10 · Aucun groupe affiché : réglé. → —
- **V5-Sortie-annulee** · 9/10 · Groupe masqué, pas de canal d'au revoir : réglé. → —
- **V5-Attente** · 8/10 · « tu en fais partie » des « personnes vérifiées » sans selfie fait : promesse inexacte. → « inscrit·e ».
- **V5-Revelation** · 4/10 · **BLOQUANT** · Prénom + visage + adresse exacte 25 h 30 avant (j'avais demandé ≤ 3 h) ; tranches centrées qui donnent l'âge (« Léa · 26–30 » = 28) ; « Tom · 31–35 » hors de « 26–31 » ; aucun filigrane nominatif sur les visages. → Lieu à J-1 18 h, visages à startsAt − 3 h ; grille d'âge fixe ; filigrane du prénom du regardeur sur chaque visage.
- **V5-Ange** · 9/10 · Ancien point coercitif réglé : facultatif, par sortie, retirable sans prévenir. → —
- **W-Ange** · 9/10 · Ancien bloquant levé : jeton 16 caractères, expiration, « Ce lien ne m'est pas destiné ». Le prénom « Alex » et l'adresse restent lisibles par qui reçoit le lien transféré. → Vérifier que « Ce lien ne m'est pas destiné » révoque pour tous.
- **W-Ange-alerte** · 9/10 · Position au moment de l'alerte, texte pour le 17, rappel < 5 min, le personnel n'intervient pas : réglé. → Ajouter le 114 (SMS) pour les proches sourds.
- **V5-Checkin** · 8/10 · Position une fois, non stockée ; « Besoin d'aide · prévient Sam et l'équipe, sans bruit ». Si aucun ange choisi, « prévient Sam » est faux. → Libellé dynamique (« prévient l'équipe » sans ange).
- **V5-Checkin-code** · 9/10 · Repli par code, 5 essais : réglé. → —
- **V5-Checkin-ok** · 9/10 · Alerte en appui long 2 s séparée du faux appel ; « Je pars, mal à l'aise · remboursé·e, sans effet » : réglé. → —
- **V5-Souvenir** · 8/10 · « La carte ne montre ni visages ni prénoms ». → —
- **V5-Partage** · 7/10 · « Citer le lieu » (option) le soir même = position en direct d'un groupe identifiable par ses pets. → « Citer le lieu » disponible seulement après endsAt + 12 h.
- **V5-Apres** · 9/10 · Ancien bloquant levé : boutons identiques, « Un problème ? » par ligne, non par défaut. → —
- **V5-Apres-resultats** · 8/10 · Seulement ses accords ; « Partager · pets seulement » mène à une carte qui ne protège pas (voir ci-dessous). → —
- **V5-Apres-aucun** · 9/10 · Neutre, rien sur les autres. → —
- **V5-Partage-accords** · 3/10 · **BLOQUANT** · « +1 DANS MA BANDE. +1 DUO. » avec la pigeonne Pia : tout membre du groupe sait que Pia = Sarah, donc que Sarah a voté ami·e ou plus pour Alex ; Léa (seul autre « oui » possible) sait que le duo est elle. La confidentialité du vote (décision A) fuit par le partage. → Pets génériques (silhouettes, jamais l'espèce réelle), aucun chiffre détaillé avant que les deux personnes concernées aient consenti au partage, ou carte sans pets.
- **V5-Bande** · 8/10 · Menu par ligne « Partir proprement, bloquer » : réglé. → —
- **V5-Duo** · 6/10 · « avec J. · 24–28 ans » : tranche centrée = âge exact (26) avant tout déblocage. → Grille fixe.
- **V5-Lien** · 8/10 · Drapeau Signaler en en-tête, « Partir proprement » : réglé. Pas de bandeau « pas de numéro ni de réseau » comme dans Groupe. → Même bandeau de modération.
- **V5-Lien-debloque** · 8/10 · Vocal facultatif, transcription, lecture dans l'app seulement : réglé. → —
- **V5-RdvDuo** · 8/10 · Après déblocage, lieu public, ange facultatif, check-in : réglé. Ange pré-sélectionné sur « Sam ». → Aucune présélection (cohérent avec « jamais par défaut »).
- **V5-Chat** · 9/10 · Signaler visible, « L'utiliser » pré-remplit au lieu d'envoyer : réglé. → —
- **V5-RdvDuo-lea** · 8/10 · Lieu différent de la sortie : réglé. Même présélection de Sam. → Idem.
- **V5-Oeuf** · 9/10 · Double activation indépendante, « Ne jamais me le proposer » : réglé. → —
- **V5-Rupture** · 9/10 · « Partir sans message · si tu ne te sens pas en sécurité » : réglé. → —
- **V5-Partage-semaine** · 7/10 · Annonce publique « jeudi, je sors » + pets du groupe + lien du quartier : calendrier public. « 4 inconnu·es » faux (Tom). → Ne pas citer le jour avant la sortie, ou différer la publication.
- **V5-Partage-invitation** · 5/10 · « VIENS JEUDI AVEC MOI ET TOM » sous « Sans visages ni prénoms » activé : prénom d'un tiers sans son accord ; en Story publique, la place de team va au premier inconnu qui clique, hors des filtres de composition. → Pas d'option Story pour une invitation de team ; lien nominatif à usage unique ; retirer le prénom de Tom.
- **V5-Partage-ville** · 8/10 · Agrégé, sans données personnelles. → —
- **V5-Story** · 8/10 · Filiation NGL retirée, 18+, désactivable : réglé. → —
- **W-Repondre** · 7/10 · « 18 ans et plus » est déclaratif (chip) ; URL blowy.app/alex = prénom, énumérable et collision. → Slug aléatoire ; case « J'ai 18 ans ou plus » avant les chips.
- **V5-Profil** · 8/10 · « Ton groupe voit : prénom, pronom, tranche d'âge… » : réglé. → —
- **V5-Fiche** · 9/10 · Fiabilité privée, retrait sécurité jamais compté : réglé. → —
- **V5-Tarifs** · 8/10 · Rien ne s'achète en visibilité. → —
- **V5-Abonnement** · 8/10 · Offre de rétention supprimée : réglé. → —
- **V5-Paiement** · 9/10 · — → —
- **V5-Paiement-ok** · 9/10 · — → —
- **V5-Reglages** · 8/10 · « Aide · réponse sous 24 h » à côté d'un SLA de 1 h ailleurs : préciser que l'urgence passe par Signaler. → « Aide (non urgent) · 24 h ».
- **V5-Confidentialite** · 8/10 · Qui voit quoi, durées, retrait art. 9 : réglé. « ton âge exact » listé sous « Personne » alors que la tranche centrée le donne. → Grille fixe.
- **V5-Signaler** · 8/10 · Ancien bloquant levé. Manque 114 ; « Bloquer aussi » pré-coché sans explication. → Ajouter 114 ; « coché par défaut pour ta sécurité ».
- **V5-Supprimer** · 9/10 · Rétention légale des signalements : réglé. → —
- **V5-Chargement** · 9/10 · — → —
- **V5-Erreur-reseau** · 9/10 · « En danger : 17 ou 112 » même hors ligne : bien. → —
- **V5-Paiement-echec** · 9/10 · — → —
- **V5-Verif-echec** · 9/10 · Pièce regardée par un humain puis supprimée : réglé. → Durée de suppression chiffrée.
- **V5-Notifs-refus** · 9/10 · — → —
- **V5-Erreur-age** · 6/10 · Arrive après 13 écrans de données (dont art. 9) ; CTA principal « Corriger ma date » invite à mentir. → Date en 1re étape ; CTA « Fermer », « Je me suis trompé·e de date » en lien secondaire.
- **V5-Chats-vide** · 9/10 · — → —

## Les 3 changements qui feraient le plus monter ma note

1. Grille d'âge fixe (25–29, 30–34…) partout, et date de naissance en 1re question de l'onboarding, avant toute réponse art. 9 ; Consentement avant les sous-choix d'intention.
2. Cartes de partage vraiment anonymes : jamais les pets réels des autres (silhouettes), jamais de prénom de tiers, pas de Story publique pour une place de team, « citer le lieu » seulement après la sortie.
3. Visages à startsAt − 3 h avec filigrane du prénom de celui qui regarde ; le lieu peut rester à J-1 18 h. Réconcilier spec §2.5/§3 et concept-v5.1 E.16 dans un seul document.

## Je mets 10 si…

Je mets 10 si un audit croisé des 75 écrans contre « Qui voit quoi » (Confidentialité) ne trouve aucune donnée déductible au-delà de la promesse (âge exact, vote d'un tiers, prénom d'un tiers), si la date de naissance précède toute donnée sensible, si les visages arrivent au plus 3 h avant avec filigrane, et si spec et concept disent la même chose sur `photoRevealAt`.

## Sources

- [Boston Globe, 09/07/2024 — FTC contre NGL](https://www.bostonglobe.com/2024/07/09/business/ftc-anonymous-messaging-app-children-ngl)
- Interne : docs/product/concept-v5.1.md (A, C.12, E.16, G), spec-v5.md §2.5, §3.1
