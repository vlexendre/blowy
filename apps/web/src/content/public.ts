/** Textes des pages publiques reliées à l'API : « 3 mots » (/m/) et invitation (/i/). `{name}` = prénom. */

export const common = {
  loading: 'On cherche le minimoa…',
  home: 'Retour à l’accueil',
  retry: 'Réessayer',
  downloadTitle: 'Toi aussi, élève ton minimoa.',
  downloadText: 'Gratuit, zéro swipe, 18 ans et plus.',
  networkTitle: ['PAS DE', 'RÉSEAU.'],
  networkText: 'Impossible de joindre Blowy. Vérifie ta connexion et réessaie.',
  busyText: 'Trop de demandes d’un coup. Attends une minute et réessaie.',
  genericText: 'Quelque chose s’est mal passé de notre côté. Réessaie dans un instant.',
} as const;

export const wordsPage = {
  meta: {
    title: '3 mots — Blowy',
    description: 'Choisis 3 mots pour décrire ton pote. C’est anonyme, et ça fait évoluer son minimoa.',
  },
  anonymous: '100 % anonyme',
  /** {nom} : prénom tel qu'écrit (les titres sont rendus en capitales). */
  title: ['DÉCRIS {nom}', 'EN 3 MOTS'],
  intro: '{nom} ne saura jamais que c’était toi. Sauf si tu craques.',
  groupLabel: 'Mots pour {name}',
  evolve: 'Tes mots feront évoluer {petNom}',
  counter: '{n} / 3',
  gaugesLabel: 'Effet de tes mots sur le caractère de {pet}',
  submit: 'Envoyer mes 3 mots',
  submitEmpty: 'Choisis 3 mots',
  submitMore: 'Encore {n} mot',
  submitMorePlural: 'Encore {n} mots',
  sending: 'Envoi…',
  needThree: 'Choisis exactement 3 mots.',
  maxReached: '3 mots maximum. Retire un mot pour en choisir un autre.',
  sentReply: 'Reçu. J’ai déjà un peu changé.',
  sentList: 'Tu as dit :',
  youTitle: ['ET TOI ?', 'PAS ENCORE DE MINIMOA.'],
  youText: 'Crée le tien en 1 minute. Il te présentera du monde.',
  youCta: 'Crée ton minimoa',
  notFoundTitle: ['LIEN', 'INTROUVABLE.'],
  notFoundText: 'Ce lien « 3 mots » n’existe pas, ou plus. Demande à ton pote de te renvoyer le sien.',
  alreadyTitle: ['DÉJÀ', 'VOTÉ.'],
  alreadyText: 'Tu as déjà choisi tes 3 mots pour {name}. Un vote par personne, c’est la règle.',
  alreadyTextNoName: 'Tu as déjà choisi tes 3 mots pour cette personne. Un vote par personne, c’est la règle.',
  petAlt: '{pet}, le minimoa de {name}',
} as const;

export const invitePage = {
  meta: {
    title: 'Invitation — Blowy',
    description: 'On t’invite sur Blowy. Élève ton minimoa, il te présente du monde.',
  },
  label: 'Invitation',
  title: ['{name}', 'T’INVITE', 'SUR BLOWY.'],
  intro: '{pet}, son minimoa, t’attend déjà. Installe Blowy, crée ton minimoa, et vos deux minimoas se retrouvent.',
  open: 'Ouvrir dans l’app',
  codeLabel: 'Ton code d’invitation',
  codeHelp: 'Pas encore installé ? Télécharge Blowy, puis tape ce code à l’inscription.',
  copy: 'Copier',
  copied: 'Copié ✓',
  notFoundTitle: ['INVITATION', 'INTROUVABLE.'],
  notFoundText: 'Cette invitation n’existe pas, ou plus. Demande un nouveau lien à la personne qui t’invite.',
  petAlt: '{pet}, le minimoa de {name}',
} as const;

export const notFoundPage = {
  meta: { title: 'Page introuvable — Blowy', description: 'Cette page n’existe pas.' },
  title: ['PAGE', 'INTROUVABLE.'],
  text: 'Nino a cherché partout. Cette page n’existe pas, ou elle a déménagé.',
  petAlt: 'Nino, tout triste',
} as const;

/** Remplace {clé} par sa valeur. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
