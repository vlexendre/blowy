/**
 * Textes des groupes et des habitudes partagées (spéc V7 §25 et §26), par langue : erreurs de l'API, événements du
 * chat de groupe (les minimoas n'y parlent que pour des événements, aucune IA ne lit les messages), phrases dites
 * avant de rejoindre (transparence, confidentialité) et suggestion « la tenir ensemble ».
 * Un événement est rangé en base sous forme de code et de variables, puis écrit dans la langue de celui qui lit.
 */
import type { Locale } from '@blowy/domain';
import { defineMessages } from '../i18n/core';

/** Événements d'un groupe (chat) : code rangé en base, phrase écrite à la lecture. */
export const GROUP_EVENT_KINDS = [
  'created',
  'joined',
  'started',
  'left',
  'renamed',
  'joker',
  'milestone',
  'life_lost',
  'life_gained',
  'asleep',
  'woke',
  'closed',
] as const;
export type GroupEventKind = (typeof GROUP_EVENT_KINDS)[number];

/** Variables d'un événement : prénom (`name`), nom du minimoa (`minimoa`), nom du groupe (`group`), nombre (`count`). */
export interface GroupEventVars {
  name: string;
  minimoa: string;
  group: string;
  count: number;
}

type EventLine = (v: GroupEventVars) => string;

const fr = {
  /** Dit avant de rejoindre un groupe d'habitude. */
  transparency:
    'Dans ce groupe, chacun voit l’état du jour des autres : tenu, joker ou en pause. Jamais les photos, jamais l’heure.',
  /** Même engagement que dans les liens, sans lecture par une IA. */
  privacy:
    'Aucun humain ne lit vos messages, et aucune IA non plus : dans un groupe, les minimoas ne parlent que des événements.',
  /** Dit au moment de choisir ses habitudes (inscription, écran Habitudes). */
  habitsVisibility:
    'Le nom de tes habitudes, leur série et ta régularité sont montrés aux personnes que ton minimoa te présente et à tes liens. Jamais les photos de preuve, jamais l’heure.',
  /** Suggestion « la tenir ensemble » (écran Habitudes, tuile de l'accueil). */
  together: (count: number, habit: string) =>
    `${count} personnes près de toi tiennent la même habitude : ${habit}. La tenir ensemble ?`,
  togetherWaiting: 'C’est noté. Le groupe démarre dès que deux autres disent oui.',
  events: {
    created: (v) => `${v.name} crée le groupe « ${v.group} ».`,
    joined: (v) => `${v.minimoa} arrive avec ${v.name}.`,
    started: (v) => `Vous êtes ${v.count}. Le groupe démarre.`,
    left: (v) => `${v.name} a quitté le groupe.`,
    renamed: (v) => `${v.name} renomme le groupe : « ${v.group} ».`,
    joker: (v) => `${v.name} pose un joker.`,
    milestone: (v) => `${v.count} jours d’affilée, tous ensemble.`,
    life_lost: () => 'Un jour de pause. On repart ensemble.',
    life_gained: () => 'Une belle semaine : une vie de plus.',
    asleep: () => 'Le groupe s’endort. N’importe qui peut le réveiller.',
    woke: (v) => `${v.name} réveille le groupe. Cinq vies, on repart.`,
    closed: () => 'Ce groupe a été fermé par la modération.',
  } as Record<GroupEventKind, EventLine>,
  errors: {
    notFound: 'Ce groupe est introuvable.',
    notMember: 'Tu ne fais pas partie de ce groupe.',
    closed: 'Ce groupe a été fermé.',
    limit: (limit: number): string =>
      `Tu es déjà dans ${limit} groupes. Avec Minimoa+, tu peux en rejoindre jusqu’à 10.`,
    limitPlus: 'Tu es déjà dans 10 groupes : c’est le maximum.',
    invitees: 'Choisis de 2 à 7 personnes parmi tes liens.',
    full: 'Ce groupe est complet : 8 personnes au plus.',
    notALink: 'On ne peut inviter que ses liens vivants.',
    habitRequired: 'Choisis l’habitude que le groupe va tenir.',
    habitUnknown: 'Cette habitude n’existe pas.',
    habitSlot: (limit: number): string =>
      `Pour rejoindre ce groupe, il faut suivre cette habitude, et tu en suis déjà ${limit}.`,
    nameRefused: 'Ce nom de groupe ne passe pas. Choisis-en un autre.',
    notHabitGroup: 'Ce groupe n’a ni série ni vies.',
    asleep: 'Le groupe dort. Réveille-le d’abord.',
    notAsleep: 'Le groupe est déjà réveillé.',
    jokerWindow: 'On peut poser un joker pour aujourd’hui, ou pour hier jusqu’à midi.',
    jokerNone: 'Plus de joker cette semaine.',
    jokerUseless: 'Ce jour-là est déjà à jour.',
    invitationGone: 'Cette invitation n’est plus valable.',
    linkGone: 'Ce lien de groupe ne marche plus. Demande-en un nouveau à quelqu’un du groupe.',
    linkResetCreator: 'Seule la personne qui a créé le groupe peut changer son lien.',
    alreadyMember: 'Tu fais déjà partie de ce groupe.',
    sharingOff: 'Active « Montrer mes habitudes » pour la tenir ensemble.',
    togetherUnavailable: 'Pas assez de monde près de toi pour l’instant.',
    reportTarget: 'Ce message ou cette personne n’est pas dans le groupe.',
  },
};

export type GroupesText = typeof fr;

export const groupesText = defineMessages<GroupesText>({
  fr,
  en: {
    transparency:
      'In this group, everyone sees how the others did today: kept, joker or resting. Never photos, never times.',
    privacy: 'No human reads your messages, and no AI either: in a group, minimoas only speak about events.',
    habitsVisibility:
      'The names of your habits, their streaks and your consistency are shown to the people your minimoa introduces you to and to your links. Never proof photos, never times.',
    together: (count: number, habit: string) =>
      `${count} people near you also keep this habit: ${habit}. Keep it together?`,
    togetherWaiting: 'Noted. The group starts as soon as two others say yes.',
    events: {
      created: (v) => `${v.name} created the group “${v.group}”.`,
      joined: (v) => `${v.minimoa} arrives with ${v.name}.`,
      started: (v) => `There are ${v.count} of you. The group is starting.`,
      left: (v) => `${v.name} left the group.`,
      renamed: (v) => `${v.name} renamed the group: “${v.group}”.`,
      joker: (v) => `${v.name} used a joker.`,
      milestone: (v) => `${v.count} days in a row, all together.`,
      life_lost: () => 'A day off. We pick it up together.',
      life_gained: () => 'A lovely week: one more life.',
      asleep: () => 'The group fell asleep. Anyone can wake it up.',
      woke: (v) => `${v.name} woke the group up. Five lives, off again.`,
      closed: () => 'This group was closed by moderation.',
    },
    errors: {
      notFound: 'This group can’t be found.',
      notMember: 'You’re not part of this group.',
      closed: 'This group was closed.',
      limit: (limit: number): string =>
        `You’re already in ${limit} groups. With Minimoa+, you can join up to 10.`,
      limitPlus: 'You’re already in 10 groups: that’s the maximum.',
      invitees: 'Pick 2 to 7 people from your links.',
      full: 'This group is full: 8 people at most.',
      notALink: 'You can only invite your active links.',
      habitRequired: 'Pick the habit the group will keep.',
      habitUnknown: 'This habit doesn’t exist.',
      habitSlot: (limit: number): string =>
        `To join this group you need to track this habit, and you’re already tracking ${limit}.`,
      nameRefused: 'This group name doesn’t work. Pick another one.',
      notHabitGroup: 'This group has no streak and no lives.',
      asleep: 'The group is asleep. Wake it up first.',
      notAsleep: 'The group is already awake.',
      jokerWindow: 'You can use a joker for today, or for yesterday until noon.',
      jokerNone: 'No jokers left this week.',
      jokerUseless: 'That day is already covered.',
      invitationGone: 'This invitation is no longer valid.',
      linkGone: 'This group link no longer works. Ask someone in the group for a new one.',
      linkResetCreator: 'Only the person who created the group can change its link.',
      alreadyMember: 'You’re already part of this group.',
      sharingOff: 'Turn on “Show my habits” to keep it together.',
      togetherUnavailable: 'Not enough people near you for now.',
      reportTarget: 'This message or person isn’t in the group.',
    },
  },
  es: {
    transparency:
      'En este grupo, cada uno ve cómo les fue hoy a los demás: cumplido, comodín o en pausa. Nunca fotos, nunca horas.',
    privacy:
      'Ningún humano lee vuestros mensajes, y ninguna IA tampoco: en un grupo, los minimoas solo hablan de los acontecimientos.',
    habitsVisibility:
      'El nombre de tus hábitos, su racha y tu constancia se muestran a las personas que tu minimoa te presenta y a tus vínculos. Nunca las fotos de prueba, nunca la hora.',
    together: (count: number, habit: string) =>
      `${count} personas cerca de ti también tienen este hábito: ${habit}. ¿Lo mantenéis juntos?`,
    togetherWaiting: 'Apuntado. El grupo empieza en cuanto otras dos personas digan que sí.',
    events: {
      created: (v) => `${v.name} crea el grupo «${v.group}».`,
      joined: (v) => `${v.minimoa} llega con ${v.name}.`,
      started: (v) => `Sois ${v.count}. El grupo empieza.`,
      left: (v) => `${v.name} ha salido del grupo.`,
      renamed: (v) => `${v.name} cambia el nombre del grupo: «${v.group}».`,
      joker: (v) => `${v.name} usa un comodín.`,
      milestone: (v) => `${v.count} días seguidos, todos juntos.`,
      life_lost: () => 'Un día de pausa. Seguimos juntos.',
      life_gained: () => 'Una semana genial: una vida más.',
      asleep: () => 'El grupo se ha dormido. Cualquiera puede despertarlo.',
      woke: (v) => `${v.name} despierta al grupo. Cinco vidas, otra vez en marcha.`,
      closed: () => 'La moderación ha cerrado este grupo.',
    },
    errors: {
      notFound: 'No se encuentra este grupo.',
      notMember: 'No formas parte de este grupo.',
      closed: 'Este grupo está cerrado.',
      limit: (limit: number): string =>
        `Ya estás en ${limit} grupos. Con Minimoa+, puedes unirte hasta a 10.`,
      limitPlus: 'Ya estás en 10 grupos: es el máximo.',
      invitees: 'Elige de 2 a 7 personas entre tus vínculos.',
      full: 'Este grupo está completo: 8 personas como máximo.',
      notALink: 'Solo puedes invitar a tus vínculos activos.',
      habitRequired: 'Elige el hábito que mantendrá el grupo.',
      habitUnknown: 'Este hábito no existe.',
      habitSlot: (limit: number): string =>
        `Para unirte a este grupo tienes que seguir este hábito, y ya sigues ${limit}.`,
      nameRefused: 'Este nombre de grupo no vale. Elige otro.',
      notHabitGroup: 'Este grupo no tiene racha ni vidas.',
      asleep: 'El grupo está dormido. Despiértalo primero.',
      notAsleep: 'El grupo ya está despierto.',
      jokerWindow: 'Puedes usar un comodín para hoy, o para ayer hasta mediodía.',
      jokerNone: 'No te quedan comodines esta semana.',
      jokerUseless: 'Ese día ya está cubierto.',
      invitationGone: 'Esta invitación ya no es válida.',
      linkGone: 'Este enlace de grupo ya no funciona. Pide uno nuevo a alguien del grupo.',
      linkResetCreator: 'Solo quien creó el grupo puede cambiar su enlace.',
      alreadyMember: 'Ya formas parte de este grupo.',
      sharingOff: 'Activa «Mostrar mis hábitos» para mantenerlo juntos.',
      togetherUnavailable: 'Por ahora no hay suficiente gente cerca de ti.',
      reportTarget: 'Este mensaje o esta persona no está en el grupo.',
    },
  },
  pt: {
    transparency:
      'Neste grupo, cada pessoa vê como foi o dia das outras: mantido, coringa ou em pausa. Nunca fotos, nunca horários.',
    privacy:
      'Nenhum humano lê as mensagens de vocês, e nenhuma IA também: em um grupo, os minimoas só falam dos acontecimentos.',
    habitsVisibility:
      'O nome dos seus hábitos, a sequência deles e a sua constância aparecem para as pessoas que o seu minimoa te apresenta e para os seus vínculos. Nunca as fotos de prova, nunca o horário.',
    together: (count: number, habit: string) =>
      `${count} pessoas perto de você também têm este hábito: ${habit}. Manter juntos?`,
    togetherWaiting: 'Anotado. O grupo começa assim que outras duas pessoas disserem sim.',
    events: {
      created: (v) => `${v.name} criou o grupo «${v.group}».`,
      joined: (v) => `${v.minimoa} chega com ${v.name}.`,
      started: (v) => `Vocês são ${v.count}. O grupo começou.`,
      left: (v) => `${v.name} saiu do grupo.`,
      renamed: (v) => `${v.name} mudou o nome do grupo: «${v.group}».`,
      joker: (v) => `${v.name} usou um coringa.`,
      milestone: (v) => `${v.count} dias seguidos, todos juntos.`,
      life_lost: () => 'Um dia de pausa. Seguimos juntos.',
      life_gained: () => 'Uma semana ótima: uma vida a mais.',
      asleep: () => 'O grupo adormeceu. Qualquer pessoa pode acordá-lo.',
      woke: (v) => `${v.name} acordou o grupo. Cinco vidas, recomeçando.`,
      closed: () => 'Este grupo foi fechado pela moderação.',
    },
    errors: {
      notFound: 'Este grupo não foi encontrado.',
      notMember: 'Você não faz parte deste grupo.',
      closed: 'Este grupo foi fechado.',
      limit: (limit: number): string =>
        `Você já está em ${limit} grupos. Com o Minimoa+, pode entrar em até 10.`,
      limitPlus: 'Você já está em 10 grupos: é o máximo.',
      invitees: 'Escolha de 2 a 7 pessoas entre os seus vínculos.',
      full: 'Este grupo está completo: 8 pessoas no máximo.',
      notALink: 'Só dá para convidar os seus vínculos ativos.',
      habitRequired: 'Escolha o hábito que o grupo vai manter.',
      habitUnknown: 'Este hábito não existe.',
      habitSlot: (limit: number): string =>
        `Para entrar neste grupo, é preciso acompanhar este hábito, e você já acompanha ${limit}.`,
      nameRefused: 'Este nome de grupo não dá. Escolha outro.',
      notHabitGroup: 'Este grupo não tem sequência nem vidas.',
      asleep: 'O grupo está dormindo. Acorde-o primeiro.',
      notAsleep: 'O grupo já está acordado.',
      jokerWindow: 'Dá para usar um coringa para hoje, ou para ontem até o meio-dia.',
      jokerNone: 'Sem coringas nesta semana.',
      jokerUseless: 'Esse dia já está coberto.',
      invitationGone: 'Este convite não é mais válido.',
      linkGone: 'Este link de grupo não funciona mais. Peça um novo a alguém do grupo.',
      linkResetCreator: 'Só quem criou o grupo pode mudar o link.',
      alreadyMember: 'Você já faz parte deste grupo.',
      sharingOff: 'Ative «Mostrar meus hábitos» para manter juntos.',
      togetherUnavailable: 'Ainda não há gente suficiente perto de você.',
      reportTarget: 'Esta mensagem ou esta pessoa não está no grupo.',
    },
  },
  nl: {
    transparency:
      'In deze groep ziet iedereen hoe de dag van de anderen ging: volgehouden, joker of pauze. Nooit foto’s, nooit tijden.',
    privacy:
      'Geen mens leest jullie berichten, en ook geen AI: in een groep praten de minimoas alleen over gebeurtenissen.',
    habitsVisibility:
      'De naam van je gewoontes, hun reeks en hoe trouw je ze volhoudt, zijn zichtbaar voor de mensen die je minimoa je voorstelt en voor je banden. Nooit bewijsfoto’s, nooit tijden.',
    together: (count: number, habit: string) =>
      `${count} mensen bij jou in de buurt hebben deze gewoonte ook: ${habit}. Samen volhouden?`,
    togetherWaiting: 'Genoteerd. De groep start zodra twee anderen ja zeggen.',
    events: {
      created: (v) => `${v.name} maakt de groep “${v.group}”.`,
      joined: (v) => `${v.minimoa} komt erbij met ${v.name}.`,
      started: (v) => `Jullie zijn met ${v.count}. De groep gaat van start.`,
      left: (v) => `${v.name} heeft de groep verlaten.`,
      renamed: (v) => `${v.name} geeft de groep een nieuwe naam: “${v.group}”.`,
      joker: (v) => `${v.name} zet een joker in.`,
      milestone: (v) => `${v.count} dagen op rij, allemaal samen.`,
      life_lost: () => 'Een dagje pauze. We gaan samen verder.',
      life_gained: () => 'Een mooie week: een leven erbij.',
      asleep: () => 'De groep is in slaap gevallen. Iedereen kan hem wakker maken.',
      woke: (v) => `${v.name} maakt de groep wakker. Vijf levens, we gaan weer.`,
      closed: () => 'Deze groep is gesloten door de moderatie.',
    },
    errors: {
      notFound: 'Deze groep is niet te vinden.',
      notMember: 'Je hoort niet bij deze groep.',
      closed: 'Deze groep is gesloten.',
      limit: (limit: number): string => `Je zit al in ${limit} groepen. Met Minimoa+ kun je er tot 10.`,
      limitPlus: 'Je zit al in 10 groepen: dat is het maximum.',
      invitees: 'Kies 2 tot 7 mensen uit je banden.',
      full: 'Deze groep is vol: maximaal 8 mensen.',
      notALink: 'Je kunt alleen je actieve banden uitnodigen.',
      habitRequired: 'Kies de gewoonte die de groep gaat volhouden.',
      habitUnknown: 'Deze gewoonte bestaat niet.',
      habitSlot: (limit: number): string =>
        `Om bij deze groep te komen moet je deze gewoonte volgen, en je volgt er al ${limit}.`,
      nameRefused: 'Deze groepsnaam kan niet. Kies een andere.',
      notHabitGroup: 'Deze groep heeft geen reeks en geen levens.',
      asleep: 'De groep slaapt. Maak hem eerst wakker.',
      notAsleep: 'De groep is al wakker.',
      jokerWindow: 'Je kunt een joker inzetten voor vandaag, of voor gisteren tot 12 uur.',
      jokerNone: 'Geen jokers meer deze week.',
      jokerUseless: 'Die dag is al gedekt.',
      invitationGone: 'Deze uitnodiging is niet meer geldig.',
      linkGone: 'Deze groepslink werkt niet meer. Vraag iemand uit de groep om een nieuwe.',
      linkResetCreator: 'Alleen wie de groep heeft gemaakt, kan de link veranderen.',
      alreadyMember: 'Je hoort al bij deze groep.',
      sharingOff: 'Zet “Mijn gewoontes tonen” aan om samen vol te houden.',
      togetherUnavailable: 'Nog niet genoeg mensen bij jou in de buurt.',
      reportTarget: 'Dit bericht of deze persoon zit niet in de groep.',
    },
  },
});

/** Phrase d'un événement de groupe dans la langue de la personne qui lit. */
export function groupEventLine(locale: Locale, kind: GroupEventKind, vars: Partial<GroupEventVars>): string {
  const line = groupesText.in(locale).events[kind];
  return line({
    name: vars.name ?? '',
    minimoa: vars.minimoa ?? '',
    group: vars.group ?? '',
    count: vars.count ?? 0,
  });
}
