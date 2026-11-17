/**
 * Textes des notifications push (chantier « plateforme », spéc §12), par langue et par type.
 * Variables reçues du `Notifier` : name (prénom de l'autre), minimoa (nom d'un minimoa ; `petName` accepté),
 * count (`streak` accepté), more (nombre d'autres liens concernés), days, item (identifiant d'objet, traduit ici), endsOn (date ISO), price (centimes),
 * currency (défaut EUR). Les dates et les prix sont mis en forme dans la langue de la personne.
 * Pas d'emoji, pas de fausse urgence, pas de culpabilisation.
 */
import type { Locale, NotificationKindKey } from '@blowy/domain';
import { defineMessages, formatDate, formatPrice } from '../i18n/core';
import { labels } from '../labels';
import { habitById } from './rituels';

export interface NotificationText {
  title: string;
  body: string;
}

/** Variables déjà mises en forme pour la langue. */
export interface NotificationVars {
  name: string;
  /** Nom du minimoa, ou « Ton minimoa » s'il n'est pas connu. */
  minimoa: string;
  count: string;
  /** Autres liens concernés par le même rappel (« à toi d'écrire »), en chiffres ; « 0 » ou vide : aucun. */
  more: string;
  days: string;
  item: string;
  endsOn: string;
  price: string;
  /** Nom d'un groupe (tel que ses membres l'ont choisi). */
  group: string;
  /** Libellé d'une habitude du catalogue (identifiant `habit`, traduit ici). */
  habit: string;
}

type Template = (v: NotificationVars) => string;

const fr = {
  /** Quand le nom du minimoa n'est pas passé. */
  yourMinimoa: 'Ton minimoa',
  texts: {
    daily_challenge: { title: () => 'Ton défi du jour', body: (v) => `${v.minimoa} a préparé quelque chose pour toi.` },
    needs_out: { title: (v) => `${v.minimoa} a envie de sortir`, body: () => 'Un tour dehors, ou voir quelqu’un ? Il te suit.' },
    new_encounter: { title: () => 'Nouveau lien', body: (v) => `${v.name} et toi, vous pouvez vous écrire.` },
    waved: { title: (v) => `${v.name} te salue`, body: () => 'Son minimoa est passé dire bonjour au tien.' },
    message: { title: (v) => v.name, body: (v) => `${v.name} t’a écrit.` },
    your_turn: {
      title: (v) => `Série avec ${v.name}`,
      body: (v) =>
        Number(v.more) > 0
          ? `À toi d’écrire avant minuit. Et dans ${v.more} ${Number(v.more) > 1 ? 'autres liens' : 'autre lien'}.`
          : Number(v.count) > 0
            ? `${v.count} ${Number(v.count) > 1 ? 'jours' : 'jour'} d’affilée. À toi d’écrire avant minuit.`
            : `${v.name} t’a écrit aujourd’hui. À toi avant minuit.`,
    },
    link_in_danger: { title: (v) => `Lien avec ${v.name}`, body: () => 'Il lui reste peu de vies. Un mot suffit à le garder.' },
    streak_in_danger: { title: (v) => `Ta série de ${v.count} ${Number(v.count) > 1 ? 'jours' : 'jour'}`, body: () => 'Le défi du jour t’attend encore ce soir.' },
    habit_proof: { title: (v) => `${v.minimoa} voudrait voir`, body: () => 'C’est l’heure de ton habitude. Une photo ?' },
    weekly_review: { title: () => 'Ton bilan de la semaine', body: (v) => `${v.minimoa} a fait le point. Viens voir.` },
    item_unlocked: { title: () => 'Nouvel objet', body: (v) => `${v.minimoa} a gagné : ${v.item}.` },
    words_received: { title: () => '3 mots pour toi', body: () => 'Un pote vient de choisir ses 3 mots sur toi.' },
    trial_reminder: {
      title: () => 'Ton essai Minimoa+ se termine bientôt',
      body: (v) =>
        `L’essai gratuit se termine le ${v.endsOn}. Ensuite, premier paiement de ${v.price}. Pour l’éviter, annule dans les réglages de ton compte Apple, rubrique Abonnements.`,
    },
    group_invite: {
      title: (v) => `${v.name} t’invite dans « ${v.group} »`,
      body: (v) => (v.habit ? `Un groupe pour tenir une habitude ensemble : ${v.habit}. À toi de dire oui.` : 'Un groupe entre potes. À toi de dire oui.'),
    },
    together_proposal: {
      title: (v) => (v.group ? `« ${v.group} » démarre` : `${v.habit}, à plusieurs ?`),
      body: (v) => (v.group ? `Vous êtes ${v.count} à tenir la même habitude : ${v.habit}. Dis bonjour.` : 'Des personnes près de toi tiennent aussi cette habitude. La tenir ensemble ?'),
    },
    group_message: { title: (v) => v.group, body: (v) => `${v.name} a écrit dans le groupe.` },
    group_life_lost: {
      title: (v) => `« ${v.group} » perd une vie`,
      body: (v) => `Il lui reste ${v.count} ${Number(v.count) > 1 ? 'vies' : 'vie'}. Aujourd’hui, on s’y remet ensemble.`,
    },
    group_asleep: { title: (v) => `« ${v.group} » s’est endormi`, body: () => 'Plus de vies pour l’instant. N’importe qui peut le réveiller.' },
  } as Record<NotificationKindKey, { title: Template; body: Template }>,
  /** Libellés des réglages par type (écran « Moi › Notifications »). */
  kindLabels: {
    daily_challenge: 'Défi du jour',
    needs_out: 'Ton minimoa a besoin de sortir',
    new_encounter: 'Nouveaux liens',
    waved: 'On te salue',
    message: 'Messages',
    your_turn: 'À toi d’écrire (série d’un lien)',
    link_in_danger: 'Lien en danger',
    streak_in_danger: 'Série en danger',
    habit_proof: 'Preuve d’habitude',
    weekly_review: 'Bilan de la semaine',
    item_unlocked: 'Objets débloqués',
    words_received: '3 mots reçus',
    trial_reminder: 'Fin de l’essai Minimoa+',
    group_invite: 'Invitations à un groupe',
    together_proposal: 'La tenir ensemble',
    group_message: 'Messages de groupe',
    group_life_lost: 'Vie perdue d’un groupe',
    group_asleep: 'Groupe endormi',
  } as Record<NotificationKindKey, string>,
};

export const notificationTexts = defineMessages({
  fr,
  en: {
    yourMinimoa: 'Your minimoa',
    texts: {
      daily_challenge: { title: () => 'Your daily challenge', body: (v) => `${v.minimoa} has something for you.` },
      needs_out: { title: (v) => `${v.minimoa} wants to go out`, body: () => 'A walk, or seeing someone? It’s coming with you.' },
      new_encounter: { title: () => 'New link', body: (v) => `You and ${v.name} can now write to each other.` },
      waved: { title: (v) => `${v.name} waved at you`, body: () => 'Their minimoa stopped by to say hi to yours.' },
      message: { title: (v) => v.name, body: (v) => `${v.name} wrote to you.` },
      your_turn: {
        title: (v) => `Streak with ${v.name}`,
        body: (v) =>
          Number(v.more) > 0
            ? `Your turn to write before midnight. And in ${v.more} other ${Number(v.more) > 1 ? 'links' : 'link'}.`
            : Number(v.count) > 0
              ? `${v.count} ${Number(v.count) > 1 ? 'days' : 'day'} in a row. Your turn to write before midnight.`
              : `${v.name} wrote to you today. Your turn before midnight.`,
      },
      link_in_danger: { title: (v) => `Your link with ${v.name}`, body: () => 'It’s running out of lives. One word is enough to keep it.' },
      streak_in_danger: { title: (v) => `Your ${v.count}-day streak`, body: () => 'Your daily challenge is still waiting for you tonight.' },
      habit_proof: { title: (v) => `${v.minimoa} would like to see`, body: () => 'Time for your habit. A photo?' },
      weekly_review: { title: () => 'Your weekly review', body: (v) => `${v.minimoa} took stock. Come and see.` },
      item_unlocked: { title: () => 'New item', body: (v) => `${v.minimoa} won: ${v.item}.` },
      words_received: { title: () => '3 words for you', body: () => 'A friend just picked their 3 words about you.' },
      trial_reminder: {
        title: () => 'Your Minimoa+ trial ends soon',
        body: (v) =>
          `Your free trial ends on ${v.endsOn}. After that, the first payment of ${v.price} is charged. To avoid it, cancel in your Apple account settings, under Subscriptions.`,
      },
      group_invite: {
        title: (v) => `${v.name} invites you to “${v.group}”`,
        body: (v) => (v.habit ? `A group to keep a habit together: ${v.habit}. Your call.` : 'A group with friends. Your call.'),
      },
      together_proposal: {
        title: (v) => (v.group ? `“${v.group}” is starting` : `${v.habit}, together?`),
        body: (v) => (v.group ? `${v.count} of you keep the same habit: ${v.habit}. Say hi.` : 'People near you keep this habit too. Keep it together?'),
      },
      group_message: { title: (v) => v.group, body: (v) => `${v.name} wrote in the group.` },
      group_life_lost: {
        title: (v) => `“${v.group}” lost a life`,
        body: (v) => `${v.count} ${Number(v.count) === 1 ? 'life' : 'lives'} left. Today you pick it up together.`,
      },
      group_asleep: { title: (v) => `“${v.group}” fell asleep`, body: () => 'No lives left for now. Anyone can wake it up.' },
    },
    kindLabels: {
      daily_challenge: 'Daily challenge',
      needs_out: 'Your minimoa needs to go out',
      new_encounter: 'New links',
      waved: 'Waves at you',
      message: 'Messages',
      your_turn: 'Your turn to write (link streak)',
      link_in_danger: 'Link in danger',
      streak_in_danger: 'Streak in danger',
      habit_proof: 'Habit proof',
      weekly_review: 'Weekly review',
      item_unlocked: 'Unlocked items',
      words_received: '3 words received',
      trial_reminder: 'End of Minimoa+ trial',
      group_invite: 'Group invitations',
      together_proposal: 'Keep it together',
      group_message: 'Group messages',
      group_life_lost: 'Group lost a life',
      group_asleep: 'Group asleep',
    },
  },
  es: {
    yourMinimoa: 'Tu minimoa',
    texts: {
      daily_challenge: { title: () => 'Tu reto del día', body: (v) => `${v.minimoa} te ha preparado algo.` },
      needs_out: { title: (v) => `${v.minimoa} quiere salir`, body: () => '¿Una vuelta, o ver a alguien? Te acompaña.' },
      new_encounter: { title: () => 'Nuevo vínculo', body: (v) => `${v.name} y tú ya pueden escribirse.` },
      waved: { title: (v) => `${v.name} te ha saludado`, body: () => 'Su minimoa pasó a saludar al tuyo.' },
      message: { title: (v) => v.name, body: (v) => `${v.name} te ha escrito.` },
      your_turn: {
        title: (v) => `Racha con ${v.name}`,
        body: (v) =>
          Number(v.more) > 0
            ? `Te toca escribir antes de medianoche. Y en ${v.more} ${Number(v.more) === 1 ? 'vínculo más' : 'vínculos más'}.`
            : Number(v.count) > 0
              ? `${v.count} ${Number(v.count) === 1 ? 'día seguido' : 'días seguidos'}. Te toca escribir antes de medianoche.`
              : `${v.name} te escribió hoy. Te toca antes de medianoche.`,
      },
      link_in_danger: { title: (v) => `Vínculo con ${v.name}`, body: () => 'Le quedan pocas vidas. Basta un mensaje para conservarlo.' },
      streak_in_danger: { title: (v) => `Tu racha de ${v.count} ${Number(v.count) !== 1 ? 'días' : 'día'}`, body: () => 'El reto del día aún te espera esta noche.' },
      habit_proof: { title: (v) => `${v.minimoa} quiere ver algo`, body: () => 'Es la hora de tu hábito. ¿Una foto?' },
      weekly_review: { title: () => 'Tu resumen de la semana', body: (v) => `${v.minimoa} ha hecho balance. Ven a verlo.` },
      item_unlocked: { title: () => 'Nuevo objeto', body: (v) => `${v.minimoa} ha ganado: ${v.item}.` },
      words_received: { title: () => '3 palabras para ti', body: () => 'Alguien de tu gente acaba de elegir sus 3 palabras sobre ti.' },
      trial_reminder: {
        title: () => 'Tu prueba de Minimoa+ termina pronto',
        body: (v) =>
          `Tu prueba gratuita termina el ${v.endsOn}. Después, primer pago de ${v.price}. Para evitarlo, cancela en los ajustes de tu cuenta de Apple, en Suscripciones.`,
      },
      group_invite: {
        title: (v) => `${v.name} te invita a «${v.group}»`,
        body: (v) => (v.habit ? `Un grupo para mantener un hábito juntos: ${v.habit}. Tú decides.` : 'Un grupo entre amigos. Tú decides.'),
      },
      together_proposal: {
        title: (v) => (v.group ? `«${v.group}» empieza` : `${v.habit}, ¿en grupo?`),
        body: (v) => (v.group ? `Sois ${v.count} con el mismo hábito: ${v.habit}. Saluda.` : 'Hay gente cerca de ti con este hábito. ¿Lo mantenéis juntos?'),
      },
      group_message: { title: (v) => v.group, body: (v) => `${v.name} ha escrito en el grupo.` },
      group_life_lost: {
        title: (v) => `«${v.group}» pierde una vida`,
        body: (v) => `Le ${Number(v.count) === 1 ? 'queda' : 'quedan'} ${v.count} ${Number(v.count) === 1 ? 'vida' : 'vidas'}. Hoy volvéis a empezar juntos.`,
      },
      group_asleep: { title: (v) => `«${v.group}» se ha dormido`, body: () => 'Sin vidas por ahora. Cualquiera puede despertarlo.' },
    },
    kindLabels: {
      daily_challenge: 'Reto del día',
      needs_out: 'Tu minimoa necesita salir',
      new_encounter: 'Nuevos vínculos',
      waved: 'Te saludan',
      message: 'Mensajes',
      your_turn: 'Te toca escribir (racha de un vínculo)',
      link_in_danger: 'Vínculo en peligro',
      streak_in_danger: 'Racha en peligro',
      habit_proof: 'Prueba de hábito',
      weekly_review: 'Resumen de la semana',
      item_unlocked: 'Objetos desbloqueados',
      words_received: '3 palabras recibidas',
      trial_reminder: 'Fin de la prueba de Minimoa+',
      group_invite: 'Invitaciones a un grupo',
      together_proposal: 'Mantenerlo juntos',
      group_message: 'Mensajes de grupo',
      group_life_lost: 'Vida perdida de un grupo',
      group_asleep: 'Grupo dormido',
    },
  },
  pt: {
    yourMinimoa: 'Seu minimoa',
    texts: {
      daily_challenge: { title: () => 'Seu desafio do dia', body: (v) => `${v.minimoa} preparou algo para você.` },
      needs_out: { title: (v) => `${v.minimoa} quer sair`, body: () => 'Uma volta, ou ver alguém? Ele topa.' },
      new_encounter: { title: () => 'Novo vínculo', body: (v) => `Você e ${v.name} já podem trocar mensagens.` },
      waved: { title: (v) => `${v.name} acenou para você`, body: (v) => `O minimoa de ${v.name} passou para dar oi para o seu.` },
      message: { title: (v) => v.name, body: (v) => `${v.name} mandou uma mensagem.` },
      your_turn: {
        title: (v) => `Sequência com ${v.name}`,
        body: (v) =>
          Number(v.more) > 0
            ? `Sua vez de escrever antes da meia-noite. E em mais ${v.more} ${Number(v.more) === 1 ? 'vínculo' : 'vínculos'}.`
            : Number(v.count) > 0
              ? `${v.count} ${Number(v.count) === 1 ? 'dia seguido' : 'dias seguidos'}. Sua vez de escrever antes da meia-noite.`
              : `${v.name} escreveu hoje. Sua vez, antes da meia-noite.`,
      },
      link_in_danger: { title: (v) => `Vínculo com ${v.name}`, body: () => 'Restam poucas vidas. Uma mensagem basta para mantê-lo.' },
      streak_in_danger: { title: (v) => `Sua sequência de ${v.count} ${Number(v.count) > 1 ? 'dias' : 'dia'}`, body: () => 'O desafio do dia ainda te espera hoje à noite.' },
      habit_proof: { title: (v) => `${v.minimoa} quer ver`, body: () => 'Hora do seu hábito. Uma foto?' },
      weekly_review: { title: () => 'Seu resumo da semana', body: (v) => `${v.minimoa} fez um balanço. Venha ver.` },
      item_unlocked: { title: () => 'Novo item', body: (v) => `${v.minimoa} ganhou: ${v.item}.` },
      words_received: { title: () => '3 palavras para você', body: () => 'Alguém da sua galera acabou de escolher 3 palavras sobre você.' },
      trial_reminder: {
        title: () => 'Seu teste do Minimoa+ está acabando',
        body: (v) =>
          `O teste gratuito termina em ${v.endsOn}. Depois, primeira cobrança de ${v.price}. Para evitar, cancele nos ajustes da sua conta Apple, em Assinaturas.`,
      },
      group_invite: {
        title: (v) => `${v.name} te convida para «${v.group}»`,
        body: (v) => (v.habit ? `Um grupo para manter um hábito juntos: ${v.habit}. Você decide.` : 'Um grupo entre amigos. Você decide.'),
      },
      together_proposal: {
        title: (v) => (v.group ? `«${v.group}» começou` : `${v.habit}, em grupo?`),
        body: (v) => (v.group ? `Vocês são ${v.count} com o mesmo hábito: ${v.habit}. Diga oi.` : 'Tem gente perto de você com este hábito. Manter juntos?'),
      },
      group_message: { title: (v) => v.group, body: (v) => `${v.name} escreveu no grupo.` },
      group_life_lost: {
        title: (v) => `«${v.group}» perdeu uma vida`,
        body: (v) => `${Number(v.count) === 1 ? 'Resta' : 'Restam'} ${v.count} ${Number(v.count) === 1 ? 'vida' : 'vidas'}. Hoje vocês recomeçam juntos.`,
      },
      group_asleep: { title: (v) => `«${v.group}» adormeceu`, body: () => 'Sem vidas por enquanto. Qualquer pessoa pode acordá-lo.' },
    },
    kindLabels: {
      daily_challenge: 'Desafio do dia',
      needs_out: 'Seu minimoa precisa sair',
      new_encounter: 'Novos vínculos',
      waved: 'Acenaram para você',
      message: 'Mensagens',
      your_turn: 'Sua vez de escrever (sequência de um vínculo)',
      link_in_danger: 'Vínculo em perigo',
      streak_in_danger: 'Sequência em perigo',
      habit_proof: 'Prova de hábito',
      weekly_review: 'Resumo da semana',
      item_unlocked: 'Itens desbloqueados',
      words_received: '3 palavras recebidas',
      trial_reminder: 'Fim do teste do Minimoa+',
      group_invite: 'Convites para grupos',
      together_proposal: 'Manter juntos',
      group_message: 'Mensagens de grupo',
      group_life_lost: 'Vida perdida de um grupo',
      group_asleep: 'Grupo adormecido',
    },
  },
  nl: {
    yourMinimoa: 'Je minimoa',
    texts: {
      daily_challenge: { title: () => 'Je uitdaging van de dag', body: (v) => `${v.minimoa} heeft iets voor je klaargezet.` },
      needs_out: { title: (v) => `${v.minimoa} wil naar buiten`, body: () => 'Een rondje, of iemand zien? Hij gaat mee.' },
      new_encounter: { title: () => 'Nieuwe band', body: (v) => `${v.name} en jij kunnen elkaar nu schrijven.` },
      waved: { title: (v) => `${v.name} zwaait naar je`, body: (v) => `De minimoa van ${v.name} kwam de jouwe even gedag zeggen.` },
      message: { title: (v) => v.name, body: (v) => `${v.name} stuurde je een bericht.` },
      your_turn: {
        title: (v) => `Reeks met ${v.name}`,
        body: (v) =>
          Number(v.more) > 0
            ? `Jouw beurt om te schrijven voor middernacht. En in ${v.more} ${Number(v.more) === 1 ? 'andere band' : 'andere banden'}.`
            : Number(v.count) > 0
              ? `${v.count} ${Number(v.count) === 1 ? 'dag' : 'dagen'} op rij. Jouw beurt om te schrijven voor middernacht.`
              : `${v.name} schreef je vandaag. Jouw beurt, voor middernacht.`,
      },
      link_in_danger: { title: (v) => `Band met ${v.name}`, body: () => 'Nog maar weinig levens over. Eén woordje houdt hem in leven.' },
      streak_in_danger: { title: (v) => `Je reeks van ${v.count} ${Number(v.count) !== 1 ? 'dagen' : 'dag'}`, body: () => 'De uitdaging van de dag wacht vanavond nog op je.' },
      habit_proof: { title: (v) => `${v.minimoa} wil iets zien`, body: () => 'Tijd voor je gewoonte. Een foto?' },
      weekly_review: { title: () => 'Je weekoverzicht', body: (v) => `${v.minimoa} heeft de balans opgemaakt. Kom kijken.` },
      item_unlocked: { title: () => 'Nieuw item', body: (v) => `${v.minimoa} heeft gewonnen: ${v.item}.` },
      words_received: { title: () => '3 woorden voor jou', body: () => 'Iemand uit je vriendenkring heeft net 3 woorden over jou gekozen.' },
      trial_reminder: {
        title: () => 'Je Minimoa+-proefperiode eindigt bijna',
        body: (v) =>
          `Je gratis proefperiode eindigt op ${v.endsOn}. Daarna volgt de eerste betaling van ${v.price}. Wil je dat niet, zeg dan op in de instellingen van je Apple-account, onder Abonnementen.`,
      },
      group_invite: {
        title: (v) => `${v.name} nodigt je uit voor “${v.group}”`,
        body: (v) => (v.habit ? `Een groep om samen een gewoonte vol te houden: ${v.habit}. Jij beslist.` : 'Een groep met vrienden. Jij beslist.'),
      },
      together_proposal: {
        title: (v) => (v.group ? `“${v.group}” gaat van start` : `${v.habit}, samen?`),
        body: (v) => (v.group ? `Jullie zijn met ${v.count} met dezelfde gewoonte: ${v.habit}. Zeg hallo.` : 'Mensen bij jou in de buurt hebben deze gewoonte ook. Samen volhouden?'),
      },
      group_message: { title: (v) => v.group, body: (v) => `${v.name} schreef in de groep.` },
      group_life_lost: {
        title: (v) => `“${v.group}” verliest een leven`,
        body: (v) => `Nog ${v.count} ${Number(v.count) === 1 ? 'leven' : 'levens'}. Vandaag pakken jullie het samen weer op.`,
      },
      group_asleep: { title: (v) => `“${v.group}” is in slaap gevallen`, body: () => 'Even geen levens meer. Iedereen kan de groep wakker maken.' },
    },
    kindLabels: {
      daily_challenge: 'Uitdaging van de dag',
      needs_out: 'Je minimoa moet naar buiten',
      new_encounter: 'Nieuwe banden',
      waved: 'Iemand zwaait naar je',
      message: 'Berichten',
      your_turn: 'Jouw beurt om te schrijven (reeks van een band)',
      link_in_danger: 'Band in gevaar',
      streak_in_danger: 'Reeks in gevaar',
      habit_proof: 'Bewijs van gewoonte',
      weekly_review: 'Weekoverzicht',
      item_unlocked: 'Ontgrendelde items',
      words_received: '3 woorden ontvangen',
      trial_reminder: 'Einde Minimoa+-proefperiode',
      group_invite: 'Uitnodigingen voor een groep',
      together_proposal: 'Samen volhouden',
      group_message: 'Groepsberichten',
      group_life_lost: 'Groep verloor een leven',
      group_asleep: 'Groep in slaap',
    },
  },
});

const isIsoDate = (s: string): boolean => /^\d{4}-\d{2}-\d{2}/.test(s) && !Number.isNaN(Date.parse(s));

/** Variables brutes du `Notifier` → variables mises en forme dans la langue. */
export function notificationVars(locale: Locale, vars: Readonly<Record<string, string>>): NotificationVars {
  const t = notificationTexts.in(locale);
  const item = vars.item ?? '';
  const amount = Number(vars.price);
  return {
    name: vars.name ?? '',
    minimoa: vars.minimoa || vars.petName || t.yourMinimoa,
    count: vars.count ?? vars.streak ?? '',
    more: vars.more ?? '',
    days: vars.days ?? '',
    item: labels.in(locale).itemLabel[item] ?? item,
    endsOn: vars.endsOn && isIsoDate(vars.endsOn) ? formatDate(locale, vars.endsOn, { day: 'numeric', month: 'long' }) : (vars.endsOn ?? ''),
    price: vars.price && Number.isFinite(amount) && /^\d+$/.test(vars.price) ? formatPrice(locale, amount, vars.currency ?? 'EUR') : (vars.price ?? ''),
    group: vars.group ?? '',
    habit: vars.habit ? (habitById(vars.habit, locale)?.label ?? vars.habit) : '',
  };
}

/** Titre et corps d'une notification dans la langue de la personne, variables remplies. */
export function notificationText(locale: Locale, kind: NotificationKindKey, vars: Readonly<Record<string, string>> = {}): NotificationText {
  const t = notificationTexts.in(locale).texts[kind];
  const v = notificationVars(locale, vars);
  return { title: t.title(v), body: t.body(v) };
}

export const notificationKindLabel = (locale: Locale, kind: NotificationKindKey): string => notificationTexts.in(locale).kindLabels[kind] ?? kind;
