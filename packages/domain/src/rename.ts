import { type Day, addDays, daysBetween } from './days';

/** Après un changement de nom, le suivant n'est possible que 60 jours plus tard (sans attente avec Minimoa+). */
export const RENAME_COOLDOWN_DAYS = 60;

export interface RenameRule {
  /** Le nom peut-il changer maintenant ? */
  allowed: boolean;
  /** Jour (Europe/Paris) à partir duquel il pourra changer ; null s'il le peut déjà. */
  availableOn: Day | null;
  /** Minimoa+ : aucune attente entre deux changements. */
  unlimited: boolean;
}

export interface RenameInput {
  /** Jour du dernier changement de nom ; null s'il n'a jamais changé (le nom donné à la création ne compte pas). */
  lastRenamedOn: Day | null;
  today: Day;
  plus: boolean;
}

/** Peut-on renommer son pet aujourd'hui ? Le jour courant est un paramètre (pas d'horloge ici). */
export function renameRule({ lastRenamedOn, today, plus }: RenameInput): RenameRule {
  if (plus) return { allowed: true, availableOn: null, unlimited: true };
  if (lastRenamedOn === null) return { allowed: true, availableOn: null, unlimited: false };
  const availableOn = addDays(lastRenamedOn, RENAME_COOLDOWN_DAYS);
  if (daysBetween(today, availableOn) <= 0) return { allowed: true, availableOn: null, unlimited: false };
  return { allowed: false, availableOn, unlimited: false };
}

/** Jour à partir duquel un nouveau changement sera possible si on renomme aujourd'hui (sans Minimoa+). */
export const nextRenameOn = (today: Day): Day => addDays(today, RENAME_COOLDOWN_DAYS);
