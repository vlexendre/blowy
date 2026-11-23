/**
 * E-mails transactionnels, par langue. Fonctions pures qui rendent { subject, html, text }.
 * Mise en page commune et habillage (minimoas, bulles, texte d'aperçu) : `email/layout.ts`, `email/chrome.ts`.
 */
import type { Locale } from '@blowy/domain';
import { emailChromeText } from './email/chrome';
import { type Email, renderEmail } from './email/layout';
import { defineMessages } from './i18n/core';

export { type Email, type EmailBlock, type EmailLayout, renderEmail } from './email/layout';
export { EMAIL_ART, EMAIL_ASSETS_URL, EMAIL_FACES, type EmailScene, emailArtUrl } from './email/art';
export { emailChromeText } from './email/chrome';
export { SAMPLE as EMAIL_SAMPLE, emailSamples, supabaseTemplates } from './email/samples';

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
    subject: (i: WaveInput) => `${i.fromName} te fait signe`,
    title: (i: WaveInput) => `${i.fromPetName} est passé dire bonjour.`,
    paragraphs: (i: WaveInput) => [
      `Salut ${i.displayName}, ${i.fromName} te fait signe : son minimoa, ${i.fromPetName}, est venu voir ${i.petName}.`,
      'Si tu acceptes, vos minimoas se rencontrent et vous pouvez vous écrire.',
    ],
    cta: 'Voir la rencontre',
  },
  linkCreated: {
    subject: (i: LinkInput) => `${i.petName} et ${i.otherPetName} se sont trouvés`,
    title: (i: LinkInput) => `Nouveau lien avec ${i.otherName}.`,
    paragraphs: (i: LinkInput) => [
      `Salut ${i.displayName}, ${i.petName} et ${i.otherPetName} viennent de se rencontrer.`,
      `Écris à ${i.otherName} quand tu veux : un premier mot suffit.`,
    ],
    cta: 'Ouvrir le lien',
  },
};

export const emailText = defineMessages({
  fr,
  en: {
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
      subject: (i: WaveInput) => `${i.fromName} is waving at you`,
      title: (i: WaveInput) => `${i.fromPetName} stopped by to say hi.`,
      paragraphs: (i: WaveInput) => [
        `Hi ${i.displayName}, ${i.fromName} is waving at you: their minimoa, ${i.fromPetName}, came to see ${i.petName}.`,
        'If you accept, your minimoas meet and you can write to each other.',
      ],
      cta: 'See the encounter',
    },
    linkCreated: {
      subject: (i: LinkInput) => `${i.petName} and ${i.otherPetName} found each other`,
      title: (i: LinkInput) => `New link with ${i.otherName}.`,
      paragraphs: (i: LinkInput) => [
        `Hi ${i.displayName}, ${i.petName} and ${i.otherPetName} just met.`,
        `Write to ${i.otherName} whenever you like: a first word is all it takes.`,
      ],
      cta: 'Open the link',
    },
  },
  es: {
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
      subject: (i: WaveInput) => `${i.fromName} te saluda`,
      title: (i: WaveInput) => `${i.fromPetName} ha pasado a saludar.`,
      paragraphs: (i: WaveInput) => [
        `Hola, ${i.displayName}: ${i.fromName} te saluda. Su minimoa, ${i.fromPetName}, vino a ver a ${i.petName}.`,
        'Si aceptas, sus minimoas se conocen y podrás escribirle.',
      ],
      cta: 'Ver el encuentro',
    },
    linkCreated: {
      subject: (i: LinkInput) => `${i.petName} y ${i.otherPetName} se han encontrado`,
      title: (i: LinkInput) => `Nuevo vínculo con ${i.otherName}.`,
      paragraphs: (i: LinkInput) => [
        `Hola, ${i.displayName}: ${i.petName} y ${i.otherPetName} acaban de conocerse.`,
        `Escríbele a ${i.otherName} cuando quieras: basta con una primera palabra.`,
      ],
      cta: 'Abrir el vínculo',
    },
  },
  pt: {
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
      subject: (i: WaveInput) => `${i.fromName} está acenando para você`,
      title: (i: WaveInput) => `${i.fromPetName} passou para dar um oi.`,
      paragraphs: (i: WaveInput) => [
        `Oi, ${i.displayName}! ${i.fromName} está acenando para você: o minimoa dela, ${i.fromPetName}, veio ver ${i.petName}.`,
        'Se você aceitar, os minimoas de vocês se conhecem e vocês podem conversar.',
      ],
      cta: 'Ver o encontro',
    },
    linkCreated: {
      subject: (i: LinkInput) => `${i.petName} e ${i.otherPetName} se encontraram`,
      title: (i: LinkInput) => `Novo vínculo com ${i.otherName}.`,
      paragraphs: (i: LinkInput) => [
        `Oi, ${i.displayName}! ${i.petName} e ${i.otherPetName} acabaram de se conhecer.`,
        `Escreva para ${i.otherName} quando quiser: uma primeira palavra basta.`,
      ],
      cta: 'Abrir o vínculo',
    },
  },
  nl: {
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
      subject: (i: WaveInput) => `${i.fromName} zwaait naar je`,
      title: (i: WaveInput) => `${i.fromPetName} kwam even hallo zeggen.`,
      paragraphs: (i: WaveInput) => [
        `Hoi ${i.displayName}, ${i.fromName} zwaait naar je: diens minimoa, ${i.fromPetName}, kwam bij ${i.petName} langs.`,
        'Als je accepteert, ontmoeten jullie minimoas elkaar en kunnen jullie elkaar schrijven.',
      ],
      cta: 'Bekijk de ontmoeting',
    },
    linkCreated: {
      subject: (i: LinkInput) => `${i.petName} en ${i.otherPetName} hebben elkaar gevonden`,
      title: (i: LinkInput) => `Nieuwe band met ${i.otherName}.`,
      paragraphs: (i: LinkInput) => [
        `Hoi ${i.displayName}, ${i.petName} en ${i.otherPetName} hebben elkaar net ontmoet.`,
        `Schrijf ${i.otherName} wanneer je wilt: één eerste woord is genoeg.`,
      ],
      cta: 'Open de band',
    },
  },
});

export function welcomeEmail(locale: Locale, input: WelcomeInput): Email {
  const t = emailText.in(locale).welcome;
  const v = emailChromeText.in(locale).welcome;
  return renderEmail(locale, t.subject(input), {
    scene: 'nino-coucou',
    eyebrow: v.eyebrow,
    preheader: v.preheader(input),
    bubble: v.bubble(input),
    title: t.title(input),
    paragraphs: t.paragraphs(input),
    cta: { label: t.cta(input), url: input.appUrl },
  });
}

export function waveReceivedEmail(locale: Locale, input: WaveInput): Email {
  const t = emailText.in(locale).wave;
  const v = emailChromeText.in(locale).wave;
  return renderEmail(locale, t.subject(input), {
    scene: 'suzie-coucou',
    eyebrow: v.eyebrow,
    preheader: v.preheader(input),
    bubble: v.bubble(input),
    title: t.title(input),
    paragraphs: t.paragraphs(input),
    cta: { label: t.cta, url: input.appUrl },
  });
}

export function linkCreatedEmail(locale: Locale, input: LinkInput): Email {
  const t = emailText.in(locale).linkCreated;
  const v = emailChromeText.in(locale).linkCreated;
  return renderEmail(locale, t.subject(input), {
    scene: 'duo-rencontre',
    eyebrow: v.eyebrow,
    preheader: v.preheader(input),
    bubble: v.bubble,
    title: t.title(input),
    paragraphs: t.paragraphs(input),
    cta: { label: t.cta, url: input.appUrl },
  });
}
