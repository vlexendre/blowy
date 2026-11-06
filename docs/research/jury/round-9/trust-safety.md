# trust-safety — tour 9

**Verdict** : Fiabilité, numéros et sortie tombée à 18 h sont réglés partout ; restent deux écarts de confiance que je ne laisse pas passer : le prénom du duo arrive aux visages et non au double oui comme promis, et l'ange choisi reste invisible avant l'envoi du rendez-vous.

**Note globale : 9/10** (T7 9 → T8 9 → T9 9)

| Compréhension | Charge cognitive | Envie | Vraie rencontre | Sécurité | Viralité | Argent | Finition |
|---|---|---|---|---|---|---|---|
| 10 | 10 | 10 | 10 | 9 | 10 | 10 | 9 |

Évolution par critère (T7 → T8 → T9) : comprehension 9→9→10 · cognitive 9→9→10 · desire 9→9→10 · meet 9→9→10 · safety 8→9→9 · virality 9→9→10 · money 9→9→10 · visual 9→9→9.

Outils lancés : `node design/v5/check-facts.mjs` → 106 fichiers, 9 066 vérifications, 0 contradiction ; `NODE_PATH=$(npm root -g) node design/v5/a11y-audit.mjs .local/dc-runtime.js` → 106 écrans, 1 698 textes, 588 cibles, 0 problème, contraste min 4,53:1 (sans le runtime en argument : 2 faux positifs, contraste 1,00:1 sur un gabarit non rendu, comme au tour 8) ; `node tooling/qa/layout/overflow.mjs` → aucun signalement. Aucun de ces outils ne voit : l'initiale du duo après le double oui, les vignettes d'aperçu (exclues via `data-miniature`), l'ange non sélectionné, les écarts spec/business-model.

## Vérification point par point de mes reproches des tours 7 et 8

Tour 7 : les points de mon rapport T7 étaient réglés au tour 8 (voir round-8/trust-safety.md) et le restent. Tour 8 :

| Point T8 | État au tour 9 |
|---|---|
| F1 Profil « visible par toi seulement » | réglé (tuile et ligne Nino), contrôlé par check-facts |
| F2 Prénom du duo : spec = écrans | non réglé dans les faits : Confidentialité et Duo disent « au double oui », Lien/Duo-hh/Chats montrent l'initiale jusqu'aux visages |
| F3 Règle du numéro | réglé : « Les numéros restent masqués jusqu'aux visages. » partout, spec §2.8 identique |
| F4 Ange choisi visible sur Duo-hh-rdv | partiel : les 3 tuiles sont là, aucune n'est marquée choisie (idem RdvDuo, RdvDuo-lea) |
| F5 Fiche « N sur M » | réglé : README corrigé, « Venu à 1 sortie sur 1 » + « visible par toi seulement » |

## Écran par écran

| Écran | Note | Ce qui empêche le 10 | Correction |
|---|---|---|---|
| V5-Welcome | 10 | — | — |
| V5-Ville | 10 | — | — |
| V5-Ville-bordeaux | 10 | — | — |
| V5-Toi | 10 | — | — |
| V5-Genre | 10 | — | — |
| V5-Pet | 10 | — | — |
| V5-Rencontrer | 10 | — | — |
| V5-Intention | 10 | — | — |
| V5-Consentement | 10 | — | — |
| V5-Toi-plus | 10 | — | — |
| V5-Dispos | 10 | — | — |
| V5-Dispos-semaines | 10 | — | — |
| V5-Eviter | 10 | — | — |
| V5-Erreur-age | 10 | — | — |
| V5-Trouvee | 10 | — | — |
| V5-Trouvee-lyon | 10 | — | — |
| V5-Sortie-lyon | 10 | — | — |
| V5-Confirmation-lyon | 10 | — | — |
| V5-Trouvee-banlieue | 10 | — | — |
| V5-Sortie-banlieue | 10 | — | — |
| V5-Confirmation-banlieue | 10 | — | — |
| V5-Pas-encore | 10 | — | — |
| V5-Ville-nantes | 10 | — | — |
| V5-Trouvee-nantes | 10 | — | — |
| V5-Sortie-nantes | 10 | — | — |
| V5-Pas-encore-nantes | 10 | — | — |
| V5-Sortie-lille | 10 | — | — |
| V5-Trouvee-weekend | 10 | — | — |
| V5-Sortie | 10 | — | — |
| V5-Team | 10 | — | — |
| V5-Partage-invitation | 10 | — | — |
| V5-Invite | 10 | — | — |
| V5-Compte | 10 | — | — |
| V5-Verif | 10 | — | — |
| V5-Notifs | 10 | — | — |
| V5-Sortie-inscrit | 10 | — | — |
| V5-Accueil | 10 | — | — |
| V5-Accueil-discret | 10 | — | — |
| V5-Accueil-duo | 10 | — | — |
| V5-Pause | 10 | — | — |
| V5-Chats | 9 | Après le double oui, l'écran garde l'initiale : « DUO AVEC J. », « Répondre à J. », « Caramel · J. Duo ouvert quand vous avez dit oui tous les deux », « DUO AVEC K. », Chats « J. · Caramel », Accueil « Ton duo J. ». Le prénom (« Jade », « Karim ») n'apparaît qu'à Les visages. Les écrans appliquent donc toujours « prénom aux visages », contre concept V5.8 §1, spec §2.13 (D-082) et la ligne Confidentialité « ton prénom quand vous avez dit oui tous les deux ». | « Duo avec Jade », « Répondre à Jade », « Jade · Caramel », « Duo avec Karim » dès le double oui ; check-facts dans les deux sens (`ecransApresOui` : prénom obligatoire, initiale interdite). |
| V5-Groupe | 10 | — | — |
| V5-Groupe-menu | 10 | — | — |
| V5-Attente | 10 | — | — |
| V5-Partage-ville | 10 | — | — |
| V5-Amorcage | 10 | — | — |
| V5-Amorcage-solo | 10 | — | — |
| V5-Sortie-complete | 10 | — | — |
| V5-Sortie-annulee | 10 | — | — |
| V5-Affiner | 10 | — | — |
| V5-Affiner-histoire | 10 | — | — |
| V5-Affiner-age | 10 | — | — |
| V5-Affiner-ambiance | 10 | — | — |
| V5-Confirmation | 10 | — | — |
| V5-Partage-confirmation | 10 | — | — |
| V5-Revelation | 10 | — | — |
| V5-Partage-checkin | 10 | — | — |
| V5-Ange | 10 | — | — |
| W-Ange | 10 | — | — |
| W-Ange-aide | 10 | — | — |
| V5-Checkin | 10 | — | — |
| V5-Checkin-ok | 10 | — | — |
| V5-Souvenir | 10 | — | — |
| V5-Apres | 10 | — | — |
| V5-Apres-resultats | 10 | — | — |
| V5-Partage-jeudi | 10 | — | — |
| V5-Partage | 10 | — | — |
| V5-Partage-dimanche | 10 | — | — |
| V5-Apres-aucun | 10 | — | — |
| V5-Bande | 10 | — | — |
| V5-Partage-bande | 10 | — | — |
| V5-Rue | 10 | — | — |
| V5-Duo | 9 | Après le double oui, l'écran garde l'initiale : « DUO AVEC J. », « Répondre à J. », « Caramel · J. Duo ouvert quand vous avez dit oui tous les deux », « DUO AVEC K. », Chats « J. · Caramel », Accueil « Ton duo J. ». Le prénom (« Jade », « Karim ») n'apparaît qu'à Les visages. Les écrans appliquent donc toujours « prénom aux visages », contre concept V5.8 §1, spec §2.13 (D-082) et la ligne Confidentialité « ton prénom quand vous avez dit oui tous les deux ». | « Duo avec Jade », « Répondre à Jade », « Jade · Caramel », « Duo avec Karim » dès le double oui ; check-facts dans les deux sens (`ecransApresOui` : prénom obligatoire, initiale interdite). |
| V5-Lien | 9 | Après le double oui, l'écran garde l'initiale : « DUO AVEC J. », « Répondre à J. », « Caramel · J. Duo ouvert quand vous avez dit oui tous les deux », « DUO AVEC K. », Chats « J. · Caramel », Accueil « Ton duo J. ». Le prénom (« Jade », « Karim ») n'apparaît qu'à Les visages. Les écrans appliquent donc toujours « prénom aux visages », contre concept V5.8 §1, spec §2.13 (D-082) et la ligne Confidentialité « ton prénom quand vous avez dit oui tous les deux ». | « Duo avec Jade », « Répondre à Jade », « Jade · Caramel », « Duo avec Karim » dès le double oui ; check-facts dans les deux sens (`ecransApresOui` : prénom obligatoire, initiale interdite). |
| V5-Duo-hh-proposition | 10 | — | — |
| V5-Duo-hh | 9 | Après le double oui, l'écran garde l'initiale : « DUO AVEC J. », « Répondre à J. », « Caramel · J. Duo ouvert quand vous avez dit oui tous les deux », « DUO AVEC K. », Chats « J. · Caramel », Accueil « Ton duo J. ». Le prénom (« Jade », « Karim ») n'apparaît qu'à Les visages. Les écrans appliquent donc toujours « prénom aux visages », contre concept V5.8 §1, spec §2.13 (D-082) et la ligne Confidentialité « ton prénom quand vous avez dit oui tous les deux ». | « Duo avec Jade », « Répondre à Jade », « Jade · Caramel », « Duo avec Karim » dès le double oui ; check-facts dans les deux sens (`ecransApresOui` : prénom obligatoire, initiale interdite). |
| V5-Duo-hh-visages | 10 | — | — |
| V5-Duo-hh-rdv | 8 | Tuiles « Sam / Maman / Personne » toutes au même état : aucune n'est sélectionnée, on ne voit pas qui recevra le lien de l'ange avant « Proposer à … » (demandé au tour 8). | État sélectionné visible (contour citron + coche, `aria-pressed`) sur le choix courant ; « Personne » sélectionné par défaut puisque facultatif. |
| V5-Lien-debloque | 10 | — | — |
| V5-RdvDuo | 9 | Tuiles « Sam / Maman / Personne » toutes au même état : aucune n'est sélectionnée, on ne voit pas qui recevra le lien de l'ange avant « Proposer à … » (demandé au tour 8). | État sélectionné visible (contour citron + coche, `aria-pressed`) sur le choix courant ; « Personne » sélectionné par défaut puisque facultatif. |
| V5-Chat | 10 | — | — |
| V5-RdvDuo-lea | 9 | Tuiles « Sam / Maman / Personne » toutes au même état : aucune n'est sélectionnée, on ne voit pas qui recevra le lien de l'ange avant « Proposer à … » (demandé au tour 8). | État sélectionné visible (contour citron + coche, `aria-pressed`) sur le choix courant ; « Personne » sélectionné par défaut puisque facultatif. |
| V5-Oeuf | 10 | — | — |
| V5-Rupture | 10 | — | — |
| V5-Cartes | 10 | — | — |
| V5-Story | 10 | — | — |
| W-Repondre | 10 | — | — |
| V5-Profil | 10 | — | — |
| V5-Fiche | 10 | — | — |
| V5-Tarifs | 10 | — | — |
| V5-Abonnement | 10 | — | — |
| V5-Paiement | 10 | — | — |
| V5-Paiement-ok | 10 | — | — |
| V5-Reglages | 10 | — | — |
| V5-Confidentialite | 9 | « Seule ta personne de duo le sait, quand vous avez dit oui tous les deux. » ≠ phrase exacte de la spec §2.16 « Seule une personne avec qui tu as un duo sait que vous avez dit oui tous les deux. » (Confidentialité est censée être générée depuis la spec). La ligne duo promet le prénom au double oui que V5-Lien ne tient pas. | Une seule phrase, recopiée par check-facts depuis la spec ; aligner Lien, Duo, Chats, Accueil sur la ligne duo. |
| V5-Signaler | 10 | — | — |
| V5-Supprimer | 10 | — | — |
| V5-Chargement | 10 | — | — |
| V5-Erreur-reseau | 10 | — | — |
| V5-Paiement-echec | 10 | — | — |
| V5-Verif-echec | 10 | — | — |
| V5-Notifs-refus | 10 | — | — |
| V5-Chats-vide | 10 | — | — |
| L-Effectif | 10 | — | — |
| L-Creneaux | 10 | — | — |
| L-Contrat | 10 | — | — |

Aucun écran BLOQUANT.

## Les 3 changements qui feraient monter ma note

1. Prénom du duo au double oui sur tous les écrans du duo (ou, si l'équipe préfère les visages, changer spec et Confidentialité : une seule vérité).
2. Ange gardien : état sélectionné visible avant « Proposer à … » sur RdvDuo, RdvDuo-lea, Duo-hh-rdv.
3. Confidentialité : phrase duo recopiée de la spec §2.16, générée depuis la même source.

## Je mets 10 si…

Maquettes : 10 quand le prénom du duo apparaît exactement là où Confidentialité le promet, quand l'ange choisi est visible avant l'envoi d'un rendez-vous, et quand la phrase de Confidentialité est celle de la spec. Terrain (à part) : rappel humain réellement tenu à 5 min (mesure pendant le test), écart E31 « reste E » (file d'astreinte) fermé dans le code.

## À part : ce qui relève du test terrain (ne retient pas le 10)

- Rappel humain en ≤ 5 min mesuré sur toutes les demandes « besoin d'aide » / « je pars mal à l'aise » du test.
- E31 « reste E » : file d'astreinte branchée dans le code.
- Taux réel de numéros masqués contournés (écrits en lettres, etc.) dans les chats.
