/** Questions de couvaison (≥ 12, choix multiples). Chaque option peut décaler un axe hérité (borné par le tuning). */
import type { Passion, Sunday, VisionAxis } from '@blowy/domain';

export interface EggOption {
  id: string;
  key: string;
  fr: string;
  /** Décalage proposé d'un axe (borné par egg.heredityMaxDeltaPerAxis). */
  axisDelta?: { axis: VisionAxis; delta: number };
  passion?: Passion;
  sunday?: Sunday;
}

export interface EggQuestion {
  id: string;
  key: string;
  fr: string;
  options: EggOption[];
}

const q = (id: string, fr: string, options: Array<Omit<EggOption, 'key'>>): EggQuestion => ({
  id,
  key: `egg.q.${id}`,
  fr,
  options: options.map((o) => ({ ...o, key: `egg.q.${id}.${o.id}` })),
});

export const EGG_QUESTIONS: EggQuestion[] = [
  q('sunday', 'Le dimanche idéal du futur pet ?', [
    { id: 'brunch', fr: 'Un brunch', sunday: 'BRUNCH' },
    { id: 'museum', fr: 'Un musée', sunday: 'MUSEE' },
    { id: 'hike', fr: 'Une rando', sunday: 'RANDO', axisDelta: { axis: 'homeAdventure', delta: 0.1 } },
    { id: 'couch', fr: 'Le canapé', sunday: 'CANAPE', axisDelta: { axis: 'homeAdventure', delta: -0.1 } },
  ]),
  q('night_owl', 'Qui se lève à 3 h du matin pour le consoler ?', [
    { id: 'me', fr: 'Moi' },
    { id: 'you', fr: 'Toi' },
    { id: 'both', fr: 'On y va à deux' },
    { id: 'pet', fr: 'Il se console tout seul', axisDelta: { axis: 'homeAdventure', delta: 0.05 } },
  ]),
  q('first_passion', 'Sa première passion ?', [
    { id: 'music', fr: 'La musique', passion: 'MUSIQUE', axisDelta: { axis: 'scienceArt', delta: 0.1 } },
    { id: 'sport', fr: 'Le sport', passion: 'SPORT', axisDelta: { axis: 'sportyContemplative', delta: -0.1 } },
    { id: 'books', fr: 'Les livres', passion: 'LECTURE', axisDelta: { axis: 'sportyContemplative', delta: 0.1 } },
    { id: 'games', fr: 'Les jeux', passion: 'JEUX' },
  ]),
  q('first_word', 'Son premier mot ?', [
    { id: 'snack', fr: '« Goûter »' },
    { id: 'again', fr: '« Encore »', axisDelta: { axis: 'kindMischief', delta: 0.1 } },
    { id: 'hug', fr: '« Câlin »', axisDelta: { axis: 'kindMischief', delta: -0.1 } },
    { id: 'why', fr: '« Pourquoi ? »', axisDelta: { axis: 'scienceArt', delta: -0.1 } },
  ]),
  q('rainy_day', 'Un jour de pluie, il…', [
    { id: 'puddles', fr: 'Saute dans les flaques', axisDelta: { axis: 'homeAdventure', delta: 0.1 } },
    { id: 'blanket', fr: 'Construit une cabane de coussins', axisDelta: { axis: 'homeAdventure', delta: -0.1 } },
    { id: 'paint', fr: 'Peint des nuages', axisDelta: { axis: 'scienceArt', delta: 0.1 } },
    { id: 'experiment', fr: 'Mesure la pluie', axisDelta: { axis: 'scienceArt', delta: -0.1 } },
  ]),
  q('snack', 'Son goûter préféré ?', [
    { id: 'fruit', fr: 'Des fruits' },
    { id: 'cake', fr: 'Un gâteau maison', passion: 'CUISINE' },
    { id: 'crackers', fr: 'Des crackers' },
    { id: 'surprise', fr: 'Ce qu’il trouve dans ta poche', axisDelta: { axis: 'kindMischief', delta: 0.1 } },
  ]),
  q('toy', 'Son jouet de chevet ?', [
    { id: 'ball', fr: 'Une balle', axisDelta: { axis: 'sportyContemplative', delta: -0.1 } },
    { id: 'book', fr: 'Un livre d’images', passion: 'LECTURE' },
    { id: 'drum', fr: 'Un petit tambour', passion: 'MUSIQUE' },
    { id: 'map', fr: 'Une carte au trésor', passion: 'VOYAGE' },
  ]),
  q('trip', 'Sa première sortie ?', [
    { id: 'forest', fr: 'La forêt', passion: 'NATURE' },
    { id: 'cinema', fr: 'Le cinéma', passion: 'CINEMA' },
    { id: 'market', fr: 'Le marché', passion: 'CUISINE' },
    { id: 'ball', fr: 'Un bal', passion: 'DANSE' },
  ]),
  q('song', 'Quelle berceuse ?', [
    { id: 'lullaby', fr: 'Une berceuse douce', axisDelta: { axis: 'kindMischief', delta: -0.05 } },
    { id: 'rock', fr: 'Du rock très doux' },
    { id: 'invented', fr: 'Une chanson inventée', axisDelta: { axis: 'scienceArt', delta: 0.05 } },
    { id: 'silence', fr: 'Le silence et les étoiles', axisDelta: { axis: 'sportyContemplative', delta: 0.05 } },
  ]),
  q('bedtime', 'À l’heure du coucher, il…', [
    { id: 'story', fr: 'Réclame une histoire' },
    { id: 'negotiates', fr: 'Négocie cinq minutes', axisDelta: { axis: 'kindMischief', delta: 0.1 } },
    { id: 'asleep', fr: 'Dort déjà', axisDelta: { axis: 'sportyContemplative', delta: 0.05 } },
    { id: 'stars', fr: 'Compte les étoiles', axisDelta: { axis: 'scienceArt', delta: -0.05 } },
  ]),
  q('talent', 'Son talent caché ?', [
    { id: 'dance', fr: 'Danser', passion: 'DANSE' },
    { id: 'build', fr: 'Construire', axisDelta: { axis: 'scienceArt', delta: -0.1 } },
    { id: 'draw', fr: 'Dessiner', passion: 'ART' },
    { id: 'friends', fr: 'Se faire des amis', axisDelta: { axis: 'kindMischief', delta: -0.05 } },
  ]),
  q('weekend', 'Son week-end rêvé ?', [
    { id: 'beach', fr: 'La plage', passion: 'VOYAGE', axisDelta: { axis: 'homeAdventure', delta: 0.1 } },
    { id: 'garden', fr: 'Le jardin', passion: 'NATURE' },
    { id: 'games', fr: 'Une soirée jeux', passion: 'JEUX' },
    { id: 'kitchen', fr: 'Cuisiner ensemble', passion: 'CUISINE' },
  ]),
];
