// Chargement de la correspondance écran de maquette → route de l'app, une par jeu de
// références : routes.v4.json (design/v4-reference/renders, défaut), routes.v5.json
// (design/v5/renders). Choix : --routes=<fichier> explicite, sinon déduit de --ref.
//
// Format d'un écran (tableau `screens`, dans l'ordre du canvas) :
//   ref      nom du rendu de référence (<refs>/<ref>.png)
//   title    titre du canvas
//   target   'mobile' (Expo web) | 'web' (apps/web, Next) | null (aucune route : écran absent)
//   route    chemin ; {relationshipId} {conversationId} {inviteCode} {publicSlug} résolus via l'API
//   account  clé de compte de démo du seed (docs/runbooks/local-ios.md §4 bis) ; null = déconnecté
//   draft    true = brouillon d'onboarding de démo (`demoDraft`) injecté avant le chargement ;
//            sinon, pour un compte connecté, brouillon « onboarding terminé »
//   masks    zones ignorées par la comparaison (les deux images), px CSS du viewport 390×844 [x, y, w, h]
//   maskText expressions régulières : la boîte des textes de l'app qui correspondent est masquée
//            (heures, horodatages serveur)
//   note     précision affichée dans le rapport
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/** Fichier de correspondance associé à un dossier de références. */
export function routesFileFor(refDir, explicit) {
  if (explicit) return resolve(explicit);
  return join(HERE, /(^|[/\\])v5([/\\]|$)/.test(String(refDir ?? '')) ? 'routes.v5.json' : 'routes.v4.json');
}

export function loadRoutes(file) {
  const data = JSON.parse(readFileSync(file, 'utf8'));
  if (!Array.isArray(data.screens)) throw new Error(`${file} : tableau "screens" attendu`);
  return { file, refs: data.refs ?? null, demoDraft: data.demoDraft ?? null, screens: data.screens };
}
