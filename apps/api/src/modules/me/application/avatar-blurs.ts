/**
 * Vignette très floue des photos de profil (docs/ADA-2027.md, décision 7 et item 26) : la seule image d'une personne
 * envoyée à quelqu'un qui n'a pas encore de lien noué avec elle (carte, présentations, coucous, personne du jour),
 * gratuit ou Minimoa+. L'original ne part jamais avant le lien.
 *
 * - Fabriquée par le serveur (`ImageProcessor`) à la confirmation d'une photo, et par le minuteur pour les photos
 *   d'avant (`AvatarBlurJobs`). Rangée à part dans le stockage privé, sous `blurred/` : son chemin se déduit de celui de
 *   la photo (pas de colonne en base), et l'app ne peut jamais la choisir comme photo de profil (motif de `Avatar`).
 * - Effacée avec la photo : changement de photo, photo refusée par le filtre, suppression du compte (`DeleteMe`).
 *   Course avec le minuteur (ou une confirmation lente) : après avoir écrit une vignette, `make` relit le profil et
 *   l'efface aussitôt si la photo n'est plus la sienne (changée, refusée, compte supprimé). Aucune vignette orpheline.
 * - Tant qu'elle n'existe pas (image illisible, envoi d'avant le déploiement pas encore rattrapé) : visage caché, le
 *   minimoa à la place, comme avant.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import { type FaceVisibility, faceBeforeLink } from '@blowy/domain';
import { BLURRED_CONTENT_TYPE, type ImageProcessor } from '../../../integrations/images/ports';
import { MEDIA_URL_SECONDS, type Storage } from '../../../integrations/storage/ports';
import { IMAGES, PROFILES, STORAGE } from '../../../shared/tokens';
import type { Profile, ProfilesRepository } from '../ports';

/** `avatars/<personne>/<id>.jpg` → `blurred/<personne>/<id>.jpg`. */
export const blurPathOf = (avatarPath: string): string =>
  `blurred/${avatarPath.replace(/^avatars\//, '').replace(/\.[A-Za-z0-9]+$/, '')}.jpg`;

/** Personne à qui appartient une photo de profil (`avatars/<personne>/<id>.<ext>`) ; null pour un autre chemin. */
export const avatarOwnerOf = (avatarPath: string): string | null => /^avatars\/([^/]+)\/[^/]+$/.exec(avatarPath)?.[1] ?? null;

/** Les deux dossiers d'une personne : ses photos de profil envoyées et leurs vignettes floues. */
export const avatarFoldersOf = (userId: string): [string, string] => [`avatars/${userId}`, `blurred/${userId}`];

/** URL signée de la vignette floue de chaque personne qui en a une, par identifiant. */
export type BlurredFaces = ReadonlyMap<string, string>;

export const NO_BLURRED_FACES: BlurredFaces = new Map();

/** Visage d'une personne sans lien noué : vignette floue si elle existe, sinon caché. Jamais l'original. */
export const faceOf = (faces: BlurredFaces, userId: string): { face: Exclude<FaceVisibility, 'clear'>; avatarUrl: string | null } => {
  const url = faces.get(userId) ?? null;
  return { face: faceBeforeLink(url !== null), avatarUrl: url };
};

export type BlurOutcome = 'exists' | 'made' | 'unreadable';

@Injectable()
export class AvatarBlurs {
  private readonly logger = new Logger('AvatarBlurs');

  constructor(
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(IMAGES) private readonly images: ImageProcessor,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
  ) {}

  /**
   * Fabrique (ou refait) la vignette de `avatarPath`. Faux si la photo manque ou ne se lit pas, ou si elle n'est plus
   * la photo de son propriétaire une fois la vignette écrite (changée, refusée, compte supprimé pendant le calcul) :
   * la vignette est alors effacée aussitôt.
   */
  async make(avatarPath: string): Promise<boolean> {
    const original = await this.storage.read(avatarPath);
    if (!original) return false;
    const blurred = await this.images.blurredThumbnail(original.bytes);
    if (!blurred) return false;
    const target = blurPathOf(avatarPath);
    await this.storage.write(target, { bytes: blurred, contentType: BLURRED_CONTENT_TYPE });
    // Relu après l'écriture : ce qui a changé pendant le calcul est vu ici, et ce qui change après efface la vignette
    // de son côté (`Avatar.confirm`, `AvatarModeration`, `DeleteMe`).
    if (await this.stillCurrent(avatarPath)) return true;
    await this.storage.remove([target]);
    return false;
  }

  /** `avatarPath` est-elle toujours la photo de profil de son propriétaire ? */
  private async stillCurrent(avatarPath: string): Promise<boolean> {
    const owner = avatarOwnerOf(avatarPath);
    if (!owner) return false;
    return (await this.profiles.findById(owner))?.avatarPath === avatarPath;
  }

  /** Idempotent : ne fabrique la vignette que si elle manque. */
  async ensure(avatarPath: string): Promise<BlurOutcome> {
    if (await this.storage.exists(blurPathOf(avatarPath))) return 'exists';
    return (await this.make(avatarPath)) ? 'made' : 'unreadable';
  }

  /** À la confirmation d'une photo : une panne ne bloque pas l'envoi (le minuteur rattrape, visage caché d'ici là). */
  async makeQuietly(avatarPath: string): Promise<void> {
    try {
      await this.make(avatarPath);
    } catch (err) {
      this.logger.warn(`vignette floue reportée : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
    }
  }

  /** Efface la vignette d'une photo (photo changée ou refusée). */
  async remove(avatarPath: string | null): Promise<void> {
    if (avatarPath) await this.storage.remove([blurPathOf(avatarPath)]);
  }

  /**
   * URL signées des vignettes existantes, en un appel au stockage. Une panne du stockage rend une table vide : tout le
   * monde reste caché (le minimoa), la carte et les rencontres s'affichent quand même.
   */
  async urls(profiles: readonly Pick<Profile, 'id' | 'avatarPath'>[]): Promise<BlurredFaces> {
    const withPhoto = profiles.filter((p): p is Pick<Profile, 'id'> & { avatarPath: string } => !!p.avatarPath);
    if (withPhoto.length === 0) return NO_BLURRED_FACES;
    try {
      const urls = await this.storage.signedUrls(
        withPhoto.map((p) => blurPathOf(p.avatarPath)),
        MEDIA_URL_SECONDS,
      );
      const out = new Map<string, string>();
      withPhoto.forEach((p, i) => {
        const url = urls[i];
        if (url) out.set(p.id, url);
      });
      return out;
    } catch (err) {
      this.logger.warn(`vignettes floues non signées : ${err instanceof Error ? err.message : 'erreur inconnue'}`);
      return NO_BLURRED_FACES;
    }
  }
}
