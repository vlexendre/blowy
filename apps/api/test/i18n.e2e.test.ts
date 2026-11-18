/**
 * Langues : les textes de l'API suivent la langue de la personne.
 * - notifications, e-mails, répliques des minimoas : `profiles.locale` de la personne concernée ;
 * - réponses (erreurs, textes des écrans) : `Accept-Language` envoyé par l'app ;
 * - un texte pas encore traduit (`TODO`) retombe sur le français ; une langue que Minimoa ne propose pas, sur l'anglais.
 */
import { createApiClient } from '@blowy/api-client';
import { TODO, auditText, chatSystemText, defineMessages, textOf } from '@blowy/content';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { MemoryPusher } from '../src/integrations/push/memory-pusher';
import { NOTIFIER, type Notifier } from '../src/integrations/push/notifier';
import { PUSHER } from '../src/integrations/push/pusher';
import { DomainError } from '../src/shared/errors';
import { type TestWorld, apiError, onboardBody, startWorld } from './helpers';

describe('langues', () => {
  let world: TestWorld;
  let pusher: MemoryPusher;
  let notifier: Notifier;

  beforeAll(async () => {
    world = await startWorld();
    pusher = world.app.get<MemoryPusher>(PUSHER);
    notifier = world.app.get<Notifier>(NOTIFIER);
  });
  afterAll(() => world.close());

  const sentTo = (token: string) => pusher.outbox.filter((m) => m.to === token);

  it('une notification est écrite dans la langue du profil de la personne qui la reçoit', async () => {
    const people = [
      { locale: 'en' as const, token: 'ExponentPushToken[i18n-en]' },
      { locale: 'fr' as const, token: 'ExponentPushToken[i18n-fr]' },
      { locale: 'nl' as const, token: 'ExponentPushToken[i18n-nl]' },
      { locale: 'es' as const, token: 'ExponentPushToken[i18n-es]' },
      { locale: 'pt' as const, token: 'ExponentPushToken[i18n-pt]' },
    ];
    for (const p of people) {
      const c = world.client();
      await c.api.me.onboard(onboardBody({ displayName: `Lou-${p.locale}`, locale: p.locale }));
      await c.api.notifications.registerDevice({ token: p.token, platform: 'ios', timeZone: 'Europe/Paris' });
      await notifier.notify(c.id, 'waved', { name: 'Léa', minimoa: 'Suzie' });
    }
    expect(sentTo('ExponentPushToken[i18n-en]')[0]).toMatchObject({ title: 'Léa waved at you', body: 'Come and see who it is, and wave back whenever you like.' });
    expect(sentTo('ExponentPushToken[i18n-fr]')[0]).toMatchObject({ title: 'Léa te fait signe', body: 'Viens voir qui c’est et réponds quand tu veux.' });
    expect(sentTo('ExponentPushToken[i18n-nl]')[0]).toMatchObject({ title: 'Léa zwaait naar je', body: 'Kom kijken wie het is en zwaai terug wanneer je wilt.' });
    expect(sentTo('ExponentPushToken[i18n-es]')[0]).toMatchObject({ title: 'Léa te saluda' });
    expect(sentTo('ExponentPushToken[i18n-pt]')[0]).toMatchObject({ title: 'Léa acenou para você' });
  });

  it('la langue du profil change avec l’app, et les notifications suivent', async () => {
    const c = world.client();
    await c.api.me.onboard(onboardBody({ displayName: 'Sam', locale: 'fr' }));
    await c.api.notifications.registerDevice({ token: 'ExponentPushToken[i18n-switch]', platform: 'ios', timeZone: 'Europe/Paris' });
    const me = await c.api.me.update({ locale: 'en' });
    expect(me.identity.locale).toBe('en');
    await notifier.notify(c.id, 'words_received');
    expect(sentTo('ExponentPushToken[i18n-switch]')[0]).toMatchObject({ title: '3 words for you' });
  });

  it('les erreurs suivent Accept-Language (langue de l’app), français sans en-tête', async () => {
    const english = createApiClient({ baseUrl: world.baseUrl, getToken: () => 'test:00000000-0000-4000-8000-0000000000aa', getLocale: () => 'en' });
    const french = createApiClient({ baseUrl: world.baseUrl, getToken: () => 'test:00000000-0000-4000-8000-0000000000aa' });
    expect(await apiError(english.me.get())).toEqual({ code: 'not_onboarded', message: 'Create your minimoa first.' });
    expect(await apiError(french.me.get())).toEqual({ code: 'not_onboarded', message: 'Crée d’abord ton minimoa.' });
    const spanish = createApiClient({ baseUrl: world.baseUrl, getToken: () => 'test:00000000-0000-4000-8000-0000000000aa', getLocale: () => 'es-ES' });
    expect((await apiError(spanish.me.get())).message).toBe('Primero crea tu minimoa.');
    // Une langue que Minimoa ne propose pas : l'anglais (spéc §23).
    const german = createApiClient({ baseUrl: world.baseUrl, getToken: () => 'test:00000000-0000-4000-8000-0000000000aa', getLocale: () => 'de-DE' });
    expect((await apiError(german.me.get())).message).toBe('Create your minimoa first.');
  });

  it('un texte pas encore traduit (`TODO`) retombe sur le français, sans erreur', () => {
    // Dictionnaire construit ici : les dictionnaires de production sont entièrement traduits.
    const sample = defineMessages({
      fr: { gone: 'Ce lien n’existe plus.', nested: { a: 'Un', b: 'Deux' } },
      en: { gone: 'This link no longer exists.', nested: { a: 'One', b: TODO } },
      es: TODO,
      pt: { gone: TODO, nested: TODO },
      nl: { gone: 'Deze band bestaat niet meer.', nested: { a: 'Een', b: 'Twee' } },
    });
    const error = new DomainError('invalid', textOf(sample, (t) => t.gone));
    expect(error.messageIn('en')).toBe('This link no longer exists.');
    expect(error.messageIn('nl')).toBe('Deze band bestaat niet meer.');
    expect(error.messageIn('es')).toBe('Ce lien n’existe plus.');
    expect(error.messageIn('pt')).toBe('Ce lien n’existe plus.');
    expect(sample.in('en').nested).toEqual({ a: 'One', b: 'Deux' });
  });
});

/**
 * Le compte de revue d'Apple (examinateur en anglais) : tout son monde d'exemple est dans la langue de l'app, y compris
 * les messages des personnes fictives et les répliques de leurs minimoas ; même si le compte a servi en français avant.
 */
describe('monde de revue dans la langue de l’examinateur', () => {
  const REVIEW = { email: 'review@minimoa.app', code: '123456' };
  let world: TestWorld;
  beforeAll(async () => {
    world = await startWorld({ REVIEW_EMAIL: REVIEW.email, REVIEW_CODE: REVIEW.code });
  });
  afterAll(() => world.close());

  const french = new Set<string>([
    ...auditText.in('fr').review.activeLines.map((l) => l.text),
    ...auditText.in('fr').review.afterNudge,
    ...auditText.in('fr').review.dangerLines,
    ...auditText.in('fr').review.replies,
    ...Object.values(auditText.in('fr').review.short),
    auditText.in('fr').review.nudge,
    auditText.in('fr').review.guard,
    auditText.in('fr').review.remark,
    auditText.in('fr').review.today,
    chatSystemText('fr').linkCreated,
  ]);
  /** Un texte qui a l'air français : accents propres au français, ou une phrase du dictionnaire français. */
  const looksFrench = (s: string): boolean => {
    // Les prénoms (« Léa ») ne disent rien de la langue.
    const words = s.replace(/(?<!\p{L})\p{Lu}\p{L}*/gu, '');
    return french.has(s) || /[àâçéèêëîïôûœ]|\b(tu|ton|ta|tes|vous|oui|mardi|salut)\b/i.test(words);
  };

  async function visit(locale: 'en' | 'fr', onboardLocale?: 'en' | 'fr') {
    const session = await createApiClient({ baseUrl: world.baseUrl, getLocale: () => locale }).review.session(REVIEW);
    const api = createApiClient({ baseUrl: world.baseUrl, getToken: () => session.accessToken, getLocale: () => locale });
    if (onboardLocale) await api.me.onboard(onboardBody({ displayName: 'Apple', locale: onboardLocale, consents: { location: false }, location: undefined }));
    return api;
  }

  async function texts(api: Awaited<ReturnType<typeof visit>>): Promise<string[]> {
    const out: string[] = [];
    for (const link of await api.links.list()) {
      const page = await api.links.messages(link.id);
      out.push(...page.messages.map((m) => m.body ?? '').filter(Boolean));
    }
    const reviews = (await api.rituals.reviews()).reviews;
    for (const r of reviews) out.push(r.text, ...r.did, r.noticed, r.tip, ...r.links);
    return out;
  }

  it('compte créé en anglais : messages, répliques des minimoas et bilan en anglais', async () => {
    const api = await visit('en', 'en');
    const all = await texts(api);
    expect(all.length).toBeGreaterThan(15);
    expect(all.filter(looksFrench)).toEqual([]);
    const en = auditText.in('en').review;
    expect(all).toEqual(expect.arrayContaining([en.activeLines[0]?.text, en.nudge, en.guard, en.short.yes, en.short.tuesday, en.today, chatSystemText('en').linkCreated]));
  });

  it('compte utilisé en français, puis connexion depuis une app en anglais : le monde est reposé en anglais', async () => {
    const fr = await visit('fr');
    expect((await texts(fr)).some((t) => french.has(t))).toBe(true);
    const en = await visit('en');
    expect((await en.me.get()).identity.locale).toBe('en');
    expect((await texts(en)).filter(looksFrench)).toEqual([]);
  });

  it('les personnes fictives répondent dans la langue de l’examinateur', async () => {
    const api = await visit('en');
    const [link] = (await api.links.list()).filter((l) => l.lives !== 2);
    await api.links.send(link?.id ?? '', { body: 'Sounds good, Tuesday then!' });
    await new Promise((r) => setTimeout(r, 300));
    const after = (await api.links.messages(link?.id ?? '')).messages.map((m) => m.body ?? '');
    expect(after.some((b) => auditText.in('en').review.replies.includes(b))).toBe(true);
    expect(after.filter(looksFrench)).toEqual([]);
  });
});
