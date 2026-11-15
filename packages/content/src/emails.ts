/**
 * E-mails transactionnels, par langue. Fonctions pures qui rendent { subject, html, text }.
 * HTML simple et responsive (tableau unique, styles en ligne), fond sombre, accent jaune.
 */
import type { Locale } from '@blowy/domain';
import { TODO, defineMessages } from './i18n/core';
import { brand, labels } from './labels';

export interface Email {
  subject: string;
  html: string;
  text: string;
}

const COLORS = { bg: '#0B0A14', card: '#16142A', text: '#F4F2FF', muted: '#A9A4C7', accent: '#FFB800' } as const;

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

interface Layout {
  title: string;
  paragraphs: readonly string[];
  cta: { label: string; url: string };
}

interface WelcomeInput {
  displayName: string;
  petName: string;
  appUrl: string;
}
interface WaveInput extends WelcomeInput {
  fromName: string;
  fromPetName: string;
}
interface LinkInput extends WelcomeInput {
  otherName: string;
  otherPetName: string;
}

const fr = {
  /** Séparateur entre un libellé et une adresse (« Ouvrir : https://… »). */
  ctaSeparator: ' : ',
  welcome: {
    subject: (i: WelcomeInput) => `Bienvenue, ${i.displayName}`,
    title: (i: WelcomeInput) => `${i.petName} est né.`,
    paragraphs: (i: WelcomeInput) => [
      `Salut ${i.displayName}, ton minimoa ${i.petName} vient d’ouvrir les yeux.`,
      'Il va croiser d’autres minimoas et te présenter du monde. Rien ne se passe sans ton tap : tu salues, l’autre accepte, le lien se crée.',
      'Passe le voir chaque jour. Il grandit avec toi.',
    ],
    cta: (i: WelcomeInput) => `Voir ${i.petName}`,
  },
  wave: {
    subject: (i: WaveInput) => `${i.petName} a croisé le minimoa de ${i.fromName}`,
    title: (i: WaveInput) => `${i.fromPetName} est passé dire bonjour.`,
    paragraphs: (i: WaveInput) => [
      `Salut ${i.displayName}, ${i.petName} a croisé ${i.fromPetName}, le minimoa de ${i.fromName}.`,
      'Si tu acceptes, vos minimoas se rencontrent et vous pouvez vous écrire.',
    ],
    cta: 'Voir la rencontre',
  },
  linkCreated: {
    subject: (i: LinkInput) => `${i.petName} et ${i.otherPetName} se sont trouvés`,
    title: (i: LinkInput) => `Nouveau lien avec ${i.otherName}.`,
    paragraphs: (i: LinkInput) => [
      `Salut ${i.displayName}, ${i.petName} et ${i.otherPetName} viennent de se rencontrer.`,
      `Écris à ${i.otherName} : chaque jour de silence coûte une vie au lien.`,
    ],
    cta: 'Ouvrir le lien',
  },
};

export const emailText = defineMessages({ fr, en: TODO, es: TODO, pt: TODO, nl: TODO });

/** Les textes passés ici sont bruts : ils sont échappés au rendu. */
function render(locale: Locale, subject: string, layout: Layout): Email {
  const tagline = labels.in(locale).tagline;
  const sep = emailText.in(locale).ctaSeparator;
  const paras = layout.paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${COLORS.text}">${escapeHtml(p)}</p>`)
    .join('');
  const html = `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${COLORS.card};border-radius:20px">
<tr><td style="padding:32px 28px">
<p style="margin:0 0 24px;font-size:14px;font-weight:700;letter-spacing:.08em;color:${COLORS.accent}">${escapeHtml(brand.name.toLowerCase())}</p>
<h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;color:${COLORS.text}">${escapeHtml(layout.title)}</h1>
${paras}
<p style="margin:28px 0 0"><a href="${escapeHtml(layout.cta.url)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:${COLORS.accent};color:${COLORS.bg};font-weight:700;text-decoration:none">${escapeHtml(layout.cta.label)}</a></p>
</td></tr></table>
<p style="margin:20px 0 0;font-size:12px;color:${COLORS.muted}">${escapeHtml(tagline)} · ${escapeHtml(brand.supportEmail)}</p>
</td></tr></table></body></html>`;
  const text = [layout.title, '', ...layout.paragraphs, '', `${layout.cta.label}${sep}${layout.cta.url}`, '', `${brand.name} — ${tagline}`].join('\n');
  return { subject, html, text };
}

export function welcomeEmail(locale: Locale, input: WelcomeInput): Email {
  const t = emailText.in(locale).welcome;
  return render(locale, t.subject(input), { title: t.title(input), paragraphs: t.paragraphs(input), cta: { label: t.cta(input), url: input.appUrl } });
}

export function waveReceivedEmail(locale: Locale, input: WaveInput): Email {
  const t = emailText.in(locale).wave;
  return render(locale, t.subject(input), { title: t.title(input), paragraphs: t.paragraphs(input), cta: { label: t.cta, url: input.appUrl } });
}

export function linkCreatedEmail(locale: Locale, input: LinkInput): Email {
  const t = emailText.in(locale).linkCreated;
  return render(locale, t.subject(input), { title: t.title(input), paragraphs: t.paragraphs(input), cta: { label: t.cta, url: input.appUrl } });
}
