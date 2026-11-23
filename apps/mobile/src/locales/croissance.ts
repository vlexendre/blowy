/**
 * Croissance (docs/VIRALITE.md) : résultat « 3 mots », résultat du test à partager (cartes au format story).
 */
import type { TitleSegment } from '@blowy/ui';

import { messages } from './runtime';

/** Français : 0 et 1 au singulier. */
const plural = (n: number, one: string, many: string): string => `${n} ${n > 1 ? many : one}`;
const count = (n: number, one: string, other: string): string => `${n} ${n === 1 ? one : other}`;

export const croissance = messages({
  fr: {
    brand: 'minimoa',
    share: {
      story: 'Partager en story',
      sheet: 'Autre app',
      later: 'Plus tard',
      close: 'Fermer',
    },
    /** Ton lien « 3 mots » et ton résultat. */
    words: {
      title: [{ text: 'TES\n' }, { text: '3 MOTS', dim: true }] as TitleSegment[],
      back: 'Retour',
      lead: 'Tes potes votent sur le web, sans compte. Dès 3 votes, voici ton résultat.',
      votes: (n: number): string => plural(n, 'vote', 'votes'),
      waiting: (n: number): string => `Encore ${plural(n, 'vote', 'votes')} pour voir ton résultat.`,
      shareLink: 'Partager mon lien',
      linkMessage: (url: string): string => `Décris-moi en 3 mots. C’est anonyme : ${url}`,
      resultMessage: (words: string, url: string): string => `Mes potes m’ont décrit : ${words}. Et toi, tu dirais quoi ? ${url}`,
      card: {
        kicker: 'Mes potes m’ont décrit en 3 mots',
        title: [{ text: 'MOI, EN\n' }, { text: '3 MOTS.', dim: true }] as TitleSegment[],
        callout: 'Toi aussi, vote :',
      },
      error: 'Impossible de charger ton résultat.',
      retry: 'Réessayer',
      more: 'Voir mon résultat',
    },
    /** Moments à partager. */
    moments: {
      vision: {
        cta: 'Partager mon résultat',
        sheetTitle: 'Ton résultat',
        text: 'Seulement ce qui se partage : jamais ta vision complète.',
        kicker: 'Mon minimoa est…',
        callout: 'Et le tien ?',
        message: (traits: string, url: string): string => `Mon minimoa est ${traits}. Et le tien ? ${url}`,
        /** Trait par axe et par côté (le minimoa est masculin). L'axe « foyer » ne se partage jamais. */
        traits: {
          ancrage: { low: 'enraciné', high: 'voyageur' },
          elan: { low: 'zen', high: 'ambitieux' },
          rythme: { low: 'cocooning', high: 'aventurier' },
          cap: { low: 'spontané', high: 'organisé' },
        } as Record<string, { low: string; high: string }>,
        fallback: 'unique',
        and: ' et ',
      },
    },
  },
  en: {
    brand: 'minimoa',
    share: {
      story: 'Share to story',
      sheet: 'Other app',
      later: 'Later',
      close: 'Close',
    },
    words: {
      title: [{ text: 'YOUR\n' }, { text: '3 WORDS', dim: true }] as TitleSegment[],
      back: 'Back',
      lead: 'Your friends vote on the web, no account needed. From 3 votes, here’s your result.',
      votes: (n: number): string => count(n, 'vote', 'votes'),
      waiting: (n: number): string => `${count(n, 'more vote', 'more votes')} to see your result.`,
      shareLink: 'Share my link',
      linkMessage: (url: string): string => `Describe me in 3 words. It’s anonymous: ${url}`,
      resultMessage: (words: string, url: string): string => `My friends described me as: ${words}. What would you say? ${url}`,
      card: {
        kicker: 'My friends described me in 3 words',
        title: [{ text: 'ME, IN\n' }, { text: '3 WORDS.', dim: true }] as TitleSegment[],
        callout: 'Your turn to vote:',
      },
      error: 'Couldn’t load your result.',
      retry: 'Try again',
      more: 'See my result',
    },
    moments: {
      vision: {
        cta: 'Share my result',
        sheetTitle: 'Your result',
        text: 'Only what’s fine to share: never your full vision.',
        kicker: 'My minimoa is…',
        callout: 'What about yours?',
        message: (traits: string, url: string): string => `My minimoa is ${traits}. What about yours? ${url}`,
        traits: {
          ancrage: { low: 'rooted', high: 'a traveler' },
          elan: { low: 'zen', high: 'ambitious' },
          rythme: { low: 'cozy', high: 'adventurous' },
          cap: { low: 'spontaneous', high: 'organized' },
        },
        fallback: 'one of a kind',
        and: ' and ',
      },
    },
  },
  es: {
    brand: 'minimoa',
    share: {
      story: 'Compartir en historia',
      sheet: 'Otra app',
      later: 'Más tarde',
      close: 'Cerrar',
    },
    words: {
      title: [{ text: 'TUS\n' }, { text: '3 PALABRAS', dim: true }] as TitleSegment[],
      back: 'Volver',
      lead: 'Tus amigos votan en la web, sin cuenta. A partir de 3 votos, aquí está tu resultado.',
      votes: (n: number): string => count(n, 'voto', 'votos'),
      waiting: (n: number): string => `Faltan ${count(n, 'voto', 'votos')} para ver tu resultado.`,
      shareLink: 'Compartir mi enlace',
      linkMessage: (url: string): string => `Descríbeme en 3 palabras. Es anónimo: ${url}`,
      resultMessage: (words: string, url: string): string => `Mis amigos me describieron así: ${words}. ¿Y tú qué dirías? ${url}`,
      card: {
        kicker: 'Mis amigos me describieron en 3 palabras',
        title: [{ text: 'YO, EN\n' }, { text: '3 PALABRAS.', dim: true }] as TitleSegment[],
        callout: 'Tu turno de votar:',
      },
      error: 'No se pudo cargar tu resultado.',
      retry: 'Reintentar',
      more: 'Ver mi resultado',
    },
    moments: {
      vision: {
        cta: 'Compartir mi resultado',
        sheetTitle: 'Tu resultado',
        text: 'Solo lo que se puede compartir: nunca tu visión completa.',
        kicker: 'Mi minimoa es…',
        callout: '¿Y el tuyo?',
        message: (traits: string, url: string): string => `Mi minimoa es ${traits}. ¿Y el tuyo? ${url}`,
        traits: {
          ancrage: { low: 'de raíces', high: 'viajero' },
          elan: { low: 'zen', high: 'ambicioso' },
          rythme: { low: 'casero', high: 'aventurero' },
          cap: { low: 'espontáneo', high: 'organizado' },
        },
        fallback: 'único',
        and: ' y ',
      },
    },
  },
  pt: {
    brand: 'minimoa',
    share: {
      story: 'Compartilhar nos stories',
      sheet: 'Outro app',
      later: 'Depois',
      close: 'Fechar',
    },
    words: {
      title: [{ text: 'SUAS\n' }, { text: '3 PALAVRAS', dim: true }] as TitleSegment[],
      back: 'Voltar',
      lead: 'Seus amigos votam na web, sem conta. A partir de 3 votos, aqui está seu resultado.',
      votes: (n: number): string => count(n, 'voto', 'votos'),
      waiting: (n: number): string => `Falta${n > 1 ? 'm' : ''} ${count(n, 'voto', 'votos')} para ver seu resultado.`,
      shareLink: 'Compartilhar meu link',
      linkMessage: (url: string): string => `Me descreva em 3 palavras. É anônimo: ${url}`,
      resultMessage: (words: string, url: string): string => `Meus amigos me descreveram assim: ${words}. E você, diria o quê? ${url}`,
      card: {
        kicker: 'Meus amigos me descreveram em 3 palavras',
        title: [{ text: 'EU, EM\n' }, { text: '3 PALAVRAS.', dim: true }] as TitleSegment[],
        callout: 'Sua vez de votar:',
      },
      error: 'Não deu para carregar seu resultado.',
      retry: 'Tentar de novo',
      more: 'Ver meu resultado',
    },
    moments: {
      vision: {
        cta: 'Compartilhar meu resultado',
        sheetTitle: 'Seu resultado',
        text: 'Só o que dá para compartilhar: nunca sua visão completa.',
        kicker: 'Meu minimoa é…',
        callout: 'E o seu?',
        message: (traits: string, url: string): string => `Meu minimoa é ${traits}. E o seu? ${url}`,
        traits: {
          ancrage: { low: 'enraizado', high: 'viajante' },
          elan: { low: 'zen', high: 'ambicioso' },
          rythme: { low: 'caseiro', high: 'aventureiro' },
          cap: { low: 'espontâneo', high: 'organizado' },
        },
        fallback: 'único',
        and: ' e ',
      },
    },
  },
  nl: {
    brand: 'minimoa',
    share: {
      story: 'Delen in story',
      sheet: 'Andere app',
      later: 'Later',
      close: 'Sluiten',
    },
    words: {
      title: [{ text: 'JOUW\n' }, { text: '3 WOORDEN', dim: true }] as TitleSegment[],
      back: 'Terug',
      lead: 'Je vrienden stemmen op het web, zonder account. Vanaf 3 stemmen zie je hier je resultaat.',
      votes: (n: number): string => count(n, 'stem', 'stemmen'),
      waiting: (n: number): string => `Nog ${count(n, 'stem', 'stemmen')} om je resultaat te zien.`,
      shareLink: 'Mijn link delen',
      linkMessage: (url: string): string => `Beschrijf me in 3 woorden. Het is anoniem: ${url}`,
      resultMessage: (words: string, url: string): string => `Mijn vrienden beschreven me als: ${words}. Wat zou jij zeggen? ${url}`,
      card: {
        kicker: 'Mijn vrienden beschreven me in 3 woorden',
        title: [{ text: 'IK, IN\n' }, { text: '3 WOORDEN.', dim: true }] as TitleSegment[],
        callout: 'Jouw beurt om te stemmen:',
      },
      error: 'Je resultaat kon niet worden geladen.',
      retry: 'Opnieuw',
      more: 'Mijn resultaat bekijken',
    },
    moments: {
      vision: {
        cta: 'Mijn resultaat delen',
        sheetTitle: 'Je resultaat',
        text: 'Alleen wat je kunt delen: nooit je hele visie.',
        kicker: 'Mijn minimoa is…',
        callout: 'En die van jou?',
        message: (traits: string, url: string): string => `Mijn minimoa is ${traits}. En die van jou? ${url}`,
        traits: {
          ancrage: { low: 'honkvast', high: 'een reiziger' },
          elan: { low: 'zen', high: 'ambitieus' },
          rythme: { low: 'een thuisblijver', high: 'avontuurlijk' },
          cap: { low: 'spontaan', high: 'georganiseerd' },
        },
        fallback: 'uniek',
        and: ' en ',
      },
    },
  },
});
