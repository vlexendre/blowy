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
    /** Décision 7 : les photos floues jusqu'au lien sont une protection, pour tout le monde (flou fait par le serveur). */
    sheetNote: 'Photos floues jusqu’à ce que vous vous soyez dit bonjour tous les deux. Positions arrondies.',
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
    /** Chargement raté : jamais le message brut de l'erreur. */
    loadErrorText: 'Vérifie ta connexion, puis réessaie.',
    /** Fiche d'une épingle non présentée aujourd'hui (gratuit) : le bouton ouvre Minimoa+, il le dit. */
    plusAction: 'Découvrir Minimoa+',
    plusNote: (name: string): string => `${name} n’est pas dans tes présentations du jour : le saluer depuis la carte, c’est avec Minimoa+.`,
  },
  en: {
    title: [{ text: 'YOUR ' }, { text: 'NEIGHBORHOOD', dim: true }],
    sheetTitle: (n: number): string => (n === 0 ? 'Today · no one yet' : `Today · ${n} ${n === 1 ? 'person' : 'people'}`),
    sheetNote: 'Photos stay blurred until you’ve both said hello. Locations are rounded.',
    expandA11y: 'Open the list',
    collapseA11y: 'Collapse the list',
    around: (n: number): string => `On the map · ${n}`,
    list: 'List',
    listA11y: (on: boolean): string => (on ? 'List view: the map is replaced by a list. Tap to see the map again' : 'Show the map as a list'),
    rowA11y: (name: string, band: string | null): string => (band ? `${name}, ${band}. Open their card` : `${name}. Open their card`),
    activate: 'Turn on',
    chooseCity: 'Choose my city',
    history: 'Already met',
    loadErrorText: 'Check your connection, then try again.',
    plusAction: 'Discover Minimoa+',
    plusNote: (name: string): string => `${name} isn’t in today’s introductions: waving from the map comes with Minimoa+.`,
  },
  es: {
    title: [{ text: 'TU ' }, { text: 'BARRIO', dim: true }],
    sheetTitle: (n: number): string => (n === 0 ? 'Hoy · nadie por ahora' : `Hoy · ${n} ${n === 1 ? 'persona' : 'personas'}`),
    sheetNote: 'Las fotos se ven borrosas hasta que os hayáis saludado los dos. Ubicaciones aproximadas.',
    expandA11y: 'Abrir la lista',
    collapseA11y: 'Plegar la lista',
    around: (n: number): string => `En el mapa · ${n}`,
    list: 'Lista',
    listA11y: (on: boolean): string => (on ? 'Vista de lista: la lista sustituye al mapa. Toca para volver a ver el mapa' : 'Ver el mapa como lista'),
    rowA11y: (name: string, band: string | null): string => (band ? `${name}, ${band}. Abrir su ficha` : `${name}. Abrir su ficha`),
    activate: 'Activar',
    chooseCity: 'Elegir mi ciudad',
    history: 'Ya os habéis cruzado',
    loadErrorText: 'Comprueba tu conexión y vuelve a intentarlo.',
    plusAction: 'Descubrir Minimoa+',
    plusNote: (name: string): string => `${name} no está en tus presentaciones de hoy: saludar desde el mapa es con Minimoa+.`,
  },
  pt: {
    title: [{ text: 'SEU ' }, { text: 'BAIRRO', dim: true }],
    sheetTitle: (n: number): string => (n === 0 ? 'Hoje · ninguém por enquanto' : `Hoje · ${n} ${n === 1 ? 'pessoa' : 'pessoas'}`),
    sheetNote: 'As fotos ficam desfocadas até vocês dois se cumprimentarem. Localizações arredondadas.',
    expandA11y: 'Abrir a lista',
    collapseA11y: 'Recolher a lista',
    around: (n: number): string => `No mapa · ${n}`,
    list: 'Lista',
    listA11y: (on: boolean): string => (on ? 'Vista em lista: a lista substitui o mapa. Toque para ver o mapa de novo' : 'Ver o mapa como lista'),
    rowA11y: (name: string, band: string | null): string => (band ? `${name}, ${band}. Abrir a ficha` : `${name}. Abrir a ficha`),
    activate: 'Ativar',
    chooseCity: 'Escolher minha cidade',
    history: 'Já se cruzaram',
    loadErrorText: 'Verifique sua conexão e tente de novo.',
    plusAction: 'Conhecer o Minimoa+',
    plusNote: (name: string): string => `${name} não está nas suas apresentações de hoje: acenar pelo mapa é com o Minimoa+.`,
  },
  nl: {
    title: [{ text: 'JOUW ' }, { text: 'BUURT', dim: true }],
    sheetTitle: (n: number): string => (n === 0 ? 'Vandaag · nog niemand' : `Vandaag · ${n} ${n === 1 ? 'persoon' : 'mensen'}`),
    sheetNote: 'Foto’s blijven wazig tot jullie elkaar allebei gedag hebben gezegd. Locaties zijn afgerond.',
    expandA11y: 'Lijst openen',
    collapseA11y: 'Lijst inklappen',
    around: (n: number): string => `Op de kaart · ${n}`,
    list: 'Lijst',
    listA11y: (on: boolean): string => (on ? 'Lijstweergave: de kaart is vervangen door een lijst. Tik om de kaart weer te zien' : 'De kaart als lijst tonen'),
    rowA11y: (name: string, band: string | null): string => (band ? `${name}, ${band}. Kaartje openen` : `${name}. Kaartje openen`),
    activate: 'Aanzetten',
    chooseCity: 'Mijn stad kiezen',
    history: 'Al ontmoet',
    loadErrorText: 'Controleer je verbinding en probeer het opnieuw.',
    plusAction: 'Ontdek Minimoa+',
    plusNote: (name: string): string => `${name} zit niet in je voorstellingen van vandaag: zwaaien vanaf de kaart kan met Minimoa+.`,
  },
});
