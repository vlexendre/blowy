import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  APPLE_SUBSCRIPTIONS_URL,
  EMAIL_ART,
  EMAIL_ASSETS_URL,
  EMAIL_SAMPLE as SAMPLE,
  LOCALES,
  emailChromeText,
  emailSamples,
  moderationTextIn,
  renderEmail,
  supabaseTemplates,
} from '@blowy/content';

/**
 * Les e-mails (packages/content/src/email) : mise en page robuste dans les cinq langues, images présentes sur le site,
 * contenus qui engagent (rappel d'essai, désinscription, motif d'un avertissement), modèles Supabase à jour.
 */
const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const PUBLIC_EMAIL = `${ROOT}apps/web/public/email/`;
const imgs = (html: string): string[] => html.match(/<img\b[^>]*>/g) ?? [];
const attr = (tag: string, name: string): string | undefined => new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];
const hrefs = (html: string): string[] => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1] ?? '');
const flat = (s: string): string => s.replace(/[\u00a0\u202f]/g, ' ');

describe('e-mails : mise en page commune', () => {
  for (const locale of LOCALES) {
    for (const [name, mail] of Object.entries(emailSamples(locale))) {
      it(`${name} (${locale}) : robuste, illustré, complet`, () => {
        const { html, text, subject } = mail;
        expect(subject.length).toBeGreaterThan(3);
        expect(html).toContain(`<html lang="${locale}"`);
        expect(html).toContain('<meta name="color-scheme" content="light dark">');
        expect(html).toContain('max-width:600px');
        expect(html).toMatch(/<div style="display:none;[^"]*">[^<]{10,}/);
        // Rien d'externe à part les images et la police du site ; ni script ni feuille de style.
        expect(html).not.toMatch(/<script|<link\b|@import/i);
        // Aucun reste de gabarit.
        for (const out of [html, text]) expect(out).not.toMatch(/undefined|\[object |NaN|\$\{|\bTODO\b/);
        // Gmail coupe un HTML de plus de 102 Ko.
        expect(Buffer.byteLength(html)).toBeLessThan(60_000);

        // Images : PNG du site, en https, avec taille et texte alternatif ; poids total raisonnable.
        let weight = 0;
        for (const tag of imgs(html)) {
          const src = attr(tag, 'src') ?? '';
          expect(src.startsWith(`${EMAIL_ASSETS_URL}/`) && src.endsWith('.png')).toBe(true);
          expect(Number(attr(tag, 'width'))).toBeGreaterThan(0);
          expect(Number(attr(tag, 'height'))).toBeGreaterThan(0);
          expect((attr(tag, 'alt') ?? '').length).toBeGreaterThan(8);
          const file = PUBLIC_EMAIL + src.slice(EMAIL_ASSETS_URL.length + 1);
          expect(existsSync(file)).toBe(true);
          weight += statSync(file).size;
        }
        expect(imgs(html).length).toBe(2);
        expect(weight).toBeLessThan(200 * 1024);

        // Chaque lien du HTML est en https ou mailto, et chaque lien d'action se retrouve dans la version texte.
        for (const h of hrefs(html)) {
          expect(h).toMatch(/^(https:\/\/|mailto:)/);
          if (!h.startsWith('mailto:') && h !== 'https://minimoa.app') expect(text).toContain(h.replace(/&amp;/g, '&'));
        }
        expect(text).toContain('hello@minimoa.app');
      });
    }
  }

  it('chaque image déclarée existe, à la bonne taille (2x)', () => {
    for (const [scene, art] of Object.entries(EMAIL_ART)) {
      const file = `${PUBLIC_EMAIL}${scene}.png`;
      expect(existsSync(file)).toBe(true);
      const png = readFileSync(file);
      expect(png.readUInt32BE(16)).toBe(art.width * 2);
      expect(Math.abs(png.readUInt32BE(20) - art.height * 2)).toBeLessThanOrEqual(1);
      for (const locale of LOCALES) expect(emailChromeText.in(locale).art[scene as keyof typeof EMAIL_ART].length).toBeGreaterThan(8);
    }
  });

  it('échappe les textes (un prénom ne peut pas injecter de HTML)', () => {
    const mail = moderationTextIn('fr').warningEmail({ displayName: '<b>Léa</b>', reason: 'motif "<script>"' });
    expect(mail.html).not.toContain('<b>Léa</b>');
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('&lt;b&gt;Léa&lt;/b&gt;');
    expect(mail.text).toContain('<b>Léa</b>');
  });

  it('le français garde ses espaces insécables dans le HTML, la version texte reste telle quelle', () => {
    const mail = renderEmail('fr', 'Sujet', { title: 'Titre', paragraphs: ['Une question ? Écris : vite !'] });
    expect(mail.html).toContain('Une question\u00a0? Écris\u00a0: vite\u00a0!');
    expect(mail.text).toContain('Une question ? Écris : vite !');
  });
});

describe('e-mails : contenus qui engagent', () => {
  it('rappel de fin d’essai : date, montant, chemin d’annulation et page Apple, dans le HTML et le texte', () => {
    const fr = emailSamples('fr')['essai-rappel']!;
    for (const out of [flat(fr.text), flat(fr.html)]) {
      expect(out).toContain('22 novembre');
      expect(out).toContain('59,99 €');
      expect(out).toMatch(/Annule au moins 24 heures avant la fin de l’essai : sur ton iPhone, Réglages, ton nom, puis Abonnements\./);
      expect(out).toContain('Tu veux garder Minimoa+ ? Tu n’as rien à faire.');
      expect(out).toContain('Réglages › ton nom › Abonnements');
    }
    expect(fr.html).toContain(`href="${APPLE_SUBSCRIPTIONS_URL}"`);
    expect(fr.text).toContain(`Gérer mon abonnement : ${APPLE_SUBSCRIPTIONS_URL}`.replace(' :', '\u00a0:'));
    const en = emailSamples('en')['essai-rappel']!;
    expect(en.text).toContain('November 22');
    expect(en.text).toContain('€59.99');
    expect(en.text).toContain('Settings, your name, then Subscriptions');
  });

  it('quartier : confirmation avant désinscription, désinscription en lien et en clair', () => {
    for (const locale of LOCALES) {
      const confirm = emailSamples(locale)['quartier-confirmation']!;
      expect(confirm.html.indexOf(SAMPLE.confirmUrl)).toBeGreaterThan(0);
      expect(confirm.html.indexOf(SAMPLE.confirmUrl)).toBeLessThan(confirm.html.indexOf(SAMPLE.unsubscribeUrl));
      const open = emailSamples(locale)['quartier-ouverture']!;
      for (const mail of [confirm, open]) {
        expect(mail.html).toMatch(new RegExp(`<a href="${SAMPLE.unsubscribeUrl.replace(/[?.]/g, '\\$&')}"[^>]*>[^<]+</a>`));
        expect(mail.text).toContain(SAMPLE.unsubscribeUrl);
      }
      expect(open.html).toContain(`>${SAMPLE.code}</div>`);
      expect(open.text).toContain(SAMPLE.code);
    }
  });

  it('avertissement : le motif est cité tel quel', () => {
    const mail = emailSamples('fr')['moderation-avertissement']!;
    expect(mail.html).toContain(SAMPLE.reason);
    expect(mail.text).toContain(SAMPLE.reason);
    expect(mail.text).toContain('Réponds à ce message ou écris à hello@minimoa.app');
  });

  it('modèles Supabase : à jour avec la mise en page (pnpm emails:preview --supabase)', () => {
    const t = supabaseTemplates();
    expect(readFileSync(`${ROOT}supabase/templates/code.html`, 'utf8')).toBe(t.code.html);
    expect(readFileSync(`${ROOT}supabase/templates/invite.html`, 'utf8')).toBe(t.invite.html);
  });

  it('modèles Supabase : variables intactes, code en grand', () => {
    const { code, invite } = supabaseTemplates();
    expect(code.html.match(/\{\{ \.Token \}\}/g)?.length).toBeGreaterThanOrEqual(2);
    expect(code.html).toMatch(/font-size:32px[^>]*>\{\{ \.Token \}\}<\/div>/);
    expect(invite.html).toContain('href="{{ .ConfirmationURL }}"');
    for (const t of [code.html, invite.html]) expect(t).not.toMatch(/\{\{(?! \.Token \}\}| \.ConfirmationURL \}\})/);
  });
});
