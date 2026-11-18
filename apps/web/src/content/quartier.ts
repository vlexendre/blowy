/**
 * « Ouvre ton quartier », l'expérience de la page /quartier/ (organism QuartierExpedition, script quartier-xp.ts) :
 * intro de Nino, carte, étapes, pass de fondateur·rice, classement. Les champs du formulaire, le consentement et les
 * erreurs restent dans `quizCopy[l].quartier` (partagés avec la fin du quiz).
 * `*mot*` : le mot mis en valeur (couleur d'accent) ; `{x}` : rempli par le script.
 */
import { siteMessages } from '../i18n/site';

export interface QuartierXpCopy {
  intro: {
    /** Région de l'intro (lecteurs d'écran). */
    label: string;
    /** Nino parle, une ligne à la fois. */
    lines: readonly string[];
    /** Lien partagé vers un quartier (`{zone}`) : intro courte. */
    deep: readonly string[];
    skip: string;
  };
  title: string;
  /** `{n}` : le seuil d'ouverture. */
  lead: string;
  cta: string;
  signupsOne: string;
  signupsMany: string;
  zonesOne: string;
  zonesMany: string;
  mapLabel: string;
  mapLegend: string;
  zoneTitle: string;
  petTitle: string;
  petText: string;
  passTitle: string;
  passText: string;
  submit: string;
  /** Sous le gros chiffre : « sur {threshold} ». */
  gaugeOf: string;
  /** « pour ouvrir {zone} ». */
  gaugeFor: string;
  gaugeYou: string;
  gaugeFirst: string;
  gaugeOpenLink: string;
  passKicker: string;
  passStatus: string;
  /** « {count} / {threshold} pour ouvrir ». */
  passGoal: string;
  /** « {name} t'attend sur place ». */
  passScout: string;
  sharePass: string;
  /** Annoncé aux lecteurs d'écran après l'envoi. */
  celebrate: string;
  boardTitle: string;
  boardText: string;
  /** Bouton d'une ligne du classement. */
  boardPick: string;
  boardOpen: string;
}

const fr: QuartierXpCopy = {
  intro: {
    label: 'Nino se présente',
    lines: ['Salut, moi c’est Nino.', 'Je cherche des gens qui voient la vie comme toi…', '…juste à côté de chez toi.', 'Aide-moi à ouvrir ton *quartier*.'],
    deep: ['Salut, moi c’est Nino.', 'Aide-moi à ouvrir *{zone}*.'],
    skip: 'Passer',
  },
  title: 'Quel quartier ouvre en premier ?',
  lead: 'Minimoa ouvre quartier par quartier. À {n} inscriptions, le tien ouvre et ton minimoa commence les présentations.',
  cta: 'Choisir mon quartier',
  signupsOne: '1 inscription confirmée',
  signupsMany: '{n} inscriptions confirmées',
  zonesOne: '1 quartier en route',
  zonesMany: '{n} quartiers en route',
  mapLabel:
    'Carte de la France, de la Belgique, des Pays-Bas, du Luxembourg, de la Suisse, de l’Espagne et du Portugal. Chaque point lumineux est un quartier où des gens sont déjà inscrits ; le classement plus bas donne les mêmes chiffres.',
  mapLegend: 'Chaque lumière est un quartier qui a déjà du monde. Plus elle est grosse, plus il est près d’ouvrir.',
  zoneTitle: 'Ton quartier',
  petTitle: 'Ton minimoa',
  petText: 'Il part devant et t’attend sur la carte.',
  passTitle: 'Ton pass de fondateur·rice',
  passText: 'Laisse ton e-mail : on te prévient le jour où ton quartier ouvre.',
  submit: 'Prendre mon pass',
  gaugeOf: 'sur {threshold}',
  gaugeFor: 'pour ouvrir {zone}',
  gaugeYou: 'La prochaine place est pour toi.',
  gaugeFirst: 'Personne encore : allume la première lumière.',
  gaugeOpenLink: 'Voir le quartier',
  passKicker: 'Pass de fondateur·rice',
  passStatus: 'En attente de confirmation',
  passGoal: '{count} / {threshold} pour ouvrir',
  passScout: '{name} t’attend sur place',
  sharePass: 'Partager mon pass',
  celebrate: 'C’est parti ! Ton pass pour {zone} est prêt. Regarde tes e-mails pour le confirmer.',
  boardTitle: 'Les quartiers les plus proches d’ouvrir',
  boardText: 'De vrais compteurs, mis à jour chaque minute. Touche un quartier pour le choisir.',
  boardPick: 'Choisir {zone} : {count} sur {threshold}',
  boardOpen: 'Ouvert',
};

const en: QuartierXpCopy = {
  intro: {
    label: 'Nino introduces himself',
    lines: ['Hi, I’m Nino.', 'I’m looking for people who see life the way you do…', '…right around the corner from you.', 'Help me open your *neighborhood*.'],
    deep: ['Hi, I’m Nino.', 'Help me open *{zone}*.'],
    skip: 'Skip',
  },
  title: 'Which neighborhood opens first?',
  lead: 'Minimoa opens neighborhood by neighborhood. At {n} sign-ups, yours opens and your minimoa starts making introductions.',
  cta: 'Pick my neighborhood',
  signupsOne: '1 confirmed sign-up',
  signupsMany: '{n} confirmed sign-ups',
  zonesOne: '1 neighborhood on its way',
  zonesMany: '{n} neighborhoods on their way',
  mapLabel:
    'Map of France, Belgium, the Netherlands, Luxembourg, Switzerland, Spain and Portugal. Each glowing dot is a neighborhood where people have already signed up; the ranking below gives the same numbers.',
  mapLegend: 'Each light is a neighborhood that already has people. The bigger it is, the closer it is to opening.',
  zoneTitle: 'Your neighborhood',
  petTitle: 'Your minimoa',
  petText: 'It goes ahead and waits for you on the map.',
  passTitle: 'Your founder pass',
  passText: 'Leave your email: we’ll tell you the day your neighborhood opens.',
  submit: 'Get my pass',
  gaugeOf: 'out of {threshold}',
  gaugeFor: 'to open {zone}',
  gaugeYou: 'The next spot is yours.',
  gaugeFirst: 'Nobody yet: light the first light.',
  gaugeOpenLink: 'See the neighborhood',
  passKicker: 'Founder pass',
  passStatus: 'Waiting for confirmation',
  passGoal: '{count} / {threshold} to open',
  passScout: '{name} is waiting for you there',
  sharePass: 'Share my pass',
  celebrate: 'Here we go! Your pass for {zone} is ready. Check your email to confirm it.',
  boardTitle: 'Neighborhoods closest to opening',
  boardText: 'Real counters, updated every minute. Tap a neighborhood to pick it.',
  boardPick: 'Pick {zone}: {count} out of {threshold}',
  boardOpen: 'Open',
};

const es: QuartierXpCopy = {
  intro: {
    label: 'Nino se presenta',
    lines: ['Hola, soy Nino.', 'Busco gente que vea la vida como tú…', '…justo al lado de tu casa.', 'Ayúdame a abrir tu *barrio*.'],
    deep: ['Hola, soy Nino.', 'Ayúdame a abrir *{zone}*.'],
    skip: 'Saltar',
  },
  title: '¿Qué barrio abre primero?',
  lead: 'Minimoa abre barrio a barrio. Con {n} inscripciones, el tuyo abre y tu minimoa empieza a presentarte gente.',
  cta: 'Elegir mi barrio',
  signupsOne: '1 inscripción confirmada',
  signupsMany: '{n} inscripciones confirmadas',
  zonesOne: '1 barrio en camino',
  zonesMany: '{n} barrios en camino',
  mapLabel:
    'Mapa de Francia, Bélgica, los Países Bajos, Luxemburgo, Suiza, España y Portugal. Cada punto luminoso es un barrio donde ya hay gente inscrita; la clasificación de abajo da las mismas cifras.',
  mapLegend: 'Cada luz es un barrio que ya tiene gente. Cuanto más grande, más cerca está de abrir.',
  zoneTitle: 'Tu barrio',
  petTitle: 'Tu minimoa',
  petText: 'Se adelanta y te espera en el mapa.',
  passTitle: 'Tu pase de fundador·a',
  passText: 'Deja tu e-mail: te avisamos el día que abra tu barrio.',
  submit: 'Conseguir mi pase',
  gaugeOf: 'de {threshold}',
  gaugeFor: 'para abrir {zone}',
  gaugeYou: 'El próximo sitio es para ti.',
  gaugeFirst: 'Todavía nadie: enciende la primera luz.',
  gaugeOpenLink: 'Ver el barrio',
  passKicker: 'Pase de fundador·a',
  passStatus: 'Pendiente de confirmación',
  passGoal: '{count} / {threshold} para abrir',
  passScout: '{name} te espera allí',
  sharePass: 'Compartir mi pase',
  celebrate: '¡En marcha! Tu pase para {zone} está listo. Mira tu correo para confirmarlo.',
  boardTitle: 'Los barrios más cerca de abrir',
  boardText: 'Contadores reales, actualizados cada minuto. Toca un barrio para elegirlo.',
  boardPick: 'Elegir {zone}: {count} de {threshold}',
  boardOpen: 'Abierto',
};

const pt: QuartierXpCopy = {
  intro: {
    label: 'Nino se apresenta',
    lines: ['Oi, eu sou o Nino.', 'Estou procurando gente que vê a vida como você…', '…bem pertinho da sua casa.', 'Me ajuda a abrir o seu *bairro*.'],
    deep: ['Oi, eu sou o Nino.', 'Me ajuda a abrir *{zone}*.'],
    skip: 'Pular',
  },
  title: 'Qual bairro abre primeiro?',
  lead: 'O Minimoa abre bairro por bairro. Com {n} cadastros, o seu abre e o seu minimoa começa a te apresentar gente.',
  cta: 'Escolher meu bairro',
  signupsOne: '1 cadastro confirmado',
  signupsMany: '{n} cadastros confirmados',
  zonesOne: '1 bairro a caminho',
  zonesMany: '{n} bairros a caminho',
  mapLabel:
    'Mapa da França, Bélgica, Países Baixos, Luxemburgo, Suíça, Espanha e Portugal. Cada ponto luminoso é um bairro onde já tem gente cadastrada; a classificação abaixo traz os mesmos números.',
  mapLegend: 'Cada luz é um bairro que já tem gente. Quanto maior, mais perto de abrir.',
  zoneTitle: 'Seu bairro',
  petTitle: 'Seu minimoa',
  petText: 'Ele vai na frente e te espera no mapa.',
  passTitle: 'Seu passe de fundador·a',
  passText: 'Deixe seu e-mail: a gente te avisa no dia em que o seu bairro abrir.',
  submit: 'Pegar meu passe',
  gaugeOf: 'de {threshold}',
  gaugeFor: 'para abrir {zone}',
  gaugeYou: 'A próxima vaga é sua.',
  gaugeFirst: 'Ninguém ainda: acenda a primeira luz.',
  gaugeOpenLink: 'Ver o bairro',
  passKicker: 'Passe de fundador·a',
  passStatus: 'Aguardando confirmação',
  passGoal: '{count} / {threshold} para abrir',
  passScout: '{name} te espera lá',
  sharePass: 'Compartilhar meu passe',
  celebrate: 'Vamos lá! Seu passe para {zone} está pronto. Confira seu e-mail para confirmar.',
  boardTitle: 'Os bairros mais perto de abrir',
  boardText: 'Contadores reais, atualizados a cada minuto. Toque em um bairro para escolher.',
  boardPick: 'Escolher {zone}: {count} de {threshold}',
  boardOpen: 'Aberto',
};

const nl: QuartierXpCopy = {
  intro: {
    label: 'Nino stelt zich voor',
    lines: ['Hoi, ik ben Nino.', 'Ik zoek mensen die het leven zien zoals jij…', '…vlak bij jou om de hoek.', 'Help me jouw *buurt* te openen.'],
    deep: ['Hoi, ik ben Nino.', 'Help me *{zone}* te openen.'],
    skip: 'Overslaan',
  },
  title: 'Welke buurt gaat als eerste open?',
  lead: 'Minimoa gaat buurt voor buurt open. Bij {n} aanmeldingen gaat jouw buurt open en begint je minimoa mensen voor te stellen.',
  cta: 'Kies mijn buurt',
  signupsOne: '1 bevestigde aanmelding',
  signupsMany: '{n} bevestigde aanmeldingen',
  zonesOne: '1 buurt onderweg',
  zonesMany: '{n} buurten onderweg',
  mapLabel:
    'Kaart van Frankrijk, België, Nederland, Luxemburg, Zwitserland, Spanje en Portugal. Elk lichtpunt is een buurt waar al mensen aangemeld zijn; de ranglijst hieronder geeft dezelfde cijfers.',
  mapLegend: 'Elk lichtje is een buurt waar al mensen zijn. Hoe groter, hoe dichter bij de opening.',
  zoneTitle: 'Jouw buurt',
  petTitle: 'Jouw minimoa',
  petText: 'Hij gaat vooruit en wacht op je op de kaart.',
  passTitle: 'Jouw oprichterspas',
  passText: 'Laat je e-mail achter: we laten het je weten op de dag dat je buurt opengaat.',
  submit: 'Pak mijn pas',
  gaugeOf: 'van {threshold}',
  gaugeFor: 'om {zone} te openen',
  gaugeYou: 'De volgende plek is voor jou.',
  gaugeFirst: 'Nog niemand: steek het eerste lichtje aan.',
  gaugeOpenLink: 'Bekijk de buurt',
  passKicker: 'Oprichterspas',
  passStatus: 'Wacht op bevestiging',
  passGoal: '{count} / {threshold} tot de opening',
  passScout: '{name} wacht daar op je',
  sharePass: 'Deel mijn pas',
  celebrate: 'Daar gaan we! Je pas voor {zone} is klaar. Kijk in je mail om hem te bevestigen.',
  boardTitle: 'Buurten die het dichtst bij de opening zijn',
  boardText: 'Echte tellers, elke minuut bijgewerkt. Tik op een buurt om hem te kiezen.',
  boardPick: 'Kies {zone}: {count} van {threshold}',
  boardOpen: 'Open',
};

export const quartierXpCopy = siteMessages<QuartierXpCopy>({ fr, en, es, pt, nl });

/** `*mot*` → `<em>mot</em>` (le reste échappé) : le mot mis en valeur d'une ligne de l'intro. */
export function highlight(line: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc(line).replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
