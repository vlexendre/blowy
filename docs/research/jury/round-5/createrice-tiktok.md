# Jury tour 5 — createrice-tiktok (Créatrice TikTok (lifestyle, 180 k abonnés))

**Verdict** : Les cartes ont enfin chacune leur objet (enveloppe scellée, chevalet, table) et « Mes cartes » existe, mais je ne peux toujours pas filmer « ALORS, JEUDI ? » ni ma bande sans flouter, il n'y a aucun export vidéo, et la carte du vendredi doit écrire « 5 verres, 1 table » pour qu'on comprenne son dessin.

**Note globale : 9/10** (T1 5 · T2 7 · T3 8 · T4 9 · T5 9)

| Critère | Note |
|---|---|
| Compréhension | 9 |
| Charge cognitive | 9 |
| Envie | 9 |
| Vraie rencontre | 8 |
| Sécurité et confiance | 9 |
| Viralité | 9 |
| Argent | 8 |
| Finition visuelle | 8 |

## Suivi de mes reproches du tour 4

- **Un objet par jour (mercredi, vendredi)** : fait : enveloppe « lieu secret », chevalet orange ; vendredi : ronds autour d'une table légendés « 5 verres, 1 table ».
- **Mode capture sur Apres et Bande** : **pas fait** (T2, T3, T4).
- **Export vidéo 6 s** : **pas fait**.
- **Mes cartes dessiné** : fait (liste de pastilles, sans aperçu).
- **Carte pour « pas d'accord »** : fait (« On était 5 »).

## Contrôles

`node design/v5/check-facts.mjs` : 88 fichiers, 4 958 vérifications, 0 contradiction. `a11y-audit.mjs` : 88 écrans, 0 problème, contraste min 4,53:1. Ce qu'ils ne voient pas, vérifié à la main et par `scratchpad/jury-r5-experts/overflow.mjs` (texte hors de l'artboard, plages « nn–nn ans » / heures coupées) : **V5-Confirmation** a son lien « Partager « cette semaine, je sors » » rendu sous le cadre (bas 868 px > 844) et **V5-Toi** coupe « 26– / 29 ans ». check-facts ne compare pas les écrans à `spec-v5.md`, qui est resté en V5.3 (« alignée sur … concept-v5.3 », « Mardi 12 h », Blowy+ « achat intégré via RevenueCat », « 1 duo actif », bandeau « sortie entre amis pour toi » au §3 et au §12 n° 8).

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| V5-Welcome | 9 | « DES AMITIÉS, OU PLUS. EN VRAI, CETTE SEMAINE. » : hook lisible en 1 s. | — |
| V5-Ville | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Ville-bordeaux | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Toi | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Genre | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Pet | 8 | Les 5 pets côte à côte : plan « lequel tu prends ? » ; toujours aucun export « mon pet » (T3, T4). | Export 9:16 « mon pet ». |
| V5-Rencontrer | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Intention | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Consentement | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Toi-plus | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Dispos | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Eviter | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Erreur-age | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Trouvee | 9 | Mon plan du lundi, avec partage. | — |
| V5-Trouvee-lyon | 8 | Pas d'icône de partage : la carte du lundi n'existe pas à Lyon. | Même partage qu'à Paris. |
| V5-Sortie-lyon | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Confirmation-lyon | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Trouvee-banlieue | 8 | « UNE SORTIE À 17 MIN DE CHEZ TOI. » : super titre, pas de partage. | Partage. |
| V5-Sortie | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Team | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Partage-invitation | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Invite | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Compte | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Verif | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Notifs | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Sortie-inscrit | 8 | « Tu y vas. » : toujours pas d'animation exportable (T3, T4). | Micro-animation 1 s exportable. |
| V5-Accueil | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Accueil-discret | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Accueil-duo | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Pause | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Chats | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Groupe | 7 | « Ton dimanche idéal, en 3 mots ? » : super plan, mais les réponses des autres ne m'appartiennent pas (T3, T4). | Export « mes 3 mots » seuls. |
| V5-Groupe-menu | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Attente | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Partage-ville | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Amorcage | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Amorcage-solo | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Sortie-complete | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Sortie-annulee | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Affiner | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Affiner-histoire | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Confirmation | 8 | Le lien vers ma carte du mercredi est sous le cadre : je ne le trouve pas. | Remonter le lien. |
| V5-Partage-confirmation | 9 | Enveloppe scellée « lieu secret », « Cette semaine / Demain » dessinés : enfin un objet à elle. | — |
| V5-Revelation | 9 | « Partager « je sors ce soir » » à 16 h 40 : logique. | — |
| V5-Partage-checkin | 9 | Chevalet orange « Blowy », vert canard : reconnaissable en 0,5 s. | — |
| V5-Ange | 9 | Rien à filmer ici, et c'est normal. | — |
| W-Ange | 8 | Contenu sécurité ; adresse à flouter. | — |
| W-Ange-aide | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Checkin | 8 | Le code ne doit jamais être filmé ; pas de mode capture. | — |
| V5-Checkin-ok | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Souvenir | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Apres | 6 | « ALORS, JEUDI ? » = mon meilleur plan storytime, toujours 3 prénoms à flouter (T2, T3, T4). | Mode capture : silhouettes à la place des prénoms. |
| V5-Apres-resultats | 8 | « Écrire à Léa » d'abord : normal ; écran infilmable (prénoms). | Mode capture. |
| V5-Partage | 8 | « 5 verres, 1 table » écrit dans le dessin : les ronds sont les pastilles du Welcome, ils ne lisent pas comme des verres. | Verres dessinés vus de haut (pied, liquide), sans légende. |
| V5-Partage-dimanche | 8 | Raton + trois boules : pas d'objet du dimanche. | Un objet propre (porte de Ta rue qui s'ouvre, clé). |
| V5-Apres-aucun | 9 | Carte « On était 5 » proposée : réglé. | — |
| V5-Bande | 7 | Prénoms sous les pets, pas de mode capture (T4). | Mode capture sans prénoms. |
| V5-Rue | 9 | Panneau « Café des Oiseaux » dessiné : le timbre a disparu. | — |
| V5-Duo | 8 | Ressemble encore à une app de dating. | — |
| V5-Lien | 8 | Messages privés. | — |
| V5-Lien-debloque | 7 | Visage et vocal d'une autre : interdit à l'écran. | — |
| V5-RdvDuo | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Chat | 7 | Messages privés. | — |
| V5-RdvDuo-lea | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Oeuf | 8 | Pas exportable, et c'est voulu. | — |
| V5-Rupture | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Cartes | 8 | Liste de pastilles de couleur : je ne vois pas mes 7 cartes. | Grille de vignettes 9:16. |
| V5-Story | 9 | « Autres cartes › » mène enfin quelque part. | — |
| W-Repondre | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Profil | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Fiche | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Tarifs | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Abonnement | 9 | « Toutes tes sorties, 1 par semaine » : explicable en 5 s. | — |
| V5-Paiement | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Paiement-ok | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Reglages | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Confidentialite | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Signaler | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Supprimer | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Chargement | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Erreur-reseau | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Paiement-echec | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Verif-echec | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Notifs-refus | 9 | Rien à filmer ici, et c'est normal. | — |
| V5-Chats-vide | 9 | Rien à filmer ici, et c'est normal. | — |
| L-Effectif | 8 | « Le bar qui reçoit 5 inconnus » est un vrai sujet, mais prénoms à l'écran. | — |
| L-Creneaux | 9 | Rien à filmer ici, et c'est normal. | — |
| L-Contrat | 9 | Rien à filmer ici, et c'est normal. | — |

## Les 3 changements qui feraient monter ma note le plus

1. Mode capture (silhouettes, aucune sélection visible) sur Apres, Apres-resultats et Bande.
2. Export vidéo de 6 s (pet choisi → « Tu y vas. » → chevalet du jeudi).
3. Mes cartes en grille de vignettes 9:16 ; verres vraiment dessinés sur « On était 5 » (sans légende) ; un objet du dimanche.

## Je mets 10 si…

Je mets 10 si je tourne lundi → dimanche entièrement depuis des exports de l'app, sans flouter un visage, un prénom ou un lieu, avec sept cartes dont le dessin se comprend sans légende, un mode capture sur « ALORS, JEUDI ? » et Ta bande, et au moins un export vidéo de quelques secondes.
