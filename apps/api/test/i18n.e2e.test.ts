/**
 * Langues : les textes de l'API suivent la langue de la personne.
 * - notifications, e-mails, répliques des minimoas : `profiles.locale` de la personne concernée ;
 * - réponses (erreurs, textes des écrans) : `Accept-Language` envoyé par l'app ;
 * - une langue pas encore traduite (`TODO`) retombe sur le français.
 */
import { createApiClient } from '@blowy/api-client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { MemoryPusher } from '../src/integrations/push/memory-pusher';
import { NOTIFIER, type Notifier } from '../src/integrations/push/notifier';
import { PUSHER } from '../src/integrations/push/pusher';
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
    ];
    for (const p of people) {
      const c = world.client();
      await c.api.me.onboard(onboardBody({ displayName: `Lou-${p.locale}`, locale: p.locale }));
      await c.api.notifications.registerDevice({ token: p.token, platform: 'ios', timeZone: 'Europe/Paris' });
      await notifier.notify(c.id, 'waved', { name: 'Léa', minimoa: 'Suzie' });
    }
    expect(sentTo('ExponentPushToken[i18n-en]')[0]).toMatchObject({ title: 'Léa waved at you', body: 'Their minimoa stopped by to say hi to yours.' });
    expect(sentTo('ExponentPushToken[i18n-fr]')[0]).toMatchObject({ title: 'Léa te salue', body: 'Son minimoa est passé dire bonjour au tien.' });
    // Néerlandais pas encore traduit : le français, sans erreur.
    expect(sentTo('ExponentPushToken[i18n-nl]')[0]).toMatchObject({ title: 'Léa te salue' });
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
    // Espagnol pas encore traduit : le français.
    const spanish = createApiClient({ baseUrl: world.baseUrl, getToken: () => 'test:00000000-0000-4000-8000-0000000000aa', getLocale: () => 'es-ES' });
    expect((await apiError(spanish.me.get())).message).toBe('Crée d’abord ton minimoa.');
  });
});
