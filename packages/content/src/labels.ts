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
