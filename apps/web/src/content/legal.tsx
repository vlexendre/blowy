/**
 * Textes de préparation (support, confidentialité, conditions) — À VALIDER JURIDIQUEMENT.
 * Ils décrivent le fonctionnement réel du produit ; ils ne constituent pas une certification.
 */
import type { ReactNode } from 'react';

export const LEGAL_UPDATED = '1er novembre 2026';
type Section = { heading: string; body: ReactNode };

export const SUPPORT: Section[] = [
  { heading: 'Signaler un problème ou une personne', body: <p>Dans l’app : depuis une conversation, une fiche ou un pet, menu « Signaler ». Tu peux aussi bloquer et sortir d’une relation immédiatement (sortie de sécurité), sans message de départ et sans effet sur ta fiabilité. La personne signalée ne connaît jamais ton identité.</p> },
  { heading: 'Une réponse « 3 mots » te gêne', body: <p>Depuis Chats › Quartier, tu peux masquer une réponse, la signaler ou mettre ta page en pause. Personne, pas même un compte Blowy+, ne peut obtenir l’identité de qui a répondu.</p> },
  { heading: 'Contacter l’équipe', body: <p>Adresse de contact du support : à définir avant lancement (boîte dédiée, délai de réponse cible et traitement des urgences à valider). En cas de danger immédiat, contacte les services d’urgence (112).</p> },
  { heading: 'Délais', body: <p>Objectif opérationnel : revue humaine des signalements sous 24 h, export de données sous 48 h. Ce sont des objectifs mesurés, pas des garanties.</p> },
];

export const PRIVACY: Section[] = [
  { heading: 'Ce que Blowy traite', body: <p>Compte (identifiant de connexion, date de naissance pour le contrôle 18+, jamais affichée), profil (prénom, pet, vision), préférences de rencontre déclarées (jamais déduites d’une photo ou d’une voix), messages, preuves de mission (privées par défaut), position approximative à 500 m, achats, signalements.</p> },
  { heading: 'Intelligence artificielle', body: <p>Les messages et preuves de mission peuvent être analysés par un fournisseur d’IA pour la modération et la validation des missions, selon les consentements donnés dans l’app. Le serveur et ses fournisseurs voient ces contenus en clair : Blowy n’annonce pas de chiffrement de bout en bout.</p> },
  { heading: 'Page « Décris-moi en 3 mots »', body: <p>Les visiteurs répondent sans compte et sans texte libre. Nous ne conservons ni adresse IP ni empreinte d’appareil : un identifiant aléatoire stocké dans un cookie du navigateur (30 jours) sert uniquement à éviter les doublons ; seule une empreinte chiffrée liée à la page visitée est conservée. Aucun traceur publicitaire.</p> },
  { heading: 'Durées de conservation (proposition à valider)', body: <ul><li>Profil : durée du compte.</li><li>Messages : durée de la relation puis purge différée.</li><li>Preuves de mission : durée limitée, purge automatique.</li><li>Vérification d’identité : résultat, identifiant et échéance plutôt qu’une copie des données biométriques.</li><li>Position d’ange gardien : 3 heures maximum.</li><li>Événements financiers et dossiers de confiance : durée justifiée à définir.</li><li>Sauvegardes : purge différée documentée.</li></ul> },
  { heading: 'Tes droits', body: <p>Export (archive privée à durée limitée), rectification, suppression du compte (révocation immédiate des sessions et liens, puis purge). Un export ne contient jamais le vote d’une autre personne, une photo non débloquée ni l’auteur d’une réponse anonyme.</p> },
];

export const TERMS: Section[] = [
  { heading: 'Principe', body: <p>Blowy est une application sociale pour adultes (18 ans et plus) où les pets se rencontrent avant les humains. Les comptes sont vérifiés et chaque étape (photos, voix, rendez-vous) exige l’accord des deux personnes. Ce n’est pas un chat aléatoire anonyme.</p> },
  { heading: 'Règles de conduite', body: <p>Pas de harcèlement, de demande d’argent, de contenu sexuel non sollicité, ni de faux profil. Les contenus sont modérés automatiquement puis humainement ; des sanctions graduées (avertissement, restriction, suspension, bannissement) peuvent s’appliquer, avec possibilité de recours.</p> },
  { heading: 'Pièces et abonnements', body: <p>Les prix affichés par les stores font foi. Les remboursements relèvent du store. Les pièces n’ont aucune valeur monétaire. Le parrainage crédite 100 pièces au parrain et au filleul une seule fois, après activation réelle du compte du filleul ; rien n’est versé pour un clic ou une installation.</p> },
  { heading: 'Responsabilité et litiges', body: <p>Clauses à rédiger et valider par un juriste (droit applicable, médiation de la consommation, limitation de responsabilité).</p> },
];
