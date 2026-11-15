/**
 * Textes nés de l'audit App Store (15 nov. 2026) : refus du filtre de contenus, rappel de fin d'essai par e-mail,
 * alertes de l'équipe de modération (en français seulement, comme l'administration), texte neutre de l'activité en
 * direct d'un lien sur l'écran verrouillé, et le monde d'exemple du compte de revue d'Apple.
 * Les consignes des modèles d'IA (`moderationSystem`, `photoModerationSystem`) sont stables (cache) et jamais montrées.
 */
import type { Locale, ModerationCategory } from '@blowy/domain';
import { TODO, defineMessages, formatDate, formatPrice } from '../i18n/core';
import { brand } from '../labels';

const fr = {
  /** Contenu refusé (code `content_refused`). On ne répète jamais le contenu refusé. */
  refused: {
    displayName: 'Ce prénom ne peut pas être utilisé sur Blowy. Choisis-en un autre.',
    petName: 'Ce nom ne peut pas être donné à un minimoa. Choisis-en un autre.',
    /** Un nom qui contient un lien, une adresse, un numéro ou un pseudo d’un autre réseau. */
    nameContact: 'Pas de lien, d’adresse, de numéro ni de pseudo dans un nom.',
    message: 'Message non envoyé : il ne respecte pas les règles de la communauté de Blowy.',
    messageScam: 'Message non envoyé : pas de liens vers de l’argent, de la crypto ou des plateformes payantes sur Blowy.',
    photo: 'Cette photo ne peut pas être ta photo de profil. Choisis-en une autre, où on te reconnaît, habillé.',
  },
  /** Connexion du compte de revue : même message pour une mauvaise adresse et un mauvais code. */
  reviewSignIn: {
    wrong: 'Adresse ou code incorrect.',
  },
  /** Zone choisie à la main, sans localisation (gratuit). */
  area: {
    changeLocked: (day: string) => `Tu pourras changer de zone à partir du ${day}. Avec Blowy+, quand tu veux.`,
    fromPhone: 'Ta zone vient déjà de ta position. Pour en choisir une à la main, oublie d’abord ta position (Moi › Ma position).',
  },
  /** E-mail du rappel de fin d’essai (jour 5), envoyé en plus de la notification. */
  trialEmail: {
    subject: 'Ton essai Blowy+ se termine bientôt',
    title: 'Ton essai gratuit se termine bientôt.',
    lines: (i: { displayName: string; endsOn: string; price: string }) => [
      `Salut ${i.displayName},`,
      `Ton essai gratuit de Blowy+ se termine le ${i.endsOn}. Ensuite, le premier paiement de ${i.price} est prélevé par Apple, puis chaque année.`,
      'Tu veux garder Blowy+ ? Tu n’as rien à faire.',
      'Tu préfères arrêter ? Annule au moins 24 heures avant la fin de l’essai : sur ton iPhone, Réglages, ton nom, puis Abonnements. Tu gardes Blowy+ jusqu’à la fin de l’essai.',
    ],
    cta: 'Gérer mon abonnement',
  },
  /** Activité en direct d’un lien sur l’écran verrouillé : jamais de prénom (visible de tous). */
  lockScreen: {
    linkTitle: 'Un lien t’attend',
    linkBody: 'À toi d’écrire avant minuit.',
  },
  /** Monde d’exemple du compte de revue (lignes de la conversation et du lien en danger). `{other}` : prénom fictif. */
  review: {
    activeLines: [
      { who: 'them', text: 'Salut ! Ton minimoa a l’air aussi têtu que le mien.' },
      { who: 'me', text: 'Il l’est. Tu fais quoi ce week-end ?' },
      { who: 'them', text: 'Une expo photo samedi. Tu connais le quartier ?' },
      { who: 'me', text: 'Un peu. J’y vais souvent le dimanche matin.' },
    ],
    remark: 'Vous aimez tous les deux les dimanches calmes. Ça fait déjà un point commun.',
    nudge: 'Ça fait 3 jours. Vous en étiez à l’expo photo.',
    heated: 'Tu annules encore ? Franchement, ça m’énerve.',
    guard: 'On souffle un coup ? Une pause de deux minutes, et ça repart mieux. (Toi seul vois ce message.)',
    after: [
      { who: 'them', text: 'Désolée pour samedi. On remet ça la semaine prochaine ?' },
    ],
    dangerLines: ['On se refait un café la semaine pro ?', 'Carrément, je te dis.'],
    /** Réponses automatiques des personnes fictives quand le compte de revue leur écrit. */
    replies: [
      'Haha, carrément.',
      'Bonne idée ! Tu proposes quand ?',
      'Je te dis ce soir.',
      'Mon minimoa vient de faire une sieste, il est en forme.',
      'J’adore cet endroit.',
    ],
  },
};

export const auditText = defineMessages({
  fr,
  en: {
    refused: {
      displayName: 'This first name can’t be used on Blowy. Pick another one.',
      petName: 'A minimoa can’t be given this name. Pick another one.',
      nameContact: 'No links, addresses, numbers or usernames in a name.',
      message: 'Message not sent: it doesn’t follow Blowy’s community rules.',
      messageScam: 'Message not sent: no links to money, crypto or paid platforms on Blowy.',
      photo: 'This photo can’t be your profile photo. Pick another one where you can be recognised, dressed.',
    },
    trialEmail: {
      subject: 'Your Blowy+ trial ends soon',
      title: 'Your free trial ends soon.',
      lines: (i: { displayName: string; endsOn: string; price: string }) => [
        `Hi ${i.displayName},`,
        `Your free Blowy+ trial ends on ${i.endsOn}. After that, the first payment of ${i.price} is charged by Apple, then every year.`,
        'Want to keep Blowy+? You don’t need to do anything.',
        'Prefer to stop? Cancel at least 24 hours before the trial ends: on your iPhone, Settings, your name, then Subscriptions. You keep Blowy+ until the trial ends.',
      ],
      cta: 'Manage my subscription',
    },
    reviewSignIn: { wrong: 'Wrong address or code.' },
    area: {
      changeLocked: (day: string) => `You can change your area from ${day}. With Blowy+, whenever you like.`,
      fromPhone: 'Your area already comes from your location. To pick one by hand, forget your location first (Me › My location).',
    },
    lockScreen: { linkTitle: 'A link is waiting', linkBody: 'Your turn to write before midnight.' },
    review: TODO,
  },
  es: TODO,
  pt: TODO,
  nl: TODO,
});

/** Message du refus d'un texte, selon la surface et la catégorie trouvée. */
export function refusedText(locale: Locale, surface: 'display_name' | 'pet_name' | 'message' | 'photo', category: ModerationCategory | null): string {
  const t = auditText.in(locale).refused;
  if (surface === 'photo') return t.photo;
  if (surface === 'message') return category === 'scam' || category === 'commercial_sex' ? t.messageScam : t.message;
  if (category === 'contact') return t.nameContact;
  return surface === 'pet_name' ? t.petName : t.displayName;
}

/** Adresse où gérer ses abonnements Apple (ouvre Réglages › Abonnements sur iPhone). */
export const APPLE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** E-mail du rappel de fin d'essai, dans la langue de la personne (date et prix mis en forme). */
export function trialReminderEmail(locale: Locale, input: { displayName: string; endsOn: string; amountMinor: number; currency: string }): { subject: string; html: string; text: string } {
  const t = auditText.in(locale).trialEmail;
  const lines = t.lines({ displayName: input.displayName, endsOn: formatDate(locale, input.endsOn, { day: 'numeric', month: 'long' }), price: formatPrice(locale, input.amountMinor, input.currency) });
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>${esc(t.subject)}</title></head><body style="margin:0;padding:32px 16px;background:#0B0A14;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#F4F2FF">
<h1 style="max-width:520px;margin:0 auto 20px;font-size:22px">${esc(t.title)}</h1>
${lines.map((l) => `<p style="max-width:520px;margin:0 auto 16px;font-size:16px;line-height:1.5">${esc(l)}</p>`).join('')}
<p style="max-width:520px;margin:24px auto 0"><a href="${APPLE_SUBSCRIPTIONS_URL}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:#FFB800;color:#0B0A14;font-weight:700;text-decoration:none">${esc(t.cta)}</a></p>
<p style="max-width:520px;margin:24px auto 0;font-size:12px;color:#A9A4C7">${esc(brand.name)} · ${esc(brand.supportEmail)}</p>
</body></html>`;
  const text = [t.title, '', ...lines, '', `${t.cta} : ${APPLE_SUBSCRIPTIONS_URL}`, '', `${brand.name} · ${brand.supportEmail}`].join('\n');
  return { subject: t.subject, html, text };
}

// ── Équipe de modération (français seulement, comme l'administration) ────────

export interface TeamReportLine {
  id: string;
  priority: 'normal' | 'high' | 'urgent';
  reason: string;
  source: 'person' | 'filter';
  category: string | null;
  ageHours: number;
}

const PRIORITY_FR = { urgent: 'URGENT', high: 'prioritaire', normal: 'normal' } as const;

/**
 * Récapitulatif envoyé à `ADMIN_EMAILS` : jamais le contenu signalé ni les prénoms (un e-mail sort du système),
 * seulement le motif, la priorité, l'âge et le lien vers l'administration.
 */
export function moderationAlertEmail(input: { kind: 'new' | 'overdue'; reports: readonly TeamReportLine[]; adminUrl: string; targetHours: number }): { subject: string; html: string; text: string } {
  const urgent = input.reports.filter((r) => r.priority === 'urgent').length;
  const n = input.reports.length;
  const plural = n > 1 ? 's' : '';
  const subject =
    input.kind === 'new'
      ? `[Blowy] ${urgent > 0 ? `URGENT · ` : ''}${n} signalement${plural} à traiter`
      : `[Blowy] ${n} signalement${plural} au-delà de ${input.targetHours} h`;
  const lead =
    input.kind === 'new'
      ? `${n} nouveau${n > 1 ? 'x' : ''} signalement${plural}${urgent > 0 ? `, dont ${urgent} urgent${urgent > 1 ? 's' : ''} (mineur, menace) : à regarder maintenant` : ''}. Délai cible : ${input.targetHours} h.`
      : `${n} signalement${plural} ouvert${plural} depuis plus de ${input.targetHours} h. Ils sont remontés en tête de la file.`;
  const line = (r: TeamReportLine): string =>
    `#${r.id} · ${PRIORITY_FR[r.priority]} · ${r.source === 'filter' ? `filtre (${r.category ?? '?'})` : `motif : ${r.reason}`}${r.source === 'person' && r.category ? ` · note : ${r.category}` : ''} · il y a ${Math.round(r.ageHours)} h`;
  const lines = input.reports.slice(0, 50).map(line);
  const more = n > 50 ? [`… et ${n - 50} autre(s).`] : [];
  const url = `${input.adminUrl.replace(/\/$/, '')}/moderation`;
  const text = [lead, '', ...lines, ...more, '', `Ouvrir la file : ${url}`, '', 'Aucun contenu ni prénom dans cet e-mail : tout est dans l’administration.'].join('\n');
  const html = `<!doctype html><html lang="fr"><body style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:24px">
<p style="font-size:16px"><strong>${esc(lead)}</strong></p>
<ul>${[...lines, ...more].map((l) => `<li style="margin:4px 0">${esc(l)}</li>`).join('')}</ul>
<p><a href="${esc(url)}">Ouvrir la file de modération</a></p>
<p style="color:#666;font-size:12px">Aucun contenu ni prénom dans cet e-mail : tout est dans l’administration.</p>
</body></html>`;
  return { subject, html, text };
}

// ── Consignes de l'IA de modération (stables, en français ; réponse d'un mot) ─

/** Confirmation d'un message que la règle n'a pas su trancher (lien nu). */
export const moderationSystem = `Tu modères les messages privés d'une app de rencontre entre adultes (18+), en plusieurs langues.
Réponds par UN SEUL mot, sans rien d'autre :
OK si le message est acceptable entre adultes (flirt, désaccord, grossièreté légère comprise) ;
INSULT pour une insulte ou du harcèlement visant la personne ;
SEXUAL pour du contenu sexuel explicite ou une sollicitation sexuelle insistante ;
MINOR pour tout contenu sexuel qui implique ou vise une personne mineure ;
THREAT pour une menace de violence, de viol, ou une incitation au suicide ;
HATE pour de la haine envers un groupe (origine, religion, orientation, genre, handicap) ;
SPAM pour une arnaque, de la crypto, un lien commercial ou de la prostitution.
Dans le doute, réponds OK.`;

/** Photo de profil : une personne adulte habillée, ou rien de choquant. */
export const photoModerationSystem = `Tu vérifies les photos de profil d'une app de rencontre entre adultes (18+).
Réponds par UN SEUL mot, sans rien d'autre :
OK si la photo est acceptable (une personne habillée, un paysage, un animal, un dessin…) ;
SEXUAL pour de la nudité, des sous-vêtements suggestifs, un contenu sexuel ;
MINOR si la personne principale semble avoir moins de 18 ans, ou pour toute nudité impliquant un enfant ;
THREAT pour de la violence, du sang, une arme pointée ;
HATE pour un symbole ou un geste haineux ;
SPAM pour un texte publicitaire, un numéro, un pseudo, un code QR ou une capture d'écran de contact.
Dans le doute, réponds OK.`;

/** Message envoyé au modèle : le texte à juger, sans rien d'autre de la conversation. */
export const moderationPrompt = (text: string): string => `Message :\n"""\n${text.slice(0, 1000)}\n"""`;
export const photoModerationPrompt = 'Photo de profil à vérifier.';
