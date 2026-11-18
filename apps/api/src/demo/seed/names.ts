/**
 * Prénoms courants (listes locales, écrites à la main : aucune personne réelle, aucune photo) et noms de minimoas,
 * pour le semis d'un environnement de test. Données, pas des textes d'interface.
 */
import type { Locale } from '@blowy/domain';

export interface NamePool {
  femme: readonly string[];
  homme: readonly string[];
}

/** France, Belgique francophone et Suisse romande. */
const FR: NamePool = {
  femme: ['Léa', 'Chloé', 'Manon', 'Camille', 'Inès', 'Jade', 'Louise', 'Emma', 'Sarah', 'Juliette', 'Clara', 'Anaïs', 'Margaux', 'Lucie', 'Pauline', 'Zoé', 'Elsa', 'Noémie', 'Laure', 'Mathilde', 'Céline', 'Amandine', 'Nina', 'Salomé', 'Romane', 'Héloïse', 'Maëlle', 'Coralie', 'Gaëlle', 'Océane'],
  homme: ['Lucas', 'Hugo', 'Louis', 'Nathan', 'Théo', 'Arthur', 'Jules', 'Gabriel', 'Tom', 'Maxime', 'Antoine', 'Baptiste', 'Romain', 'Julien', 'Thomas', 'Alexandre', 'Quentin', 'Loïc', 'Yanis', 'Mathis', 'Raphaël', 'Bastien', 'Florian', 'Kevin', 'Adrien', 'Valentin', 'Cédric', 'Ludovic', 'Gaspard', 'Malo'],
};
const NL: NamePool = {
  femme: ['Emma', 'Julia', 'Sophie', 'Lotte', 'Fleur', 'Anouk', 'Sanne', 'Lieke', 'Femke', 'Noor', 'Isa', 'Eva', 'Roos', 'Maud', 'Britt', 'Jasmijn'],
  homme: ['Daan', 'Sem', 'Lars', 'Bram', 'Thijs', 'Jesse', 'Ruben', 'Stijn', 'Joris', 'Niels', 'Milan', 'Tim', 'Sven', 'Koen', 'Wouter', 'Jelle'],
};
const ES: NamePool = {
  femme: ['Lucía', 'María', 'Paula', 'Carmen', 'Laura', 'Marta', 'Elena', 'Sara', 'Alba', 'Nerea', 'Irene', 'Claudia', 'Andrea', 'Noelia', 'Ainhoa', 'Rocío'],
  homme: ['Hugo', 'Pablo', 'Javier', 'Daniel', 'Álvaro', 'Adrián', 'Sergio', 'Marcos', 'Diego', 'Iván', 'Jorge', 'Raúl', 'Íker', 'Mario', 'Rubén', 'Guillermo'],
};
const PT: NamePool = {
  femme: ['Beatriz', 'Inês', 'Mariana', 'Leonor', 'Matilde', 'Carolina', 'Joana', 'Rita', 'Sofia', 'Margarida', 'Catarina', 'Raquel', 'Teresa', 'Filipa'],
  homme: ['João', 'Tiago', 'Rodrigo', 'Duarte', 'Afonso', 'Gonçalo', 'Miguel', 'Diogo', 'Rui', 'Tomás', 'Bernardo', 'Nuno', 'Pedro', 'Vasco'],
};
/** Prénoms mixtes (personnes non binaires ou qui ne le disent pas). */
export const NEUTRAL_NAMES: readonly string[] = ['Sasha', 'Charlie', 'Alex', 'Andrea', 'Eden', 'Noa', 'Robin', 'Sacha', 'Maxime', 'Lou'];

export const NAME_POOLS: Readonly<Record<'fr' | 'nl' | 'es' | 'pt', NamePool>> = { fr: FR, nl: NL, es: ES, pt: PT };

/** Pool de prénoms selon la langue de la personne (l'anglais reprend le pays). */
export const poolFor = (locale: Locale, country: 'fr' | 'be' | 'nl' | 'pt' | 'es'): NamePool => {
  if (locale === 'nl') return NL;
  if (locale === 'es') return ES;
  if (locale === 'pt') return PT;
  if (locale === 'fr') return FR;
  return country === 'nl' || country === 'be' ? NL : country === 'es' ? ES : country === 'pt' ? PT : FR;
};

/** Noms de minimoas (14 caractères au plus). */
export const PET_NAMES: readonly string[] = [
  'Pistache', 'Biscotte', 'Mochi', 'Praline', 'Caramel', 'Noisette', 'Plume', 'Galette', 'Choupi', 'Pépite', 'Tofu', 'Nuage', 'Bulle',
  'Myrtille', 'Cookie', 'Gribouille', 'Pompon', 'Sushi', 'Kiwi', 'Mango', 'Paprika', 'Basile', 'Olga', 'Ziggy', 'Grisou', 'Frimousse',
  'Patate', 'Muffin', 'Churro', 'Pixel', 'Tango', 'Loukoum',
];
