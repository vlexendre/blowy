/**
 * Textes des notifications push (chantier « plateforme », spéc §12), par langue et par type.
 * Variables entre accolades : {name} (prénom de l'autre), {minimoa} (nom d'un minimoa), {count}, {days}, {item}.
 * Seul le français est écrit ; repli sur le français. Pas d'emoji, pas de fausse urgence, pas de culpabilisation.
 */
import type { NotificationKindKey } from '@blowy/domain';
import { fillTemplate } from './chat';

export interface NotificationText {
  title: string;
  body: string;
}

const FR: Readonly<Record<NotificationKindKey, NotificationText>> = {
  daily_challenge: { title: 'Ton défi du jour', body: '{minimoa} a préparé quelque chose pour toi.' },
  needs_out: { title: '{minimoa} a envie de sortir', body: 'Un tour dehors, ou voir quelqu’un ? Il te suit.' },
  new_encounter: { title: 'Nouveau lien', body: '{name} et toi, vous pouvez vous écrire.' },
  waved: { title: '{name} t’a salué', body: 'Son minimoa est passé dire bonjour au tien.' },
  message: { title: '{name}', body: '{name} t’a écrit.' },
  daily_photo: { title: 'Photo du jour', body: '{name} a posté la sienne. À toi.' },
  link_in_danger: { title: 'Lien avec {name}', body: 'Il lui reste peu de vies. Un mot suffit à le garder.' },
  streak_in_danger: { title: 'Ta série de {count} jours', body: 'Le défi du jour t’attend encore ce soir.' },
  habit_proof: { title: '{minimoa} voudrait voir', body: 'C’est l’heure de ton habitude. Une photo ?' },
  weekly_review: { title: 'Ton bilan de la semaine', body: '{minimoa} a fait le point. Viens voir.' },
  item_unlocked: { title: 'Nouvel objet', body: '{minimoa} a gagné : {item}.' },
  words_received: { title: '3 mots pour toi', body: 'Un pote vient de choisir ses 3 mots sur toi.' },
  trial_reminder: { title: 'Ton essai Blowy+', body: 'Il se termine dans 2 jours. Tu peux l’annuler à tout moment dans les réglages.' },
};

const TEXTS: Readonly<Record<string, Readonly<Record<NotificationKindKey, NotificationText>>>> = { fr: FR };

/** Titre et corps d'une notification dans la langue donnée (repli : français), variables remplies. */
export function notificationText(lang: string, kind: NotificationKindKey, vars: Readonly<Record<string, string>> = {}): NotificationText {
  const t = (TEXTS[lang] ?? FR)[kind];
  return { title: fillTemplate(t.title, vars), body: fillTemplate(t.body, vars) };
}

/** Libellés des réglages par type (écran « Moi › Notifications »). */
export const notificationKindLabels: Readonly<Record<string, Readonly<Record<NotificationKindKey, string>>>> = {
  fr: {
    daily_challenge: 'Défi du jour',
    needs_out: 'Ton minimoa a besoin de sortir',
    new_encounter: 'Nouveaux liens',
    waved: 'On t’a salué',
    message: 'Messages',
    daily_photo: 'Photo du jour de l’autre',
    link_in_danger: 'Lien en danger',
    streak_in_danger: 'Série en danger',
    habit_proof: 'Preuve d’habitude',
    weekly_review: 'Bilan de la semaine',
    item_unlocked: 'Objets débloqués',
    words_received: '3 mots reçus',
    trial_reminder: 'Fin de l’essai Blowy+',
  },
};
export const notificationKindLabel = (lang: string, kind: NotificationKindKey): string => (notificationKindLabels[lang] ?? notificationKindLabels.fr)?.[kind] ?? kind;
