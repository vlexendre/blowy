/**
 * Onglet Quartier (docs/ADA-2027.md, décision 8) : la carte et les présentations du jour réunies, la feuille à crans,
 * la vue en liste (VoiceOver), et « Déjà croisés » dans les Chats. Les autres textes de la carte et des rencontres
 * restent dans `rencontres.ts` (`carte`, `rencontres`) et `chemin.ts` (`chemin.carte`).
 */
import type { TitleSegment } from '@blowy/ui';

import { messages } from './runtime';

export const voisins = messages({
  fr: {
    title: [{ text: 'TON ' }, { text: 'QUARTIER', dim: true }] as TitleSegment[],
    /** Titre de la feuille, toujours visible (le plafond est quotidien). */
    sheetTitle: (n: number): string => (n === 0 ? 'Aujourd’hui · personne pour l’instant' : `Aujourd’hui · ${n} ${n > 1 ? 'personnes' : 'personne'}`),
    /** Décision 7 : les visages flous sont une protection, pour tout le monde. */
    sheetNote: 'Visages flous jusqu’à votre bonjour. Positions arrondies.',
    expandA11y: 'Ouvrir la liste',
    collapseA11y: 'Replier la liste',
    /** Les autres épingles de la carte, dans la vue en liste. */
    around: (n: number): string => `Sur la carte · ${n}`,
    list: 'Liste',
    listA11y: (on: boolean): string => (on ? 'Vue en liste : la carte est remplacée par la liste. Toucher pour revoir la carte' : 'Voir la carte en liste'),
    rowA11y: (name: string, band: string | null): string => (band ? `${name}, ${band}. Ouvrir sa fiche` : `${name}. Ouvrir sa fiche`),
    /** Sans position : la liste seule, et une seule action. */
    activate: 'Activer',
    chooseCity: 'Choisir ma ville',
    history: 'Déjà croisés',
  },
  en: {
    title: [{ text: 'YOUR ' }, { text: 'NEIGHBORHOOD', dim: true }],
    sheetTitle: (n: number): string => (n === 0 ? 'Today · no one yet' : `Today · ${n} ${n === 1 ? 'person' : 'people'}`),
    sheetNote: 'Faces stay blurred until you say hello. Locations are rounded.',
    expandA11y: 'Open the list',
    collapseA11y: 'Collapse the list',
    around: (n: number): string => `On the map · ${n}`,
    list: 'List',
    listA11y: (on: boolean): string => (on ? 'List view: the map is replaced by a list. Tap to see the map again' : 'Show the map as a list'),
    rowA11y: (name: string, band: string | null): string => (band ? `${name}, ${band}. Open their card` : `${name}. Open their card`),
    activate: 'Turn on',
    chooseCity: 'Choose my city',
    history: 'Already met',
  },
  es: {
    title: [{ text: 'TU ' }, { text: 'BARRIO', dim: true }],
    sheetTitle: (n: number): string => (n === 0 ? 'Hoy · nadie por ahora' : `Hoy · ${n} ${n === 1 ? 'persona' : 'personas'}`),
    sheetNote: 'Caras borrosas hasta vuestro hola. Posiciones redondeadas.',
    expandA11y: 'Abrir la lista',
    collapseA11y: 'Plegar la lista',
    around: (n: number): string => `En el mapa · ${n}`,
    list: 'Lista',
    listA11y: (on: boolean): string => (on ? 'Vista de lista: la lista sustituye al mapa. Toca para volver a ver el mapa' : 'Ver el mapa como lista'),
    rowA11y: (name: string, band: string | null): string => (band ? `${name}, ${band}. Abrir su ficha` : `${name}. Abrir su ficha`),
    activate: 'Activar',
    chooseCity: 'Elegir mi ciudad',
    history: 'Ya os habéis cruzado',
  },
  pt: {
    title: [{ text: 'SEU ' }, { text: 'BAIRRO', dim: true }],
    sheetTitle: (n: number): string => (n === 0 ? 'Hoje · ninguém por enquanto' : `Hoje · ${n} ${n === 1 ? 'pessoa' : 'pessoas'}`),
    sheetNote: 'Rostos desfocados até o primeiro oi. Posições arredondadas.',
    expandA11y: 'Abrir a lista',
    collapseA11y: 'Recolher a lista',
    around: (n: number): string => `No mapa · ${n}`,
    list: 'Lista',
    listA11y: (on: boolean): string => (on ? 'Vista em lista: a lista substitui o mapa. Toque para ver o mapa de novo' : 'Ver o mapa como lista'),
    rowA11y: (name: string, band: string | null): string => (band ? `${name}, ${band}. Abrir a ficha` : `${name}. Abrir a ficha`),
    activate: 'Ativar',
    chooseCity: 'Escolher minha cidade',
    history: 'Já se cruzaram',
  },
  nl: {
    title: [{ text: 'JOUW ' }, { text: 'BUURT', dim: true }],
    sheetTitle: (n: number): string => (n === 0 ? 'Vandaag · nog niemand' : `Vandaag · ${n} ${n === 1 ? 'persoon' : 'mensen'}`),
    sheetNote: 'Gezichten blijven wazig tot jullie hallo zeggen. Posities zijn afgerond.',
    expandA11y: 'Lijst openen',
    collapseA11y: 'Lijst inklappen',
    around: (n: number): string => `Op de kaart · ${n}`,
    list: 'Lijst',
    listA11y: (on: boolean): string => (on ? 'Lijstweergave: de kaart is vervangen door een lijst. Tik om de kaart weer te zien' : 'De kaart als lijst tonen'),
    rowA11y: (name: string, band: string | null): string => (band ? `${name}, ${band}. Kaartje openen` : `${name}. Kaartje openen`),
    activate: 'Aanzetten',
    chooseCity: 'Mijn stad kiezen',
    history: 'Al ontmoet',
  },
});
