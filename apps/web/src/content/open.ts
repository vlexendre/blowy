/**
 * Pages « Ouvre Minimoa » : ce qu'affiche le site quand un lien de l'app (groupe, rencontre, lien, Minimoa+, défi,
 * habitudes, carte) est ouvert sans l'app. Cinq langues ; les cinq rendues au build, le navigateur montre celle du
 * téléphone (`layouts/Public.astro`, mode `shell`). Tableau des chemins : docs/DEEPLINKS.md.
 */

import type { Locale } from '../i18n/site';

export type OpenKind = 'g' | 'r' | 'l' | 'plus' | 'defi' | 'habitudes' | 'carte';

interface OpenCopy {
  /** Titre de l'onglet. */
  meta: string;
  /** Lignes du gros titre (la dernière est atténuée s'il y en a plus de deux). */
  title: readonly string[];
  text: string;
}

interface OpenLang {
  open: string;
  downloadTitle: string;
  downloadText: string;
  home: string;
  description: string;
  kinds: Record<OpenKind, OpenCopy>;
}

export const openCopy: Record<Locale, OpenLang> = {
  fr: {
    open: 'Ouvrir dans l’app',
    downloadTitle: 'Pas encore l’app ?',
    downloadText: 'Gratuit, zéro swipe, 18 ans et plus.',
    home: 'Découvrir Minimoa',
    description: 'Ce lien s’ouvre dans l’app Minimoa.',
    kinds: {
      g: { meta: 'Un groupe — Minimoa', title: ['TON GROUPE', 'T’ATTEND.'], text: 'Ce groupe s’ouvre dans l’app. Seuls ses membres le voient.' },
      r: { meta: 'Une rencontre — Minimoa', title: ['UN MINIMOA', 'T’ATTEND.'], text: 'Cette rencontre s’ouvre dans l’app Minimoa.' },
      l: { meta: 'Ton lien — Minimoa', title: ['TON LIEN', 'T’ATTEND.'], text: 'Cette conversation s’ouvre dans l’app Minimoa.' },
      plus: { meta: 'Minimoa+', title: ['MINIMOA+'], text: 'Minimoa+ se découvre dans l’app, depuis ton téléphone.' },
      defi: { meta: 'Défi du jour — Minimoa', title: ['LE DÉFI', 'DU JOUR.'], text: 'Le défi du jour s’ouvre dans l’app Minimoa.' },
      habitudes: { meta: 'Habitudes — Minimoa', title: ['TES', 'HABITUDES.'], text: 'Tes habitudes se suivent dans l’app Minimoa.' },
      carte: { meta: 'La carte — Minimoa', title: ['LA', 'CARTE.'], text: 'La carte des minimoas s’ouvre dans l’app Minimoa.' },
    },
  },
  en: {
    open: 'Open in the app',
    downloadTitle: 'Don’t have the app yet?',
    downloadText: 'Free, zero swiping, 18+.',
    home: 'Discover Minimoa',
    description: 'This link opens in the Minimoa app.',
    kinds: {
      g: { meta: 'A group — Minimoa', title: ['YOUR GROUP', 'IS WAITING.'], text: 'This group opens in the app. Only its members can see it.' },
      r: { meta: 'Someone new — Minimoa', title: ['A MINIMOA', 'IS WAITING.'], text: 'This person opens in the Minimoa app.' },
      l: { meta: 'Your link — Minimoa', title: ['YOUR LINK', 'IS WAITING.'], text: 'This conversation opens in the Minimoa app.' },
      plus: { meta: 'Minimoa+', title: ['MINIMOA+'], text: 'Minimoa+ lives in the app, on your phone.' },
      defi: { meta: 'Today’s challenge — Minimoa', title: ['TODAY’S', 'CHALLENGE.'], text: 'Today’s challenge opens in the Minimoa app.' },
      habitudes: { meta: 'Habits — Minimoa', title: ['YOUR', 'HABITS.'], text: 'You track your habits in the Minimoa app.' },
      carte: { meta: 'The map — Minimoa', title: ['THE', 'MAP.'], text: 'The minimoa map opens in the Minimoa app.' },
    },
  },
  es: {
    open: 'Abrir en la app',
    downloadTitle: '¿Aún no tienes la app?',
    downloadText: 'Gratis, sin swipes, para mayores de 18.',
    home: 'Descubrir Minimoa',
    description: 'Este enlace se abre en la app Minimoa.',
    kinds: {
      g: { meta: 'Un grupo — Minimoa', title: ['TU GRUPO', 'TE ESPERA.'], text: 'Este grupo se abre en la app. Solo lo ven sus miembros.' },
      r: { meta: 'Un encuentro — Minimoa', title: ['UN MINIMOA', 'TE ESPERA.'], text: 'Este encuentro se abre en la app Minimoa.' },
      l: { meta: 'Tu vínculo — Minimoa', title: ['TU VÍNCULO', 'TE ESPERA.'], text: 'Esta conversación se abre en la app Minimoa.' },
      plus: { meta: 'Minimoa+', title: ['MINIMOA+'], text: 'Minimoa+ se descubre en la app, desde tu teléfono.' },
      defi: { meta: 'Reto del día — Minimoa', title: ['EL RETO', 'DEL DÍA.'], text: 'El reto del día se abre en la app Minimoa.' },
      habitudes: { meta: 'Hábitos — Minimoa', title: ['TUS', 'HÁBITOS.'], text: 'Tus hábitos se siguen en la app Minimoa.' },
      carte: { meta: 'El mapa — Minimoa', title: ['EL', 'MAPA.'], text: 'El mapa de los minimoas se abre en la app Minimoa.' },
    },
  },
  pt: {
    open: 'Abrir no app',
    downloadTitle: 'Ainda não tem o app?',
    downloadText: 'Grátis, zero swipe, para maiores de 18.',
    home: 'Conhecer o Minimoa',
    description: 'Este link abre no app Minimoa.',
    kinds: {
      g: { meta: 'Um grupo — Minimoa', title: ['SEU GRUPO', 'TE ESPERA.'], text: 'Este grupo abre no app. Só os membros conseguem ver.' },
      r: { meta: 'Um encontro — Minimoa', title: ['UM MINIMOA', 'TE ESPERA.'], text: 'Este encontro abre no app Minimoa.' },
      l: { meta: 'Seu vínculo — Minimoa', title: ['SEU VÍNCULO', 'TE ESPERA.'], text: 'Esta conversa abre no app Minimoa.' },
      plus: { meta: 'Minimoa+', title: ['MINIMOA+'], text: 'O Minimoa+ fica no app, no seu celular.' },
      defi: { meta: 'Desafio do dia — Minimoa', title: ['O DESAFIO', 'DO DIA.'], text: 'O desafio do dia abre no app Minimoa.' },
      habitudes: { meta: 'Hábitos — Minimoa', title: ['SEUS', 'HÁBITOS.'], text: 'Você acompanha seus hábitos no app Minimoa.' },
      carte: { meta: 'O mapa — Minimoa', title: ['O', 'MAPA.'], text: 'O mapa dos minimoas abre no app Minimoa.' },
    },
  },
  nl: {
    open: 'Openen in de app',
    downloadTitle: 'Nog geen app?',
    downloadText: 'Gratis, nul swipes, vanaf 18 jaar.',
    home: 'Ontdek Minimoa',
    description: 'Deze link opent in de Minimoa-app.',
    kinds: {
      g: { meta: 'Een groep — Minimoa', title: ['JE GROEP', 'WACHT.'], text: 'Deze groep opent in de app. Alleen de leden zien hem.' },
      r: { meta: 'Een ontmoeting — Minimoa', title: ['EEN MINIMOA', 'WACHT.'], text: 'Deze ontmoeting opent in de Minimoa-app.' },
      l: { meta: 'Je band — Minimoa', title: ['JE BAND', 'WACHT.'], text: 'Dit gesprek opent in de Minimoa-app.' },
      plus: { meta: 'Minimoa+', title: ['MINIMOA+'], text: 'Minimoa+ vind je in de app, op je telefoon.' },
      defi: { meta: 'Uitdaging van de dag — Minimoa', title: ['DE UITDAGING', 'VAN DE DAG.'], text: 'De uitdaging van de dag opent in de Minimoa-app.' },
      habitudes: { meta: 'Gewoontes — Minimoa', title: ['JE', 'GEWOONTES.'], text: 'Je volgt je gewoontes in de Minimoa-app.' },
      carte: { meta: 'De kaart — Minimoa', title: ['DE', 'KAART.'], text: 'De kaart met minimoas opent in de Minimoa-app.' },
    },
  },
};
