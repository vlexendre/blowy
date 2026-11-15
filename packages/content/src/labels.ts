/**
 * Libellés des notions du domaine (partagés par l'API, l'app et le site), par langue.
 * Les mots isolés (pôles, formes, objets, « 3 mots ») restent en minuscules : ils s'insèrent au milieu des phrases.
 * Les adjectifs des pôles et des formes s'accordent avec « le minimoa » (masculin).
 */
import type { GaugeKey, LevelKey, PetEventKind, PetForm } from '@blowy/domain';
import { TODO, defineMessages } from './i18n/core';

/** Marque, adresses : identiques dans toutes les langues. */
export const brand = {
  name: 'Blowy',
  /** Phrase d'accroche française du site (le site est en français) ; les e-mails prennent `labels.in(locale).tagline`. */
  tagline: 'Élève ton minimoa. Il te présente du monde.',
  site: 'https://blowy.app',
  supportEmail: 'hello@blowy.app',
} as const;

const fr = {
  tagline: 'Élève ton minimoa. Il te présente du monde.',
  /** Aperçu d'une ancienne photo (message `photo`) dans la liste des chats. */
  photoPreview: 'Photo',
  poleLabel: {
    casanier: 'casanier',
    sociable: 'sociable',
    pose: 'posé',
    joueur: 'joueur',
    piquant: 'piquant',
    tendre: 'tendre',
    discret: 'discret',
    bavard: 'bavard',
  } as Record<string, string>,
  gaugeLabel: {
    social: { low: 'casanier', high: 'sociable', hint: 'Elle bouge quand ton minimoa croise de nouvelles têtes.' },
    play: { low: 'posé', high: 'joueur', hint: 'Elle bouge avec les défis du jour.' },
    tender: { low: 'piquant', high: 'tendre', hint: 'Elle bouge avec les mots doux, les vannes et les jours où vous vous écrivez.' },
    talk: { low: 'discret', high: 'bavard', hint: 'Elle bouge avec les messages.' },
  } as Record<GaugeKey, { low: string; high: string; hint: string }>,
  formLabel: {
    equilibre: 'équilibré',
    casanier: 'casanier',
    sociable: 'sociable',
    joueur: 'joueur',
    piquant: 'piquant',
    tendre: 'tendre',
  } as Record<PetForm, string>,
  levelLabel: {
    rendezvous: { title: 'Le rendez-vous', text: 'Vos minimoas se sont trouvés. Vous pouvez vous écrire.' },
    jouent: { title: 'Ils jouent ensemble', text: 'Les minimoas lancent des défis dans le chat.' },
    emmenagent: { title: 'Ils emménagent', text: 'Vos minimoas partagent une maison, vos souvenirs s’y rangent.' },
    visage_flou: { title: 'Le visage flou', text: 'Vos photos de profil apparaissent, floues.' },
    revelation: { title: 'La révélation', text: 'Les visages deviennent nets.' },
    irl: { title: 'Le premier rendez-vous', text: 'Vos minimoas vous proposent de vous voir en vrai.' },
    oeuf: { title: 'L’œuf', text: 'Un œuf apparaît. Il éclora de ce que vous êtes devenus.' },
  } as Record<LevelKey, { title: string; text: string }>,
  eventLabel: {
    met_new_pet: 'A croisé un nouveau minimoa',
    waved: 'A salué un minimoa',
    challenge_done: 'A relevé le défi du jour',
    photo_sent: 'Photo partagée dans un lien',
    wrote_together: 'Vous vous êtes écrit tous les deux',
    sweet_word: 'Un mot doux',
    tease: 'Une vanne',
    message_sent: 'A papoté',
    three_words: 'Tes potes ont donné 3 mots',
    quiz: 'Son caractère de départ',
    care_feed: 'A bien mangé',
    care_play: 'A joué avec toi',
    care_nap: 'A fait une sieste',
    care_cuddle: 'A eu un câlin',
    went_out: 'Est sorti avec toi',
    habit_done: 'Une habitude tenue',
  } as Record<PetEventKind, string>,
  /** Les « 3 mots » : choisis par les potes pour décrire quelqu'un, donc sans genre supposé. */
  wordLabel: {
    drole: 'drôle',
    calme: 'calme',
    fetard: 'noctambule',
    casanier: 'cocooning',
    doux: 'tendre',
    cash: 'cash',
    bavard: 'volubile',
    mysterieux: 'énigmatique',
    curieux: 'touche-à-tout',
    reveur: 'lunaire',
    taquin: 'espiègle',
    attentionne: 'à l’écoute',
  } as Record<string, string>,
  reportReasonLabel: {
    harcelement: 'Harcèlement',
    contenu_inapproprie: 'Contenu inapproprié',
    faux_profil: 'Faux profil',
    mineur: 'Personne mineure',
    autre: 'Autre',
  } as Record<string, string>,
  needLabel: {
    hunger: { name: 'Faim', low: 'Il a faim' },
    energy: { name: 'Énergie', low: 'Il tombe de sommeil' },
    mood: { name: 'Humeur', low: 'Il s’ennuie' },
  } as Record<string, { name: string; low: string }>,
  careLabel: {
    feed: { action: 'Nourrir', done: 'Miam.', refused: 'Il n’a plus faim.' },
    play: { action: 'Jouer', done: 'Encore !', refused: 'Pas maintenant : trop fatigué, ou déjà comblé.' },
    nap: { action: 'Sieste', done: 'Zzz…', refused: 'Il n’a pas sommeil.' },
    cuddle: { action: 'Câlin', done: 'Ronron.', refused: 'Il est déjà comblé.' },
  } as Record<string, { action: string; done: string; refused: string }>,
  shapeLabel: {
    en_forme: { title: 'En pleine forme', text: 'Il sort, il croise du monde.' },
    bof: { title: 'Un peu à plat', text: 'Il croise moins de monde. Occupe-toi de lui.' },
    boude: { title: 'Il boude', text: 'Il ne sort plus et ne croise personne. Nourris-le, joue, laisse-le dormir.' },
  } as Record<string, { title: string; text: string }>,
  slotLabel: { head: 'Tête', face: 'Visage', body: 'Tenue', toy: 'Objets' } as Record<string, string>,
  statGoalLabel: {
    careDays: (n: number): string => `Occupe-toi de lui ${n} jour${n > 1 ? 's' : ''}`,
    links: (n: number): string => `Crée ${n} lien${n > 1 ? 's' : ''}`,
    bestLevel: (n: number): string => `Atteins le niveau ${n} dans un lien`,
    bestStreak: (n: number): string => `Écrivez-vous ${n} jours d’affilée dans un lien`,
    challenges: (n: number): string => `Relève ${n} défi${n > 1 ? 's' : ''} du jour`,
    words: (n: number): string => `Reçois les 3 mots de ${n} pote${n > 1 ? 's' : ''}`,
  } as Record<string, (n: number) => string>,
  /** Noms des objets de la garde-robe (minuscules : ils s'insèrent dans les phrases). */
  itemLabel: {
    couronne: 'couronne', fleurs: 'couronne de fleurs', chapeau_fete: 'chapeau de fête', sorcier: 'chapeau de sorcier',
    bonnet: 'bonnet', bob: 'bob', casquette: 'casquette', casquette_envers: 'casquette à l’envers', toque: 'toque',
    aureole: 'auréole', cornes: 'cornes', lapin: 'oreilles de lapin', chat: 'oreilles de chat', noeud: 'gros nœud',
    pirate: 'tricorne de pirate', antennes: 'antennes', casque_audio: 'casque audio',
    lunettes_rondes: 'lunettes rondes', lunettes_coeur: 'lunettes cœur', lunettes_etoile: 'lunettes étoile',
    lunettes_pixel: 'lunettes pixel', monocle: 'monocle', cache_oeil: 'cache-œil', masque_nuit: 'masque de nuit',
    nez_rouge: 'nez rouge', moustache: 'moustache', joues_roses: 'joues roses', taches_rousseur: 'taches de rousseur',
    pansement: 'pansement', tetine: 'tétine', etincelles: 'étincelles',
    echarpe: 'écharpe', noeud_violet: 'nœud violet', bandana: 'bandana', collier_perles: 'collier de perles',
    chaine_or: 'chaîne en or', cape: 'cape', ailes: 'ailes d’ange', sac_a_dos: 'sac à dos', sac_main: 'sac à main',
    salopette: 'salopette', sweat: 'sweat à capuche', teddy: 'teddy', tutu: 'tutu', bretelles: 'bretelles',
    collier_coquillage: 'collier coquillage', tablier: 'tablier', noeud_pap: 'nœud papillon',
    ballon: 'ballon', coeur: 'cœur en peluche', livre: 'livre', tasse: 'tasse', bulle: 'bulle', baguette: 'baguette magique',
    ballons: 'ballons', skate: 'skate', manette: 'manette', pinceau: 'pinceau', micro: 'micro', gateau: 'part de gâteau',
    cadeau: 'cadeau', potion: 'potion', fleur: 'fleur en pot', doudou: 'doudou',
  } as Record<string, string>,
};

export const labels = defineMessages({ fr, en: TODO, es: TODO, pt: TODO, nl: TODO });
export type Labels = typeof fr;
