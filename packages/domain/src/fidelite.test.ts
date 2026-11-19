import { describe, expect, it } from 'vitest';
import { type StoreEvent, applyStoreEvent } from './billing';
import {
  absenceDue,
  addMonths,
  anniversaryDue,
  fideliteDayKey,
  fideliteDue,
  firstStepDue,
  firstStepSent,
  firstStepVariant,
  isFideliteHour,
  plusGoodbyeDue,
  plusNewsAfter,
  plusWinbackDue,
} from './fidelite';

const DAY = 86_400_000;
const T0 = Date.parse('2026-11-15T10:00:00Z');
const at = (days: number): string => new Date(T0 + days * DAY).toISOString();
const ev = (over: Partial<StoreEvent>): StoreEvent => ({
  store: 'apple',
  kind: null,
  subtype: null,
  signedAt: at(0),
  originalTransactionId: 'O',
  transactionId: 'T1',
  productId: 'app.blowy.plus.yearly',
  plan: 'yearly',
  purchasedAt: at(0),
  expiresAt: at(7),
  freeTrial: true,
  revokedAt: null,
  storeStatus: 1,
  renewal: { autoRenew: true, inBillingRetry: false, graceUntil: null },
  ...over,
});

describe('fidélisation : rétention de l’app', () => {
  it('ajoute des mois sans déborder (31 janvier → 28 février, 29 février → 28 février)', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2028-02-29', 12)).toBe('2029-02-28');
    expect(addMonths('2026-11-17', 2)).toBe('2027-01-17');
  });

  it('premiers pas : J1, J2, J3, J5, J7, sans chevauchement (rattrapage d’un jour seulement quand le suivant est loin)', () => {
    const step = (today: string) => firstStepDue('2026-11-10', today)?.step ?? null;
    expect(step('2026-11-10')).toBeNull();
    expect(step('2026-11-11')).toBe('d1');
    expect(step('2026-11-12')).toBe('d2');
    expect(step('2026-11-13')).toBe('d3');
    expect(step('2026-11-14')).toBe('d3');
    expect(step('2026-11-15')).toBe('d5');
    expect(step('2026-11-16')).toBe('d5');
    expect(step('2026-11-17')).toBe('d7');
    expect(step('2026-11-18')).toBe('d7');
    expect(step('2026-11-19')).toBeNull();
  });

  it('premiers pas : les gens d’abord (J1), puis 3 mots, habitude, groupe, semaine', () => {
    const topic = (today: string) => firstStepDue('2026-11-10', today)?.topic ?? null;
    expect(['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-15', '2026-11-17'].map(topic)).toEqual(['people', 'words', 'habit', 'group', 'week']);
    // Sans personne à présenter : un texte honnête qui pousse à inviter.
    expect(firstStepVariant('people', 2)).toBe('people');
    expect(firstStepVariant('people', 0)).toBe('people_none');
    expect(firstStepVariant('words', 0)).toBe('words');
  });

  it('premiers pas : une ancienne clé (ordre d’avant) compte pour son ancien sujet, jamais deux fois le même message', () => {
    // Ancien J1 = « 3 mots » : déjà parti, le nouveau J2 (« 3 mots ») ne repart pas.
    expect(firstStepSent('words', new Set(['first_steps:d1']))).toBe(true);
    expect(firstStepSent('people', new Set(['first_steps:d1']))).toBe(false);
    expect(firstStepSent('people', new Set(['first_steps:d5']))).toBe(true);
    expect(fideliteDue({ createdOn: '2026-11-10', lastActiveOn: '2026-11-10', today: '2026-11-12', sent: new Set(['first_steps:d1']) })).toBeNull();
    expect(fideliteDue({ createdOn: '2026-11-10', lastActiveOn: '2026-11-10', today: '2026-11-12', sent: new Set(['first_steps:people']) })).toMatchObject({ topic: 'words', key: 'first_steps:words' });
  });

  it('absences : 3, 7, 14 jours (avec rattrapage), rien entre deux paliers ni au-delà', () => {
    expect(absenceDue('2026-11-01', '2026-11-03')).toBeNull();
    expect(absenceDue('2026-11-01', '2026-11-04')).toBe(3);
    expect(absenceDue('2026-11-01', '2026-11-06')).toBe(3);
    expect(absenceDue('2026-11-01', '2026-11-07')).toBeNull();
    expect(absenceDue('2026-11-01', '2026-11-08')).toBe(7);
    expect(absenceDue('2026-11-01', '2026-11-15')).toBe(14);
    expect(absenceDue('2026-11-01', '2026-11-18')).toBeNull();
    expect(absenceDue('2026-11-01', '2026-12-30')).toBeNull();
  });

  it('anniversaires : un mois, puis chaque année', () => {
    expect(anniversaryDue('2026-10-17', '2026-11-17')).toBe(1);
    expect(anniversaryDue('2026-10-17', '2026-11-19')).toBe(1);
    expect(anniversaryDue('2026-10-17', '2026-11-20')).toBeNull();
    expect(anniversaryDue('2025-11-17', '2026-11-17')).toBe(12);
    expect(anniversaryDue('2024-02-29', '2025-02-28')).toBe(12);
    expect(anniversaryDue('2023-11-18', '2026-11-18')).toBe(36);
    expect(anniversaryDue('2025-11-17', '2026-06-01')).toBeNull();
  });

  it('une seule nouvelle par jour, jamais deux fois la même, anniversaire avant absence avant premiers pas', () => {
    const sent = new Set<string>();
    // Inscription le 10 ; le 11 : J1.
    expect(fideliteDue({ createdOn: '2026-11-10', lastActiveOn: '2026-11-10', today: '2026-11-11', sent })).toMatchObject({ kind: 'first_steps', step: 'd1', topic: 'people', key: 'first_steps:people' });
    // J3 alors qu'on n'est pas revenu depuis l'inscription : premiers pas, pas d'absence pendant la semaine d'accueil.
    expect(fideliteDue({ createdOn: '2026-11-10', lastActiveOn: '2026-11-10', today: '2026-11-13', sent })).toMatchObject({ kind: 'first_steps', step: 'd3' });
    // Déjà une nouvelle aujourd'hui : rien.
    expect(fideliteDue({ createdOn: '2026-11-10', lastActiveOn: '2026-11-10', today: '2026-11-13', sent: new Set([fideliteDayKey('2026-11-13')]) })).toBeNull();
    // Absence de 14 jours : e-mail aussi ; clé liée au dernier jour d'activité (une nouvelle absence plus tard repart).
    const long = fideliteDue({ createdOn: '2026-09-01', lastActiveOn: '2026-11-01', today: '2026-11-15', sent });
    expect(long).toEqual({ kind: 'minimoa_news', step: 'absence', days: 14, key: 'absence:14:2026-11-01', email: true });
    expect(fideliteDue({ createdOn: '2026-09-01', lastActiveOn: '2026-11-01', today: '2026-11-16', sent: new Set(['absence:14:2026-11-01']) })).toBeNull();
    // Anniversaire d'un mois le même jour qu'une absence de 3 jours : l'anniversaire d'abord, l'absence le lendemain.
    expect(fideliteDue({ createdOn: '2026-10-15', lastActiveOn: '2026-11-12', today: '2026-11-15', sent })).toMatchObject({ step: 'anniversary', months: 1 });
    expect(fideliteDue({ createdOn: '2026-10-15', lastActiveOn: '2026-11-12', today: '2026-11-16', sent: new Set(['anniversary:1', fideliteDayKey('2026-11-15')]) })).toMatchObject({ step: 'absence', days: 3, email: false });
  });

  it('fenêtre d’envoi en journée', () => {
    expect(isFideliteHour(10)).toBe(false);
    expect(isFideliteHour(11)).toBe(true);
    expect(isFideliteHour(19)).toBe(true);
    expect(isFideliteHour(20)).toBe(false);
  });
});

describe('fidélisation : Minimoa+', () => {
  const now = new Date(T0 + 3_600_000);

  it('bienvenue à l’achat, pas à la restauration d’un vieil achat ni au renvoi de la même notification', () => {
    const e = ev({});
    const s = applyStoreEvent(null, e);
    expect(plusNewsAfter(null, s, e, now)).toEqual([{ step: 'welcome', key: 'plus_welcome:apple:O:T1' }]);
    // La notification SUBSCRIBED du même achat : l'abonnement est déjà connu.
    expect(plusNewsAfter(s, applyStoreEvent(s, { ...e, kind: 'SUBSCRIBED' }), { ...e, kind: 'SUBSCRIBED' }, now)).toEqual([]);
    // Restauration sur un autre compte d'un abonnement acheté il y a un mois.
    const old = ev({ purchasedAt: at(-30), signedAt: at(0), expiresAt: at(300), freeTrial: false });
    expect(plusNewsAfter(null, applyStoreEvent(null, old), old, now)).toEqual([]);
  });

  it('merci au renouvellement de l’annuel, pas après l’essai ; paiement refusé une fois, puis rattrapé', () => {
    const paid = applyStoreEvent(null, ev({ freeTrial: false, expiresAt: at(365) }));
    const renew = ev({ kind: 'DID_RENEW', transactionId: 'T2', signedAt: at(365), purchasedAt: at(365), expiresAt: at(730), freeTrial: false });
    expect(plusNewsAfter(paid, applyStoreEvent(paid, renew), renew, new Date(T0 + 365 * DAY))).toEqual([{ step: 'renewed', key: 'plus_renewed:T2' }]);
    const trial = applyStoreEvent(null, ev({}));
    const first = ev({ kind: 'DID_RENEW', transactionId: 'T2', signedAt: at(7), purchasedAt: at(7), expiresAt: at(372), freeTrial: false });
    expect(plusNewsAfter(trial, applyStoreEvent(trial, first), first, new Date(T0 + 7 * DAY))).toEqual([]);
    // Mensuelle : pas de merci à chaque mois.
    const monthly = applyStoreEvent(null, ev({ plan: 'monthly', freeTrial: false, expiresAt: at(30) }));
    const m2 = ev({ plan: 'monthly', kind: 'DID_RENEW', transactionId: 'T2', signedAt: at(30), purchasedAt: at(30), expiresAt: at(60), freeTrial: false });
    expect(plusNewsAfter(monthly, applyStoreEvent(monthly, m2), m2, new Date(T0 + 30 * DAY))).toEqual([]);

    const fail = ev({ kind: 'DID_FAIL_TO_RENEW', subtype: 'GRACE_PERIOD', signedAt: at(365), expiresAt: at(365), freeTrial: false, storeStatus: 4, renewal: { autoRenew: true, inBillingRetry: true, graceUntil: at(381) } });
    const grace = applyStoreEvent(paid, fail);
    expect(plusNewsAfter(paid, grace, fail, new Date(T0 + 365 * DAY))).toEqual([{ step: 'billing_grace', key: `plus_billing:O:${at(365)}` }]);
    // Fin du délai de grâce, nouvelle tentative : pas de second message.
    const retryEv = ev({ kind: 'GRACE_PERIOD_EXPIRED', signedAt: at(381), expiresAt: at(365), freeTrial: false, storeStatus: 3, renewal: { autoRenew: true, inBillingRetry: true, graceUntil: null } });
    const retry = applyStoreEvent(grace, retryEv);
    expect(plusNewsAfter(grace, retry, retryEv, new Date(T0 + 381 * DAY))).toEqual([]);
    const recovery = ev({ kind: 'DID_RENEW', subtype: 'BILLING_RECOVERY', transactionId: 'T3', signedAt: at(383), purchasedAt: at(383), expiresAt: at(748), freeTrial: false });
    expect(plusNewsAfter(retry, applyStoreEvent(retry, recovery), recovery, new Date(T0 + 383 * DAY))).toEqual([{ step: 'recovered', key: 'plus_recovered:T3' }]);
  });

  it('au revoir dans la semaine qui suit la fin, relance un mois après ; rien après un remboursement', () => {
    const cancelled = applyStoreEvent(null, ev({ freeTrial: false, expiresAt: at(30), renewal: { autoRenew: false, inBillingRetry: false, graceUntil: null } }));
    expect(plusGoodbyeDue(cancelled, new Date(T0 + 29 * DAY))).toBe(false);
    expect(plusGoodbyeDue(cancelled, new Date(T0 + 31 * DAY))).toBe(true);
    expect(plusGoodbyeDue(cancelled, new Date(T0 + 38 * DAY))).toBe(false);
    expect(plusWinbackDue(cancelled, new Date(T0 + 59 * DAY))).toBe(false);
    expect(plusWinbackDue(cancelled, new Date(T0 + 61 * DAY))).toBe(true);
    expect(plusWinbackDue(cancelled, new Date(T0 + 68 * DAY))).toBe(false);
    const refunded = applyStoreEvent(cancelled, ev({ kind: 'REFUND', signedAt: at(10), expiresAt: at(30), freeTrial: false, revokedAt: at(10) }));
    expect(plusGoodbyeDue(refunded, new Date(T0 + 11 * DAY))).toBe(false);
    expect(plusWinbackDue(refunded, new Date(T0 + 45 * DAY))).toBe(false);
  });
});
