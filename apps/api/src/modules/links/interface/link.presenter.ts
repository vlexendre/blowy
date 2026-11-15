import { Inject, Injectable } from '@nestjs/common';
import type { Link, Message } from '@blowy/contract';
import { canRevive, dayOf, faceVisibility, levelProgress, linkToday, linkWeek, type Mood, moodForLives, nextLevel } from '@blowy/domain';
import { MEDIA_URL_SECONDS, type Storage } from '../../../integrations/storage/ports';
import { type Clock, todayOf } from '../../../shared/clock';
import { CLOCK, LINK_READS, MESSAGES, PAST_PHOTOS, PETS, PROFILES, STORAGE } from '../../../shared/tokens';
import { toPerson } from '../../me/interface/person.presenter';
import type { ProfilesRepository } from '../../me/ports';
import { livePet } from '../../pets/application/pet-catch-up';
import { toPublicPet } from '../../pets/interface/pet.presenter';
import type { PetsRepository } from '../../pets/ports';
import { type LinkReadsRepository, type LinkRecord, type MessageRecord, type MessagesRepository, type PastPhotosRepository, sideOf } from '../ports';
import { labels } from '@blowy/content';
import { requestLocale } from '../../../shared/locale';

const PREVIEW_MAX = 80;

const preview = (m: MessageRecord): string => {
  if (m.kind === 'photo') return labels.in(requestLocale()).photoPreview;
  const body = (m.body ?? '').replace(/\s+/g, ' ').trim();
  return body.length > PREVIEW_MAX ? `${body.slice(0, PREVIEW_MAX - 1)}…` : body;
};

const linkMood = (link: LinkRecord): Mood => (link.status === 'ghost' ? 'triste' : moodForLives(link.lives));

/** Assemble les DTO de liens et de messages, relatifs à la personne qui regarde. */
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
  ) {}

  async link(link: LinkRecord, viewerId: string): Promise<Link> {
    const [dto] = await this.links([link], viewerId);
    if (!dto) throw new Error('lien non présenté');
    return dto;
  }

  async links(links: readonly LinkRecord[], viewerId: string): Promise<Link[]> {
    const now = this.clock.now();
    const today = todayOf(this.clock);
    const otherIds = links.map((l) => (l.userA === viewerId ? l.userB : l.userA));
    const [profiles, pets] = await Promise.all([this.profiles.findByIds(otherIds), this.pets.findByOwners([viewerId, ...otherIds])]);
    const profileById = new Map(profiles.map((p) => [p.id, p]));
    const petByOwner = new Map(pets.map((p) => [p.ownerId, livePet(p, now)]));

    const out = await Promise.all(
      links.map(async (link, i): Promise<Link | null> => {
        const otherId = otherIds[i] ?? '';
        const other = profileById.get(otherId);
        const myPet = petByOwner.get(viewerId);
        const theirPet = petByOwner.get(otherId);
        if (!other || !myPet || !theirPet) return null;
        const mood = linkMood(link);
        const face = faceVisibility(link.level);
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
          status: link.status,
          lives: link.lives,
          level: link.level,
          xp: link.xp,
          levelRatio: levelProgress(link.xp).ratio,
          next: nextLevel(link.xp),
          streak: day.streak,
          bestStreak: Math.max(link.bestStreak, day.streak),
          canRevive: canRevive(link),
          unread,
          lastMessage: latest ? { preview: preview(latest), at: latest.createdAt } : null,
          today: { day: today, mine: day.mine, theirs: day.theirs, atStake: day.atStake, week, myPhotoUrl: null, theirPhotoUrl: null },
          createdAt: link.createdAt,
        };
      }),
    );
    return out.filter((l): l is Link => l !== null);
  }

  /**
   * Messages vus par `viewerId`. Une ancienne photo du jour de l'autre n'est visible que si tu avais envoyé la tienne
   * le même jour (règle d'alors, gardée pour l'historique).
   */
  async messagesFor(link: LinkRecord, records: readonly MessageRecord[], viewerId: string): Promise<Message[]> {
    const hasPhotos = records.some((m) => m.mediaPath !== null);
    const photos = hasPhotos ? await this.photos.listForLink(link.id) : [];
    const dayOfPath = new Map(photos.map((p) => [p.mediaPath, p.day]));
    const myDays = new Set(photos.filter((p) => p.userId === viewerId).map((p) => p.day));
    return Promise.all(
      records
        .filter((m) => !m.visibleTo || m.visibleTo === viewerId)
        .map(async (m): Promise<Message> => {
        const mine = m.authorId === viewerId;
        const day = m.mediaPath ? dayOfPath.get(m.mediaPath) : undefined;
        const visible = m.mediaPath !== null && (mine || (day !== undefined && myDays.has(day)));
        return {
          id: m.id,
          linkId: m.linkId,
          author: m.authorKind === 'system' ? 'system' : m.authorKind === 'pet' ? (mine ? 'my_pet' : 'other_pet') : mine ? 'me' : 'other',
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
