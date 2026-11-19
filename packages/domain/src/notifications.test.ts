import { describe, expect, it } from 'vitest';
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_KINDS,
  type NotificationHistoryEntry,
  type NotificationInput,
  categoryOf,
  decideNotification,
  emailAllowed,
  isMandatory,
  mergeNotificationVars,
  notificationTierOf,
  pickDigestLead,
} from './index';

/** 15 novembre 2026, 13 h à Paris. */
const DAY = new Date('2026-11-15T12:00:00Z');
/** 23 h 30 à Paris. */
const NIGHT = new Date('2026-11-15T22:30:00Z');
const MORNING = new Date('2026-11-16T07:00:00Z');

const base: NotificationInput = {
  kind: 'waved',
  key: null,
  enabled: true,
  marketingOptIn: false,
  now: DAY,
  timeZone: 'Europe/Paris',
  history: [],
  lastOpenAt: null,
  foreground: null,
};
let seq = 0;
const sent = (kind: NotificationHistoryEntry['kind'], at: string, extra: Partial<NotificationHistoryEntry> = {}): NotificationHistoryEntry => ({
  id: String(++seq),
  kind,
  key: null,
  localDay: at.slice(0, 10),
  status: 'sent',
  at,
  sendAfter: null,
  ...extra,
});

describe('priorités et catégories', () => {
  it('chaque type a une priorité ; chaque type non obligatoire a exactement une catégorie', () => {
    expect(notificationTierOf('message')).toBe('direct');
    expect(notificationTierOf('new_encounter')).toBe('direct');
    expect(notificationTierOf('trial_reminder')).toBe('urgent');
    expect(notificationTierOf('plus_account', 'billing_retry')).toBe('urgent');
    expect(notificationTierOf('plus_account', 'winback')).toBe('marketing');
    expect(notificationTierOf('plus_account', 'welcome')).toBe('news');
    expect(notificationTierOf('waved')).toBe('social');
    expect(notificationTierOf('daily_challenge')).toBe('ritual');
    for (const kind of NOTIFICATION_KINDS) {
      const found = Object.values(NOTIFICATION_CATEGORIES).filter((kinds) => (kinds as readonly string[]).includes(kind));
      expect(found.length, kind).toBe(isMandatory(kind) ? 0 : 1);
    }
    expect(categoryOf('waved')).toBe('encounters');
    expect(categoryOf('group_joined')).toBe('group_joined');
    expect(categoryOf('trial_reminder')).toBeNull();
  });
});

describe('décision', () => {
  it('réglage coupé, sauf pour un type obligatoire ; marketing seulement avec accord', () => {
    expect(decideNotification(base)).toEqual({ action: 'send' });
    expect(decideNotification({ ...base, enabled: false })).toEqual({ action: 'skip', reason: 'disabled' });
    expect(decideNotification({ ...base, kind: 'trial_reminder', enabled: false })).toEqual({ action: 'send' });
    expect(decideNotification({ ...base, kind: 'plus_account', step: 'winback' })).toEqual({ action: 'skip', reason: 'not_opted_in' });
    expect(decideNotification({ ...base, kind: 'plus_account', step: 'winback', marketingOptIn: true })).toEqual({ action: 'send' });
  });

  it('premier plan : rien sur la conversation ouverte ni pour les rappels ; un message d’ailleurs passe', () => {
    const fg = { ...base, foreground: { key: 'L1' } };
    expect(decideNotification({ ...fg, kind: 'message', key: 'L1' })).toEqual({ action: 'skip', reason: 'foreground' });
    expect(decideNotification({ ...fg, kind: 'message', key: 'L2' })).toEqual({ action: 'send' });
    expect(decideNotification({ ...fg, kind: 'waved' })).toEqual({ action: 'skip', reason: 'foreground' });
    expect(decideNotification({ ...fg, kind: 'item_unlocked' })).toEqual({ action: 'skip', reason: 'foreground' });
    expect(decideNotification({ ...fg, kind: 'trial_reminder' })).toEqual({ action: 'send' });
  });

  it('heures calmes : report au matin, messages compris (un seul paquet pour la nuit) ; rappel du soir abandonné', () => {
    expect(decideNotification({ ...base, now: NIGHT })).toEqual({ action: 'defer', until: MORNING, bucket: null, reason: 'quiet' });
    expect(decideNotification({ ...base, kind: 'message', key: 'L1', now: NIGHT })).toEqual({ action: 'defer', until: MORNING, bucket: 'night', reason: 'quiet' });
    const pending = sent('message', '2026-11-15T22:10:00Z', { status: 'deferred', key: 'night', sendAfter: MORNING.toISOString() });
    expect(decideNotification({ ...base, kind: 'message', key: 'L2', now: NIGHT, history: [pending] })).toEqual({ action: 'merge', into: pending.id });
    expect(decideNotification({ ...base, kind: 'your_turn', now: NIGHT })).toMatchObject({ action: 'skip' });
    expect(decideNotification({ ...base, kind: 'daily_challenge', now: NIGHT })).toEqual({ action: 'skip', reason: 'quiet' });
  });

  it('échéance : fin d’essai avant le matin → envoi tout de suite ; après → report ; passée → rien', () => {
    expect(decideNotification({ ...base, kind: 'trial_reminder', now: NIGHT, expiresAt: '2026-11-16T03:00:00Z' })).toEqual({ action: 'send' });
    expect(decideNotification({ ...base, kind: 'trial_reminder', now: NIGHT, expiresAt: '2026-11-17T22:00:00Z' })).toMatchObject({ action: 'defer', until: MORNING });
    expect(decideNotification({ ...base, kind: 'trial_reminder', expiresAt: '2026-11-15T11:00:00Z' })).toEqual({ action: 'skip', reason: 'expired' });
  });

  it('rafale : après un envoi, la suite attend la fin de l’heure dans un seul paquet', () => {
    const first = sent('waved', '2026-11-15T11:40:00Z');
    expect(decideNotification({ ...base, history: [first] })).toEqual({ action: 'defer', until: new Date('2026-11-15T12:40:00Z'), bucket: null, reason: 'group' });
    const pending = sent('waved', '2026-11-15T11:50:00Z', { status: 'deferred', sendAfter: '2026-11-15T12:40:00Z' });
    expect(decideNotification({ ...base, history: [first, pending] })).toEqual({ action: 'merge', into: pending.id });
    // Une heure après : envoi normal.
    expect(decideNotification({ ...base, history: [sent('waved', '2026-11-15T10:50:00Z')] })).toEqual({ action: 'send' });
    // Groupes : par conversation.
    expect(decideNotification({ ...base, kind: 'group_joined', key: 'G2', history: [sent('group_joined', '2026-11-15T11:40:00Z', { key: 'G1' })] })).toEqual({ action: 'send' });
  });

  it('plafonds : 3 par jour, 2 rappels de rituels, une place gardée pour les gens ; messages et échéances hors plafond', () => {
    const two = [sent('daily_challenge', '2026-11-15T08:00:00Z'), sent('waved', '2026-11-15T09:00:00Z')];
    // Deux envois : un rappel de plus prendrait la place gardée pour les gens.
    expect(decideNotification({ ...base, kind: 'needs_out', history: two })).toEqual({ action: 'skip', reason: 'cap' });
    expect(decideNotification({ ...base, kind: 'group_invite', history: two })).toEqual({ action: 'send' });
    const three = [...two, sent('group_invite', '2026-11-15T10:00:00Z')];
    expect(decideNotification({ ...base, kind: 'words_received', history: three })).toEqual({ action: 'skip', reason: 'cap' });
    expect(decideNotification({ ...base, kind: 'message', key: 'L1', history: three })).toEqual({ action: 'send' });
    expect(decideNotification({ ...base, kind: 'new_encounter', history: three })).toEqual({ action: 'send' });
    expect(decideNotification({ ...base, kind: 'trial_reminder', history: three })).toEqual({ action: 'send' });
    // Hier ne compte pas.
    expect(decideNotification({ ...base, kind: 'words_received', history: three.map((h) => ({ ...h, localDay: '2026-11-14' })) })).toEqual({ action: 'send' });
  });

  it('délai de 5 minutes par conversation ; une fois par jour ; fenêtre locale du soir', () => {
    const msg = sent('message', '2026-11-15T11:58:00Z', { key: 'L1' });
    expect(decideNotification({ ...base, kind: 'message', key: 'L1', history: [msg] })).toEqual({ action: 'skip', reason: 'cooldown' });
    expect(decideNotification({ ...base, kind: 'message', key: 'L2', history: [msg] })).toEqual({ action: 'send' });
    expect(decideNotification({ ...base, kind: 'daily_challenge', history: [sent('daily_challenge', '2026-11-15T08:00:00Z')] })).toEqual({ action: 'skip', reason: 'once_a_day' });
    // 13 h à Paris : « à toi d'écrire avant minuit » n'a pas de sens.
    expect(decideNotification({ ...base, kind: 'your_turn' })).toEqual({ action: 'skip', reason: 'window' });
    // 19 h à Paris (18 h UTC) : oui ; mais 13 h à New York au même instant : non.
    const evening = new Date('2026-11-15T18:00:00Z');
    expect(decideNotification({ ...base, kind: 'your_turn', now: evening })).toEqual({ action: 'send' });
    expect(decideNotification({ ...base, kind: 'your_turn', now: evening, timeZone: 'America/New_York' })).toEqual({ action: 'skip', reason: 'window' });
  });

  it('conversation animée : après 4 pushs dans la journée, un toutes les 30 minutes au plus', () => {
    const four = ['10:00', '10:10', '10:20', '11:40'].map((t) => sent('message', `2026-11-15T${t}:00Z`, { key: 'L1' }));
    // Dernier push il y a 20 min : passé 5 min, mais conversation animée → 30 min.
    expect(decideNotification({ ...base, kind: 'message', key: 'L1', history: four })).toEqual({ action: 'skip', reason: 'cooldown' });
    expect(decideNotification({ ...base, kind: 'message', key: 'L1', history: four.slice(0, 3) })).toEqual({ action: 'send' });
    expect(decideNotification({ ...base, kind: 'message', key: 'L1', now: new Date('2026-11-15T12:11:00Z'), history: four })).toEqual({ action: 'send' });
    // Hier ne compte pas pour « animée ».
    const yesterday = four.map((h) => ({ ...h, localDay: '2026-11-14', at: h.at.replace('-15T', '-14T') }));
    expect(decideNotification({ ...base, kind: 'message', key: 'L1', history: [...yesterday, sent('message', '2026-11-15T11:50:00Z', { key: 'L1' })] })).toEqual({ action: 'send' });
  });

  it('nouveau lien puis premier message de la même personne : un seul push', () => {
    const created = sent('new_encounter', '2026-11-15T11:58:00Z', { link: 'L1' });
    expect(decideNotification({ ...base, kind: 'message', key: 'L1', link: 'L1', history: [created] })).toEqual({ action: 'skip', reason: 'cooldown' });
    expect(decideNotification({ ...base, kind: 'message', key: 'L2', link: 'L2', history: [created] })).toEqual({ action: 'send' });
    expect(decideNotification({ ...base, kind: 'message', key: 'L1', link: 'L1', now: new Date('2026-11-15T12:04:00Z'), history: [created] })).toEqual({ action: 'send' });
  });

  it('décroissance : rappels ralentis après 2 jours sans ouvrir, arrêtés après 3 ; les gens passent toujours', () => {
    const away = (days: number): string => new Date(DAY.getTime() - days * 86_400_000).toISOString();
    const yesterdayRitual = [sent('daily_challenge', '2026-11-14T20:00:00Z')];
    expect(decideNotification({ ...base, kind: 'needs_out', lastOpenAt: away(1), history: yesterdayRitual })).toEqual({ action: 'send' });
    expect(decideNotification({ ...base, kind: 'needs_out', lastOpenAt: away(2.2), history: yesterdayRitual })).toEqual({ action: 'skip', reason: 'decay' });
    expect(decideNotification({ ...base, kind: 'needs_out', lastOpenAt: away(2.2), history: [sent('daily_challenge', '2026-11-14T08:00:00Z')] })).toEqual({ action: 'send' });
    expect(decideNotification({ ...base, kind: 'daily_challenge', lastOpenAt: away(4) })).toEqual({ action: 'skip', reason: 'decay' });
    expect(decideNotification({ ...base, kind: 'minimoa_news', lastOpenAt: away(7) })).toEqual({ action: 'send' });
    expect(decideNotification({ ...base, kind: 'waved', lastOpenAt: away(30) })).toEqual({ action: 'send' });
  });
});

describe('regroupement et canal', () => {
  it('paquet du matin : on montre le plus important, puis le plus ancien', () => {
    expect(pickDigestLead([])).toBe(-1);
    expect(
      pickDigestLead([
        { kind: 'waved', at: '2026-11-15T22:10:00Z' },
        { kind: 'message', at: '2026-11-15T23:10:00Z' },
        { kind: 'new_encounter', at: '2026-11-15T22:50:00Z' },
      ]),
    ).toBe(2);
    expect(pickDigestLead([{ kind: 'words_received', at: '2026-11-15T23:00:00Z' }, { kind: 'plus_account', step: 'billing_retry', at: '2026-11-15T23:30:00Z' }])).toBe(1);
  });

  it('« Léa et 3 autres » : premier prénom gardé, personnes distinctes comptées', () => {
    let v: Record<string, string> = { name: 'Léa', about: 'u1' };
    for (const about of ['u2', 'u3', 'u2', 'u4']) v = mergeNotificationVars(v, { name: 'X', about });
    expect(v).toMatchObject({ name: 'Léa', n: '5', others: '3' });
    // Sans identifiant (votes « 3 mots ») : on compte les événements.
    expect(mergeNotificationVars(mergeNotificationVars({}, {}), {})).toMatchObject({ n: '3', others: '2' });
    expect(mergeNotificationVars({ linkId: 'L1', about: 'u1' }, { linkId: 'L2', about: 'u2' })).toMatchObject({ multi: '1', others: '1' });
  });

  it('push d’abord : l’e-mail de repli ne part que sans appareil (et si le type n’est pas coupé) ; les comptes rendus partent toujours', () => {
    expect(emailAllowed('wave_received', { hasActivePush: true, disabledKinds: [] })).toBe(false);
    expect(emailAllowed('wave_received', { hasActivePush: false, disabledKinds: [] })).toBe(true);
    expect(emailAllowed('wave_received', { hasActivePush: false, disabledKinds: ['waved'] })).toBe(false);
    expect(emailAllowed('link_created', { hasActivePush: true, disabledKinds: [] })).toBe(false);
    expect(emailAllowed('trial_reminder', { hasActivePush: true, disabledKinds: [] })).toBe(true);
    expect(emailAllowed('long_absence', { hasActivePush: true, disabledKinds: [] })).toBe(true);
  });
});
