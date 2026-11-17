import type { Day, Gender, Locale } from '@blowy/domain';

export interface Profile {
  id: string;
  displayName: string;
  birthdate: Day;
  /** Sexe (« Tu es… ») : accords grammaticaux et statistiques ; ne filtre rien (spéc. §27). */
  gender: Gender;
  locale: Locale;
  /** Mode discret : absente de la carte des autres. */
  discreet: boolean;
  /** Accord explicite pour la position. */
  locationConsentAt: string | null;
  avatarPath: string | null;
  inviteCode: string;
  wordsCode: string;
  plusUntil: string | null;
  welcomeSentAt: string | null;
  createdAt: string;
  /**
   * Monde d'exemple du compte de revue d'Apple : identifiant du compte de revue, sur ce compte et sur chacune de ses
   * personnes fictives ; absent ou null pour tout le monde. `Audience` ne montre une personne qu'à quelqu'un du même
   * monde : les personnes fictives ne croisent jamais un vrai compte.
   */
  reviewWorld?: string | null;
  /** Photo de profil vérifiée par le filtre (null : pas encore, le minuteur s'en charge). */
  avatarCheckedAt?: string | null;
  /** « Montrer mes habitudes » (spéc §25) ; absent : activé. */
  showHabits?: boolean;
}

export type ProfilePatch = Partial<
  Pick<
    Profile,
    'displayName' | 'avatarPath' | 'welcomeSentAt' | 'gender' | 'locale' | 'discreet' | 'locationConsentAt' | 'reviewWorld' | 'avatarCheckedAt' | 'showHabits'
  >
>;

export interface ProfilesRepository {
  findById(id: string): Promise<Profile | null>;
  findByIds(ids: readonly string[]): Promise<Profile[]>;
  findByInviteCode(code: string): Promise<Profile | null>;
  findByWordsCode(code: string): Promise<Profile | null>;
  /** Vrai si le code est déjà pris (invitation ou « 3 mots »). */
  codeTaken(code: string): Promise<boolean>;
  create(profile: Profile): Promise<void>;
  update(id: string, patch: ProfilePatch): Promise<Profile>;
  /** Profils les plus récents, hors `excludeId` : vivier des rencontres. */
  listRecent(limit: number, excludeId: string): Promise<Profile[]>;
  /** Personnes fictives du monde d'exemple `world` (sans le compte de revue lui-même). */
  listFixtures(world: string): Promise<Profile[]>;
  /** Supprime les personnes fictives du monde `world` et tout ce qui va avec (cascade) ; rend leurs identifiants. */
  deleteFixtures(world: string): Promise<string[]>;
  /** Photos de profil pas encore vérifiées par le filtre, les plus anciennes d'abord. */
  listUncheckedAvatars(limit: number): Promise<Profile[]>;
}

/** Appelé après une création de pet réussie (monde de démo en local ; rien en production). */
export interface OnboardedHook {
  onOnboarded(userId: string): Promise<void>;
}
