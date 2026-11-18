/**
 * Textes du semis d'un environnement de test (`apps/api/src/demo/seed`, docs/SEED-TEST.md) : messages courts et
 * banals échangés entre comptes de test, noms de groupes. Jamais montrés à un vrai compte (monde à part, `Audience`).
 * Rien de sensible : ni santé, ni argent, ni politique, ni rendez-vous intime ; pas de lieu ni d'heure précis.
 */
import { defineMessages } from '../i18n/core';

const fr = {
  /** Premier message d'un lien. */
  openers: ['Salut ! Ton minimoa a l’air en forme', 'Coucou 🙂', 'Hello ! Tu es dans le quartier depuis longtemps ?', 'Salut, enchanté·e !', 'Hey ! J’aime bien la tenue de ton minimoa'],
  /** Messages du quotidien. */
  lines: [
    'Bonne journée !',
    'Tu as fait quoi ce week-end ?',
    'Il fait beau aujourd’hui',
    'J’ai testé la boulangerie du coin, pas mal du tout',
    'Tu lis quelque chose en ce moment ?',
    'Mon minimoa a encore faim 😅',
    'Ça va de ton côté ?',
    'Petite balade ce matin, ça fait du bien',
    'Tu as vu le défi du jour ?',
    'Haha oui !',
    'Je file, à plus tard',
    'Belle soirée 🙂',
  ],
  /** Réponses courtes. */
  replies: ['Oui !', 'Trop bien', 'Pareil 🙂', 'Ah cool', 'Bonne idée', 'Merci !', 'À plus !'],
  /** Noms de groupes. */
  groupNames: ['Les marcheurs', 'Club lecture', 'Café du matin', 'Les lève-tôt', 'Petits pas', 'Team quartier'],
  /** Messages de groupe. */
  groupLines: ['Bienvenue à tous !', 'On tient bon cette semaine', 'Fait pour aujourd’hui ✅', 'Qui est motivé demain ?'],
};

export const seedText = defineMessages({
  fr,
  en: {
    openers: ['Hi! Your minimoa looks great', 'Hey 🙂', 'Hello! Have you lived around here long?', 'Hi, nice to meet you!', 'Hey! I like your minimoa’s outfit'],
    lines: [
      'Have a nice day!',
      'What did you do this weekend?',
      'Lovely weather today',
      'Tried the bakery nearby, pretty good',
      'Reading anything right now?',
      'My minimoa is hungry again 😅',
      'How’s it going?',
      'Short walk this morning, felt good',
      'Did you see today’s challenge?',
      'Haha yes!',
      'Got to go, talk later',
      'Have a nice evening 🙂',
    ],
    replies: ['Yes!', 'So nice', 'Same 🙂', 'Oh cool', 'Good idea', 'Thanks!', 'See you!'],
    groupNames: ['The walkers', 'Book club', 'Morning coffee', 'Early birds', 'Small steps', 'Team neighbourhood'],
    groupLines: ['Welcome everyone!', 'Hanging in there this week', 'Done for today ✅', 'Who’s up for tomorrow?'],
  },
  es: {
    openers: ['¡Hola! Tu minimoa se ve genial', 'Hola 🙂', '¡Hola! ¿Llevas mucho en el barrio?', '¡Hola, encantado de conocerte!', '¡Hey! Me gusta el look de tu minimoa'],
    lines: [
      '¡Que tengas un buen día!',
      '¿Qué hiciste el fin de semana?',
      'Hoy hace buen tiempo',
      'Probé la panadería de la esquina, nada mal',
      '¿Estás leyendo algo ahora?',
      'Mi minimoa tiene hambre otra vez 😅',
      '¿Qué tal por ahí?',
      'Paseíto esta mañana, sienta bien',
      '¿Viste el reto del día?',
      '¡Jaja sí!',
      'Me voy, hablamos luego',
      'Buena noche 🙂',
    ],
    replies: ['¡Sí!', 'Genial', 'Igual 🙂', 'Ah, guay', 'Buena idea', '¡Gracias!', '¡Hasta luego!'],
    groupNames: ['Los caminantes', 'Club de lectura', 'Café de la mañana', 'Madrugadores', 'Pasitos', 'Equipo barrio'],
    groupLines: ['¡Bienvenidos!', 'Aguantamos esta semana', 'Hecho por hoy ✅', '¿Quién se anima mañana?'],
  },
  pt: {
    openers: ['Olá! O teu minimoa parece ótimo', 'Olá 🙂', 'Olá! Moras no bairro há muito tempo?', 'Olá, prazer!', 'Olá! Gosto da roupa do teu minimoa'],
    lines: [
      'Bom dia para ti!',
      'O que fizeste no fim de semana?',
      'Está bom tempo hoje',
      'Experimentei a padaria aqui perto, nada mal',
      'Estás a ler alguma coisa?',
      'O meu minimoa tem fome outra vez 😅',
      'Tudo bem por aí?',
      'Passeio de manhã, soube bem',
      'Viste o desafio do dia?',
      'Haha sim!',
      'Tenho de ir, falamos depois',
      'Boa noite 🙂',
    ],
    replies: ['Sim!', 'Muito bom', 'Igual 🙂', 'Ah, fixe', 'Boa ideia', 'Obrigado!', 'Até já!'],
    groupNames: ['Os caminhantes', 'Clube de leitura', 'Café da manhã', 'Madrugadores', 'Passinhos', 'Equipa do bairro'],
    groupLines: ['Bem-vindos!', 'A aguentar esta semana', 'Feito por hoje ✅', 'Quem alinha amanhã?'],
  },
  nl: {
    openers: ['Hoi! Je minimoa ziet er goed uit', 'Hoi 🙂', 'Hallo! Woon je al lang in de buurt?', 'Hoi, leuk je te leren kennen!', 'Hé! Leuke outfit van je minimoa'],
    lines: [
      'Fijne dag!',
      'Wat heb je dit weekend gedaan?',
      'Mooi weer vandaag',
      'De bakker om de hoek geprobeerd, best goed',
      'Lees je iets op dit moment?',
      'Mijn minimoa heeft alweer honger 😅',
      'Hoe gaat het daar?',
      'Korte wandeling vanochtend, deed goed',
      'Heb je de uitdaging van vandaag gezien?',
      'Haha ja!',
      'Ik moet gaan, tot later',
      'Fijne avond 🙂',
    ],
    replies: ['Ja!', 'Leuk', 'Ik ook 🙂', 'O, tof', 'Goed idee', 'Dank je!', 'Tot zo!'],
    groupNames: ['De wandelaars', 'Leesclub', 'Ochtendkoffie', 'Vroege vogels', 'Kleine stapjes', 'Team buurt'],
    groupLines: ['Welkom allemaal!', 'Deze week volhouden', 'Gedaan voor vandaag ✅', 'Wie doet morgen mee?'],
  },
});
