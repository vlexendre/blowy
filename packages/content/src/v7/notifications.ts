/**
 * Textes des notifications push (chantier « plateforme », spéc §12), par langue et par type.
 * Variables reçues du `Notifier` : name (prénom de l'autre), minimoa (nom d'un minimoa ; `petName` accepté),
 * count (`streak` accepté), more (nombre d'autres liens concernés), days, item (identifiant d'objet, traduit ici), endsOn (date ISO), price (centimes),
 * currency (défaut EUR). Les dates et les prix sont mis en forme dans la langue de la personne.
 * Pas d'emoji, pas de fausse urgence, pas de culpabilisation.
 */
import type { Locale, NotificationKindKey } from '@blowy/domain';
import { TODO, defineMessages, formatDate, formatPrice } from '../i18n/core';
import { labels } from '../labels';

export interface NotificationText {
  title: string;
  body: string;
}

/** Variables déjà mises en forme pour la langue. */
export interface NotificationVars {
  name: string;
  /** Nom du minimoa, ou « Ton minimoa » s'il n'est pas connu. */
  minimoa: string;
  count: string;
  /** Autres liens concernés par le même rappel (« à toi d'écrire »), en chiffres ; « 0 » ou vide : aucun. */
  more: string;
  days: string;
  item: string;
  endsOn: string;
  price: string;
}

type Template = (v: NotificationVars) => string;

const fr = {
  /** Quand le nom du minimoa n'est pas passé. */
  yourMinimoa: 'Ton minimoa',
  texts: {
    daily_challenge: { title: () => 'Ton défi du jour', body: (v) => `${v.minimoa} a préparé quelque chose pour toi.` },
    needs_out: { title: (v) => `${v.minimoa} a envie de sortir`, body: () => 'Un tour dehors, ou voir quelqu’un ? Il te suit.' },
    new_encounter: { title: () => 'Nouveau lien', body: (v) => `${v.name} et toi, vous pouvez vous écrire.` },
    waved: { title: (v) => `${v.name} te salue`, body: () => 'Son minimoa est passé dire bonjour au tien.' },
    message: { title: (v) => v.name, body: (v) => `${v.name} t’a écrit.` },
    your_turn: {
      title: (v) => `Série avec ${v.name}`,
      body: (v) =>
        Number(v.more) > 0
          ? `À toi d’écrire avant minuit. Et dans ${v.more} ${Number(v.more) > 1 ? 'autres liens' : 'autre lien'}.`
          : Number(v.count) > 0
            ? `${v.count} ${Number(v.count) > 1 ? 'jours' : 'jour'} d’affilée. À toi d’écrire avant minuit.`
            : `${v.name} t’a écrit aujourd’hui. À toi avant minuit.`,
    },
    link_in_danger: { title: (v) => `Lien avec ${v.name}`, body: () => 'Il lui reste peu de vies. Un mot suffit à le garder.' },
    streak_in_danger: { title: (v) => `Ta série de ${v.count} jours`, body: () => 'Le défi du jour t’attend encore ce soir.' },
    habit_proof: { title: (v) => `${v.minimoa} voudrait voir`, body: () => 'C’est l’heure de ton habitude. Une photo ?' },
    weekly_review: { title: () => 'Ton bilan de la semaine', body: (v) => `${v.minimoa} a fait le point. Viens voir.` },
    item_unlocked: { title: () => 'Nouvel objet', body: (v) => `${v.minimoa} a gagné : ${v.item}.` },
    words_received: { title: () => '3 mots pour toi', body: () => 'Un pote vient de choisir ses 3 mots sur toi.' },
    trial_reminder: {
      title: () => 'Ton essai Blowy+ se termine bientôt',
      body: (v) =>
        `L’essai gratuit se termine le ${v.endsOn}. Ensuite, premier paiement de ${v.price}. Pour l’éviter, annule dans les réglages de ton compte Apple, rubrique Abonnements.`,
    },
  } as Record<NotificationKindKey, { title: Template; body: Template }>,
  /** Libellés des réglages par type (écran « Moi › Notifications »). */
  kindLabels: {
    daily_challenge: 'Défi du jour',
    needs_out: 'Ton minimoa a besoin de sortir',
    new_encounter: 'Nouveaux liens',
    waved: 'On te salue',
    message: 'Messages',
    your_turn: 'À toi d’écrire (série d’un lien)',
    link_in_danger: 'Lien en danger',
    streak_in_danger: 'Série en danger',
    habit_proof: 'Preuve d’habitude',
    weekly_review: 'Bilan de la semaine',
    item_unlocked: 'Objets débloqués',
    words_received: '3 mots reçus',
    trial_reminder: 'Fin de l’essai Blowy+',
  } as Record<NotificationKindKey, string>,
};

export const notificationTexts = defineMessages({
  fr,
  en: {
    yourMinimoa: 'Your minimoa',
    texts: {
      daily_challenge: { title: () => 'Your daily challenge', body: (v) => `${v.minimoa} has something for you.` },
      needs_out: { title: (v) => `${v.minimoa} wants to go out`, body: () => 'A walk, or seeing someone? It’s coming with you.' },
      new_encounter: { title: () => 'New link', body: (v) => `You and ${v.name} can now write to each other.` },
      waved: { title: (v) => `${v.name} waved at you`, body: () => 'Their minimoa stopped by to say hi to yours.' },
      message: { title: (v) => v.name, body: (v) => `${v.name} wrote to you.` },
      your_turn: {
        title: (v) => `Streak with ${v.name}`,
        body: (v) =>
          Number(v.more) > 0
            ? `Your turn to write before midnight. And in ${v.more} other ${Number(v.more) > 1 ? 'links' : 'link'}.`
            : Number(v.count) > 0
              ? `${v.count} ${Number(v.count) > 1 ? 'days' : 'day'} in a row. Your turn to write before midnight.`
              : `${v.name} wrote to you today. Your turn before midnight.`,
      },
      link_in_danger: { title: (v) => `Your link with ${v.name}`, body: () => 'It’s running out of lives. One word is enough to keep it.' },
      streak_in_danger: { title: (v) => `Your ${v.count}-day streak`, body: () => 'Today’s challenge is still waiting for you tonight.' },
      habit_proof: { title: (v) => `${v.minimoa} would like to see`, body: () => 'Time for your habit. A photo?' },
      weekly_review: { title: () => 'Your week in review', body: (v) => `${v.minimoa} took stock. Come and see.` },
      item_unlocked: { title: () => 'New item', body: (v) => `${v.minimoa} won: ${v.item}.` },
      words_received: { title: () => '3 words for you', body: () => 'A friend just picked their 3 words about you.' },
      trial_reminder: {
        title: () => 'Your Blowy+ trial ends soon',
        body: (v) =>
          `Your free trial ends on ${v.endsOn}. After that, the first payment of ${v.price} is taken. To avoid it, cancel in your Apple account settings, under Subscriptions.`,
      },
    },
    kindLabels: TODO,
  },
  es: TODO,
  pt: TODO,
  nl: TODO,
});

const isIsoDate = (s: string): boolean => /^\d{4}-\d{2}-\d{2}/.test(s) && !Number.isNaN(Date.parse(s));

/** Variables brutes du `Notifier` → variables mises en forme dans la langue. */
export function notificationVars(locale: Locale, vars: Readonly<Record<string, string>>): NotificationVars {
  const t = notificationTexts.in(locale);
  const item = vars.item ?? '';
  const amount = Number(vars.price);
  return {
    name: vars.name ?? '',
    minimoa: vars.minimoa || vars.petName || t.yourMinimoa,
    count: vars.count ?? vars.streak ?? '',
    more: vars.more ?? '',
    days: vars.days ?? '',
    item: labels.in(locale).itemLabel[item] ?? item,
    endsOn: vars.endsOn && isIsoDate(vars.endsOn) ? formatDate(locale, vars.endsOn, { day: 'numeric', month: 'long' }) : (vars.endsOn ?? ''),
    price: vars.price && Number.isFinite(amount) && /^\d+$/.test(vars.price) ? formatPrice(locale, amount, vars.currency ?? 'EUR') : (vars.price ?? ''),
  };
}

/** Titre et corps d'une notification dans la langue de la personne, variables remplies. */
export function notificationText(locale: Locale, kind: NotificationKindKey, vars: Readonly<Record<string, string>> = {}): NotificationText {
  const t = notificationTexts.in(locale).texts[kind];
  const v = notificationVars(locale, vars);
  return { title: t.title(v), body: t.body(v) };
}

export const notificationKindLabel = (locale: Locale, kind: NotificationKindKey): string => notificationTexts.in(locale).kindLabels[kind] ?? kind;
