# Jury V5 · tour 1 · Responsable Trust & Safety

**Verdict.** Les fondations sont meilleures que celles de la plupart des apps de rencontre (lieu public partenaire, révélation simultanée, ange gardien sans app, check-in sans stockage de position), mais la maquette contredit la spec sur trois points qui exposent des personnes réelles : le bouton « Plus » qui disparaît selon les préférences de l'autre, l'âge exact, et un parcours de signalement pensé pour le chat, pas pour une agression dans un bar.

**Note globale : 4/10**

| Critère | Note | Pourquoi |
|---|---|---|
| Compréhension (5 s) | 7 | Les promesses de confidentialité sont répétées avec les mêmes formules (Trouvée, Groupe, Vérif, Confidentialité) : bon. |
| Charge cognitive | 6 | Le parcours sécurité (ange gardien → check-in → alerte → faux appel) est lisible ; « Alerte discrète » est trop petit. |
| Envie (J+1/J+7/J+30) | 6 | La sécurité visible rassure les femmes, sans qui il n'y a pas de groupes mixtes. |
| Vraie rencontre (2 semaines) | 6 | Rencontre en lieu public, en groupe, avec horaire fixe : le meilleur format de première rencontre du marché. |
| Sécurité et confiance | 4 | README §Écarts : « Plus n'apparaît que si les deux préférences sont compatibles » = fuite d'orientation (art. 9 RGPD) ; âge exact affiché alors que la spec prévoit une tranche ; aucun motif « agression / comportement pendant la sortie / mineur / demande d'argent » ; réponse « sous 24 h » pour un incident IRL ; lien ange gardien à slug devinable. |
| Viralité / distribution | 4 | La story « 3 mots » anonyme ouverte au web public, sans contrôle d'âge, rappelle NGL (sanctionnée par la FTC en 2024) ; la story Sortie « sans visages » est la bonne direction. |
| Argent | 6 | Aucun dark pattern visible ; mais l'état de rétention « −50 % · L. continue d'en profiter » est encore dans la source et culpabilise via une tierce personne. |
| Finition visuelle | 6 | Les écrans d'alerte (rouge, deux actions) sont justes ; les infos critiques du jour J (adresse) sont en blanc sur rose peu contrasté. |

## Lecture d'ensemble

Je juge contre trois scénarios réels : (1) **stalking** : quelqu'un s'inscrit pour retrouver une personne précise du 11e ; (2) **agression ou pression sexuelle** pendant ou après une sortie ; (3) **outing** : une personne LGBT+ ou en couple découverte par un proche. Et contre le cadre légal : RGPD art. 9 (orientation, vie sexuelle), DSA art. 16 (mécanisme de notification et action) et art. 28 (protection des mineurs), et l'obligation d'âge 18+.

Contradictions maquette ↔ spec qui doivent être tranchées en faveur de la spec :
- **Vote « Plus »** : README V5 dit que le bouton n'apparaît que si « genre × qui je rencontre » sont compatibles des deux côtés. Si Alex voit « Plus » pour Léa mais pas pour Sarah (deux femmes), il apprend que Sarah ne cherche pas d'hommes. La spec §2.10 dit l'inverse (« dépend uniquement de soi : aucune fuite sur la cible ») : c'est la spec qui a raison.
- **Âge** : spec §3.1 « prénom, tranche d'âge » ; maquettes « Léa, 27 », « Malo, 29 », « Jade, 26 », « N., 28 ans ». Confidentialité propose « Masquer mon âge exact », désactivé par défaut.
- **Statut d'arrivée** : spec « jamais d'étiquette absent·e » ; Check-in-ok affiche « Malo · en route ».
- **Signalement** : spec prévoit `SAFETY_EXIT` et `SYSTEM_REMOVAL` ; aucun écran ne montre « quitter la sortie maintenant, remboursé·e ».
- **Lien ange gardien** : spec jeton aléatoire 32 octets ; maquette `blowy.app/ange/alex-k7r` (prénom + 3 caractères, énumérable).

## Reproches du tour V4 (panel personas) : statut

- Templates de story « On s'est vus » / « Naissance » (risque d'outing, Yanis) : **retirés**. Réglé.
- Genre et orientation jamais demandés : **réglé** (V5-Toi, V5-Toi-plus), mais la fuite se déplace dans le vote.
- Position floutée à 500 m mais distances affichées : **réglé** (aucune carte, aucune distance) ; reste « près de toi » sur V5-Toi-quartier.
- Catégorie de signalement LGBTphobie : **ajoutée**. Manquent agression physique, pression sexuelle, mineur, arnaque.
- Révélation incohérente (niveau 4 vs 5) : **réglé** (une seule règle par mode).

## Écran par écran

Format : note · problème → correction attendue. `BLOQUANT` = suffit à me faire refuser.

- **V5-Welcome** · 7/10 · Pas de mention 18+ ni de vérification ; « Ami·e ou plus ? Tu le dis en secret » : bonne promesse. → Ajouter « 18 ans et plus · selfie vérifié pour tous » sous le CTA.
- **V5-Invite** · 6/10 · Le lien d'invitation affiche le prénom d'Alex et son créneau à quiconque reçoit le lien (transféré, posté) ; aucun avertissement que l'invité·e passera aussi le selfie. → Lien nominatif à usage unique et expirant ; afficher « selfie vérifié obligatoire pour venir ».
- **V5-Craft** · 7/10 · Rien de sensible. → —
- **V5-Vie** · 7/10 · Questions anodines ; vérifier qu'aucune réponse « vision » ne sert de proxy à religion/orientation. → Revue des 4 questions par T&S avant lancement.
- **V5-Intention** · 5/10 · Les deux cases semblent cochées par défaut : « Plus » est une donnée qui révèle l'intimité, elle ne doit jamais être pré-cochée ; aucun consentement explicite art. 9 visible. → Aucune case par défaut ; consentement explicite séparé avant l'écran « En plus, tu veux rencontrer… » (spec `ProcessingConsent SENSITIVE_PREFERENCES`).
- **V5-Toi** · 7/10 · « Ton groupe voit seulement ton pronom » : bien ; « Autre mot ? Je l'écris » = champ libre à modérer (insultes, données). → Liste fermée + « Je préfère ne pas dire » ; modération du champ libre.
- **V5-Toi-plus** · 5/10 · **BLOQUANT** · Écran correct en soi, mais il alimente la règle README « Plus n'apparaît que si compatibles », qui révèle l'orientation des autres membres du groupe par l'absence du bouton. → Appliquer la spec §2.10 : « Plus » visible selon mes seules préférences ; la compatibilité est résolue en silence au dépouillement.
- **V5-Toi-quartier** · 6/10 · « près de toi » sous Paris 11e suggère une géolocalisation non consentie. → Retirer ; aucune permission de localisation avant le check-in.
- **V5-Eclosion** · 7/10 · — → —
- **V5-Eclosion-ne** · 7/10 · — → —
- **V5-Compte** · 5/10 · « 18 ans minimum » en mention légale grise ; aucune saisie de date de naissance à l'écran alors que la spec l'exige (« date de naissance 18+ ») ; « C'est moi · 28 ans » dans la feuille Apple : Apple ne fournit pas l'âge. → Écran date de naissance explicite, blocage < 18 ans, et contrôle d'âge au selfie (estimation d'âge) avant la 1re sortie.
- **V5-Trouvee** · 7/10 · Initiales + pronoms + pets : bon niveau d'information avant confirmation ; « En commun : jamais ghoster » rassure. → Ajouter « tranche d'âge du groupe » pour que chacun sache où il met les pieds.
- **V5-Sortie** · 7/10 · Lieu public partenaire, lieu exact la veille, ange gardien : bien ; ne dit pas qu'on peut partir à tout moment remboursé·e (spec `SAFETY_EXIT`). → Ligne « Mal à l'aise ? Tu pars quand tu veux, remboursé·e, sans effet sur ta fiabilité ».
- **V5-Sortie-inscrit** · 7/10 · « Choisir mon ange gardien » en lien secondaire : il devrait être proposé une fois, fortement. → Proposer l'ange gardien juste après l'inscription (écran dédié, sautable).
- **V5-Sortie-complete** · 6/10 · Montre le groupe (pets + initiales + pronoms) d'une sortie à laquelle je ne participe pas : contraire à la spec §3.1 (« ma place n'est pas active : ✗ »). → Ne rien montrer du groupe d'une sortie non confirmée.
- **V5-Sortie-annulee** · 6/10 · Idem : le groupe reste affiché après annulation ; « Dire au revoir au groupe » ouvre un canal après la fin de la relation. → Masquer le groupe ; message d'au revoir pré-écrit, sans réponse possible.
- **V5-Verif** · 6/10 · « Le selfie sert à vérifier, il n'est montré à personne » : bien. Mais aucune détection du vivant ni comparaison avec les photos (« Tes photos » floutées peuvent être celles de quelqu'un d'autre). → Vérification de vivacité + correspondance selfie ↔ photo publiée, refus si non concordant ; mention de la durée de conservation du selfie.
- **V5-Notifs** · 8/10 · Mode discret annoncé dès l'opt-in : excellent contre l'outing par l'écran verrouillé. → Proposer d'activer le mode discret ici en un tap.
- **V5-Accueil** · 7/10 · Bulle « Jeudi, on sort ! » visible sur l'écran d'accueil : en mode discret, la carte devrait aussi être neutre. → Mode discret = textes neutres in-app au premier écran aussi.
- **V5-Attente** · 7/10 · Compteur agrégé, aucune position individuelle : conforme. → —
- **V5-Chats** · 7/10 · « Rien n'est public » : bien ; aperçu de message « Inès : qui vient jeudi avec Alex ? » visible sans verrouillage. → Option d'aperçus masqués.
- **V5-Groupe** · 5/10 · Chat libre entre inconnu·es avant toute vérification visuelle, sans accès visible à Signaler/Bloquer/Quitter ; spec : texte seul, modération : rien n'indique à l'utilisateur que les messages sont modérés. → Menu « … » avec Signaler, Bloquer, Quitter la sortie ; bandeau « messages modérés · pas de numéros ni de réseaux avant jeudi » + filtre automatique des numéros/handles.
- **V5-Revelation** · 5/10 · Prénom + âge exact + photo + adresse exacte à 9 h : 10 h d'avance pour qu'un inscrit malveillant cherche la personne sur Instagram ; aucune protection capture d'écran. → Tranche d'âge, révélation à startsAt − 3 h maximum (spec `photoRevealAt`), filigrane nominatif sur les visages, alerte capture d'écran au groupe.
- **V5-Ange** · 7/10 · Liste « reçoit / jamais » exemplaire ; mais aucune réflexion sur le contrôle coercitif (un conjoint qui exige d'être l'ange gardien et voit chaque sortie). → Ange gardien optionnel par sortie, révocable sans notification, jamais imposé par défaut sur toutes les sorties.
- **W-Ange** · 5/10 · **BLOQUANT** · URL `blowy.app/ange/alex-k7r` = prénom + 3 caractères : énumérable ; la page donne nom du café, adresse et horaire d'une personne identifiée à quiconque devine ou reçoit le lien transféré. → Jeton aléatoire 32 octets (spec §2.9), page `noindex`, expiration à endsAt + 3 h, et « Ce lien ne m'est pas destiné » qui le révoque.
- **W-Ange-alerte** · 7/10 · Deux actions claires ; « dernier lieu connu » = check-in de 19:32, potentiellement 1 h 30 plus tôt ; « équipe blowy prévenue » sans délai annoncé. → Afficher l'heure de la dernière info en gros, joindre la position de l'alerte si partagée (spec), « l'équipe te rappelle sous 5 min » avec un vrai SLA.
- **V5-Checkin** · 7/10 · Position ponctuelle, non stockée : bien. « Alerte discrète » trop petite et sans explication de ce qu'elle fait. → Bouton 44 pt ; une phrase : « prévient Sam et notre équipe, sans bruit ».
- **V5-Checkin-ok** · 6/10 · « Malo · en route » publie un état non vérifié (et la spec interdit l'étiquette d'absence) ; « Faux appel » et « Alerte » de même taille côte à côte : erreur de tap. → « Pas encore là » ou rien ; alerte à confirmation par appui long ; ajouter « Je pars, je me sens mal à l'aise » (SAFETY_EXIT).
- **V5-Souvenir** · 7/10 · « Partager la story · sans visages ni prénoms » : la bonne règle. → Vérifier techniquement que la carte ne contient ni nom du café avant endsAt + 12 h (géolocalisation en direct).
- **V5-Apres** · 4/10 · **BLOQUANT** · Aucun chemin « Signaler » depuis le vote, alors que c'est le moment où une victime repense à la soirée ; la règle README du bouton « Plus » conditionnel fuit l'orientation ; pas de « je ne veux plus jamais la recroiser » (blocage silencieux). → Bouton « Un problème avec cette personne ? » sur chaque carte → signalement + blocage, sans que l'autre le sache ; « Plus » selon mes seules préférences.
- **V5-Apres-resultats** · 7/10 · Seuls les accords mutuels, pas de « non » : conforme. → Le libellé « Plus · réciproque » doit être neutre en mode discret.
- **V5-Bande** · 7/10 · Liste égocentrée, provenance visible : bien. → Action « Partir proprement » et « Bloquer » accessibles par glissement sur chaque ligne.
- **V5-Chat** · 6/10 · « Signaler ou bloquer » caché dans le menu « … » ; vocal actif dès l'accord (harcèlement vocal non modérable automatiquement). → Signaler visible en en-tête ; vocal activable par chacun, désactivé par défaut.
- **V5-Duo** · 6/10 · « avec J., 26 ans » : âge exact avant toute vérification mutuelle ; 3 propositions max : bien. → Tranche d'âge jusqu'au déblocage.
- **V5-Lien** · 7/10 · « Rien ne se débloque si un seul des deux parle » : bon garde-fou contre le voyeurisme. → Filtre numéros/réseaux pendant l'échange entre pets.
- **V5-Lien-debloque** · 6/10 · Le vocal de 12 s est réécoutable et enregistrable : risque de diffusion. → Lecture seule dans l'app, pas d'export, filigrane audio.
- **V5-RdvDuo** · 5/10 · Rendez-vous proposé le samedi 15 à 18 h alors que les visages ne sont débloqués qu'à 20 h : on accepte un tête-à-tête sans avoir vu la personne. → Interdire tout créneau avant le déblocage ; rappeler « lieu public, tu peux partir à tout moment ».
- **V5-RdvDuo-lea** · 7/10 · Lieu public partenaire, check-in, alerte actifs par défaut : bien. → Proposer un lieu différent de celui de la sortie de groupe (le groupe sait où il est).
- **V5-Oeuf** · 7/10 · Pas d'exclusivité, non secret, double accord : bien. → —
- **V5-Rupture** · 6/10 · Message présélectionné ; « Ghoster, c'est elle qui baisse » est faux et met la pression pour envoyer un mot à quelqu'un dont on a peur. → Lien direct « Partir sans message » si la personne a été signalée/bloquée ; corriger le texte.
- **V5-Story** · 4/10 · « Décris-moi en 3 mots · Anonyme » + « ngl, mais en mieux » : on revendique la filiation avec NGL, sanctionnée par la FTC (2024) pour faux messages et ciblage des mineurs. → Retirer la référence NGL ; réponses non anonymes ou limitées aux contacts ; aucune collecte sur la page web sans âge déclaré.
- **W-Repondre** · 5/10 · Page publique `blowy.app/alex` : n'importe qui (mineur compris) répond sans compte ; « beau sourire » ouvre la porte aux remarques physiques ; « Je ne dirai à personne que c'est toi » promet un anonymat qu'un ordre judiciaire peut lever. → « 18+ ? » sur la page, mots physiques retirés, promesse exacte (« Alex ne saura pas que c'est toi »), lien désactivable à tout moment.
- **V5-Profil** · 7/10 · « selfie vérifié » visible : bien. → —
- **V5-Fiche** · 6/10 · « Fiabilité · visible par ton groupe » : une absence peut venir d'un retrait de sécurité ; la spec l'exclut, l'écran ne le dit pas. → « Un retrait pour ta sécurité ne compte jamais ».
- **V5-Boutique** · 7/10 · « Ne s'achète jamais : plus de visibilité » : bon garde-fou contre le pay-to-reach. → —
- **V5-Reglages** · 6/10 · Mode discret désactivé par défaut ; ange gardien « Sam · par SMS » par défaut sur toutes les sorties. → Mode discret proposé à l'onboarding ; ange gardien choisi sortie par sortie.
- **V5-Abonnement** · 6/10 · État de rétention « L. continue d'en profiter aussi » présent dans le code : utilise un tiers pour culpabiliser. → Supprimer.
- **V5-Confidentialite** · 5/10 · « Masquer mon âge exact » désactivé par défaut ; aucune ligne pour retirer le consentement aux données sensibles (genres recherchés) ; pas de liste des données conservées et durées. → Âge en tranche par défaut ; « Retirer mon consentement “plus” » ; tableau des durées (selfie, bulletins 7 j, position jamais).
- **V5-Signaler** · 4/10 · **BLOQUANT** · Motifs pensés pour le chat (Faux profil, Messages déplacés, Harcèlement, Propos haineux, Autre) : rien pour « agression ou geste déplacé pendant la sortie », « pression sexuelle », « mineur », « demande d'argent / arnaque », « m'a suivi·e après » ; « Messages déplacés » présélectionné ; « réponse en moins de 24 h » pour un incident physique ; « Léa ne saura pas que c'est toi » est intenable dans un duo à deux. → Motifs IRL en tête, rien de présélectionné, voie urgente (rappel humain sous 1 h, lien 17/112, 3919), promesse honnête (« on ne lui dit pas qui a signalé ») et preuve (capture, heure).
- **V5-Supprimer** · 7/10 · Conséquences claires, pause proposée, suppression sous 30 j. → Préciser que les signalements reçus et la vérification sont conservés le temps légal (sinon ré-inscription d'un banni).

## Les 3 changements qui feraient le plus monter ma note

1. Appliquer la spec contre le README : bouton « Plus » selon mes seules préférences, âge en tranche par défaut, aucun statut « en route », jeton ange gardien aléatoire, aucune info de groupe hors place confirmée.
2. Refaire le signalement pour l'IRL : motifs physiques et sexuels en tête, accès depuis Groupe, Check-in-ok, Après (vote) et chaque ligne de bande ; voie urgente avec SLA humain ; écran « Je pars maintenant » (SAFETY_EXIT, remboursé, sans effet sur la fiabilité).
3. Âge et identité : date de naissance saisie, estimation d'âge + vivacité au selfie, correspondance selfie/photo, filigrane et alerte capture sur les visages révélés, révélation à 3 h de la sortie plutôt qu'à 9 h.

## Je mets 10 si…

Je mets 10 si un audit croisé maquette ↔ spec §3 (qui voit quoi) ne trouve aucune donnée affichée au-delà de la spec, si le signalement couvre les incidents physiques avec une réponse humaine en moins d'une heure pendant les créneaux de sortie, si le consentement art. 9 est explicite et révocable à l'écran, et si l'âge 18+ est vérifié avant la première sortie, pas seulement déclaré.

## Sources

- [Boston Globe, 09/07/2024 — la FTC interdit NGL aux moins de 18 ans (faux messages, accord à 5 M$)](https://www.bostonglobe.com/2024/07/09/business/ftc-anonymous-messaging-app-children-ngl)
- Spec interne `docs/product/spec-v5.md` §2.6 (SAFETY_EXIT, SYSTEM_REMOVAL), §2.9 (GuardianLink), §2.10 (vote), §3.1 (visibilité), §2.15 (consentement art. 9).
