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
      title: (zone: string): TitleSegment[] => [{ text: `${zone.toUpperCase()}\n` }, { text: 'OUVRE BIENTÔT', dim: true }],
      openTitle: (zone: string): TitleSegment[] => [{ text: `${zone.toUpperCase()}\n` }, { text: 'EST OUVERT', dim: true }],
      counter: (count: number, threshold: number, zone: string): string => `${count} / ${threshold} pour ouvrir ${zone}`,
      openCounter: (count: number): string => `${count} ${count > 1 ? 'personnes inscrites' : 'personne inscrite'} avant l’ouverture`,
      text: (pet: string): string => `${pet} n’a encore personne à te présenter ici. Chaque voisin qui s’inscrit avec ton lien fait avancer le compteur.`,
      openText: (pet: string): string => `Le quartier vient d’ouvrir : ${pet} cherche. Invite tes voisins, il aura plus de monde à te présenter.`,
      action: 'Invite 3 personnes de ton quartier',
      copied: 'Lien copié ✓',
      message: (zone: string, missing: number, url: string): string =>
        missing > 0
          ? `Il manque ${missing} ${missing > 1 ? 'personnes' : 'personne'} pour ouvrir Minimoa à ${zone}. Inscris-toi : ${url}`
          : `Minimoa est ouvert à ${zone}. Viens, ton minimoa te présentera du monde : ${url}`,
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
      title: (zone: string): TitleSegment[] => [{ text: `${zone.toUpperCase()}\n` }, { text: 'OPENS SOON', dim: true }],
      openTitle: (zone: string): TitleSegment[] => [{ text: `${zone.toUpperCase()}\n` }, { text: 'IS OPEN', dim: true }],
      counter: (count: number, threshold: number, zone: string): string => `${count} / ${threshold} to open ${zone}`,
      openCounter: (count: number): string => `${count} ${count === 1 ? 'person' : 'people'} signed up before opening`,
      text: (pet: string): string => `${pet} has no one to introduce you to here yet. Every neighbour who signs up with your link moves the counter.`,
      openText: (pet: string): string => `The neighbourhood just opened: ${pet} is looking. Invite your neighbours, it’ll have more people to introduce you to.`,
      action: 'Invite 3 people from your neighbourhood',
      copied: 'Link copied ✓',
      message: (zone: string, missing: number, url: string): string =>
        missing > 0
          ? `${missing} more ${missing === 1 ? 'person' : 'people'} needed to open Minimoa in ${zone}. Sign up: ${url}`
          : `Minimoa is open in ${zone}. Come, your minimoa will introduce you to people: ${url}`,
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
      title: (zone: string): TitleSegment[] => [{ text: `${zone.toUpperCase()}\n` }, { text: 'ABRE PRONTO', dim: true }],
      openTitle: (zone: string): TitleSegment[] => [{ text: `${zone.toUpperCase()}\n` }, { text: 'YA ESTÁ ABIERTO', dim: true }],
      counter: (count: number, threshold: number, zone: string): string => `${count} / ${threshold} para abrir ${zone}`,
      openCounter: (count: number): string => `${count} ${count === 1 ? 'persona apuntada' : 'personas apuntadas'} antes de la apertura`,
      text: (pet: string): string => `${pet} aún no tiene a nadie que presentarte aquí. Cada vecino que se apunta con tu enlace hace avanzar el contador.`,
      openText: (pet: string): string => `El barrio acaba de abrir: ${pet} está buscando. Invita a tus vecinos, tendrá más gente que presentarte.`,
      action: 'Invita a 3 personas de tu barrio',
      copied: 'Enlace copiado ✓',
      message: (zone: string, missing: number, url: string): string =>
        missing > 0
          ? `Faltan ${missing} ${missing === 1 ? 'persona' : 'personas'} para abrir Minimoa en ${zone}. Apúntate: ${url}`
          : `Minimoa ya está abierto en ${zone}. Ven, tu minimoa te presentará gente: ${url}`,
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
      title: (zone: string): TitleSegment[] => [{ text: `${zone.toUpperCase()}\n` }, { text: 'ABRE EM BREVE', dim: true }],
      openTitle: (zone: string): TitleSegment[] => [{ text: `${zone.toUpperCase()}\n` }, { text: 'ESTÁ ABERTO', dim: true }],
      counter: (count: number, threshold: number, zone: string): string => `${count} / ${threshold} para abrir ${zone}`,
      openCounter: (count: number): string => `${count} ${count === 1 ? 'pessoa inscrita' : 'pessoas inscritas'} antes da abertura`,
      text: (pet: string): string => `${pet} ainda não tem ninguém para te apresentar aqui. Cada vizinho que se inscreve com seu link faz o contador avançar.`,
      openText: (pet: string): string => `O bairro acabou de abrir: ${pet} está procurando. Convide seus vizinhos, ele terá mais gente para te apresentar.`,
      action: 'Convide 3 pessoas do seu bairro',
      copied: 'Link copiado ✓',
      message: (zone: string, missing: number, url: string): string =>
        missing > 0
          ? `Faltam ${missing} ${missing === 1 ? 'pessoa' : 'pessoas'} para abrir o Minimoa em ${zone}. Inscreva-se: ${url}`
          : `O Minimoa está aberto em ${zone}. Vem, seu minimoa vai te apresentar pessoas: ${url}`,
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
      title: (zone: string): TitleSegment[] => [{ text: `${zone.toUpperCase()}\n` }, { text: 'GAAT BIJNA OPEN', dim: true }],
      openTitle: (zone: string): TitleSegment[] => [{ text: `${zone.toUpperCase()}\n` }, { text: 'IS OPEN', dim: true }],
      counter: (count: number, threshold: number, zone: string): string => `${count} / ${threshold} om ${zone} te openen`,
      openCounter: (count: number): string => `${count} ${count === 1 ? 'persoon' : 'mensen'} aangemeld voor de opening`,
      text: (pet: string): string => `${pet} heeft hier nog niemand om je aan voor te stellen. Elke buur die zich aanmeldt met jouw link brengt de teller verder.`,
      openText: (pet: string): string => `De buurt is net open: ${pet} zoekt. Nodig je buren uit, dan heeft hij meer mensen om je aan voor te stellen.`,
      action: 'Nodig 3 mensen uit je buurt uit',
      copied: 'Link gekopieerd ✓',
      message: (zone: string, missing: number, url: string): string =>
        missing > 0
          ? `Nog ${missing} ${missing === 1 ? 'persoon' : 'mensen'} nodig om Minimoa te openen in ${zone}. Meld je aan: ${url}`
          : `Minimoa is open in ${zone}. Kom, je minimoa stelt je voor aan mensen: ${url}`,
    },
  },
});
