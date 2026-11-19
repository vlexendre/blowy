/**
 * Quiz du site repris dans l'app et « Ouvre ton quartier » (docs/VIRALITE.md) : la page qui reprend un résultat du quiz
 * ou une inscription au quartier, et la carte du quartier dans Rencontres vide (compteur réel de ta zone).
 */
import type { TitleSegment } from '@blowy/ui';

import { messages } from './runtime';

export const quartier = messages({
  fr: {
    quiz: {
      loading: 'On retrouve ton minimoa…',
      notFoundTitle: [{ text: 'CODE\n' }, { text: 'INTROUVABLE', dim: true }] as TitleSegment[],
      notFoundText: 'Ce résultat n’existe pas, ou plus. Crée ton minimoa quand même : ça prend deux minutes.',
      readyTitle: [{ text: 'TU AS DÉJÀ\n' }, { text: 'TON MINIMOA', dim: true }] as TitleSegment[],
      readyText: 'Le quiz sert à créer un minimoa. Le tien est déjà là, et il t’attend.',
      start: 'Créer mon minimoa',
      home: 'Voir mon minimoa',
    },
    card: {
      kicker: 'Ton quartier',
      /** Pas de « quartier fermé » : l'appariement ne dépend pas de l'ouverture. Le compteur réel, et ce qui aide (inviter). */
      title: (zone: string): TitleSegment[] => [{ text: `${zone.toUpperCase()}\n` }, { text: 'TES VOISINS', dim: true }],
      openTitle: (zone: string): TitleSegment[] => [{ text: `${zone.toUpperCase()}\n` }, { text: 'TES VOISINS', dim: true }],
      counter: (count: number, _threshold: number, _zone: string): string => `Compteur du quartier : ${count} ${count > 1 ? 'voisins inscrits' : 'voisin inscrit'}`,
      openCounter: (count: number): string => `Compteur du quartier : ${count} ${count > 1 ? 'voisins inscrits' : 'voisin inscrit'}`,
      text: (pet: string): string => `${pet} n’a encore personne de compatible à te présenter ici. Plus il y a de voisins, plus il a de monde à te présenter : chaque voisin qui s’inscrit avec ton lien compte.`,
      openText: (pet: string): string => `${pet} cherche des gens compatibles autour de toi. Invite tes voisins, il aura plus de monde à te présenter.`,
      action: 'Invite 3 personnes de ton quartier',
      copied: 'Lien copié ✓',
      message: (zone: string, _missing: number, url: string): string => `Je suis sur Minimoa à ${zone} : ton minimoa te présente des gens du coin qui vont avec toi. Plus on est de voisins, plus il y a de monde : ${url}`,
    },
  },
  en: {
    quiz: {
      loading: 'Finding your minimoa…',
      notFoundTitle: [{ text: 'CODE\n' }, { text: 'NOT FOUND', dim: true }],
      notFoundText: 'This result doesn’t exist, or no longer does. Create your minimoa anyway: it takes two minutes.',
      readyTitle: [{ text: 'YOU ALREADY\n' }, { text: 'HAVE A MINIMOA', dim: true }],
      readyText: 'The quiz is for creating a minimoa. Yours is already here, waiting for you.',
      start: 'Create my minimoa',
      home: 'See my minimoa',
    },
    card: {
      kicker: 'Your neighbourhood',
      title: (zone: string): TitleSegment[] => [{ text: `${zone.toUpperCase()}\n` }, { text: 'YOUR NEIGHBOURS', dim: true }],
      openTitle: (zone: string): TitleSegment[] => [{ text: `${zone.toUpperCase()}\n` }, { text: 'YOUR NEIGHBOURS', dim: true }],
      counter: (count: number, _threshold: number, _zone: string): string => `Neighbourhood counter: ${count} ${count === 1 ? 'neighbour' : 'neighbours'} signed up`,
      openCounter: (count: number): string => `Neighbourhood counter: ${count} ${count === 1 ? 'neighbour' : 'neighbours'} signed up`,
      text: (pet: string): string => `${pet} has no one compatible to introduce you to here yet. The more neighbours, the more people it can introduce: every neighbour who signs up with your link counts.`,
      openText: (pet: string): string => `${pet} is looking for compatible people around you. Invite your neighbours, it’ll have more people to introduce you to.`,
      action: 'Invite 3 people from your neighbourhood',
      copied: 'Link copied ✓',
      message: (zone: string, _missing: number, url: string): string => `I’m on Minimoa in ${zone}: your minimoa introduces you to people nearby who go well with you. The more neighbours, the more people: ${url}`,
    },
  },
  es: {
    quiz: {
      loading: 'Buscando tu minimoa…',
      notFoundTitle: [{ text: 'CÓDIGO\n' }, { text: 'NO ENCONTRADO', dim: true }],
      notFoundText: 'Este resultado no existe o ya no está. Crea tu minimoa igualmente: son dos minutos.',
      readyTitle: [{ text: 'YA TIENES\n' }, { text: 'TU MINIMOA', dim: true }],
      readyText: 'El test sirve para crear un minimoa. El tuyo ya está aquí, esperándote.',
      start: 'Crear mi minimoa',
      home: 'Ver mi minimoa',
    },
    card: {
      kicker: 'Tu barrio',
      title: (zone: string): TitleSegment[] => [{ text: `${zone.toUpperCase()}\n` }, { text: 'TUS VECINOS', dim: true }],
      openTitle: (zone: string): TitleSegment[] => [{ text: `${zone.toUpperCase()}\n` }, { text: 'TUS VECINOS', dim: true }],
      counter: (count: number, _threshold: number, _zone: string): string => `Contador del barrio: ${count} ${count === 1 ? 'vecino apuntado' : 'vecinos apuntados'}`,
      openCounter: (count: number): string => `Contador del barrio: ${count} ${count === 1 ? 'vecino apuntado' : 'vecinos apuntados'}`,
      text: (pet: string): string => `${pet} aún no tiene a nadie compatible que presentarte aquí. Cuantos más vecinos, más gente te puede presentar: cada vecino que se apunta con tu enlace cuenta.`,
      openText: (pet: string): string => `${pet} busca gente compatible a tu alrededor. Invita a tus vecinos, tendrá más gente que presentarte.`,
      action: 'Invita a 3 personas de tu barrio',
      copied: 'Enlace copiado ✓',
      message: (zone: string, _missing: number, url: string): string => `Estoy en Minimoa en ${zone}: tu minimoa te presenta a gente del barrio que encaja contigo. Cuantos más vecinos, más gente: ${url}`,
    },
  },
  pt: {
    quiz: {
      loading: 'Procurando seu minimoa…',
      notFoundTitle: [{ text: 'CÓDIGO\n' }, { text: 'NÃO ENCONTRADO', dim: true }],
      notFoundText: 'Este resultado não existe ou não existe mais. Crie seu minimoa mesmo assim: leva dois minutos.',
      readyTitle: [{ text: 'VOCÊ JÁ TEM\n' }, { text: 'SEU MINIMOA', dim: true }],
      readyText: 'O quiz serve para criar um minimoa. O seu já está aqui, te esperando.',
      start: 'Criar meu minimoa',
      home: 'Ver meu minimoa',
    },
    card: {
      kicker: 'Seu bairro',
      title: (zone: string): TitleSegment[] => [{ text: `${zone.toUpperCase()}\n` }, { text: 'SEUS VIZINHOS', dim: true }],
      openTitle: (zone: string): TitleSegment[] => [{ text: `${zone.toUpperCase()}\n` }, { text: 'SEUS VIZINHOS', dim: true }],
      counter: (count: number, _threshold: number, _zone: string): string => `Contador do bairro: ${count} ${count === 1 ? 'vizinho inscrito' : 'vizinhos inscritos'}`,
      openCounter: (count: number): string => `Contador do bairro: ${count} ${count === 1 ? 'vizinho inscrito' : 'vizinhos inscritos'}`,
      text: (pet: string): string => `${pet} ainda não tem ninguém compatível para te apresentar aqui. Quanto mais vizinhos, mais gente ele pode apresentar: cada vizinho que se inscreve com seu link conta.`,
      openText: (pet: string): string => `${pet} está procurando gente compatível perto de você. Convide seus vizinhos, ele terá mais gente para te apresentar.`,
      action: 'Convide 3 pessoas do seu bairro',
      copied: 'Link copiado ✓',
      message: (zone: string, _missing: number, url: string): string => `Estou no Minimoa em ${zone}: seu minimoa te apresenta gente do bairro que combina com você. Quanto mais vizinhos, mais gente: ${url}`,
    },
  },
  nl: {
    quiz: {
      loading: 'We zoeken je minimoa…',
      notFoundTitle: [{ text: 'CODE NIET\n' }, { text: 'GEVONDEN', dim: true }],
      notFoundText: 'Dit resultaat bestaat niet (meer). Maak toch je minimoa: het duurt twee minuten.',
      readyTitle: [{ text: 'JE HEBT AL\n' }, { text: 'EEN MINIMOA', dim: true }],
      readyText: 'De quiz is om een minimoa te maken. De jouwe is er al, en wacht op je.',
      start: 'Mijn minimoa maken',
      home: 'Naar mijn minimoa',
    },
    card: {
      kicker: 'Je buurt',
      title: (zone: string): TitleSegment[] => [{ text: `${zone.toUpperCase()}\n` }, { text: 'JE BUREN', dim: true }],
      openTitle: (zone: string): TitleSegment[] => [{ text: `${zone.toUpperCase()}\n` }, { text: 'JE BUREN', dim: true }],
      counter: (count: number, _threshold: number, _zone: string): string => `Buurtteller: ${count} ${count === 1 ? 'buur aangemeld' : 'buren aangemeld'}`,
      openCounter: (count: number): string => `Buurtteller: ${count} ${count === 1 ? 'buur aangemeld' : 'buren aangemeld'}`,
      text: (pet: string): string => `${pet} heeft hier nog niemand compatibel om je aan voor te stellen. Hoe meer buren, hoe meer mensen hij kan voorstellen: elke buur die zich aanmeldt met jouw link telt.`,
      openText: (pet: string): string => `${pet} zoekt compatibele mensen in je buurt. Nodig je buren uit, dan heeft hij meer mensen om je aan voor te stellen.`,
      action: 'Nodig 3 mensen uit je buurt uit',
      copied: 'Link gekopieerd ✓',
      message: (zone: string, _missing: number, url: string): string => `Ik zit op Minimoa in ${zone}: je minimoa stelt je voor aan mensen uit de buurt die bij je passen. Hoe meer buren, hoe meer mensen: ${url}`,
    },
  },
});
