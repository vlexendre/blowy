/** Textes des pages publiques reliées à l'API : « 3 mots » (/m/) et invitation (/i/). `{name}` = prénom. */

export const common = {
  loading: 'on cherche le pet…',
  home: "retour à l'accueil",
  retry: 'réessayer',
  downloadTitle: 'toi aussi, élève ton pet.',
  downloadText: 'gratuit, zéro swipe, 18 ans et plus.',
  networkTitle: ['PAS DE', 'RÉSEAU.'],
  networkText: 'impossible de joindre blowy. vérifie ta connexion et réessaie.',
  busyText: 'trop de demandes d’un coup. attends une minute et réessaie.',
  genericText: 'quelque chose s’est mal passé de notre côté. réessaie dans un instant.',
} as const;

export const wordsPage = {
  meta: {
    title: '3 mots — Blowy',
    description: 'choisis 3 mots pour décrire ton pote. c’est anonyme, et ça fait évoluer son pet.',
  },
  anonymous: '100 % anonyme',
  /** {nom} : prénom en minuscules (ton des maquettes). */
  title: ['DÉCRIS {nom}', 'EN 3 MOTS'],
  intro: '{nom} ne saura jamais que c’était toi. sauf si tu craques.',
  groupLabel: 'mots pour {name}',
  evolve: 'tes mots feront évoluer {petNom}',
  counter: '{n} / 3',
  gaugesLabel: 'effet de tes mots sur le caractère de {pet}',
  submit: 'envoyer mes 3 mots',
  submitEmpty: 'choisis 3 mots',
  submitMore: 'encore {n} mot',
  submitMorePlural: 'encore {n} mots',
  sending: 'envoi…',
  needThree: 'choisis exactement 3 mots.',
  maxReached: '3 mots maximum. retire un mot pour en choisir un autre.',
  sentReply: 'reçu. j’ai déjà changé un peu 🥹',
  sentList: 'tu as dit :',
  youTitle: ['ET TOI ?', 'T’AS PAS DE PET.'],
  youText: 'crée le tien en 1 minute. il te présentera du monde.',
  youCta: 'crée ton pet',
  notFoundTitle: ['LIEN', 'INTROUVABLE.'],
  notFoundText: 'ce lien « 3 mots » n’existe pas ou plus. demande à ton pote de te renvoyer le sien.',
  alreadyTitle: ['DÉJÀ', 'VOTÉ.'],
  alreadyText: 'tu as déjà choisi tes 3 mots pour {name}. un vote par personne, c’est la règle.',
  alreadyTextNoName: 'tu as déjà choisi tes 3 mots pour cette personne. un vote par personne, c’est la règle.',
  petAlt: '{pet}, le pet de {name}',
} as const;

export const invitePage = {
  meta: {
    title: 'Invitation — Blowy',
    description: 'on t’invite sur blowy. élève ton pet, il te présente du monde.',
  },
  label: 'invitation',
  title: ['{name}', "T'INVITE", 'SUR BLOWY.'],
  intro: '{pet}, son pet, t’attend déjà. installe blowy, crée ton pet, et vos deux pets se retrouvent.',
  open: "ouvrir dans l'app",
  codeLabel: 'ton code d’invitation',
  codeHelp: 'pas installé ? télécharge blowy, puis tape ce code à l’inscription.',
  copy: 'copier',
  copied: 'copié ✓',
  notFoundTitle: ['INVITATION', 'INTROUVABLE.'],
  notFoundText: 'cette invitation n’existe pas ou plus. demande un nouveau lien à la personne qui t’a invité.',
  petAlt: '{pet}, le pet de {name}',
} as const;

export const notFoundPage = {
  meta: { title: 'Page introuvable — Blowy', description: 'cette page n’existe pas.' },
  title: ['PAGE', 'INTROUVABLE.'],
  text: 'nino a cherché partout. cette page n’existe pas, ou elle a déménagé.',
  petAlt: 'nino, tout triste',
} as const;

/** Remplace {clé} par sa valeur. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}
