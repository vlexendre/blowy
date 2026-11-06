# Jury tour 6 — growth-lead (Growth lead (ex-Hinge, ex-BeReal))

**Verdict** : La boucle hebdo a maintenant un partage à chaque marche (Trouvée Paris, Lyon, Saint-Denis, Confirmation, visages, dimanche) et un parrainage qui paie (sortie offerte), mais V5-Chargement promet « lundi à 21 h » à quelqu'un dont le samedi est composé le mercredi, Mes cartes montre 9 dégradés vides au lieu des aperçus promis, et rien n'est encore mesuré.

**Note globale : 9/10** (T1 5 · T2 7 · T3 8 · T4 9 · T5 9 · T6 9)

| Critère | Note |
|---|---|
| Compréhension | 9 |
| Charge cognitive | 9 |
| Envie | 9 |
| Vraie rencontre | 8 |
| Sécurité et confiance | 9 |
| Viralité | 9 |
| Argent | 8 |
| Finition visuelle | 9 |

## Suivi de mes reproches du tour 5

- **Spec en V5.4/V5.5 (T5 n° 1)** : fait (révision 5 : J − 3 21 h, 3 duos, Stripe Billing, bandeau retiré). Le code reste à « mardi 12 h » (écart E1 §11.4, ouvert) : le moteur n'a pas encore la boucle que les écrans montrent.
- **Duo hors du point de décision (T5 n° 2)** : **pas fait**, 4e tour : V5-Rencontrer met encore trois formats à égalité au 5/9.
- **Mes cartes en vignettes avec lien, partage sur Confirmation / Trouvée Lyon / Saint-Denis (T5 n° 3)** : partage fait partout (icône en haut à droite, « Partager ma semaine ») ; Mes cartes en grille 9:16 fait, **mais les vignettes sont des dégradés sans contenu** et aucun lien n'est visible.
- **Bordeaux : compte utile au lieu de « 64 vérifiés »** : fait à moitié : « environ 40 inscrits ont entre 18 et 25 ans » sur V5-Attente, au-dessus d'une sortie… en 26–34 ans.
- **Nouveau** : V5-Chargement « lundi à 21 h » faux pour un créneau du samedi ; « Viens jeudi prochain » sur la carte du vendredi promet ce que la composition ne garantit pas.

## Contrôles

`node design/v5/check-facts.mjs` : 97 fichiers, 6 039 vérifications, 0 contradiction. `a11y-audit.mjs` : 97 écrans, 1 423 textes, 538 cibles, 1 462 blocs mesurés, 0 problème, contraste min 4,53:1. `tooling/qa/layout/overflow.mjs` : aucun signalement (ni texte hors cadre, ni plage coupée). Ce que ces outils ne voient pas, relevé à la main sur les rendus et les sources : (1) la règle d'annulation canonique, présente sur 8 écrans, met « ta sécurité » sous la parenthèse « chacun 1 fois par mois, sans pénalité, place non remboursée », alors que spec §2.7 dit `SAFETY_EXIT` « à tout moment, remboursée » et que V5-Groupe-menu dit « Pour ta sécurité, toujours » ; (2) « les soirs de sortie » subsiste pour le délai d'1 h (V5-Groupe-menu, V5-Signaler) alors que l'astreinte couvre maintenant samedi 15 h, dimanche 11 h et les rendez-vous ; (3) spec révision 5 ≠ écrans sur la fiabilité (§3.1 et §2.13 : visible du groupe et du duo ; V5-Fiche : « Toi seul vois ce chiffre »), le vote (§2.11 « Non par défaut » ; V5-Apres : aucun état), Blowy+ (§6.2 « rentable dès la 2ᵉ sortie » ; V5-Abonnement : « 3 sorties par mois », et 2 × 4,99 = 9,98 < 9,99) ; (4) `business-model.md` est encore titré V5.4 : astreinte « 18 h à 2 h … par soir et par ville », point mort par ville, aucune ligne tables à deux, parrainage, imprévu ni « Blowy annule », alors que concept-v5.5 §D.13 et spec §10.1 renvoient à un calcul national qui n'existe pas ; (5) V5-Chargement promet « lundi à 21 h » quel que soit le créneau (samedi composé le mercredi 21 h, spec §1.1) ; (6) L-Effectif additionne 4,99 € (TTC) et 3 € = 7,99 €, le contrat dit 4,16 € HT, la spec §6.5 un « total HT » ; « par place réservée » (L-Effectif, spec) contre « par place prévue » (L-Contrat, V5-Sortie-annulee) ; (7) V5-Lien : rendez-vous « Quand vous voulez » contre V5-Duo-hh « Dans un lieu partenaire, à une heure couverte par l'équipe » ; (8) V5-Dispos-semaines « 28 déc.... » (quatre points).

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction attendue |
|---|---|---|---|
| V5-Welcome | 9 | « Une sortie dès 5 personnes, partout » : promesse d'acquisition forte que business-model ne finance pas (astreinte encore chiffrée « par ville »). | Adosser « partout » à l'astreinte nationale chiffrée. |
| V5-Ville | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Ville-bordeaux | 9 | « Environ 60 inscrits » alors que facts.json compte 64 personnes **vérifiées** : inscrit ≠ vérifié, le chiffre utile pour former une sortie est le second. | « Environ 60 personnes vérifiées ». |
| V5-Toi | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Genre | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Pet | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Rencontrer | 8 | 4e tour : « À deux, par écrit » à égalité avec « En petit groupe » au 5/9 ; la voie Duo n'a ni « venir avec quelqu'un » ni carte, donc aucun coefficient viral. | Duo proposé après la 1re sortie vécue, ou A/B mesuré sur cet écran. |
| V5-Intention | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Consentement | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Toi-plus | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Dispos | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Dispos-semaines | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Eviter | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Erreur-age | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Trouvee | 9 | Écran juste (5/5 au test). Moitié basse vide de 1 100 à 1 430 px : la place idéale pour « Inviter quelqu'un à venir avec toi » en carte, pas en lien texte. | Remonter l'invitation en carte. |
| V5-Trouvee-lyon | 9 | « Et la semaine d'après : mar. 24 nov. · Atelier céramique » annoncé avant toute composition de cette semaine-là : si elle n'a pas lieu, c'est une promesse cassée dans la ville d'amorçage. | « Probablement » ou rien avant J − 3. |
| V5-Sortie-lyon | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Confirmation-lyon | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Trouvee-banlieue | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Sortie-banlieue | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Confirmation-banlieue | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Pas-encore | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Sortie | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Team | 9 | Parrainage clair (« ta prochaine sortie est offerte, 1 par mois au plus ») ; bouton « GARDER LA PLACE DE TOM (30 MIN) » plein bord (≈ 8 pt de marge). | Libellé plus court. |
| V5-Partage-invitation | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Invite | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Compte | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Verif | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Notifs | 9 | « lun. 21:00 » juste pour un jeudi seulement. | Exemple daté par créneau. |
| V5-Sortie-inscrit | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Accueil | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Accueil-discret | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Accueil-duo | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Pause | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Chats | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Groupe | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Groupe-menu | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Attente | 8 | Bandeau « À Bordeaux, environ 40 inscrits ont entre 18 et 25 ans » au-dessus d'une sortie « en 26–34 ans » : le chiffre ne concerne pas la sortie affichée et laisse croire qu'on est dans la mauvaise ville. | Indicateur de la tranche de la sortie, ou aucun. |
| V5-Partage-ville | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Amorcage | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Amorcage-solo | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Sortie-complete | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Sortie-annulee | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Affiner | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Affiner-histoire | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Affiner-age | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Affiner-ambiance | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Confirmation | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Partage-confirmation | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Revelation | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Partage-checkin | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Ange | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| W-Ange | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| W-Ange-aide | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Checkin | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Checkin-ok | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Souvenir | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Apres | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Apres-resultats | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Partage-jeudi | 9 | Mode capture et « Vidéo 5 s » faits ; aucun aperçu de la vidéo avant export. | Aperçu 5 s jouable. |
| V5-Partage | 8 | Lien « Viens jeudi prochain » : un inscrit du vendredi n'a pas de sortie garantie jeudi (créneaux, densité, J − 3). Dessin toujours légendé « 5 verres, 1 table ». | « Trouve ta sortie » ; verres dessinés comme sur V5-Souvenir. |
| V5-Partage-dimanche | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Apres-aucun | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Bande | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Partage-bande | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Rue | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Duo | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Lien | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Duo-hh | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Lien-debloque | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-RdvDuo | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Chat | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-RdvDuo-lea | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Oeuf | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Rupture | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Cartes | 7 | 9 vignettes = 9 dégradés vides : ni titre dessiné, ni objet, ni lien ; concept §D.11 demande « aperçus réels ». | Miniature réelle de chaque carte + slug. |
| V5-Story | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| W-Repondre | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Profil | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Fiche | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Tarifs | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Abonnement | 8 | « Rentable à partir de 3 sorties par mois » (juste) ; spec §6.2 dit « dès la 2ᵉ » : on mesurera contre une hypothèse fausse. | Aligner la spec ; mesurer la part d'abonnés. |
| V5-Paiement | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Paiement-ok | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Reglages | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Confidentialite | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Signaler | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Supprimer | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Chargement | 7 | « Ta proposition arrive lundi à 21 h » : Alex a « jeu. soir, sam. après-midi » (Réglages) ; le samedi est composé le mercredi 21 h (spec §1.1). Faux pour la moitié de ses créneaux. | Heure calculée : « ta prochaine proposition arrive {jour} à 21 h ». |
| V5-Erreur-reseau | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Paiement-echec | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Verif-echec | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Notifs-refus | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| V5-Chats-vide | 8 | « Voir ma proposition » alors qu'il n'y en a peut-être pas encore (T5, non traité). | « Voir quand arrive ma proposition ». |
| L-Effectif | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| L-Creneaux | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |
| L-Contrat | 9 | Rien qui freine l'acquisition sur cet écran ; le 10 dépend de mesures (taux par slug, chute au selfie) que la maquette ne peut pas montrer. | Mesurer dans le test de 8 semaines. |

## Les 3 changements qui feraient monter ma note le plus

1. V5-Chargement et les notifications calculés par jour de créneau (J − 3 21 h), et le moteur aligné (écart E1 fermé) : une seule heure, juste, partout.
2. Mes cartes avec de vraies miniatures et le slug de chacune ; « Viens jeudi prochain » remplacé par une promesse tenable.
3. Duo proposé après la 1re sortie vécue (ou A/B mesuré) pour que chaque nouvel inscrit passe d'abord par le canal qui invite.

## Je mets 10 si…

Je mets 10 si le test de 8 semaines mesure dans le 11e Welcome → 1re sortie vécue ≥ 25 % et une chute au selfie < 30 %, si chaque sortie vécue produit ≥ 0,3 inscrit vérifié attribué par slug, si le parrainage « sortie offerte » est mesuré (part des 1res sorties venues par un lien), si Bordeaux passe de « il manque 2 » à une sortie vécue en moins de 3 semaines, et si l'heure de proposition est calculée J − 3 21 h à l'identique dans le moteur, la spec et chaque écran (Chargement compris).
