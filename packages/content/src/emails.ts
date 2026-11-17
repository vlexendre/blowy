/**
 * E-mails transactionnels, par langue. Fonctions pures qui rendent { subject, html, text }.
 * HTML simple et responsive (tableau unique, styles en ligne), fond sombre, accent jaune.
 */
import type { Locale } from '@blowy/domain';
import { defineMessages } from './i18n/core';
import { brand, labels } from './labels';

export interface Email {
  subject: string;
  html: string;
  text: string;
}

const COLORS = { bg: '#0B0A14', card: '#16142A', text: '#F4F2FF', muted: '#A9A4C7', accent: '#FFB800' } as const;

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export interface EmailLayout {
  title: string;
  paragraphs: readonly string[];
  cta: { label: string; url: string };
  /** Ligne discrète sous le bouton (pourquoi cet e-mail, comment ne plus le recevoir). */
  footer?: string;
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

export const emailText = defineMessages({
  fr,
  en: {
    ctaSeparator: ': ',
    welcome: {
      subject: (i: WelcomeInput) => `Welcome, ${i.displayName}`,
      title: (i: WelcomeInput) => `${i.petName} is born.`,
      paragraphs: (i: WelcomeInput) => [
        `Hi ${i.displayName}, your minimoa ${i.petName} just opened its eyes.`,
        'It will cross paths with other minimoas and introduce you to people. Nothing happens without your tap: you wave, the other person accepts, the link is made.',
        'Drop by every day. It grows with you.',
      ],
      cta: (i: WelcomeInput) => `See ${i.petName}`,
    },
    wave: {
      subject: (i: WaveInput) => `${i.petName} met ${i.fromName}’s minimoa`,
      title: (i: WaveInput) => `${i.fromPetName} stopped by to say hi.`,
      paragraphs: (i: WaveInput) => [
        `Hi ${i.displayName}, ${i.petName} met ${i.fromPetName}, ${i.fromName}’s minimoa.`,
        'If you accept, your minimoas meet and you can write to each other.',
      ],
      cta: 'See the encounter',
    },
    linkCreated: {
      subject: (i: LinkInput) => `${i.petName} and ${i.otherPetName} found each other`,
      title: (i: LinkInput) => `New link with ${i.otherName}.`,
      paragraphs: (i: LinkInput) => [
        `Hi ${i.displayName}, ${i.petName} and ${i.otherPetName} just met.`,
        `Write to ${i.otherName}: every day of silence costs the link a life.`,
      ],
      cta: 'Open the link',
    },
  },
  es: {
    ctaSeparator: ': ',
    welcome: {
      subject: (i: WelcomeInput) => `Te damos la bienvenida, ${i.displayName}`,
      title: (i: WelcomeInput) => `${i.petName} ha nacido.`,
      paragraphs: (i: WelcomeInput) => [
        `Hola, ${i.displayName}: tu minimoa ${i.petName} acaba de abrir los ojos.`,
        'Se cruzará con otros minimoas y te presentará gente. Nada pasa sin tu toque: saludas, la otra persona acepta y se crea el vínculo.',
        'Pásate a verlo cada día. Crece contigo.',
      ],
      cta: (i: WelcomeInput) => `Ver a ${i.petName}`,
    },
    wave: {
      subject: (i: WaveInput) => `${i.petName} se ha cruzado con el minimoa de ${i.fromName}`,
      title: (i: WaveInput) => `${i.fromPetName} ha pasado a saludar.`,
      paragraphs: (i: WaveInput) => [
        `Hola, ${i.displayName}: ${i.petName} se ha cruzado con ${i.fromPetName}, el minimoa de ${i.fromName}.`,
        'Si aceptas, sus minimoas se conocen y podrás escribirle.',
      ],
      cta: 'Ver el encuentro',
    },
    linkCreated: {
      subject: (i: LinkInput) => `${i.petName} y ${i.otherPetName} se han encontrado`,
      title: (i: LinkInput) => `Nuevo vínculo con ${i.otherName}.`,
      paragraphs: (i: LinkInput) => [
        `Hola, ${i.displayName}: ${i.petName} y ${i.otherPetName} acaban de conocerse.`,
        `Escríbele a ${i.otherName}: cada día de silencio le cuesta una vida al vínculo.`,
      ],
      cta: 'Abrir el vínculo',
    },
  },
  pt: {
    ctaSeparator: ': ',
    welcome: {
      subject: (i: WelcomeInput) => `Boas-vindas, ${i.displayName}`,
      title: (i: WelcomeInput) => `${i.petName} nasceu.`,
      paragraphs: (i: WelcomeInput) => [
        `Oi, ${i.displayName}! Seu minimoa ${i.petName} acabou de abrir os olhos.`,
        'Ele vai cruzar com outros minimoas e te apresentar pessoas. Nada acontece sem o seu toque: você acena, a outra pessoa aceita e o vínculo é criado.',
        'Passe para vê-lo todos os dias. Ele cresce com você.',
      ],
      cta: (i: WelcomeInput) => `Ver ${i.petName}`,
    },
    wave: {
      subject: (i: WaveInput) => `${i.petName} cruzou com o minimoa de ${i.fromName}`,
      title: (i: WaveInput) => `${i.fromPetName} passou para dar um oi.`,
      paragraphs: (i: WaveInput) => [
        `Oi, ${i.displayName}! ${i.petName} cruzou com ${i.fromPetName}, o minimoa de ${i.fromName}.`,
        'Se você aceitar, os minimoas de vocês se conhecem e vocês podem conversar.',
      ],
      cta: 'Ver o encontro',
    },
    linkCreated: {
      subject: (i: LinkInput) => `${i.petName} e ${i.otherPetName} se encontraram`,
      title: (i: LinkInput) => `Novo vínculo com ${i.otherName}.`,
      paragraphs: (i: LinkInput) => [
        `Oi, ${i.displayName}! ${i.petName} e ${i.otherPetName} acabaram de se conhecer.`,
        `Escreva para ${i.otherName}: cada dia de silêncio custa uma vida ao vínculo.`,
      ],
      cta: 'Abrir o vínculo',
    },
  },
  nl: {
    ctaSeparator: ': ',
    welcome: {
      subject: (i: WelcomeInput) => `Welkom, ${i.displayName}`,
      title: (i: WelcomeInput) => `${i.petName} is geboren.`,
      paragraphs: (i: WelcomeInput) => [
        `Hoi ${i.displayName}, je minimoa ${i.petName} heeft net zijn ogen geopend.`,
        'Hij gaat andere minimoas tegenkomen en je aan mensen voorstellen. Niets gebeurt zonder jouw tik: jij zwaait, de ander accepteert, de band ontstaat.',
        'Kom elke dag even langs. Hij groeit met je mee.',
      ],
      cta: (i: WelcomeInput) => `Bekijk ${i.petName}`,
    },
    wave: {
      subject: (i: WaveInput) => `${i.petName} kwam de minimoa van ${i.fromName} tegen`,
      title: (i: WaveInput) => `${i.fromPetName} kwam even hallo zeggen.`,
      paragraphs: (i: WaveInput) => [
        `Hoi ${i.displayName}, ${i.petName} kwam ${i.fromPetName} tegen, de minimoa van ${i.fromName}.`,
        'Als je accepteert, ontmoeten jullie minimoas elkaar en kunnen jullie elkaar schrijven.',
      ],
      cta: 'Bekijk de ontmoeting',
    },
    linkCreated: {
      subject: (i: LinkInput) => `${i.petName} en ${i.otherPetName} hebben elkaar gevonden`,
      title: (i: LinkInput) => `Nieuwe band met ${i.otherName}.`,
      paragraphs: (i: LinkInput) => [
        `Hoi ${i.displayName}, ${i.petName} en ${i.otherPetName} hebben elkaar net ontmoet.`,
        `Schrijf ${i.otherName}: elke dag stilte kost de band een leven.`,
      ],
      cta: 'Open de band',
    },
  },
});

/** Mise en page commune des e-mails. Les textes passés ici sont bruts : ils sont échappés au rendu. */
export function renderEmail(locale: Locale, subject: string, layout: EmailLayout): Email {
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
${layout.footer ? `<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:${COLORS.muted}">${escapeHtml(layout.footer)}</p>` : ''}
</td></tr></table>
<p style="margin:20px 0 0;font-size:12px;color:${COLORS.muted}">${escapeHtml(tagline)} · ${escapeHtml(brand.supportEmail)}</p>
</td></tr></table></body></html>`;
  const text = [
    layout.title,
    '',
    ...layout.paragraphs,
    '',
    `${layout.cta.label}${sep}${layout.cta.url}`,
    ...(layout.footer ? ['', layout.footer] : []),
    '',
    `${brand.name} — ${tagline}`,
  ].join('\n');
  return { subject, html, text };
}

export function welcomeEmail(locale: Locale, input: WelcomeInput): Email {
  const t = emailText.in(locale).welcome;
  return renderEmail(locale, t.subject(input), { title: t.title(input), paragraphs: t.paragraphs(input), cta: { label: t.cta(input), url: input.appUrl } });
}

export function waveReceivedEmail(locale: Locale, input: WaveInput): Email {
  const t = emailText.in(locale).wave;
  return renderEmail(locale, t.subject(input), { title: t.title(input), paragraphs: t.paragraphs(input), cta: { label: t.cta, url: input.appUrl } });
}

export function linkCreatedEmail(locale: Locale, input: LinkInput): Email {
  const t = emailText.in(locale).linkCreated;
  return renderEmail(locale, t.subject(input), { title: t.title(input), paragraphs: t.paragraphs(input), cta: { label: t.cta, url: input.appUrl } });
}
