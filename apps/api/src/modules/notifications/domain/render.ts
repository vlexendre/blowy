/**
 * Rendu pur d'une notification : texte normal ou variante discrète (§9.3), titre, canal, charge `data`.
 * Règles :
 *  - variante discrète : titre « Rappel », corps `<clé>.discreet` limité à `{heure}`, aucune clé ni
 *    catégorie dans `data`, icône `neutral`, canal `discreet` (écran verrouillé PRIVATE côté Android) ;
 *  - une variable manquante ne produit jamais un texte troué : on retombe sur la variante discrète ;
 *  - la sécurité garde son texte (« appelle le 112 ») et son canal `safety`.
 */
import { DISCREET_TEMPLATE_VARIABLES, NOTIFICATION_TITLES, NOTIFICATION_TITLE_KEYS, templateVariables } from '@blowy/content';
import type { PushData } from '@blowy/api-contract';
import { categoryOf, PUSH_KINDS, templateOf, type PushKey } from './catalog.js';

export type TemplateVars = Partial<Record<'pet' | 'autrePet' | 'prenom' | 'lieu' | 'jour' | 'heure' | 'quartier' | 'nombre', string>>;

export interface RenderedPush {
  title: string;
  body: string;
  channelId: 'default' | 'discreet' | 'safety';
  data: PushData;
  /** Envoi « haute priorité » (sécurité, transactionnels). */
  urgent: boolean;
}

const TITLE = new Map(NOTIFICATION_TITLES.map((t) => [t.key, t.fr]));

function fill(text: string, vars: TemplateVars): string | null {
  const names = templateVariables(text);
  for (const n of names) {
    const v = vars[n as keyof TemplateVars];
    if (v === undefined || v.trim() === '') return null;
  }
  return text.replace(/\{([a-zA-Z]+)\}/g, (_, n: string) => vars[n as keyof TemplateVars]!);
}

export function renderPush(key: PushKey, i: { notificationId: string; vars: TemplateVars; discreet: boolean; route: string }): RenderedPush {
  const t = templateOf(key);
  const spec = PUSH_KINDS[key];
  const safety = spec.klass === 'SAFETY';
  const discreetVars: TemplateVars = Object.fromEntries(DISCREET_TEMPLATE_VARIABLES.filter((k) => i.vars[k] !== undefined).map((k) => [k, i.vars[k]!]));
  const normal = i.discreet ? null : fill(t.fr, i.vars);
  const discreetBody = fill(t.discreetFr, discreetVars) ?? 'Tu as du nouveau.';
  const discreet = i.discreet || normal === null;
  const body = discreet ? discreetBody : normal!;
  const title = TITLE.get(discreet ? NOTIFICATION_TITLE_KEYS.discreet : NOTIFICATION_TITLE_KEYS.default)!;
  return {
    title,
    body,
    channelId: safety ? 'safety' : discreet ? 'discreet' : 'default',
    urgent: safety || spec.klass === 'TRANSACTIONAL',
    data: discreet
      ? { v: 1, notificationId: i.notificationId, discreet: true, icon: 'neutral', route: i.route }
      : { v: 1, notificationId: i.notificationId, discreet: false, icon: 'blowy', key, category: categoryOf(key), route: i.route },
  };
}
