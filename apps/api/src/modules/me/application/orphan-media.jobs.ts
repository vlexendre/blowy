/**
 * Travail planifié (`modules/tick/jobs.ts`), idempotent : ménage des photos de profil laissées dans le stockage (RGPD,
 * docs/ADA-2027.md, avant le 4 janvier). Parcourt les sous-dossiers de `avatars/` et `blurred/` :
 * - dossier sans profil (compte supprimé avant le correctif B2, suppression interrompue) : tout est effacé ;
 * - dossier d'un profil : tout est effacé sauf sa photo actuelle (`avatarPath`) et sa vignette, et sauf les fichiers de
 *   moins de deux heures (`UPLOAD_GRACE_MS`, durée du ticket d'envoi : un envoi en cours, une confirmation en cours).
 * Les fichiers d'un lot sont listés avant la lecture des profils : un fichier listé chez une personne sans profil a été
 * envoyé avant (un ticket exige un profil), donc il n'appartient à personne.
 *
 * Mode (`MEDIA_SWEEP`, docs/ENVIRONNEMENTS.md) : `dry` (défaut) compte sans rien effacer, `on` efface, `off` ne fait
 * rien. À chaque fin de passe, une ligne de journal : « N dossiers orphelins, M fichiers à effacer » (`dry`) ou
 * « … effacés » (`on`). Un lot borné de dossiers par passage du minuteur, curseur en mémoire (un redémarrage relance la
 * passe : sans danger, rien n'est effacé deux fois), puis repos d'une semaine une fois la passe finie.
 */
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Env, MediaSweepMode } from '../../../config/env';
import { type ListedFile, type Storage, isFresh } from '../../../integrations/storage/ports';
import { ENV, PROFILES, STORAGE } from '../../../shared/tokens';
import type { ProfilesRepository } from '../ports';
import { blurPathOf } from './avatar-blurs';

/** Dossiers examinés par passage du minuteur (une liste et au plus un effacement chacun). */
const FOLDERS_PER_TICK = 50;
const REST_MS = 7 * 24 * 3_600_000;
const ROOTS = ['avatars', 'blurred'] as const;

/** Bilan d'une passe finie (journal, tests). */
export interface OrphanMediaPass {
  mode: Exclude<MediaSweepMode, 'off'>;
  /** Dossiers sans profil qui contenaient au moins un fichier. */
  orphanFolders: number;
  /** Fichiers effacés (`on`) ou qui l'auraient été (`dry`). */
  files: number;
  finishedAt: string;
}

@Injectable()
export class OrphanMediaJobs {
  private readonly logger = new Logger('OrphanMediaJobs');
  private readonly mode: MediaSweepMode;
  /** Dossiers de la passe en cours (null : pas de passe en cours) et position. */
  private queue: string[] | null = null;
  private index = 0;
  private restUntil = 0;
  private orphanFolders = 0;
  private files = 0;
  /** Dernière passe finie. */
  lastPass: OrphanMediaPass | null = null;

  constructor(
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(ENV) env: Env,
  ) {
    this.mode = env.mediaSweep;
  }

  async runDue(now: Date, deadline?: number): Promise<number> {
    const mode = this.mode;
    if (mode === 'off' || now.getTime() < this.restUntil) return 0;
    if (this.queue === null) {
      this.queue = (await Promise.all(ROOTS.map((r) => this.storage.listFolders(r)))).flat();
      this.index = 0;
      this.orphanFolders = 0;
      this.files = 0;
    }
    const batch: { folder: string; owner: string; files: ListedFile[] }[] = [];
    while (this.index < this.queue.length && batch.length < FOLDERS_PER_TICK) {
      if (deadline !== undefined && Date.now() >= deadline) break;
      const folder = this.queue[this.index] ?? '';
      batch.push({ folder, owner: folder.slice(folder.indexOf('/') + 1), files: await this.storage.list(folder) });
      this.index += 1;
    }
    // Les profils après les listes (voir plus haut).
    const owners = [...new Set(batch.map((b) => b.owner))];
    const profiles = new Map((owners.length > 0 ? await this.profiles.findByIds(owners) : []).map((p) => [p.id, p]));
    let gone = 0;
    for (const { owner, files } of batch) {
      const profile = profiles.get(owner);
      let stale: string[];
      if (!profile) {
        stale = files.map((f) => f.path);
        if (stale.length > 0) this.orphanFolders += 1;
      } else {
        const kept = new Set(profile.avatarPath ? [profile.avatarPath, blurPathOf(profile.avatarPath)] : []);
        stale = files.filter((f) => !kept.has(f.path) && !isFresh(f, now)).map((f) => f.path);
      }
      if (stale.length === 0) continue;
      if (mode === 'on') await this.storage.remove(stale);
      gone += stale.length;
    }
    this.files += gone;
    if (this.index >= this.queue.length) this.finish(mode, now);
    return mode === 'on' ? gone : 0;
  }

  private finish(mode: Exclude<MediaSweepMode, 'off'>, now: Date): void {
    this.lastPass = { mode, orphanFolders: this.orphanFolders, files: this.files, finishedAt: now.toISOString() };
    this.logger.log(
      mode === 'dry'
        ? `à blanc (MEDIA_SWEEP=dry) : ${this.orphanFolders} dossiers orphelins, ${this.files} fichiers à effacer`
        : `${this.orphanFolders} dossiers orphelins, ${this.files} fichiers effacés`,
    );
    this.queue = null;
    this.index = 0;
    this.restUntil = now.getTime() + REST_MS;
  }
}
