/**
 * Contenus V5 (spec-v5 §2.7, §2.10–2.13, §5, §9) : souvenirs, accessoires, brise-glace des pets,
 * messages système neutres, libellés de vote, créneaux, offres des lieux, notifications V5 et leurs
 * variantes discrètes. Règles vérifiées par tests : variables allowlistées, aucun commentaire
 * physique ni parole humaine prêtée au pet, aucune urgence commerciale, variantes discrètes sans
 * prénom, pet, lieu ni mot « sortie » / « duo » (seule variable possible : l'heure).
 */
import type { ActivityKind, NotificationCategoryV5, PetMemoryKind } from '@blowy/domain';
import type { I18nEntry } from './types.js';

// ---------------------------------------------------------------- souvenirs (§2.13)
export const MEMORY_ENTRIES: Array<I18nEntry<PetMemoryKind>> = [
  { id: 'HATCHED', key: 'memory.hatched', fr: '{pet} est sorti·e de sa coquille' },
  { id: 'OUTING_LIVED', key: 'memory.outing_lived', fr: 'Une sortie au {lieu} avec {nombre} pets' },
  { id: 'DUO_DATE_LIVED', key: 'memory.duo_date_lived', fr: 'Un rendez-vous à deux au {lieu}' },
  { id: 'BAND_NEW_MEMBER', key: 'memory.band_new_member', fr: '{autrePet} a rejoint la bande' },
  { id: 'PROMISE_KEPT', key: 'memory.promise_kept', fr: 'Parole tenue : {nombre} sorties vécues' },
  { id: 'EGG', key: 'memory.egg', fr: 'Un œuf est arrivé à la maison' },
];

// ---------------------------------------------------------------- accessoires (non achetables, D-020)
export const ACCESSORY_SLOTS = ['HEAD', 'FACE', 'NECK', 'BODY', 'HAND'] as const;
export type AccessorySlot = (typeof ACCESSORY_SLOTS)[number];
export interface AccessoryEntry extends I18nEntry {
  slot: AccessorySlot;
}
const acc = (id: string, slot: AccessorySlot, fr: string): AccessoryEntry => ({ id, key: `accessory.${id}`, slot, fr });
/** Les identifiants sont référencés par `@blowy/tuning` (memories, accessories) ; vérifié par test. */
export const ACCESSORIES: AccessoryEntry[] = [
  acc('scarf_red', 'NECK', 'Écharpe rouge'),
  acc('cap_blue', 'HEAD', 'Casquette bleue'),
  acc('glasses_round', 'FACE', 'Lunettes rondes'),
  acc('crown_paper', 'HEAD', 'Couronne en papier'),
  acc('badge_first_outing', 'BODY', 'Badge « première sortie »'),
  acc('bracelet_friendship', 'HAND', 'Bracelet de l’amitié'),
  acc('flower_lapel', 'BODY', 'Fleur à la boutonnière'),
  acc('medal_promise', 'NECK', 'Médaille « parole tenue »'),
  acc('kite_referral', 'HAND', 'Cerf-volant'),
  acc('hat_beret', 'HEAD', 'Béret'),
  acc('bow_tie', 'NECK', 'Nœud papillon'),
  acc('backpack_mini', 'BODY', 'Mini sac à dos'),
  acc('umbrella_yellow', 'HAND', 'Parapluie jaune'),
  acc('headphones', 'HEAD', 'Casque audio'),
  acc('bandana_green', 'NECK', 'Bandana vert'),
];

// ---------------------------------------------------------------- brise-glace du pet (§2.7)
/** Messages SYSTEM signés par le pet : à l'ouverture du chat, au verrouillage, à la révélation des photos. */
export const ICEBREAKER_MOMENTS = ['OPEN', 'LOCK', 'REVEAL'] as const;
export type IcebreakerMoment = (typeof ICEBREAKER_MOMENTS)[number];
export const ICEBREAKER_MESSAGES: Array<I18nEntry & { moment: IcebreakerMoment }> = [
  { id: 'open', moment: 'OPEN', key: 'icebreaker.open', fr: '{pet} dit bonjour à toute la bande ! On se présente en 3 mots ?' },
  { id: 'open_alt', moment: 'OPEN', key: 'icebreaker.open_alt', fr: '{pet} a déjà repéré {nombre} nouveaux pets. Qui commence ?' },
  { id: 'lock', moment: 'LOCK', key: 'icebreaker.lock', fr: '{pet} a reçu l’adresse : rendez-vous {jour} à {heure} au {lieu}. Les visages de la bande sont visibles.' },
  { id: 'reveal', moment: 'REVEAL', key: 'icebreaker.reveal', fr: '{pet} lève le rideau : les visages de la bande sont visibles. À tout à l’heure !' },
];
/** Questions soufflées (`promptId` = clé) ; réponses « 3 mots » (≤ 3 mots, ≤ 40 caractères). */
const prompt = (id: string, fr: string): I18nEntry => ({ id, key: `icebreaker.prompt.${id}`, fr });
export const ICEBREAKER_PROMPTS: I18nEntry[] = [
  prompt('sunday', 'Ton dimanche idéal en 3 mots ?'),
  prompt('playlist', 'Ta playlist du moment en 3 mots ?'),
  prompt('childhood', 'Un souvenir d’enfance en 3 mots ?'),
  prompt('trip', 'Ton prochain voyage rêvé en 3 mots ?'),
  prompt('dish', 'Le plat que tu pourrais manger tous les jours ?'),
  prompt('talent', 'Un talent caché en 3 mots ?'),
  prompt('neighborhood', 'Ton coin préféré du quartier ?'),
  prompt('book', 'Le dernier livre ou film qui t’a marqué·e ?'),
  prompt('motto', 'Ta devise en 3 mots ?'),
  prompt('weekend', 'Ce week-end, tu as fait quoi en 3 mots ?'),
  prompt('superpower', 'Le super-pouvoir que tu choisirais ?'),
  prompt('morning', 'Ton matin parfait en 3 mots ?'),
];

// ---------------------------------------------------------------- messages système neutres (D-017, D-025)
const sys = (id: string, fr: string): I18nEntry => ({ id, key: `system.${id}`, fr });
/** Un même texte neutre pour toute fin non mutuelle ou recomposition : il ne révèle jamais un motif. */
export const SYSTEM_MESSAGES_V5: I18nEntry[] = [
  sys('outing.composition_changed', 'La composition de ta sortie a changé. Ta place est remboursée et tu es prioritaire la semaine prochaine.'),
  sys('outing.member_not_coming', '{prenom} ne pourra pas venir.'),
  sys('outing.chat_closed', 'Ce chat se ferme. La suite se passe dans ta bande et tes duos.'),
  sys('outing.cancelled_undersized', 'Pas assez de monde cette fois : la sortie est annulée et ta place est rendue. Tu es prioritaire la semaine prochaine.'),
  sys('duo.exchange_expired', 'Vos pets se sont dit au revoir.'),
  sys('duo.ended', 'Ce duo s’arrête ici, merci d’être venu·e.'),
  sys('duo.left', 'Ce duo s’arrête ici. Merci pour les bons moments.'),
  sys('band.left', 'Ce lien s’arrête ici. Merci pour les bons moments.'),
  sys('votes.closed_neutral', 'Merci pour cette sortie. Ton pet garde le souvenir.'),
  sys('votes.closed_summary', '{nombre} nouvelles personnes dans ta bande.'),
  sys('waitlist.not_launched', 'Le quartier {quartier} se prépare : {nombre} personnes vérifiées sur le seuil. Invite tes amis pour le lancer plus vite.'),
  sys('waitlist.not_placed', 'Pas de sortie cette semaine. Tu es prioritaire la semaine prochaine.'),
  sys('waitlist.estimated', 'Lancement estimé : {jour}.'),
  sys('waitlist.seeding', 'Viens avec ta team : à 3 personnes vérifiées, on vous organise une première sortie avec une autre team de la ville.'),
  sys('outing.cancel_after_lock', 'Le groupe est confirmé : annuler maintenant compte comme une absence et la place n’est pas remboursée. En cas de problème de sécurité, utilise « Je ne me sens pas en sécurité ».'),
  sys('outing.booking_name', 'Au lieu, la table est réservée au nom de « Blowy ».'),
];

// ---------------------------------------------------------------- votes d'après (§2.10)
export const VOTE_LABELS: I18nEntry[] = [
  { id: 'FRIEND', key: 'vote.friend', fr: 'Ami·e' },
  { id: 'PLUS', key: 'vote.plus', fr: 'Plus' },
  { id: 'NO', key: 'vote.no', fr: 'Non' },
  { id: 'PLUS_NOTE', key: 'vote.plus_note', fr: 'Si l’autre dit ami·e, vous restez ami·es.' },
  { id: 'DEFAULT_NOTE', key: 'vote.default_note', fr: 'Sans réponse, c’est « non ». Personne ne le saura.' },
  { id: 'SECRET', key: 'vote.secret_note', fr: 'Ton choix reste secret. Seuls les accords réciproques sont révélés, jamais un « non ».' },
];

// ---------------------------------------------------------------- créneaux et lieux
const WEEKDAYS_FR = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'] as const;
const WEEKDAY_IDS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export const SLOT_PERIODS = ['morning', 'afternoon', 'evening'] as const;
export type SlotPeriod = (typeof SLOT_PERIODS)[number];
const PERIOD_FR: Record<SlotPeriod, string> = { morning: 'matin', afternoon: 'après-midi', evening: 'soir' };
export const SLOT_LABELS: I18nEntry[] = WEEKDAY_IDS.flatMap((d, i) => SLOT_PERIODS.map((p) => ({ id: `${d}_${p}`, key: `slot.${d}_${p}`, fr: `${WEEKDAYS_FR[i]} ${PERIOD_FR[p]}` })));
/** Clé de libellé d'un créneau (`OutingWeekView.slots[].label`) : jour ISO 1–7, heure locale. */
export function slotLabelKey(isoWeekday: number, localHour: number): string {
  const period: SlotPeriod = localHour < 12 ? 'morning' : localHour < 18 ? 'afternoon' : 'evening';
  return `slot.${WEEKDAY_IDS[Math.min(7, Math.max(1, isoWeekday)) - 1]}_${period}`;
}

/** `Venue.offerKey` — V5.1 (H.23) : consommation NON incluse, chacun paie ce qu'il prend au lieu. */
export const VENUE_OFFERS: I18nEntry[] = [
  { id: 'table_reserved', key: 'venue.offer.table_reserved', fr: 'Table réservée pour la bande. Chacun paie ce qu’il prend sur place.' },
  { id: 'quiet_corner', key: 'venue.offer.quiet_corner', fr: 'Un coin calme réservé. Chacun paie ce qu’il prend sur place.' },
  { id: 'activity_spot', key: 'venue.offer.activity_spot', fr: 'Créneau d’activité réservé. Chacun règle sa participation sur place.' },
];

/** Types d'activité (V5.1 D.14). */
export const ACTIVITY_ENTRIES: Array<I18nEntry<ActivityKind>> = [
  { id: 'DRINK_COFFEE', key: 'activity.drink_coffee', fr: 'Un verre ou un café' },
  { id: 'BRUNCH', key: 'activity.brunch', fr: 'Brunch' },
  { id: 'CLIMBING', key: 'activity.climbing', fr: 'Bloc / escalade' },
  { id: 'WORKSHOP', key: 'activity.workshop', fr: 'Atelier' },
  { id: 'GAMES', key: 'activity.games', fr: 'Jeux' },
  { id: 'EXHIBITION', key: 'activity.exhibition', fr: 'Expo' },
];

// ---------------------------------------------------------------- notifications V5 (§9)
export interface NotificationTemplateV5 {
  /** `templateKey` du catalogue §9.1. */
  templateKey: string;
  category: NotificationCategoryV5 | 'IN_APP';
  /** Clé du corps ; la variante discrète est `<key>.discreet`. */
  key: string;
  fr: string;
  discreetFr: string;
  /** Transactionnel de la sortie du jour (hors plafond quotidien, §9.2). */
  transactional: boolean;
  /** `pet.memory` : in-app seulement, jamais de push. */
  inAppOnly: boolean;
}
const n = (templateKey: string, category: NotificationTemplateV5['category'], fr: string, discreetFr = 'Tu as du nouveau.', flags: { transactional?: boolean; inAppOnly?: boolean } = {}): NotificationTemplateV5 => ({
  templateKey,
  category,
  key: `notif.v5.${templateKey}`,
  fr,
  discreetFr,
  transactional: flags.transactional ?? false,
  inAppOnly: flags.inAppOnly ?? false,
});
export const NOTIFICATION_TITLE_KEYS = { default: 'notif.v5.title', discreet: 'notif.v5.discreet_title' } as const;
export const NOTIFICATION_TITLES: I18nEntry[] = [
  { id: 'default', key: NOTIFICATION_TITLE_KEYS.default, fr: 'Blowy' },
  { id: 'discreet', key: NOTIFICATION_TITLE_KEYS.discreet, fr: 'Rappel' },
];
export const NOTIFICATION_TEMPLATES_V5: NotificationTemplateV5[] = [
  n('outing.request_open', 'OUTING', '{pet} est prêt·e à te trouver une bande cette semaine. Choisis tes créneaux.'),
  n('outing.request_last_call', 'OUTING', 'Les demandes de la semaine ferment à {heure}. {pet} attend tes créneaux.'),
  n('outing.invited', 'OUTING', '{pet} t’a trouvé une bande pour {jour}.'),
  n('outing.invite_reminder', 'OUTING', 'Ta bande de {jour} attend ta réponse.'),
  n('outing.unplaced', 'OUTING', 'Pas de sortie cette semaine, tu es prioritaire la prochaine.'),
  n('outing.formed', 'OUTING', 'Ta bande de {jour} est formée : le chat est ouvert.'),
  n('outing.venue_revealed', 'OUTING', 'Ta bande est confirmée : rendez-vous demain à {heure} au {lieu}, les visages sont visibles.', 'Rappel pour demain à {heure}.'),
  // V5.3 B.7–B.8 (T8) : confirmation J-1 18 h (lieu + groupe, sans visages) puis visages à J − 3 h.
  n('outing.confirmed', 'OUTING', 'Ta sortie de {jour} est confirmée : {heure} au {lieu}. Les prénoms de ta bande sont visibles ; une annulation compte désormais comme une absence.', 'Rappel pour demain à {heure}.'),
  n('outing.faces', 'OUTING', 'Les visages de ta bande sont visibles. À tout à l’heure, {heure} au {lieu}.', 'Rappel pour {heure}.'),
  n('outing.today', 'OUTING', 'C’est aujourd’hui, à {heure} au {lieu}.', 'Rappel pour aujourd’hui à {heure}.'),
  n('outing.seeding_invited', 'OUTING', 'Ta team et une autre team de la ville sortent {jour} : réponds pour confirmer.'),
  n('team.member_joined', 'SYSTEM', '{prenom} a rejoint ta team.'),
  n('outing.checkin_open', 'OUTING', 'Tu es arrivé·e ? Fais ton check-in au {lieu}.', 'C’est l’heure.', { transactional: true }),
  n('outing.cancelled', 'OUTING', 'Ta sortie de {jour} est annulée. Ta place t’est rendue.', 'Un changement de programme.', { transactional: true }),
  n('outing.composition_changed', 'OUTING', 'La composition de ta sortie a changé. Ta place est remboursée et tu es prioritaire la semaine prochaine.', 'Un changement de programme.', { transactional: true }),
  n('outing.refund_done', 'OUTING', 'Ton remboursement est effectué.', 'Une opération est terminée.', { transactional: true }),
  n('votes.opened', 'VOTE', 'Alors, cette sortie ? Dis en secret qui tu aimerais revoir.'),
  n('votes.reminder', 'VOTE', 'Tu as encore jusqu’à {heure} pour dire en secret qui tu aimerais revoir.'),
  n('connection.friend', 'CONNECTION', 'C’est réciproque : {prenom} rejoint ta bande.'),
  n('connection.plus', 'CONNECTION', 'C’est réciproque avec {prenom} : votre chat à deux est ouvert.'),
  n('votes.closed', 'VOTE', 'Les choix sont clos. {pet} range ce souvenir.'),
  n('duo.proposal', 'DUO', '{pet} a croisé un pet qui partage ta vision.'),
  n('duo.matched', 'DUO', '{pet} et {autrePet} commencent à se parler.'),
  n('duo.unlocked', 'DUO', 'Vous avez échangé tous les deux : visages et voix sont débloqués.'),
  n('duo.exchange_ending', 'DUO', '{pet} aimerait encore échanger avec {autrePet} avant {heure}.'),
  n('duo.date_proposed', 'DUO', '{prenom} te propose un rendez-vous {jour} à {heure}.'),
  n('duo.date_confirmed', 'DUO', 'Rendez-vous confirmé {jour} à {heure} au {lieu}.', 'Rappel pour {heure}.'),
  n('duo.date_reminder', 'DUO', 'Demain à {heure} au {lieu} avec {prenom}.', 'Rappel pour demain à {heure}.'),
  n('duo.checkin_open', 'DUO', 'Tu es arrivé·e ? Fais ton check-in au {lieu}.', 'C’est l’heure.', { transactional: true }),
  n('duo.deadline_soon', 'DUO', 'Il reste un jour pour fixer un rendez-vous avec {prenom}.'),
  n('duo.after_vote', 'DUO', 'Alors, ce rendez-vous ? Dis-le en secret.'),
  n('duo.closed', 'DUO', 'Ce duo s’arrête ici, merci d’être venu·e.'),
  n('message.human', 'HUMAN_MESSAGE', 'Nouveau message de {prenom}.'),
  n('reliability.paused', 'RELIABILITY', 'Petite pause jusqu’au {jour} : on se retrouve après pour une nouvelle sortie.'),
  n('safety.alert_sent', 'SAFETY', 'Ton alerte est envoyée. En cas de danger, appelle le 112.', 'Ton alerte est envoyée. En cas de danger, appelle le 112.'),
  n('neighborhood.launched', 'SYSTEM', 'Le quartier {quartier} est lancé : les premières sorties arrivent.'),
  n('pet.memory', 'IN_APP', '{pet} a un nouveau souvenir.', 'Tu as du nouveau.', { inAppOnly: true }),
];
