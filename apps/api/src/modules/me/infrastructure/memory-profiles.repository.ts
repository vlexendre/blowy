import type { MemoryDb } from '../../../persistence/memory-db';
import type { Profile, ProfilePatch, ProfilesRepository } from '../ports';

export class MemoryProfilesRepository implements ProfilesRepository {
  constructor(private readonly db: MemoryDb) {}

  async findById(id: string): Promise<Profile | null> {
    const p = this.db.profiles.get(id);
    return p ? { ...p } : null;
  }

  async findByIds(ids: readonly string[]): Promise<Profile[]> {
    return ids.flatMap((id) => {
      const p = this.db.profiles.get(id);
      return p ? [{ ...p }] : [];
    });
  }

  async findByInviteCode(code: string): Promise<Profile | null> {
    return this.find((p) => p.inviteCode === code);
  }

  async findByWordsCode(code: string): Promise<Profile | null> {
    return this.find((p) => p.wordsCode === code);
  }

  async codeTaken(code: string): Promise<boolean> {
    return (await this.find((p) => p.inviteCode === code || p.wordsCode === code)) !== null;
  }

  async create(profile: Profile): Promise<void> {
    if (this.db.profiles.has(profile.id)) throw new Error('profil déjà existant');
    this.db.profiles.set(profile.id, { ...profile });
  }

  async update(id: string, patch: ProfilePatch): Promise<Profile> {
    const p = this.db.profiles.get(id);
    if (!p) throw new Error('profil introuvable');
    const next = { ...p, ...patch };
    this.db.profiles.set(id, next);
    return { ...next };
  }

  async listRecent(limit: number, excludeId: string): Promise<Profile[]> {
    return [...this.db.profiles.values()]
      .filter((p) => p.id !== excludeId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
      .map((p) => ({ ...p }));
  }

  private find(predicate: (p: Profile) => boolean): Profile | null {
    for (const p of this.db.profiles.values()) if (predicate(p)) return { ...p };
    return null;
  }
}
