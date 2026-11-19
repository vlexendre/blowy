/**
 * Textes des notifications push (chantier « plateforme », spéc §12), par langue et par type.
 * Variables reçues du `Notifier` : name (prénom de l'autre), minimoa (nom d'un minimoa ; `petName` accepté),
 * count (`streak` accepté), more (nombre d'autres liens concernés), days, item (identifiant d'objet, traduit ici), endsOn (date ISO), price (centimes),
 * currency (défaut EUR), step (variante d'un message de fidélisation ; `invite` ou `wave` pour un nouveau lien), others et n
 * (regroupement : « Léa et 4 autres »). Les dates et les prix sont mis en forme dans la langue de la personne.
 * Pas d'emoji, pas de fausse urgence, pas de culpabilisation.
 */
import type { Locale, NotificationKindKey } from '@blowy/domain';
import { defineMessages, formatDate, formatPrice } from '../i18n/core';
import { labels } from '../labels';
import { habitById } from './rituels';

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
  /** Nom d'un groupe (tel que ses membres l'ont choisi). */
  group: string;
  /** Libellé d'une habitude du catalogue (identifiant `habit`, traduit ici). */
  habit: string;
  /**
   * Variante d'un message de fidélisation (docs/FIDELISATION.md) : `d1`, `d3`, `d7` (premiers pas), `absence` ou
   * `anniversary` (nouvelles du minimoa, avec `days` ou `count` en mois), `welcome`, `renewed`, `recovered`,
   * `billing_grace`, `billing_retry`, `goodbye`, `winback` (abonnement).
   */
  step: string;
  /** Regroupement : autres personnes (ou événements) dans le même paquet, en chiffres ; « 0 » ou vide : aucun. */
  others: string;
  /** Regroupement : nombre d'événements du paquet. */
  n: string;
}

type Template = (v: NotificationVars) => string;

/** Un paquet de plusieurs personnes ou événements (« Léa et 4 autres »). */
const many = (v: NotificationVars): boolean => Number(v.others) > 0;
/** « 1 autre », « 4 autres » (les deux formes de la langue). */
const others = (v: NotificationVars, one: string, more: string): string => `${v.others} ${Number(v.others) === 1 ? one : more}`;
/** Personnes en tout dans le paquet. */
const total = (v: NotificationVars): number => Number(v.others) + 1;

/** Texte d'une variante (`v.step`), ou le repli. */
const pick = (texts: Readonly<Record<string, string>>, key: string, fallback: string): string => texts[key] ?? fallback;

const fr = {
  /** Quand le nom du minimoa n'est pas passé. */
  yourMinimoa: 'Ton minimoa',
  /** Paquet du matin : ajouté au texte du plus important quand d’autres nouvelles partent avec lui. */
  digestMore: (n: number): string => (n === 1 ? 'Et 1 autre nouvelle t’attend dans l’app.' : `Et ${n} autres nouvelles t’attendent dans l’app.`),
  texts: {
    daily_challenge: { title: () => 'Ton défi du jour', body: (v) => `${v.minimoa} a préparé quelque chose pour toi.` },
    needs_out: { title: (v) => `${v.minimoa} a envie de sortir`, body: () => 'Un tour dehors ou un mot à quelqu’un, et il repart de plus belle.' },
    new_encounter: {
      title: (v) => (many(v) ? 'Nouveaux liens' : v.step === 'invite' ? `${v.name} a accepté ton invitation` : `${v.name} t’a répondu`),
      body: (v) => (many(v) ? `${v.name} et ${others(v, 'autre', 'autres')} t’ont répondu. Dis-leur bonjour.` : 'Vous pouvez vous écrire. Dis-lui bonjour.'),
    },
    waved: {
      title: (v) => (many(v) ? `${v.name} et ${others(v, 'autre', 'autres')} t’ont fait signe` : `${v.name} te fait signe`),
      body: () => 'Viens voir qui c’est et réponds quand tu veux.',
    },
    message: {
      title: (v) => (many(v) ? 'Messages' : v.name),
      body: (v) => (many(v) ? `${v.name} et ${others(v, 'autre', 'autres')} t’ont écrit.` : Number(v.n) > 1 ? `${v.n} messages de ${v.name}.` : `${v.name} t’a écrit.`),
    },
    your_turn: {
      title: (v) => `Série avec ${v.name}`,
      body: (v) =>
        Number(v.more) > 0
          ? `À toi d’écrire avant minuit. Et dans ${v.more} ${Number(v.more) > 1 ? 'autres liens' : 'autre lien'}.`
          : Number(v.count) > 0
            ? `${v.count} ${Number(v.count) > 1 ? 'jours' : 'jour'} d’affilée. À toi d’écrire avant minuit.`
            : `${v.name} t’a écrit aujourd’hui. À toi avant minuit.`,
    },
    link_in_danger: { title: (v) => `Lien avec ${v.name}`, body: () => 'Votre lien s’essouffle un peu. Un petit mot suffit à le raviver.' },
    streak_in_danger: { title: (v) => `Ta série de ${v.count} ${Number(v.count) > 1 ? 'jours' : 'jour'}`, body: () => 'Le défi du jour est encore possible ce soir.' },
    habit_proof: { title: (v) => `${v.minimoa} voudrait voir`, body: () => 'C’est l’heure de ton habitude. Une photo ?' },
    weekly_review: { title: () => 'Ton bilan de la semaine', body: (v) => `${v.minimoa} a fait le point. Viens voir.` },
    item_unlocked: {
      title: (v) => (many(v) ? 'Nouveaux objets' : 'Nouvel objet'),
      body: (v) => (many(v) ? `${v.minimoa} a gagné : ${v.item}, et ${others(v, 'autre objet', 'autres objets')}.` : `${v.minimoa} a gagné : ${v.item}.`),
    },
    words_received: {
      title: (v) => (many(v) ? `${total(v)} personnes t’ont décrit` : '3 mots pour toi'),
      body: (v) => (many(v) ? 'Leurs 3 mots sur toi t’attendent.' : 'Quelqu’un vient de choisir ses 3 mots sur toi. Viens voir.'),
    },
    trial_reminder: {
      title: (v) => `Ton essai Minimoa+ se termine le ${v.endsOn}`,
      body: (v) => `Ensuite, premier paiement de ${v.price}. Pour l’éviter, annule dans Réglages › Abonnements de ton compte Apple.`,
    },
    group_invite: {
      title: (v) => `${v.name} t’invite dans « ${v.group} »`,
      body: (v) => (v.habit ? `Un groupe pour tenir une habitude ensemble : ${v.habit}. À toi de dire oui.` : 'Un groupe entre potes. À toi de dire oui.'),
    },
    together_proposal: {
      title: (v) => (v.group ? `« ${v.group} » démarre` : `${v.habit}, à plusieurs ?`),
      body: (v) => (v.group ? `Vous êtes ${v.count} à tenir la même habitude : ${v.habit}. Dis bonjour.` : 'Des personnes près de toi tiennent aussi cette habitude. La tenir ensemble ?'),
    },
    group_message: { title: (v) => v.group, body: (v) => `${v.name} a écrit dans le groupe.` },
    group_life_lost: {
      title: (v) => `« ${v.group} » perd une vie`,
      body: (v) => `Il lui reste ${v.count} ${Number(v.count) > 1 ? 'vies' : 'vie'}. Aujourd’hui, on s’y remet ensemble.`,
    },
    group_asleep: { title: (v) => `« ${v.group} » s’est endormi`, body: () => 'Plus de vies pour l’instant. N’importe qui peut le réveiller.' },
    group_joined: {
      title: (v) => (many(v) ? `« ${v.group} » : ${v.name} et ${others(v, 'autre', 'autres')} arrivent` : `« ${v.group} » : ${v.name} arrive`),
      body: (v) => (Number(v.count) >= 3 ? `Vous êtes ${v.count}. Dis bonjour.` : `Vous êtes ${v.count}. Encore une personne et la série démarre.`),
    },
    first_steps: {
      title: (v) =>
        v.step === 'd1'
          ? `${v.minimoa} veut savoir qui tu es`
          : v.step === 'd2'
            ? `${v.minimoa} a une idée`
            : v.step === 'd3'
              ? 'À plusieurs, c’est plus simple'
              : v.step === 'd5'
                ? `${v.minimoa} a cherché pour toi`
                : `Une semaine avec ${v.minimoa}`,
      body: (v) =>
        v.step === 'd1'
          ? 'Envoie ton lien « 3 mots » à 3 potes : ils te décrivent, sans compte, et il te connaît mieux.'
          : v.step === 'd2'
            ? 'Choisis une habitude à tenir : il la suivra avec toi, et des gens près de chez toi la tiennent peut-être aussi.'
            : v.step === 'd3'
              ? 'Rejoins un groupe par son lien, ou crée le tien et envoie-le à 2 potes. Il démarre à 3.'
              : v.step === 'd5'
                ? 'Viens voir qui il te présente près de chez toi. Il te dit pourquoi ; rien ne se passe sans toi.'
                : 'Ta première semaine est là : ce qui a bougé, et une carte à partager.',
    },
    minimoa_news: {
      title: (v) =>
        v.step === 'anniversary'
          ? Number(v.count) < 12
            ? `Un mois avec ${v.minimoa}`
            : Number(v.count) === 12
              ? `Un an avec ${v.minimoa}`
              : `${Math.floor(Number(v.count) / 12)} ans avec ${v.minimoa}`
          : v.days === '3'
            ? `${v.minimoa} pense à toi`
            : v.days === '7'
              ? `Des nouvelles de ${v.minimoa}`
              : 'Deux semaines déjà',
      body: (v) =>
        v.step === 'anniversary'
          ? Number(v.count) < 12
            ? 'Un mois que vous faites équipe. Merci d’être là.'
            : 'Joyeux anniversaire à vous deux. Viens voir le chemin parcouru.'
          : v.days === '3'
            ? 'Rien ne presse. Il te garde ta place au chaud.'
            : v.days === '7'
              ? 'Il va bien et il a gardé quelques histoires pour toi. Passe quand tu veux.'
              : `${v.minimoa} va bien. Tes liens ont peut-être des nouvelles pour toi.`,
    },
    plus_account: {
      title: (v) =>
        pick(
          {
            welcome: 'Bienvenue dans Minimoa+',
            renewed: 'Une année de plus avec Minimoa+',
            recovered: 'Minimoa+ est de nouveau ouvert',
            billing_grace: 'Le paiement de Minimoa+ n’est pas passé',
            billing_retry: 'Le paiement de Minimoa+ n’est pas passé',
            goodbye: 'Minimoa+ s’arrête ici',
            winback: `${v.minimoa} pense à toi`,
          },
          v.step,
          'Minimoa+',
        ),
      body: (v) =>
        pick(
          {
            welcome: `${v.minimoa} a sorti les objets premium. Toute la carte et plus de rencontres sont à toi.`,
            renewed: `Ton abonnement annuel est renouvelé. Merci de rester : ${v.minimoa} garde ses objets premium.`,
            recovered: 'Le paiement est passé. Merci, tout est rentré dans l’ordre.',
            billing_grace: `Minimoa+ reste ouvert jusqu’au ${v.endsOn}. Mets à jour ton moyen de paiement : Moi › Minimoa+ › Gérer mon abonnement.`,
            billing_retry: 'Minimoa+ est en pause. Mets à jour ton moyen de paiement : Moi › Minimoa+ › Gérer mon abonnement.',
            goodbye: `Merci pour ce bout de chemin. ${v.minimoa}, tes liens et tes habitudes restent là, gratuitement.`,
            winback: 'Ça fait un mois que Minimoa+ s’est arrêté. Si l’envie revient, il est toujours là ; le reste continue comme avant.',
          },
          v.step,
          '',
        ),
    },
  } as Record<NotificationKindKey, { title: Template; body: Template }>,
  /** Libellés des réglages par type (écran « Moi › Notifications »). */
  kindLabels: {
    daily_challenge: 'Défi du jour',
    needs_out: 'Ton minimoa a besoin de sortir',
    new_encounter: 'Nouveaux liens',
    waved: 'On te fait signe',
    message: 'Messages',
    your_turn: 'À toi d’écrire (série d’un lien)',
    link_in_danger: 'Lien en danger',
    streak_in_danger: 'Série en danger',
    habit_proof: 'Preuve d’habitude',
    weekly_review: 'Bilan de la semaine',
    item_unlocked: 'Objets débloqués',
    words_received: '3 mots reçus',
    trial_reminder: 'Fin de l’essai Minimoa+',
    group_invite: 'Invitations à un groupe',
    together_proposal: 'La tenir ensemble',
    group_message: 'Messages de groupe',
    group_life_lost: 'Vie perdue d’un groupe',
    group_asleep: 'Groupe endormi',
    group_joined: 'Arrivées dans un groupe',
    first_steps: 'Premiers pas',
    minimoa_news: 'Nouvelles de ton minimoa',
    plus_account: 'Ton abonnement Minimoa+',
  } as Record<NotificationKindKey, string>,
};

export const notificationTexts = defineMessages({
  fr,
  en: {
    yourMinimoa: 'Your minimoa',
    digestMore: (n: number): string => (n === 1 ? 'And 1 more update is waiting in the app.' : `And ${n} more updates are waiting in the app.`),
    texts: {
      daily_challenge: { title: () => 'Your daily challenge', body: (v) => `${v.minimoa} has something for you.` },
      needs_out: { title: (v) => `${v.minimoa} wants to go out`, body: () => 'A walk outside or a word to someone, and it’s back to its old self.' },
      new_encounter: {
        title: (v) => (many(v) ? 'New links' : v.step === 'invite' ? `${v.name} accepted your invite` : `${v.name} waved back`),
        body: (v) => (many(v) ? `${v.name} and ${others(v, 'other', 'others')} waved back. Say hi.` : 'You can now write to each other. Say hi.'),
      },
      waved: {
        title: (v) => (many(v) ? `${v.name} and ${others(v, 'other', 'others')} waved at you` : `${v.name} waved at you`),
        body: () => 'Come and see who it is, and wave back whenever you like.',
      },
      message: {
        title: (v) => (many(v) ? 'Messages' : v.name),
        body: (v) => (many(v) ? `${v.name} and ${others(v, 'other', 'others')} wrote to you.` : Number(v.n) > 1 ? `${v.n} messages from ${v.name}.` : `${v.name} wrote to you.`),
      },
      your_turn: {
        title: (v) => `Streak with ${v.name}`,
        body: (v) =>
          Number(v.more) > 0
            ? `Your turn to write before midnight. And in ${v.more} other ${Number(v.more) > 1 ? 'links' : 'link'}.`
            : Number(v.count) > 0
              ? `${v.count} ${Number(v.count) > 1 ? 'days' : 'day'} in a row. Your turn to write before midnight.`
              : `${v.name} wrote to you today. Your turn before midnight.`,
      },
      link_in_danger: { title: (v) => `Your link with ${v.name}`, body: () => 'Your link is running a little low. One short message is enough to perk it up.' },
      streak_in_danger: { title: (v) => `Your ${v.count}-day streak`, body: () => 'Today’s challenge is still doable tonight.' },
      habit_proof: { title: (v) => `${v.minimoa} would like to see`, body: () => 'Time for your habit. A photo?' },
      weekly_review: { title: () => 'Your weekly review', body: (v) => `${v.minimoa} took stock. Come and see.` },
      item_unlocked: {
        title: (v) => (many(v) ? 'New items' : 'New item'),
        body: (v) => (many(v) ? `${v.minimoa} won: ${v.item}, and ${others(v, 'other item', 'other items')}.` : `${v.minimoa} won: ${v.item}.`),
      },
      words_received: {
        title: (v) => (many(v) ? `${total(v)} people described you` : '3 words for you'),
        body: (v) => (many(v) ? 'Their 3 words about you are waiting.' : 'Someone just picked their 3 words about you. Come and see.'),
      },
      trial_reminder: {
        title: (v) => `Your Minimoa+ trial ends on ${v.endsOn}`,
        body: (v) => `After that, the first payment of ${v.price} is charged. To avoid it, cancel in your Apple account settings, under Subscriptions.`,
      },
      group_invite: {
        title: (v) => `${v.name} invites you to “${v.group}”`,
        body: (v) => (v.habit ? `A group to keep a habit together: ${v.habit}. Your call.` : 'A group with friends. Your call.'),
      },
      together_proposal: {
        title: (v) => (v.group ? `“${v.group}” is starting` : `${v.habit}, together?`),
        body: (v) => (v.group ? `${v.count} of you keep the same habit: ${v.habit}. Say hi.` : 'People near you keep this habit too. Keep it together?'),
      },
      group_message: { title: (v) => v.group, body: (v) => `${v.name} wrote in the group.` },
      group_life_lost: {
        title: (v) => `“${v.group}” lost a life`,
        body: (v) => `${v.count} ${Number(v.count) === 1 ? 'life' : 'lives'} left. Today you pick it up together.`,
      },
      group_asleep: { title: (v) => `“${v.group}” fell asleep`, body: () => 'No lives left for now. Anyone can wake it up.' },
      group_joined: {
        title: (v) => (many(v) ? `${v.name} and ${others(v, 'other', 'others')} joined “${v.group}”` : `${v.name} joined “${v.group}”`),
        body: (v) => (Number(v.count) >= 3 ? `There are ${v.count} of you now. Say hi.` : `There are ${v.count} of you. One more and the streak starts.`),
      },
      first_steps: {
        title: (v) =>
          v.step === 'd1'
            ? `${v.minimoa} wants to know who you are`
            : v.step === 'd2'
              ? `${v.minimoa} has an idea`
              : v.step === 'd3'
                ? 'Easier together'
                : v.step === 'd5'
                  ? `${v.minimoa} looked around for you`
                  : `One week with ${v.minimoa}`,
        body: (v) =>
          v.step === 'd1'
            ? 'Send your “3 words” link to 3 friends: they describe you, no account needed, and it gets to know you better.'
            : v.step === 'd2'
              ? 'Pick a habit to keep: it will follow along with you, and people near you might keep it too.'
              : v.step === 'd3'
                ? 'Join a group with its link, or start yours and send it to 2 friends. It starts at 3.'
                : v.step === 'd5'
                  ? 'Come see who it’s introducing you to near you. It tells you why; nothing happens without you.'
                  : 'Your first week is here: what changed, and a card to share.',
      },
      minimoa_news: {
        title: (v) =>
          v.step === 'anniversary'
            ? Number(v.count) < 12
              ? `One month with ${v.minimoa}`
              : Number(v.count) === 12
                ? `One year with ${v.minimoa}`
                : `${Math.floor(Number(v.count) / 12)} years with ${v.minimoa}`
            : v.days === '3'
              ? `${v.minimoa} is thinking of you`
              : v.days === '7'
                ? `News from ${v.minimoa}`
                : 'Two weeks already',
        body: (v) =>
          v.step === 'anniversary'
            ? Number(v.count) < 12
              ? 'A month of being a team. Thanks for being here.'
              : 'Happy anniversary to you both. Come and see how far you’ve come.'
            : v.days === '3'
              ? 'No rush. It’s keeping your spot warm.'
              : v.days === '7'
                ? 'It’s doing well and saved a few stories for you. Drop by whenever you like.'
                : `${v.minimoa} is doing well. Your links may have news for you.`,
      },
      plus_account: {
        title: (v) =>
          pick(
            {
              welcome: 'Welcome to Minimoa+',
              renewed: 'Another year of Minimoa+',
              recovered: 'Minimoa+ is back on',
              billing_grace: 'Your Minimoa+ payment didn’t go through',
              billing_retry: 'Your Minimoa+ payment didn’t go through',
              goodbye: 'Minimoa+ stops here',
              winback: `${v.minimoa} is thinking of you`,
            },
            v.step,
            'Minimoa+',
          ),
        body: (v) =>
          pick(
            {
              welcome: `${v.minimoa} got the premium items out. The whole map and more encounters are yours.`,
              renewed: `Your yearly subscription has renewed. Thanks for staying: ${v.minimoa} keeps its premium items.`,
              recovered: 'The payment went through. Thanks, everything’s back in order.',
              billing_grace: `Minimoa+ stays open until ${v.endsOn}. Update your payment method: Me › Minimoa+ › Manage my subscription.`,
              billing_retry: 'Minimoa+ is paused. Update your payment method: Me › Minimoa+ › Manage my subscription.',
              goodbye: `Thanks for coming along. ${v.minimoa}, your links and your habits stay, for free.`,
              winback: 'It’s been a month since Minimoa+ stopped. If you feel like it again, it’s still here; everything else carries on as before.',
            },
            v.step,
            '',
          ),
      },
    },
    kindLabels: {
      daily_challenge: 'Daily challenge',
      needs_out: 'Your minimoa needs to go out',
      new_encounter: 'New links',
      waved: 'Waves at you',
      message: 'Messages',
      your_turn: 'Your turn to write (link streak)',
      link_in_danger: 'Link in danger',
      streak_in_danger: 'Streak in danger',
      habit_proof: 'Habit proof',
      weekly_review: 'Weekly review',
      item_unlocked: 'Unlocked items',
      words_received: '3 words received',
      trial_reminder: 'End of Minimoa+ trial',
      group_invite: 'Group invitations',
      together_proposal: 'Keep it together',
      group_message: 'Group messages',
      group_life_lost: 'Group lost a life',
      group_asleep: 'Group asleep',
      group_joined: 'Someone joined a group',
      first_steps: 'First steps',
      minimoa_news: 'News from your minimoa',
      plus_account: 'Your Minimoa+ subscription',
    },
  },
  es: {
    yourMinimoa: 'Tu minimoa',
    digestMore: (n: number): string => (n === 1 ? 'Y 1 novedad más te espera en la app.' : `Y ${n} novedades más te esperan en la app.`),
    texts: {
      daily_challenge: { title: () => 'Tu reto del día', body: (v) => `${v.minimoa} te ha preparado algo.` },
      needs_out: { title: (v) => `${v.minimoa} quiere salir`, body: () => 'Una vuelta fuera o un mensaje a alguien, y recupera la chispa.' },
      new_encounter: {
        title: (v) => (many(v) ? 'Nuevos vínculos' : v.step === 'invite' ? `${v.name} aceptó tu invitación` : `${v.name} te ha respondido`),
        body: (v) => (many(v) ? `${v.name} y ${others(v, 'persona más', 'personas más')} te han respondido. Salúdalos.` : 'Ya podéis escribiros. Salúdale.'),
      },
      waved: {
        title: (v) => (many(v) ? `${v.name} y ${others(v, 'persona más', 'personas más')} te han saludado` : `${v.name} te saluda`),
        body: () => 'Ven a ver quién es y responde cuando quieras.',
      },
      message: {
        title: (v) => (many(v) ? 'Mensajes' : v.name),
        body: (v) => (many(v) ? `${v.name} y ${others(v, 'persona más', 'personas más')} te han escrito.` : Number(v.n) > 1 ? `${v.n} mensajes de ${v.name}.` : `${v.name} te ha escrito.`),
      },
      your_turn: {
        title: (v) => `Racha con ${v.name}`,
        body: (v) =>
          Number(v.more) > 0
            ? `Te toca escribir antes de medianoche. Y en ${v.more} ${Number(v.more) === 1 ? 'vínculo más' : 'vínculos más'}.`
            : Number(v.count) > 0
              ? `${v.count} ${Number(v.count) === 1 ? 'día seguido' : 'días seguidos'}. Te toca escribir antes de medianoche.`
              : `${v.name} te escribió hoy. Te toca antes de medianoche.`,
      },
      link_in_danger: { title: (v) => `Vínculo con ${v.name}`, body: () => 'Vuestro vínculo anda un poco flojo. Un mensajito basta para animarlo.' },
      streak_in_danger: { title: (v) => `Tu racha de ${v.count} ${Number(v.count) !== 1 ? 'días' : 'día'}`, body: () => 'El reto del día aún es posible esta noche.' },
      habit_proof: { title: (v) => `${v.minimoa} quiere ver algo`, body: () => 'Es la hora de tu hábito. ¿Una foto?' },
      weekly_review: { title: () => 'Tu resumen de la semana', body: (v) => `${v.minimoa} ha hecho balance. Ven a verlo.` },
      item_unlocked: {
        title: (v) => (many(v) ? 'Nuevos objetos' : 'Nuevo objeto'),
        body: (v) => (many(v) ? `${v.minimoa} ha ganado: ${v.item}, y ${others(v, 'objeto más', 'objetos más')}.` : `${v.minimoa} ha ganado: ${v.item}.`),
      },
      words_received: {
        title: (v) => (many(v) ? `${total(v)} personas te han descrito` : '3 palabras para ti'),
        body: (v) => (many(v) ? 'Sus 3 palabras sobre ti te esperan.' : 'Alguien acaba de elegir sus 3 palabras sobre ti. Ven a verlo.'),
      },
      trial_reminder: {
        title: (v) => `Tu prueba de Minimoa+ termina el ${v.endsOn}`,
        body: (v) => `Después, primer pago de ${v.price}. Para evitarlo, cancela en los ajustes de tu cuenta de Apple, en Suscripciones.`,
      },
      group_invite: {
        title: (v) => `${v.name} te invita a «${v.group}»`,
        body: (v) => (v.habit ? `Un grupo para mantener un hábito juntos: ${v.habit}. Tú decides.` : 'Un grupo entre amigos. Tú decides.'),
      },
      together_proposal: {
        title: (v) => (v.group ? `«${v.group}» empieza` : `${v.habit}, ¿en grupo?`),
        body: (v) => (v.group ? `Sois ${v.count} con el mismo hábito: ${v.habit}. Saluda.` : 'Hay gente cerca de ti con este hábito. ¿Lo mantenéis juntos?'),
      },
      group_message: { title: (v) => v.group, body: (v) => `${v.name} ha escrito en el grupo.` },
      group_life_lost: {
        title: (v) => `«${v.group}» pierde una vida`,
        body: (v) => `Le ${Number(v.count) === 1 ? 'queda' : 'quedan'} ${v.count} ${Number(v.count) === 1 ? 'vida' : 'vidas'}. Hoy volvéis a empezar juntos.`,
      },
      group_asleep: { title: (v) => `«${v.group}» se ha dormido`, body: () => 'Sin vidas por ahora. Cualquiera puede despertarlo.' },
      group_joined: {
        title: (v) => (many(v) ? `${v.name} y ${others(v, 'persona más', 'personas más')} se unen a «${v.group}»` : `${v.name} se une a «${v.group}»`),
        body: (v) => (Number(v.count) >= 3 ? `Ya sois ${v.count}. Saluda.` : `Sois ${v.count}. Una persona más y empieza la racha.`),
      },
      first_steps: {
        title: (v) =>
          v.step === 'd1'
            ? `${v.minimoa} quiere saber cómo eres`
            : v.step === 'd2'
              ? `${v.minimoa} tiene una idea`
              : v.step === 'd3'
                ? 'Juntos es más fácil'
                : v.step === 'd5'
                  ? `${v.minimoa} ha buscado por ti`
                  : `Una semana con ${v.minimoa}`,
        body: (v) =>
          v.step === 'd1'
            ? 'Envía tu enlace «3 palabras» a 3 amistades: te describen sin cuenta, y te conoce mejor.'
            : v.step === 'd2'
              ? 'Elige un hábito que mantener: lo seguirá contigo, y quizá gente cerca de ti también lo mantiene.'
              : v.step === 'd3'
                ? 'Únete a un grupo con su enlace, o crea el tuyo y envíalo a 2 amistades. Empieza con 3.'
                : v.step === 'd5'
                  ? 'Ven a ver a quién te presenta cerca de ti. Te dice por qué; nada pasa sin ti.'
                  : 'Tu primera semana ya está aquí: lo que ha cambiado, y una tarjeta para compartir.',
      },
      minimoa_news: {
        title: (v) =>
          v.step === 'anniversary'
            ? Number(v.count) < 12
              ? `Un mes con ${v.minimoa}`
              : Number(v.count) === 12
                ? `Un año con ${v.minimoa}`
                : `${Math.floor(Number(v.count) / 12)} años con ${v.minimoa}`
            : v.days === '3'
              ? `${v.minimoa} piensa en ti`
              : v.days === '7'
                ? `Noticias de ${v.minimoa}`
                : 'Ya van dos semanas',
        body: (v) =>
          v.step === 'anniversary'
            ? Number(v.count) < 12
              ? 'Un mes formando equipo. Gracias por estar ahí.'
              : 'Feliz aniversario a los dos. Ven a ver todo lo recorrido.'
            : v.days === '3'
              ? 'Sin prisa. Te guarda el sitio calentito.'
              : v.days === '7'
                ? 'Está bien y te ha guardado algunas historias. Pásate cuando quieras.'
                : `${v.minimoa} está bien. Puede que tus vínculos tengan novedades para ti.`,
      },
      plus_account: {
        title: (v) =>
          pick(
            {
              welcome: 'Te damos la bienvenida a Minimoa+',
              renewed: 'Un año más de Minimoa+',
              recovered: 'Minimoa+ vuelve a estar activo',
              billing_grace: 'El pago de Minimoa+ no se ha realizado',
              billing_retry: 'El pago de Minimoa+ no se ha realizado',
              goodbye: 'Minimoa+ termina aquí',
              winback: `${v.minimoa} piensa en ti`,
            },
            v.step,
            'Minimoa+',
          ),
        body: (v) =>
          pick(
            {
              welcome: `${v.minimoa} ha sacado los objetos premium. Todo el mapa y más encuentros son tuyos.`,
              renewed: `Tu suscripción anual se ha renovado. Gracias por quedarte: ${v.minimoa} conserva sus objetos premium.`,
              recovered: 'El pago se ha realizado. Gracias, todo vuelve a estar en orden.',
              billing_grace: `Minimoa+ sigue abierto hasta el ${v.endsOn}. Actualiza tu método de pago: Yo › Minimoa+ › Gestionar mi suscripción.`,
              billing_retry: 'Minimoa+ está en pausa. Actualiza tu método de pago: Yo › Minimoa+ › Gestionar mi suscripción.',
              goodbye: `Gracias por este tramo del camino. ${v.minimoa}, tus vínculos y tus hábitos siguen aquí, gratis.`,
              winback: 'Hace un mes que Minimoa+ terminó. Si te apetece volver, sigue aquí; todo lo demás continúa igual.',
            },
            v.step,
            '',
          ),
      },
    },
    kindLabels: {
      daily_challenge: 'Reto del día',
      needs_out: 'Tu minimoa necesita salir',
      new_encounter: 'Nuevos vínculos',
      waved: 'Te saludan',
      message: 'Mensajes',
      your_turn: 'Te toca escribir (racha de un vínculo)',
      link_in_danger: 'Vínculo en peligro',
      streak_in_danger: 'Racha en peligro',
      habit_proof: 'Prueba de hábito',
      weekly_review: 'Resumen de la semana',
      item_unlocked: 'Objetos desbloqueados',
      words_received: '3 palabras recibidas',
      trial_reminder: 'Fin de la prueba de Minimoa+',
      group_invite: 'Invitaciones a un grupo',
      together_proposal: 'Mantenerlo juntos',
      group_message: 'Mensajes de grupo',
      group_life_lost: 'Vida perdida de un grupo',
      group_asleep: 'Grupo dormido',
      group_joined: 'Llegadas a un grupo',
      first_steps: 'Primeros pasos',
      minimoa_news: 'Noticias de tu minimoa',
      plus_account: 'Tu suscripción a Minimoa+',
    },
  },
  pt: {
    yourMinimoa: 'Seu minimoa',
    digestMore: (n: number): string => (n === 1 ? 'E mais 1 novidade te espera no app.' : `E mais ${n} novidades te esperam no app.`),
    texts: {
      daily_challenge: { title: () => 'Seu desafio do dia', body: (v) => `${v.minimoa} preparou algo para você.` },
      needs_out: { title: (v) => `${v.minimoa} quer sair`, body: () => 'Uma volta lá fora ou uma mensagem para alguém, e ele se anima de novo.' },
      new_encounter: {
        title: (v) => (many(v) ? 'Novos vínculos' : v.step === 'invite' ? `${v.name} aceitou seu convite` : `${v.name} respondeu seu aceno`),
        body: (v) => (many(v) ? `${v.name} e mais ${others(v, 'pessoa', 'pessoas')} responderam. Dê um oi.` : 'Agora vocês podem conversar. Dê um oi.'),
      },
      waved: {
        title: (v) => (many(v) ? `${v.name} e mais ${others(v, 'pessoa', 'pessoas')} acenaram para você` : `${v.name} acenou para você`),
        body: () => 'Venha ver quem é e responda quando quiser.',
      },
      message: {
        title: (v) => (many(v) ? 'Mensagens' : v.name),
        body: (v) => (many(v) ? `${v.name} e mais ${others(v, 'pessoa', 'pessoas')} mandaram mensagem.` : Number(v.n) > 1 ? `${v.n} mensagens de ${v.name}.` : `${v.name} mandou uma mensagem.`),
      },
      your_turn: {
        title: (v) => `Sequência com ${v.name}`,
        body: (v) =>
          Number(v.more) > 0
            ? `Sua vez de escrever antes da meia-noite. E em mais ${v.more} ${Number(v.more) === 1 ? 'vínculo' : 'vínculos'}.`
            : Number(v.count) > 0
              ? `${v.count} ${Number(v.count) === 1 ? 'dia seguido' : 'dias seguidos'}. Sua vez de escrever antes da meia-noite.`
              : `${v.name} escreveu hoje. Sua vez, antes da meia-noite.`,
      },
      link_in_danger: { title: (v) => `Vínculo com ${v.name}`, body: () => 'O vínculo de vocês está meio parado. Uma mensagenzinha basta para animar.' },
      streak_in_danger: { title: (v) => `Sua sequência de ${v.count} ${Number(v.count) > 1 ? 'dias' : 'dia'}`, body: () => 'Ainda dá para fazer o desafio do dia hoje à noite.' },
      habit_proof: { title: (v) => `${v.minimoa} quer ver`, body: () => 'Hora do seu hábito. Uma foto?' },
      weekly_review: { title: () => 'Seu resumo da semana', body: (v) => `${v.minimoa} fez um balanço. Venha ver.` },
      item_unlocked: {
        title: (v) => (many(v) ? 'Novos itens' : 'Novo item'),
        body: (v) => (many(v) ? `${v.minimoa} ganhou: ${v.item}, e mais ${others(v, 'item', 'itens')}.` : `${v.minimoa} ganhou: ${v.item}.`),
      },
      words_received: {
        title: (v) => (many(v) ? `${total(v)} pessoas descreveram você` : '3 palavras para você'),
        body: (v) => (many(v) ? 'As 3 palavras delas sobre você estão te esperando.' : 'Alguém acabou de escolher 3 palavras sobre você. Venha ver.'),
      },
      trial_reminder: {
        title: (v) => `Seu teste do Minimoa+ termina em ${v.endsOn}`,
        body: (v) => `Depois, primeira cobrança de ${v.price}. Para evitar, cancele nos ajustes da sua conta Apple, em Assinaturas.`,
      },
      group_invite: {
        title: (v) => `${v.name} te convida para «${v.group}»`,
        body: (v) => (v.habit ? `Um grupo para manter um hábito juntos: ${v.habit}. Você decide.` : 'Um grupo entre amigos. Você decide.'),
      },
      together_proposal: {
        title: (v) => (v.group ? `«${v.group}» começou` : `${v.habit}, em grupo?`),
        body: (v) => (v.group ? `Vocês são ${v.count} com o mesmo hábito: ${v.habit}. Diga oi.` : 'Tem gente perto de você com este hábito. Manter juntos?'),
      },
      group_message: { title: (v) => v.group, body: (v) => `${v.name} escreveu no grupo.` },
      group_life_lost: {
        title: (v) => `«${v.group}» perdeu uma vida`,
        body: (v) => `${Number(v.count) === 1 ? 'Resta' : 'Restam'} ${v.count} ${Number(v.count) === 1 ? 'vida' : 'vidas'}. Hoje vocês recomeçam juntos.`,
      },
      group_asleep: { title: (v) => `«${v.group}» adormeceu`, body: () => 'Sem vidas por enquanto. Qualquer pessoa pode acordá-lo.' },
      group_joined: {
        title: (v) => (many(v) ? `${v.name} e mais ${others(v, 'pessoa', 'pessoas')} entraram em “${v.group}”` : `${v.name} entrou em “${v.group}”`),
        body: (v) => (Number(v.count) >= 3 ? `Agora vocês são ${v.count}. Dê um oi.` : `Vocês são ${v.count}. Mais uma pessoa e a sequência começa.`),
      },
      first_steps: {
        title: (v) =>
          v.step === 'd1'
            ? `${v.minimoa} quer saber quem você é`
            : v.step === 'd2'
              ? `${v.minimoa} teve uma ideia`
              : v.step === 'd3'
                ? 'Junto fica mais fácil'
                : v.step === 'd5'
                  ? `${v.minimoa} procurou por você`
                  : `Uma semana com ${v.minimoa}`,
        body: (v) =>
          v.step === 'd1'
            ? 'Mande seu link “3 palavras” para 3 amigos: eles te descrevem, sem conta, e ele te conhece melhor.'
            : v.step === 'd2'
              ? 'Escolha um hábito para manter: ele acompanha você, e talvez gente perto de você mantenha também.'
              : v.step === 'd3'
                ? 'Entre num grupo pelo link, ou crie o seu e mande para 2 amigos. Ele começa com 3.'
                : v.step === 'd5'
                  ? 'Venha ver quem ele te apresenta perto de você. Ele diz por quê; nada acontece sem você.'
                  : 'Sua primeira semana chegou: o que mudou, e um cartão para compartilhar.',
      },
      minimoa_news: {
        title: (v) =>
          v.step === 'anniversary'
            ? Number(v.count) < 12
              ? `Um mês com ${v.minimoa}`
              : Number(v.count) === 12
                ? `Um ano com ${v.minimoa}`
                : `${Math.floor(Number(v.count) / 12)} anos com ${v.minimoa}`
            : v.days === '3'
              ? `${v.minimoa} está pensando em você`
              : v.days === '7'
                ? `Novidades de ${v.minimoa}`
                : 'Já faz duas semanas',
        body: (v) =>
          v.step === 'anniversary'
            ? Number(v.count) < 12
              ? 'Um mês formando uma dupla. Obrigado por estar aqui.'
              : 'Feliz aniversário para vocês dois. Venha ver o caminho percorrido.'
            : v.days === '3'
              ? 'Sem pressa. Ele está guardando seu lugar quentinho.'
              : v.days === '7'
                ? 'Ele está bem e guardou umas histórias para você. Passe quando quiser.'
                : `${v.minimoa} está bem. Seus vínculos talvez tenham novidades para você.`,
      },
      plus_account: {
        title: (v) =>
          pick(
            {
              welcome: 'Boas-vindas ao Minimoa+',
              renewed: 'Mais um ano de Minimoa+',
              recovered: 'O Minimoa+ voltou',
              billing_grace: 'O pagamento do Minimoa+ não foi aprovado',
              billing_retry: 'O pagamento do Minimoa+ não foi aprovado',
              goodbye: 'O Minimoa+ termina aqui',
              winback: `${v.minimoa} está pensando em você`,
            },
            v.step,
            'Minimoa+',
          ),
        body: (v) =>
          pick(
            {
              welcome: `${v.minimoa} tirou os itens premium do armário. O mapa inteiro e mais encontros são seus.`,
              renewed: `Sua assinatura anual foi renovada. Obrigado por ficar: ${v.minimoa} continua com os itens premium.`,
              recovered: 'O pagamento foi aprovado. Obrigado, tudo voltou ao normal.',
              billing_grace: `O Minimoa+ continua aberto até ${v.endsOn}. Atualize sua forma de pagamento: Eu › Minimoa+ › Gerenciar minha assinatura.`,
              billing_retry: 'O Minimoa+ está pausado. Atualize sua forma de pagamento: Eu › Minimoa+ › Gerenciar minha assinatura.',
              goodbye: `Obrigado por esse pedaço do caminho. ${v.minimoa}, seus vínculos e seus hábitos continuam aqui, de graça.`,
              winback: 'Faz um mês que o Minimoa+ terminou. Se der vontade de voltar, ele continua aqui; o resto segue igual.',
            },
            v.step,
            '',
          ),
      },
    },
    kindLabels: {
      daily_challenge: 'Desafio do dia',
      needs_out: 'Seu minimoa precisa sair',
      new_encounter: 'Novos vínculos',
      waved: 'Acenaram para você',
      message: 'Mensagens',
      your_turn: 'Sua vez de escrever (sequência de um vínculo)',
      link_in_danger: 'Vínculo em perigo',
      streak_in_danger: 'Sequência em perigo',
      habit_proof: 'Prova de hábito',
      weekly_review: 'Resumo da semana',
      item_unlocked: 'Itens desbloqueados',
      words_received: '3 palavras recebidas',
      trial_reminder: 'Fim do teste do Minimoa+',
      group_invite: 'Convites para grupos',
      together_proposal: 'Manter juntos',
      group_message: 'Mensagens de grupo',
      group_life_lost: 'Vida perdida de um grupo',
      group_asleep: 'Grupo adormecido',
      group_joined: 'Chegadas em um grupo',
      first_steps: 'Primeiros passos',
      minimoa_news: 'Notícias do seu minimoa',
      plus_account: 'Sua assinatura do Minimoa+',
    },
  },
  nl: {
    yourMinimoa: 'Je minimoa',
    digestMore: (n: number): string => (n === 1 ? 'En er wacht nog 1 update in de app.' : `En er wachten nog ${n} updates in de app.`),
    texts: {
      daily_challenge: { title: () => 'Je uitdaging van de dag', body: (v) => `${v.minimoa} heeft iets voor je klaargezet.` },
      needs_out: { title: (v) => `${v.minimoa} wil naar buiten`, body: () => 'Even naar buiten of iemand een berichtje sturen, en hij leeft weer op.' },
      new_encounter: {
        title: (v) => (many(v) ? 'Nieuwe banden' : v.step === 'invite' ? `${v.name} nam je uitnodiging aan` : `${v.name} zwaaide terug`),
        body: (v) => (many(v) ? `${v.name} en ${others(v, 'ander', 'anderen')} zwaaiden terug. Zeg hallo.` : 'Jullie kunnen elkaar nu schrijven. Zeg hallo.'),
      },
      waved: {
        title: (v) => (many(v) ? `${v.name} en ${others(v, 'ander', 'anderen')} zwaaiden naar je` : `${v.name} zwaait naar je`),
        body: () => 'Kom kijken wie het is en zwaai terug wanneer je wilt.',
      },
      message: {
        title: (v) => (many(v) ? 'Berichten' : v.name),
        body: (v) => (many(v) ? `${v.name} en ${others(v, 'ander', 'anderen')} schreven je.` : Number(v.n) > 1 ? `${v.n} berichten van ${v.name}.` : `${v.name} schreef je.`),
      },
      your_turn: {
        title: (v) => `Reeks met ${v.name}`,
        body: (v) =>
          Number(v.more) > 0
            ? `Jouw beurt om te schrijven voor middernacht. En in ${v.more} ${Number(v.more) === 1 ? 'andere band' : 'andere banden'}.`
            : Number(v.count) > 0
              ? `${v.count} ${Number(v.count) === 1 ? 'dag' : 'dagen'} op rij. Jouw beurt om te schrijven voor middernacht.`
              : `${v.name} schreef je vandaag. Jouw beurt, voor middernacht.`,
      },
      link_in_danger: { title: (v) => `Band met ${v.name}`, body: () => 'Jullie band zakt een beetje in. Eén berichtje is genoeg om hem op te vrolijken.' },
      streak_in_danger: { title: (v) => `Je reeks van ${v.count} ${Number(v.count) === 1 ? 'dag' : 'dagen'}`, body: () => 'De uitdaging van vandaag kan vanavond nog.' },
      habit_proof: { title: (v) => `${v.minimoa} wil iets zien`, body: () => 'Tijd voor je gewoonte. Een foto?' },
      weekly_review: { title: () => 'Je weekoverzicht', body: (v) => `${v.minimoa} heeft de balans opgemaakt. Kom kijken.` },
      item_unlocked: {
        title: (v) => (many(v) ? 'Nieuwe items' : 'Nieuw item'),
        body: (v) => (many(v) ? `${v.minimoa} won: ${v.item}, en ${others(v, 'ander item', 'andere items')}.` : `${v.minimoa} won: ${v.item}.`),
      },
      words_received: {
        title: (v) => (many(v) ? `${total(v)} mensen beschreven je` : '3 woorden voor jou'),
        body: (v) => (many(v) ? 'Hun 3 woorden over jou wachten op je.' : 'Iemand koos net 3 woorden over jou. Kom kijken.'),
      },
      trial_reminder: {
        title: (v) => `Je Minimoa+-proefperiode eindigt op ${v.endsOn}`,
        body: (v) => `Daarna volgt de eerste betaling van ${v.price}. Wil je dat niet, zeg dan op in je Apple-accountinstellingen, onder Abonnementen.`,
      },
      group_invite: {
        title: (v) => `${v.name} nodigt je uit voor “${v.group}”`,
        body: (v) => (v.habit ? `Een groep om samen een gewoonte vol te houden: ${v.habit}. Jij beslist.` : 'Een groep met vrienden. Jij beslist.'),
      },
      together_proposal: {
        title: (v) => (v.group ? `“${v.group}” gaat van start` : `${v.habit}, samen?`),
        body: (v) => (v.group ? `Jullie zijn met ${v.count} met dezelfde gewoonte: ${v.habit}. Zeg hallo.` : 'Mensen bij jou in de buurt hebben deze gewoonte ook. Samen volhouden?'),
      },
      group_message: { title: (v) => v.group, body: (v) => `${v.name} schreef in de groep.` },
      group_life_lost: {
        title: (v) => `“${v.group}” verliest een leven`,
        body: (v) => `Nog ${v.count} ${Number(v.count) === 1 ? 'leven' : 'levens'}. Vandaag pakken jullie het samen weer op.`,
      },
      group_asleep: { title: (v) => `“${v.group}” is in slaap gevallen`, body: () => 'Even geen levens meer. Iedereen kan de groep wakker maken.' },
      group_joined: {
        title: (v) => (many(v) ? `${v.name} en ${others(v, 'ander', 'anderen')} komen bij “${v.group}”` : `${v.name} komt bij “${v.group}”`),
        body: (v) => (Number(v.count) >= 3 ? `Jullie zijn nu met ${v.count}. Zeg hallo.` : `Jullie zijn met ${v.count}. Nog één persoon en de reeks begint.`),
      },
      first_steps: {
        title: (v) =>
          v.step === 'd1'
            ? `${v.minimoa} wil weten wie je bent`
            : v.step === 'd2'
              ? `${v.minimoa} heeft een idee`
              : v.step === 'd3'
                ? 'Samen is makkelijker'
                : v.step === 'd5'
                  ? `${v.minimoa} heeft voor je gezocht`
                  : `Een week met ${v.minimoa}`,
        body: (v) =>
          v.step === 'd1'
            ? 'Stuur je “3 woorden”-link naar 3 vrienden: ze beschrijven je, zonder account, en hij leert je beter kennen.'
            : v.step === 'd2'
              ? 'Kies een gewoonte om vol te houden: hij volgt die met je, en mensen in je buurt houden haar misschien ook vol.'
              : v.step === 'd3'
                ? 'Sluit je aan bij een groep via de link, of start je eigen en stuur hem naar 2 vrienden. Hij start bij 3.'
                : v.step === 'd5'
                  ? 'Kom kijken aan wie hij je voorstelt in je buurt. Hij zegt waarom; niets gebeurt zonder jou.'
                  : 'Je eerste week is er: wat er veranderde, en een kaart om te delen.',
      },
      minimoa_news: {
        title: (v) =>
          v.step === 'anniversary'
            ? Number(v.count) < 12
              ? `Een maand met ${v.minimoa}`
              : Number(v.count) === 12
                ? `Een jaar met ${v.minimoa}`
                : `${Math.floor(Number(v.count) / 12)} jaar met ${v.minimoa}`
            : v.days === '3'
              ? `${v.minimoa} denkt aan je`
              : v.days === '7'
                ? `Nieuws van ${v.minimoa}`
                : 'Al twee weken',
        body: (v) =>
          v.step === 'anniversary'
            ? Number(v.count) < 12
              ? 'Een maand samen een team. Fijn dat je er bent.'
              : 'Gefeliciteerd, jullie allebei. Kom kijken hoe ver jullie zijn gekomen.'
            : v.days === '3'
              ? 'Geen haast. Hij houdt je plekje warm.'
              : v.days === '7'
                ? 'Het gaat goed met hem en hij heeft wat verhalen voor je bewaard. Kom langs wanneer je wilt.'
                : `Het gaat goed met ${v.minimoa}. Misschien hebben je banden nieuws voor je.`,
      },
      plus_account: {
        title: (v) =>
          pick(
            {
              welcome: 'Welkom bij Minimoa+',
              renewed: 'Nog een jaar Minimoa+',
              recovered: 'Minimoa+ staat weer aan',
              billing_grace: 'De betaling voor Minimoa+ is niet gelukt',
              billing_retry: 'De betaling voor Minimoa+ is niet gelukt',
              goodbye: 'Minimoa+ stopt hier',
              winback: `${v.minimoa} denkt aan je`,
            },
            v.step,
            'Minimoa+',
          ),
        body: (v) =>
          pick(
            {
              welcome: `${v.minimoa} heeft de premium items tevoorschijn gehaald. De hele kaart en meer ontmoetingen zijn van jou.`,
              renewed: `Je jaarabonnement is verlengd. Bedankt dat je blijft: ${v.minimoa} houdt zijn premium items.`,
              recovered: 'De betaling is gelukt. Bedankt, alles is weer in orde.',
              billing_grace: `Minimoa+ blijft open tot ${v.endsOn}. Werk je betaalmethode bij: Ik › Minimoa+ › Mijn abonnement beheren.`,
              billing_retry: 'Minimoa+ is gepauzeerd. Werk je betaalmethode bij: Ik › Minimoa+ › Mijn abonnement beheren.',
              goodbye: `Bedankt voor dit stukje van de weg. ${v.minimoa}, je banden en je gewoonten blijven, gratis.`,
              winback: 'Minimoa+ is een maand geleden gestopt. Heb je weer zin, dan is het er nog; al de rest gaat gewoon door.',
            },
            v.step,
            '',
          ),
      },
    },
    kindLabels: {
      daily_challenge: 'Uitdaging van de dag',
      needs_out: 'Je minimoa moet naar buiten',
      new_encounter: 'Nieuwe banden',
      waved: 'Iemand zwaait naar je',
      message: 'Berichten',
      your_turn: 'Jouw beurt om te schrijven (reeks van een band)',
      link_in_danger: 'Band in gevaar',
      streak_in_danger: 'Reeks in gevaar',
      habit_proof: 'Bewijs van gewoonte',
      weekly_review: 'Weekoverzicht',
      item_unlocked: 'Ontgrendelde items',
      words_received: '3 woorden ontvangen',
      trial_reminder: 'Einde Minimoa+-proefperiode',
      group_invite: 'Uitnodigingen voor een groep',
      together_proposal: 'Samen volhouden',
      group_message: 'Groepsberichten',
      group_life_lost: 'Groep verloor een leven',
      group_asleep: 'Groep in slaap',
      group_joined: 'Nieuwe leden in een groep',
      first_steps: 'Eerste stappen',
      minimoa_news: 'Nieuws van je minimoa',
      plus_account: 'Je Minimoa+-abonnement',
    },
  },
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
    group: vars.group ?? '',
    habit: vars.habit ? (habitById(vars.habit, locale)?.label ?? vars.habit) : '',
    step: vars.step ?? '',
    others: vars.others ?? '',
    n: vars.n ?? '',
  };
}

/** Titre et corps d'une notification dans la langue de la personne, variables remplies. */
export function notificationText(locale: Locale, kind: NotificationKindKey, vars: Readonly<Record<string, string>> = {}): NotificationText {
  const t = notificationTexts.in(locale).texts[kind];
  const v = notificationVars(locale, vars);
  return { title: t.title(v), body: t.body(v) };
}

/** Paquet du matin : texte du plus important, plus « Et 2 autres nouvelles t’attendent dans l’app. ». */
export function notificationDigestText(locale: Locale, lead: NotificationText, others: number): NotificationText {
  if (others <= 0) return lead;
  return { title: lead.title, body: `${lead.body} ${notificationTexts.in(locale).digestMore(others)}` };
}

export const notificationKindLabel = (locale: Locale, kind: NotificationKindKey): string => notificationTexts.in(locale).kindLabels[kind] ?? kind;
