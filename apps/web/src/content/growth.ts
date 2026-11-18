/**
 * Pages de partage de la croissance (docs/VIRALITE.md) : lien d'invitation d'un groupe (/g/<code>) et code d'un
 * créateur (/c/<code>). Cinq langues ; le français est rendu au build, le navigateur choisit la langue du téléphone.
 * `{x}` : rempli par le script de la page.
 */
import { type OpenLocale, pickOpenLocale } from './open';

export { pickOpenLocale as pickGrowthLocale };

interface GroupCopy {
  meta: string;
  description: string;
  label: string;
  habit: string;
  free: string;
  members: { one: string; other: string };
  daysKept: { zero: string; one: string; other: string };
  missing: { one: string; other: string };
  full: string;
  open: string;
  codeLabel: string;
  codeHelp: string;
  notFoundTitle: readonly string[];
  notFoundText: string;
  downloadTitle: string;
  downloadText: string;
  home: string;
}

interface CreatorCopy {
  meta: string;
  description: string;
  label: string;
  title: readonly string[];
  intro: string;
  open: string;
  codeLabel: string;
  codeHelp: string;
  unknownTitle: readonly string[];
  unknownText: string;
}

export interface GrowthCopy {
  group: GroupCopy;
  creator: CreatorCopy;
  /** Code d'un créateur venu par `?ref=` (n'importe quelle page). */
  ref: { label: string; help: string };
  copy: string;
  copied: string;
}

export const growthCopy: Record<OpenLocale, GrowthCopy> = {
  fr: {
    group: {
      meta: 'Rejoins un groupe — Minimoa',
      description: 'On t’invite dans un groupe Minimoa : une habitude à tenir à plusieurs, chacun avec son minimoa.',
      label: 'Groupe',
      habit: 'Habitude : {habit}',
      free: 'Un groupe entre potes',
      members: { one: '{n} membre', other: '{n} membres' },
      daysKept: { zero: 'La série n’a pas encore commencé', one: '{n} jour tenu ensemble', other: '{n} jours tenus ensemble' },
      missing: { one: 'Il manque {n} personne pour lancer la série.', other: 'Il manque {n} personnes pour lancer la série.' },
      full: 'Ce groupe est complet (8 membres).',
      open: 'Rejoindre dans l’app',
      codeLabel: 'Code du groupe',
      codeHelp: 'Pas encore l’app ? Installe Minimoa, puis tape ce code à l’inscription (« Un code ? »).',
      notFoundTitle: ['LIEN', 'INTROUVABLE.'],
      notFoundText: 'Ce lien de groupe ne marche plus. Demande-en un nouveau à quelqu’un du groupe.',
      downloadTitle: 'Toi aussi, élève ton minimoa.',
      downloadText: 'Gratuit, zéro swipe, 18 ans et plus.',
      home: 'Découvrir Minimoa',
    },
    creator: {
      meta: 'Code créateur — Minimoa',
      description: 'Élève ton minimoa : il te présente du monde près de chez toi.',
      label: 'Code créateur',
      title: ['DE LA PART', 'DE {name}.'],
      intro: 'Élève ton minimoa : il te présente du monde près de chez toi. Gratuit, zéro swipe, 18 ans et plus.',
      open: 'J’ai déjà Minimoa',
      codeLabel: 'Ton code',
      codeHelp: 'À l’inscription, tape ce code dans « Un code ? ». C’est facultatif.',
      unknownTitle: ['BIENVENUE', 'SUR MINIMOA.'],
      unknownText: 'Ce code n’existe pas, ou plus. Rien de grave : l’app est la même pour tout le monde.',
    },
    ref: { label: 'Ton code', help: 'À l’inscription, tape ce code dans « Un code ? ». C’est facultatif.' },
    copy: 'Copier',
    copied: 'Copié ✓',
  },
  en: {
    group: {
      meta: 'Join a group — Minimoa',
      description: 'You’re invited to a Minimoa group: a habit to keep up together, each with their own minimoa.',
      label: 'Group',
      habit: 'Habit: {habit}',
      free: 'A group of friends',
      members: { one: '{n} member', other: '{n} members' },
      daysKept: { zero: 'The streak hasn’t started yet', one: '{n} day kept together', other: '{n} days kept together' },
      missing: { one: '{n} more person needed to start the streak.', other: '{n} more people needed to start the streak.' },
      full: 'This group is full (8 members).',
      open: 'Join in the app',
      codeLabel: 'Group code',
      codeHelp: 'No app yet? Install Minimoa, then type this code when you sign up (“Got a code?”).',
      notFoundTitle: ['LINK', 'NOT FOUND.'],
      notFoundText: 'This group link no longer works. Ask someone in the group for a new one.',
      downloadTitle: 'Raise your own minimoa.',
      downloadText: 'Free, zero swiping, 18+.',
      home: 'Discover Minimoa',
    },
    creator: {
      meta: 'Creator code — Minimoa',
      description: 'Raise your minimoa: it introduces you to people nearby.',
      label: 'Creator code',
      title: ['COURTESY', 'OF {name}.'],
      intro: 'Raise your minimoa: it introduces you to people nearby. Free, zero swiping, 18+.',
      open: 'I already have Minimoa',
      codeLabel: 'Your code',
      codeHelp: 'When you sign up, type this code in “Got a code?”. It’s optional.',
      unknownTitle: ['WELCOME', 'TO MINIMOA.'],
      unknownText: 'This code doesn’t exist, or no longer works. No big deal: the app is the same for everyone.',
    },
    ref: { label: 'Your code', help: 'When you sign up, type this code in “Got a code?”. It’s optional.' },
    copy: 'Copy',
    copied: 'Copied ✓',
  },
  es: {
    group: {
      meta: 'Únete a un grupo — Minimoa',
      description: 'Te invitan a un grupo de Minimoa: un hábito para mantener entre varios, cada cual con su minimoa.',
      label: 'Grupo',
      habit: 'Hábito: {habit}',
      free: 'Un grupo de amigos',
      members: { one: '{n} miembro', other: '{n} miembros' },
      daysKept: { zero: 'La racha aún no ha empezado', one: '{n} día cumplido juntos', other: '{n} días cumplidos juntos' },
      missing: { one: 'Falta {n} persona para empezar la racha.', other: 'Faltan {n} personas para empezar la racha.' },
      full: 'Este grupo está completo (8 miembros).',
      open: 'Unirme en la app',
      codeLabel: 'Código del grupo',
      codeHelp: '¿Aún no tienes la app? Instala Minimoa y escribe este código al registrarte («¿Tienes un código?»).',
      notFoundTitle: ['ENLACE', 'NO ENCONTRADO.'],
      notFoundText: 'Este enlace de grupo ya no funciona. Pide uno nuevo a alguien del grupo.',
      downloadTitle: 'Cuida tu propio minimoa.',
      downloadText: 'Gratis, sin swipes, para mayores de 18.',
      home: 'Descubrir Minimoa',
    },
    creator: {
      meta: 'Código de creador — Minimoa',
      description: 'Cuida tu minimoa: te presenta a gente cerca de ti.',
      label: 'Código de creador',
      title: ['DE PARTE', 'DE {name}.'],
      intro: 'Cuida tu minimoa: te presenta a gente cerca de ti. Gratis, sin swipes, para mayores de 18.',
      open: 'Ya tengo Minimoa',
      codeLabel: 'Tu código',
      codeHelp: 'Al registrarte, escribe este código en «¿Tienes un código?». Es opcional.',
      unknownTitle: ['TE DAMOS LA', 'BIENVENIDA.'],
      unknownText: 'Este código no existe o ya no funciona. No pasa nada: la app es la misma para todo el mundo.',
    },
    ref: { label: 'Tu código', help: 'Al registrarte, escribe este código en «¿Tienes un código?». Es opcional.' },
    copy: 'Copiar',
    copied: 'Copiado ✓',
  },
  pt: {
    group: {
      meta: 'Entre em um grupo — Minimoa',
      description: 'Você foi convidado para um grupo do Minimoa: um hábito para manter juntos, cada um com seu minimoa.',
      label: 'Grupo',
      habit: 'Hábito: {habit}',
      free: 'Um grupo de amigos',
      members: { one: '{n} membro', other: '{n} membros' },
      daysKept: { zero: 'A sequência ainda não começou', one: '{n} dia mantido juntos', other: '{n} dias mantidos juntos' },
      missing: { one: 'Falta {n} pessoa para começar a sequência.', other: 'Faltam {n} pessoas para começar a sequência.' },
      full: 'Este grupo está completo (8 membros).',
      open: 'Entrar pelo app',
      codeLabel: 'Código do grupo',
      codeHelp: 'Ainda sem o app? Instale o Minimoa e digite este código no cadastro (“Tem um código?”).',
      notFoundTitle: ['LINK', 'NÃO ENCONTRADO.'],
      notFoundText: 'Este link de grupo não funciona mais. Peça um novo a alguém do grupo.',
      downloadTitle: 'Cuide do seu minimoa também.',
      downloadText: 'Grátis, zero swipe, para maiores de 18.',
      home: 'Conhecer o Minimoa',
    },
    creator: {
      meta: 'Código de criador — Minimoa',
      description: 'Cuide do seu minimoa: ele te apresenta gente perto de você.',
      label: 'Código de criador',
      title: ['DA PARTE', 'DE {name}.'],
      intro: 'Cuide do seu minimoa: ele te apresenta gente perto de você. Grátis, zero swipe, para maiores de 18.',
      open: 'Já tenho o Minimoa',
      codeLabel: 'Seu código',
      codeHelp: 'No cadastro, digite este código em “Tem um código?”. É opcional.',
      unknownTitle: ['BOAS-VINDAS', 'AO MINIMOA.'],
      unknownText: 'Este código não existe ou não funciona mais. Sem problema: o app é o mesmo para todo mundo.',
    },
    ref: { label: 'Seu código', help: 'No cadastro, digite este código em “Tem um código?”. É opcional.' },
    copy: 'Copiar',
    copied: 'Copiado ✓',
  },
  nl: {
    group: {
      meta: 'Doe mee met een groep — Minimoa',
      description: 'Je bent uitgenodigd voor een Minimoa-groep: samen een gewoonte volhouden, ieder met een eigen minimoa.',
      label: 'Groep',
      habit: 'Gewoonte: {habit}',
      free: 'Een groep vrienden',
      members: { one: '{n} lid', other: '{n} leden' },
      daysKept: { zero: 'De reeks is nog niet begonnen', one: '{n} dag samen volgehouden', other: '{n} dagen samen volgehouden' },
      missing: { one: 'Nog {n} persoon nodig om de reeks te starten.', other: 'Nog {n} personen nodig om de reeks te starten.' },
      full: 'Deze groep is vol (8 leden).',
      open: 'Meedoen in de app',
      codeLabel: 'Groepscode',
      codeHelp: 'Nog geen app? Installeer Minimoa en typ deze code bij het aanmelden („Heb je een code?”).',
      notFoundTitle: ['LINK', 'NIET GEVONDEN.'],
      notFoundText: 'Deze groepslink werkt niet meer. Vraag iemand uit de groep om een nieuwe.',
      downloadTitle: 'Zorg ook voor je eigen minimoa.',
      downloadText: 'Gratis, nul swipes, vanaf 18 jaar.',
      home: 'Ontdek Minimoa',
    },
    creator: {
      meta: 'Makerscode — Minimoa',
      description: 'Zorg voor je minimoa: hij stelt je voor aan mensen in de buurt.',
      label: 'Makerscode',
      title: ['NAMENS', '{name}.'],
      intro: 'Zorg voor je minimoa: hij stelt je voor aan mensen in de buurt. Gratis, nul swipes, vanaf 18 jaar.',
      open: 'Ik heb Minimoa al',
      codeLabel: 'Je code',
      codeHelp: 'Typ deze code bij het aanmelden in „Heb je een code?”. Het is niet verplicht.',
      unknownTitle: ['WELKOM', 'BIJ MINIMOA.'],
      unknownText: 'Deze code bestaat niet (meer). Geen probleem: de app is voor iedereen hetzelfde.',
    },
    ref: { label: 'Je code', help: 'Typ deze code bij het aanmelden in „Heb je een code?”. Het is niet verplicht.' },
    copy: 'Kopiëren',
    copied: 'Gekopieerd ✓',
  },
};
