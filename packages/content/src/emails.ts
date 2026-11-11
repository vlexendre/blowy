/**
 * E-mails transactionnels. Fonctions pures qui rendent { subject, html, text }.
 * HTML simple et responsive (tableau unique, styles en ligne), fond sombre, accent jaune.
 */
import { brand } from './labels';

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
  paragraphs: string[];
  cta: { label: string; url: string };
}

/** Les textes passés ici sont bruts : ils sont échappés au rendu. */
function render(subject: string, layout: Layout): Email {
  const paras = layout.paragraphs
    .map((p) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:${COLORS.text}">${escapeHtml(p)}</p>`)
    .join('');
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.bg}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${COLORS.card};border-radius:20px">
<tr><td style="padding:32px 28px">
<p style="margin:0 0 24px;font-size:14px;font-weight:700;letter-spacing:.08em;color:${COLORS.accent}">${escapeHtml(brand.name.toLowerCase())}</p>
<h1 style="margin:0 0 20px;font-size:24px;line-height:1.3;color:${COLORS.text}">${escapeHtml(layout.title)}</h1>
${paras}
<p style="margin:28px 0 0"><a href="${escapeHtml(layout.cta.url)}" style="display:inline-block;padding:14px 22px;border-radius:999px;background:${COLORS.accent};color:${COLORS.bg};font-weight:700;text-decoration:none">${escapeHtml(layout.cta.label)}</a></p>
</td></tr></table>
<p style="margin:20px 0 0;font-size:12px;color:${COLORS.muted}">${escapeHtml(brand.tagline)} · ${escapeHtml(brand.supportEmail)}</p>
</td></tr></table></body></html>`;
  const text = [layout.title, '', ...layout.paragraphs, '', `${layout.cta.label} : ${layout.cta.url}`, '', `${brand.name} — ${brand.tagline}`].join('\n');
  return { subject, html, text };
}

export function welcomeEmail(input: { displayName: string; petName: string; appUrl: string }): Email {
  return render(`bienvenue, ${input.displayName}`, {
    title: `${input.petName} est né.`,
    paragraphs: [
      `salut ${input.displayName}, ton pet ${input.petName} vient d'ouvrir les yeux.`,
      `il va croiser d'autres pets et te présenter du monde. rien ne se passe sans ton tap : tu salues, l'autre accepte, le lien se crée.`,
      `passe le voir chaque jour, il grandit avec toi.`,
    ],
    cta: { label: `voir ${input.petName}`, url: input.appUrl },
  });
}

export function waveReceivedEmail(input: { displayName: string; petName: string; fromName: string; fromPetName: string; appUrl: string }): Email {
  return render(`${input.petName} a croisé le pet de ${input.fromName}`, {
    title: `${input.fromPetName} t'a fait coucou.`,
    paragraphs: [
      `salut ${input.displayName}, ${input.petName} a croisé ${input.fromPetName}, le pet de ${input.fromName}.`,
      `si tu acceptes, vos pets se rencontrent et vous pourrez vous écrire.`,
    ],
    cta: { label: 'voir la rencontre', url: input.appUrl },
  });
}

export function linkCreatedEmail(input: { displayName: string; petName: string; otherName: string; otherPetName: string; appUrl: string }): Email {
  return render(`${input.petName} et ${input.otherPetName} se sont trouvés`, {
    title: `nouveau lien avec ${input.otherName}.`,
    paragraphs: [
      `salut ${input.displayName}, ${input.petName} et ${input.otherPetName} viennent de se rencontrer.`,
      `écris à ${input.otherName} : chaque jour de silence coûte une vie au lien.`,
    ],
    cta: { label: 'ouvrir le lien', url: input.appUrl },
  });
}
