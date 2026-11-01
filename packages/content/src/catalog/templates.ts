/**
 * Modèles système : départs pré-écrits (clairement « message système », jamais signés par
 * l'humain) et notifications (aucun contenu intime sur écran verrouillé).
 */
export interface SystemTemplate {
  id: string;
  key: string;
  fr: string;
  /** Toujours présenté comme message système. */
  system: true;
}

const t = (id: string, ns: string, fr: string): SystemTemplate => ({ id, key: `${ns}.${id}`, fr, system: true });

export const DEPARTURE_TEMPLATES: SystemTemplate[] = [
  t('moved_in_elsewhere', 'departure', 'Message de Blowy : {pet} a emménagé ailleurs. Ce rendez-vous se termine en douceur. Merci pour les bons moments.'),
  t('clean_leave', 'departure', 'Message de Blowy : ce rendez-vous est terminé. {pet} rentre à la maison avec ses souvenirs.'),
  t('silence_14d', 'departure', 'Message de Blowy : sans nouvelles depuis 14 jours, ce rendez-vous s’est terminé. Personne n’est pénalisé.'),
  t('transfer_neighborhood', 'departure', 'Message de Blowy : vous êtes désormais ami·es au Quartier. Votre histoire est conservée.'),
];

export const NOTIFICATION_TEMPLATES: SystemTemplate[] = [
  t('message', 'notif', 'Nouveau message de {autrePet}'),
  t('waiting', 'notif', '{pet} attend {autrePet} {lieu} depuis {nombre} h'),
  t('streak', 'notif', 'Ta série de {nombre} jours t’attend : une mission ou un soin suffit'),
  t('neighborhood', 'notif', 'Un ami du Quartier a pensé à {pet}'),
  t('mission', 'notif', 'La mission du jour est disponible'),
  t('pet_sick', 'notif', '{pet} ne se sent pas bien : un soin gratuit l’aidera'),
  t('proposal', 'notif', '{nombre} rencontres à découvrir ce soir'),
  t('egg_session', 'notif', 'L’œuf vous attend pour la nuit {nombre}'),
  t('pause_ending', 'notif', 'Ta pause se termine aujourd’hui. Tout reprend sans pénalité.'),
];
