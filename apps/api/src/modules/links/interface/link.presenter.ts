import { surpriseOf } from '@blowy/content';
import { Inject, Injectable } from '@nestjs/common';
import type { Link, Message } from '@blowy/contract';
import {
  MAX_LIVES,
  dayOf,
  levelProgress,
  linkFace,
  linkToday,
  linkWarmth,
  linkWeek,
  type Mood,
  nextLevel,
  pastPhotosShown,
} from '@blowy/domain';
import { MEDIA_URL_SECONDS, type Storage } from '../../../integrations/storage/ports';
import { type Clock, todayOf } from '../../../shared/clock';
import { CLOCK, LINK_READS, MESSAGES, PAST_PHOTOS, PETS, PROFILES, STORAGE } from '../../../shared/tokens';
import { toPerson } from '../../me/interface/person.presenter';
import type { ProfilesRepository } from '../../me/ports';
import { livePet } from '../../pets/application/pet-catch-up';
import { toPublicPet } from '../../pets/interface/pet.presenter';
import type { PetsRepository } from '../../pets/ports';
import { Audience } from '../../safety/application/audience';
import {
  type LinkReadsRepository,
  type LinkRecord,
  type MessageRecord,
  type MessagesRepository,
  type PastPhotosRepository,
  sideOf,
} from '../ports';
import { labels } from '@blowy/content';
import { requestLocale } from '../../../shared/locale';

const PREVIEW_MAX = 80;

const preview = (m: MessageRecord): string => {
  if (m.kind === 'photo') return labels.in(requestLocale()).photoPreview;
  const body = (m.body ?? '').replace(/\s+/g, ' ').trim();
  return body.length > PREVIEW_MAX ? `${body.slice(0, PREVIEW_MAX - 1)}…` : body;
};

/** Qui a écrit, vu de `viewerId`. */
const authorOf = (m: MessageRecord, viewerId: string): Message['author'] => {
  const mine = m.authorId === viewerId;
  return m.authorKind === 'system'
    ? 'system'
    : m.authorKind === 'pet'
      ? mine
        ? 'my_pet'
        : 'other_pet'
      : mine
        ? 'me'
        : 'other';
};

/** Les minimoas d'un lien sont contents : un lien ne se perd plus, jamais de minimoa triste comme levier (ADA-2027). */
const LINK_MOOD: Mood = 'joie';

/**
 * Assemble les DTO de liens et de messages, relatifs à la personne qui regarde. Un lien « fermé » pour elle (rangé par
 * « Le laisser partir » ou par un blocage, ou blocage entre eux : `Audience`) ne signe aucune photo de l'autre : ni sa
 * photo de profil (`face: 'hidden'`), ni ses anciennes photos du jour. Les anciennes photos de l'autre ne partent
 * qu'à partir du niveau 5 (`pastPhotosShown`, promesse de la politique de confidentialité).
 */
@Injectable()
export class LinkPresenter {
  constructor(
    @Inject(PROFILES) private readonly profiles: ProfilesRepository,
    @Inject(PETS) private readonly pets: PetsRepository,
    @Inject(MESSAGES) private readonly messages: MessagesRepository,
    @Inject(LINK_READS) private readonly reads: LinkReadsRepository,
    @Inject(PAST_PHOTOS) private readonly photos: PastPhotosRepository,
    @Inject(STORAGE) private readonly storage: Storage,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(Audience) private readonly audience: Audience,
  ) {}

  /** Lien ouvert pour `viewerId` : ni rangé, ni bloqué dans un sens ou dans l'autre. */
  private isOpen(link: LinkRecord, viewerId: string, blocked: ReadonlySet<string>): boolean {
    return link.status !== 'archived' && !blocked.has(link.userA === viewerId ? link.userB : link.userA);
  }

  async link(link: LinkRecord, viewerId: string): Promise<Link> {
    const [dto] = await this.links([link], viewerId);
    if (!dto) throw new Error('lien non présenté');
    return dto;
  }

  async links(links: readonly LinkRecord[], viewerId: string): Promise<Link[]> {
    const now = this.clock.now();
    const today = todayOf(this.clock);
    const otherIds = links.map((l) => (l.userA === viewerId ? l.userB : l.userA));
    const [profiles, pets, blocked] = await Promise.all([
      this.profiles.findByIds(otherIds),
      this.pets.findByOwners([viewerId, ...otherIds]),
      this.audience.blockedPartners(viewerId),
    ]);
    const profileById = new Map(profiles.map((p) => [p.id, p]));
    const petByOwner = new Map(pets.map((p) => [p.ownerId, livePet(p, now)]));

    const out = await Promise.all(
      links.map(async (link, i): Promise<Link | null> => {
        const otherId = otherIds[i] ?? '';
        const other = profileById.get(otherId);
        const myPet = petByOwner.get(viewerId);
        const theirPet = petByOwner.get(otherId);
        if (!other || !myPet || !theirPet) return null;
        const mood = LINK_MOOD;
        const face = linkFace(this.isOpen(link, viewerId, blocked));
        const [latest, lastRead, avatarUrl] = await Promise.all([
          this.messages.latest(link.id, viewerId),
          this.reads.lastReadAt(link.id, viewerId),
          face !== 'hidden' && other.avatarPath ? this.sign(other.avatarPath) : Promise.resolve(null),
        ]);
        const unread = await this.messages.countUnread(link.id, viewerId, lastRead);
        // La journée du lien, vue d'ici : qui a écrit, la série (et si elle est en jeu), la semaine (spéc §24).
        const side = sideOf(link, viewerId);
        const day = linkToday(link, side, today);
        const week = linkWeek(link.recentDays, today, dayOf(new Date(link.createdAt))).map((d) => ({
          day: d.day,
          mine: side === 'a' ? d.a : d.b,
          theirs: side === 'a' ? d.b : d.a,
          when: d.when,
          beforeLink: d.beforeLink,
        }));
        return {
          id: link.id,
          other: toPerson(other, toPublicPet(theirPet, mood), face, avatarUrl),
          myPet: toPublicPet(myPet, mood),
          // Anciennes versions de l'app : jamais de lien fantôme ni de vie en moins, même pour un lien rendu tel quel
          // sans rattrapage (`CreateLink` sur une paire déjà liée).
          status: link.status === 'ghost' ? 'active' : link.status,
          lives: MAX_LIVES,
          level: link.level,
          xp: link.xp,
          levelRatio: levelProgress(link.xp).ratio,
          next: nextLevel(link.xp),
          streak: day.streak,
          bestStreak: Math.max(link.bestStreak, day.streak),
          // Plus de lien endormi à ranimer (ADA-2027 item 27) : faux pour les anciennes versions de l'app.
          canRevive: false,
          warmth: linkWarmth(link, today),
          unread,
          lastMessage: latest
            ? { preview: preview(latest), at: latest.createdAt, author: authorOf(latest, viewerId) }
            : null,
          today: {
            day: today,
            mine: day.mine,
            theirs: day.theirs,
            atStake: day.atStake,
            week,
            myPhotoUrl: null,
            theirPhotoUrl: null,
          },
          createdAt: link.createdAt,
        };
      }),
    );
    return out.filter((l): l is Link => l !== null);
  }

  /**
   * Messages vus par `viewerId`. Une ancienne photo du jour de l'autre n'est envoyée que si tu avais envoyé la tienne
   * le même jour (règle d'alors, gardée pour l'historique), que le lien a atteint le niveau 5 et qu'il est ouvert
   * (ni rangé ni bloqué) ; sinon `mediaUrl` est nul (case verrouillée dans l'app). Tes propres photos te restent.
   */
  async messagesFor(
    link: LinkRecord,
    records: readonly MessageRecord[],
    viewerId: string,
  ): Promise<Message[]> {
    const hasPhotos = records.some((m) => m.mediaPath !== null);
    const [photos, blocked] = hasPhotos
      ? await Promise.all([this.photos.listForLink(link.id), this.audience.blockedPartners(viewerId)])
      : [[], new Set<string>()];
    const theirsShown = pastPhotosShown(link.level, this.isOpen(link, viewerId, blocked));
    const dayOfPath = new Map(photos.map((p) => [p.mediaPath, p.day]));
    const myDays = new Set(photos.filter((p) => p.userId === viewerId).map((p) => p.day));
    return Promise.all(
      records
        .filter((m) => !m.visibleTo || m.visibleTo === viewerId)
        // Plus de remarques des minimoas dans le fil (21 nov. 2026) : seules leurs questions surprise restent.
        .filter((m) => !(m.authorKind === 'pet' && m.petRole === 'remark' && !(m.body && surpriseOf(m.body))))
        .map(async (m): Promise<Message> => {
          const mine = m.authorId === viewerId;
          const day = m.mediaPath ? dayOfPath.get(m.mediaPath) : undefined;
          const visible = m.mediaPath !== null && (mine || (theirsShown && day !== undefined && myDays.has(day)));
          return {
            id: m.id,
            linkId: m.linkId,
            author: authorOf(m, viewerId),
            kind: m.kind,
            body: m.body,
            mediaUrl: visible && m.mediaPath ? await this.sign(m.mediaPath) : null,
            at: m.createdAt,
            petRole: m.authorKind === 'pet' ? (m.petRole ?? null) : null,
          };
        }),
    );
  }

  private sign(path: string): Promise<string> {
    return this.storage.signedUrl(path, MEDIA_URL_SECONDS);
  }
}
