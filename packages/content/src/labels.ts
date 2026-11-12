/** Libellés français des notions du domaine (partagés par l'API, l'app et le site). */
import type { GaugeKey, LevelKey, PetEventKind, PetForm } from '@blowy/domain';

export const poleLabel: Record<string, string> = {
  casanier: 'casanier',
  sociable: 'sociable',
  pose: 'posé',
  joueur: 'joueur',
  piquant: 'piquant',
  tendre: 'tendre',
  discret: 'discret',
  bavard: 'bavard',
};

export const gaugeLabel: Record<GaugeKey, { low: string; high: string; hint: string }> = {
  social: { low: 'casanier', high: 'sociable', hint: 'Il bouge quand tu croises de nouveaux pets.' },
  play: { low: 'posé', high: 'joueur', hint: 'Il bouge avec les défis du jour.' },
  tender: { low: 'piquant', high: 'tendre', hint: 'Il bouge avec les photos, les mots doux et les vannes.' },
  talk: { low: 'discret', high: 'bavard', hint: 'Il bouge avec les messages.' },
};

export const formLabel: Record<PetForm, string> = {
  equilibre: 'équilibré',
  casanier: 'casanier',
  sociable: 'sociable',
  joueur: 'joueur',
  piquant: 'piquant',
  tendre: 'tendre',
};

export const levelLabel: Record<LevelKey, { title: string; text: string }> = {
  rendezvous: { title: 'Le rendez-vous', text: 'Vos pets se sont trouvés. Vous pouvez vous écrire.' },
  jouent: { title: 'Ils jouent ensemble', text: 'Les pets lancent des défis dans le chat.' },
  emmenagent: { title: 'Ils emménagent', text: 'Vos pets partagent une maison, vos souvenirs s’y rangent.' },
  visage_flou: { title: 'Le visage flou', text: 'Vos photos de profil apparaissent, floues.' },
  revelation: { title: 'La révélation', text: 'Les visages deviennent nets.' },
  irl: { title: 'Le premier rendez-vous', text: 'Vos pets vous proposent de vous voir en vrai.' },
  oeuf: { title: 'L’œuf', text: 'Un œuf apparaît. Il éclora de ce que vous êtes devenus.' },
};

export const eventLabel: Record<PetEventKind, string> = {
  met_new_pet: 'A rencontré un nouveau pet',
  waved: 'A salué un pet',
  challenge_done: 'A relevé le défi du jour',
  photo_sent: 'Photo du jour envoyée',
  sweet_word: 'Un mot doux',
  tease: 'Une vanne',
  message_sent: 'A papoté',
  three_words: 'Tes potes ont donné 3 mots',
  quiz: 'Son caractère de départ',
  care_feed: 'A bien mangé',
  care_play: 'A joué avec toi',
  care_nap: 'A fait une sieste',
  care_cuddle: 'A eu un câlin',
};

export const wordLabel: Record<string, string> = {
  drole: 'drôle',
  calme: 'calme',
  fetard: 'fêtard',
  casanier: 'casanier',
  doux: 'doux',
  cash: 'cash',
  bavard: 'bavard',
  mysterieux: 'mystérieux',
  curieux: 'curieux',
  reveur: 'rêveur',
  taquin: 'taquin',
  attentionne: 'attentionné',
};

export const reportReasonLabel: Record<string, string> = {
  harcelement: 'Harcèlement',
  contenu_inapproprie: 'Contenu inapproprié',
  faux_profil: 'Faux profil',
  mineur: 'Personne mineure',
  autre: 'Autre',
};

export const brand = {
  name: 'Blowy',
  tagline: 'élève ton pet. il te présente du monde.',
  site: 'https://blowy.app',
  supportEmail: 'hello@blowy.app',
} as const;

export const needLabel: Record<string, { name: string; low: string }> = {
  hunger: { name: 'faim', low: 'il a faim' },
  energy: { name: 'énergie', low: 'il tombe de sommeil' },
  mood: { name: 'humeur', low: 'il s’ennuie' },
};

export const careLabel: Record<string, { action: string; done: string; refused: string }> = {
  feed: { action: 'nourrir', done: 'miam.', refused: 'il n’a plus faim.' },
  play: { action: 'jouer', done: 'encore !', refused: 'pas maintenant : il est trop fatigué ou déjà comblé.' },
  nap: { action: 'sieste', done: 'zzz…', refused: 'il n’a pas sommeil.' },
  cuddle: { action: 'câlin', done: 'ronron.', refused: 'il est déjà comblé.' },
};

export const shapeLabel: Record<string, { title: string; text: string }> = {
  en_forme: { title: 'en pleine forme', text: 'il sort, il croise du monde.' },
  bof: { title: 'un peu à plat', text: 'il croise moins de monde. occupe-toi de lui.' },
  boude: { title: 'il boude', text: 'il ne sort plus et ne croise personne. nourris-le, joue, laisse-le dormir.' },
};

export const slotLabel: Record<string, string> = { head: 'tête', face: 'visage', body: 'tenue', toy: 'objets' };

export const statGoalLabel: Record<string, (n: number) => string> = {
  careDays: (n) => `occupe-toi de lui ${n} jour${n > 1 ? 's' : ''}`,
  links: (n) => `crée ${n} lien${n > 1 ? 's' : ''}`,
  bestLevel: (n) => `atteins le niveau ${n} dans un lien`,
  bestStreak: (n) => `fais une série de ${n} photos du jour`,
  challenges: (n) => `relève ${n} défi${n > 1 ? 's' : ''} du jour`,
  words: (n) => `reçois les 3 mots de ${n} pote${n > 1 ? 's' : ''}`,
};

export const itemLabel: Record<string, string> = {
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
};
