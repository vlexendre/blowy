/** Textes de l'accueil (Mon minimoa), du caractère, de la garde-robe et de l'écran Évolution. */
import { TODO } from '@blowy/content';
import type { GaugeKey, ItemSlot, NeedKey, PetForm, StatKey } from '@blowy/domain';
import type { TitleSegment } from '@blowy/ui';
import { formatDate, messages } from './runtime';

const low = (s: string): string => s.toLowerCase();
const plural = (n: number, one: string, many: string): string => `${n} ${n > 1 ? many : one}`;

/** « plutôt joueur », adjectif accordé au masculin (le minimoa). */
const formTitleFr: Record<PetForm, string> = {
  equilibre: 'ÉQUILIBRÉ.',
  casanier: 'PLUTÔT\nCASANIER',
  sociable: 'PLUTÔT\nSOCIABLE',
  joueur: 'PLUTÔT\nJOUEUR.',
  piquant: 'PLUTÔT\nPIQUANT',
  tendre: 'PLUTÔT\nTENDRE.',
};

/** « d’humeur joueuse » : accordé à « humeur ». */
const moodWordFr: Record<Exclude<PetForm, 'equilibre'>, string> = {
  casanier: 'casanière',
  sociable: 'sociable',
  joueur: 'joueuse',
  piquant: 'piquante',
  tendre: 'tendre',
};

export const pet = messages({
  fr: {
    title: (name: string, form: PetForm): TitleSegment[] => [{ text: `${name.toUpperCase()},\n` }, { text: formTitleFr[form], dim: true }],
    mood: (form: PetForm): string => (form === 'equilibre' ? 'D’humeur égale' : `D’humeur ${moodWordFr[form]}`),
    speech: {
      equilibre: 'Je suis un peu tout à la fois. Fais-moi pencher.',
      casanier: 'Un plaid, une série. C’est tout ce que je demande.',
      sociable: 'Je me sens pousser des antennes.',
      joueur: 'On joue à quoi, aujourd’hui ?',
      piquant: 'Je dis les choses. Gentiment. Presque.',
      tendre: 'Viens là. Câlin obligatoire.',
    } as Record<PetForm, string>,
    petA11y: (name: string): string => `${name}, toucher pour le renommer`,
    renameA11y: (name: string): string => `Renommer ${name}`,
    renameLabel: 'Son petit nom',
    renameHint: '14 caractères max.',
    renameSave: 'Garder ce nom',
    renameCancel: 'Annuler',
    renameError: 'Impossible de le renommer. Réessaie.',
    /** Changement de nom : une fois tous les 60 jours, sans attente avec Blowy+. */
    renameLocked: (when: string): string => `Prochain changement de nom possible le ${when} · avec Blowy+, pas d’attente.`,
    renameNext: (days: number, when: string): string => `Après ce changement, le prochain ne sera possible que dans ${days} jours (le ${when}).`,
    renamePlus: 'Découvrir Blowy+',
    renameClose: 'Fermer',
    gaugeNames: { social: 'Sociabilité', play: 'Jeu', tender: 'Tendresse', talk: 'Parole' } as Record<GaugeKey, string>,
    wardrobe: 'Garde-robe',
    wardrobeA11y: 'Ouvrir la garde-robe',
    back: 'Retour',
    evolution: 'Son évolution',
    loadError: 'Impossible de charger ton minimoa',
    retry: 'Réessayer',
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});

export const evolution = messages({
  fr: {
    back: 'Retour',
    title: [{ text: 'IL CHANGE\n' }, { text: 'AVEC TOI.', dim: true }] as TitleSegment[],
    age: (days: number): string =>
      days < 1 ? 'Né aujourd’hui' : days < 60 ? `${days} ${days > 1 ? 'jours' : 'jour'} avec toi` : `${Math.floor(days / 30)} mois avec toi`,
    /** Puce de date d'une étape passée (« septembre »), dans la langue du téléphone. */
    month: (iso: string): string => formatDate(iso, { month: 'long' }),
    /** Légende d'une forme dans la frise. */
    story: {
      equilibre: 'Un peu de tout.',
      casanier: 'Que du canapé.',
      sociable: 'Des minimoas croisés.',
      joueur: 'Toujours partant.',
      piquant: 'La vanne facile.',
      tendre: 'Que des câlins.',
    } as Record<PetForm, string>,
    /** Ce que la forme change à son allure. */
    look: {
      equilibre: '→ Ni crête ni antennes.',
      casanier: '→ Tout rond, paupières lourdes.',
      sociable: '→ Des antennes poussent.',
      joueur: '→ Une dent de plus, sourire en coin.',
      piquant: '→ Poils courts dressés et une crête.',
      tendre: '→ Poils longs et joues roses.',
    } as Record<PetForm, string>,
    now: 'Aujourd’hui',
    formsTitle: 'Ce qu’il peut devenir',
    formsHint: 'Touche pour voir',
    formCaption: {
      equilibre: 'Un peu de tout',
      casanier: 'Plus de calme',
      sociable: 'Plus de rencontres',
      joueur: 'Plus de défis',
      piquant: 'Plus de vannes',
      tendre: 'Plus de câlins',
    } as Record<PetForm, string>,
    how: {
      equilibre: 'Rien de marqué : ses jauges restent proches du centre.',
      casanier: 'Rester avec les mêmes liens, saluer moins de monde.',
      sociable: 'Croiser de nouveaux minimoas, saluer, accepter des rencontres.',
      joueur: 'Défis, quiz, et ne jamais perdre exprès.',
      piquant: 'Vannes, roasts, second degré à volonté.',
      tendre: 'Photo du jour, câlins, soin de tes liens.',
    } as Record<PetForm, string>,
    howTitle: (form: string): string => `Pour devenir ${low(form)} : `,
    speech: 'Dans un sens, puis dans l’autre. Rien n’est définitif.',
    decay: 'Si tu lâches, ses jauges retombent doucement vers 0.',
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});

/** Accueil : le minimoa, ses besoins, les soins (V6-Accueil, V6-Boude). */
export const home = messages({
  fr: {
    wardrobe: 'Garde-robe',
    wardrobeA11y: 'Ouvrir sa garde-robe',
    petA11y: (name: string): string => `${name}, ton minimoa`,
    /** Ce que dit le minimoa : choisi selon son besoin le plus urgent, sinon une phrase joyeuse (3 par cas). */
    speech: {
      hunger: ['J’ai faim. Et hier, personne.', 'Mon ventre fait des bruits bizarres.', 'Un petit truc à grignoter ?'],
      energy: ['Je tombe de sommeil…', 'Mes yeux se ferment tout seuls.', 'Une sieste. Vite.'],
      mood: ['Je m’ennuie à mourir.', 'On joue ? Juste un peu ?', 'Un câlin, ça ne se refuse pas.'],
    } as Record<NeedKey, readonly string[]>,
    happy: ['On sort ce soir ? Je suis prêt.', 'Je suis au top. Merci, chef.', 'Regarde-moi ce style.'],
    careError: 'Ça n’a pas marché. Réessaie.',
    /** Carte garde-robe. */
    wardrobeTitle: (owned: number, total: number): string => `${plural(owned, 'objet', 'objets')} sur ${total}`,
    wardrobeNext: (item: string, goal: string, have: number, need: number): string => `Prochain : ${item}. ${goal} (${have}/${need})`,
    wardrobeAll: 'Tu as tout gagné. Respect.',
    wardrobeLoading: 'Sa garde-robe…',
    newCount: (n: number): string => (n > 1 ? `${n} nouveaux` : '1 nouveau'),
    /** Carte caractère. */
    character: 'Son caractère',
    characterText: (form: string, challengeDone: boolean): string =>
      `${form.charAt(0).toUpperCase()}${form.slice(1)} · ${challengeDone ? 'défi du jour relevé' : 'défi du jour à faire'}`,
    characterA11y: 'Ouvrir son caractère',
    /** Carte « il ne sort plus » (il boude). */
    sulkTitle: (name: string): string => `${name} ne sort plus`,
    sulkText: 'Tant qu’il boude, il ne croise personne et tu ne peux plus saluer. Tes liens, eux, continuent.',
    loadError: 'Impossible de charger ton minimoa',
    retry: 'Réessayer',
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});

/** Fête d'un objet gagné (V6-Debloque). */
export const unlock = messages({
  fr: {
    kicker: 'Nouveau !',
    title: (item: string, pet: string): TitleSegment[] => [{ text: `${item.toUpperCase()}\n` }, { text: `POUR ${pet.toUpperCase()}.`, dim: true }],
    /** Ce qui l'a débloqué, au passé. */
    reason: {
      careDays: (n: number): string => `${plural(n, 'jour', 'jours')} de soins. C’est mérité.`,
      links: (n: number): string => `${plural(n, 'lien créé', 'liens créés')}. Bien joué.`,
      bestLevel: (n: number): string => `Niveau ${n} dans un lien. Vous l’avez fait.`,
      bestStreak: (n: number): string => `Une série de ${n} photos du jour. Chapeau.`,
      challenges: (n: number): string => `${plural(n, 'défi relevé', 'défis relevés')}. Pas mal.`,
      words: (n: number): string => `${plural(n, 'pote a', 'potes ont')} donné leurs 3 mots.`,
      ritualStreak: (n: number): string => `${n} jours de série. La mèche brille.`,
      habitsKept: (n: number): string => `${plural(n, 'habitude tenue', 'habitudes tenues')}. Ça se voit.`,
    } as Record<StatKey, (n: number) => string>,
    fallback: 'Il est rangé dans sa garde-robe.',
    wear: 'Il le porte',
    store: 'Ranger dans la garde-robe',
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});

/** Garde-robe (V6-GardeRobe, V6-Objet). */
export const wardrobe = messages({
  fr: {
    title: [{ text: 'GARDE-' }, { text: 'ROBE', dim: true }] as TitleSegment[],
    back: 'Retour',
    count: (owned: number, total: number): string => `${owned} / ${total}`,
    countA11y: (owned: number, total: number): string => `${owned} objets sur ${total}`,
    empty: 'Rien',
    worn: 'Porté',
    new: 'Nouveau',
    premium: 'Bientôt',
    hints: { owned: 'Toucher pour le lui mettre', worn: 'Toucher pour le retirer', locked: 'Toucher pour voir comment le gagner', premium: 'Bientôt disponible' },
    petA11y: (name: string): string => `${name}, habillé`,
    /** Sous un objet à gagner : l'étape en bref. */
    goalShort: {
      careDays: (n: number): string => plural(n, 'jour de soins', 'jours de soins'),
      links: (n: number): string => plural(n, 'lien', 'liens'),
      bestLevel: (n: number): string => `Niveau ${n} d’un lien`,
      bestStreak: (n: number): string => `Série de ${n} photos`,
      challenges: (n: number): string => plural(n, 'défi', 'défis'),
      words: (n: number): string => (n > 1 ? `3 mots de ${n} potes` : '3 mots d’un pote'),
      ritualStreak: (n: number): string => `Série de ${n} jours`,
      habitsKept: (n: number): string => plural(n, 'habitude tenue', 'habitudes tenues'),
    } as Record<StatKey, (n: number) => string>,
    /** Titre de la fiche : le dernier mot estompé (« COURONNE DE / FLEURS »). */
    itemTitle: (name: string): TitleSegment[] => {
      const words = name.toUpperCase().split(' ');
      if (words.length < 2) return [{ text: words[0] ?? '' }];
      return [{ text: `${words.slice(0, -1).join(' ')} ` }, { text: words[words.length - 1] ?? '', dim: true }];
    },
    where: {
      head: 'Se pose sur la tête. Tes potes le verront dans vos chats.',
      face: 'Se porte sur le visage. Tes potes le verront dans vos chats.',
      body: 'Se porte sur lui. Tes potes le verront dans vos chats.',
      toy: 'Reste à ses pieds. Tes potes le verront dans vos chats.',
    } as Record<ItemSlot, string>,
    /** Où il en est, sous la barre. */
    goalHint: {
      careDays: (have: number): string => (have === 0 ? 'Commence aujourd’hui : un soin suffit.' : `Déjà ${plural(have, 'jour', 'jours')} de soins.`),
      links: (have: number): string => (have === 0 ? 'Pas encore de lien.' : `Tu as ${plural(have, 'lien', 'liens')}.`),
      bestLevel: (have: number): string => (have === 0 ? 'Pas encore de lien.' : `Ton meilleur lien est au niveau ${have}.`),
      bestStreak: (have: number): string => (have === 0 ? 'Pas encore de série.' : `Ta meilleure série : ${plural(have, 'jour', 'jours')}.`),
      challenges: (have: number): string => `${plural(have, 'défi relevé', 'défis relevés')} pour l’instant.`,
      words: (have: number): string => (have === 0 ? 'Personne n’a encore choisi tes 3 mots.' : `${plural(have, 'pote a', 'potes ont')} déjà répondu.`),
      ritualStreak: (have: number): string => (have === 0 ? 'Pas encore de série.' : `Ton record : ${plural(have, 'jour', 'jours')}.`),
      habitsKept: (have: number): string => `${plural(have, 'habitude tenue', 'habitudes tenues')} pour l’instant.`,
    } as Record<StatKey, (have: number) => string>,
    /** Raccourci vers l'endroit où on avance. */
    shortcut: {
      careDays: 'M’occuper de lui',
      links: 'Trouver des minimoas',
      bestLevel: 'Aller dans mes chats',
      bestStreak: 'Faire la photo du jour',
      challenges: 'Relever le défi du jour',
      words: 'Partager mes 3 mots',
      ritualStreak: 'Relever le défi du jour',
      habitsKept: 'Tenir une habitude',
    } as Record<StatKey, string>,
    premiumNote: 'Bientôt disponible',
    /** Fiche d'un objet Blowy+ : ouvre la feuille Blowy+. */
    premiumCta: 'Voir Blowy+',
    premiumText: 'Cet objet arrive avec Blowy+. Pas encore en vente : on te prévient dès qu’il l’est.',
    close: 'Fermer',
    loadError: 'Impossible d’ouvrir la garde-robe',
    outfitError: 'La tenue n’a pas changé. Réessaie.',
    retry: 'Réessayer',
  },
  en: TODO,
  es: TODO,
  pt: TODO,
  nl: TODO,
});
