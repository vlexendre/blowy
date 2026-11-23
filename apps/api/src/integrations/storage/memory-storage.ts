import { randomBytes } from 'node:crypto';
import type { Clock } from '../../shared/clock';
import type { ListedFile, PublicUrl, Storage, StoredBytes, UploadTicket } from './ports';

interface StoredFile {
  bytes: Buffer;
  contentType: string;
}

/** Fichier rangé, avec sa date de création (horloge de l'API) comme Supabase la garde. */
interface KeptFile extends StoredFile {
  createdAt: string;
}

/**
 * Stockage en mémoire qui se comporte comme Supabase Storage : ticket d'envoi à usage unique
 * (PUT sur `/dev/uploads/<path>?token=…`) et URL de lecture signée qui expire (`/dev/media/<path>?token=…`).
 */
export class MemoryStorage implements Storage {
  private readonly files = new Map<string, KeptFile>();
  private readonly uploadTokens = new Map<string, string>();
  private readonly readTokens = new Map<string, { path: string; until: number }>();

  constructor(
    private readonly publicUrl: PublicUrl,
    private readonly clock: Clock,
  ) {}

  async createUploadTicket(path: string): Promise<UploadTicket> {
    const token = randomBytes(16).toString('hex');
    this.uploadTokens.set(path, token);
    return { path, uploadUrl: `${this.publicUrl.current}/dev/uploads/${encodePath(path)}?token=${token}`, token };
  }

  async signedUrl(path: string, seconds: number): Promise<string> {
    const token = randomBytes(16).toString('hex');
    this.readTokens.set(token, { path, until: this.clock.now().getTime() + seconds * 1000 });
    return `${this.publicUrl.current}/dev/media/${encodePath(path)}?token=${token}`;
  }

  async signedUrls(paths: readonly string[], seconds: number): Promise<(string | null)[]> {
    return Promise.all(paths.map((p) => (this.files.has(p) ? this.signedUrl(p, seconds) : null)));
  }

  async remove(paths: readonly string[]): Promise<void> {
    for (const p of paths) this.files.delete(p);
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  async read(path: string): Promise<StoredBytes | null> {
    const f = this.files.get(path);
    return f ? { bytes: f.bytes, contentType: f.contentType } : null;
  }

  async write(path: string, file: StoredBytes): Promise<void> {
    this.files.set(path, { bytes: Buffer.from(file.bytes), contentType: file.contentType, createdAt: this.clock.now().toISOString() });
  }

  async list(folder: string): Promise<ListedFile[]> {
    const prefix = `${folder.replace(/\/+$/, '')}/`;
    return [...this.files.entries()]
      .filter(([p]) => p.startsWith(prefix) && !p.slice(prefix.length).includes('/'))
      .map(([path, f]) => ({ path, createdAt: f.createdAt }))
      .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  }

  async listFolders(folder: string): Promise<string[]> {
    const prefix = `${folder.replace(/\/+$/, '')}/`;
    const out = new Set<string>();
    for (const p of this.files.keys()) {
      if (!p.startsWith(prefix)) continue;
      const rest = p.slice(prefix.length);
      const slash = rest.indexOf('/');
      if (slash > 0) out.add(`${prefix}${rest.slice(0, slash)}`);
    }
    return [...out].sort();
  }

  /** Reçoit le fichier envoyé avec un ticket ; faux si le ticket n'est pas valable. */
  put(path: string, token: string, file: StoredFile): boolean {
    if (this.uploadTokens.get(path) !== token) return false;
    this.uploadTokens.delete(path);
    this.files.set(path, { bytes: file.bytes, contentType: file.contentType, createdAt: this.clock.now().toISOString() });
    return true;
  }

  /** Fichier tel qu'il est stocké, sans jeton (usage interne de l'API : vérification des preuves). */
  peek(path: string): StoredFile | null {
    const f = this.files.get(path);
    return f ? { bytes: f.bytes, contentType: f.contentType } : null;
  }

  /** Lit un fichier avec un jeton de lecture encore valable. */
  readWithToken(path: string, token: string): StoredFile | null {
    const grant = this.readTokens.get(token);
    if (!grant || grant.path !== path || grant.until < this.clock.now().getTime()) return null;
    const f = this.files.get(path);
    return f ? { bytes: f.bytes, contentType: f.contentType } : null;
  }
}

const encodePath = (path: string): string => path.split('/').map(encodeURIComponent).join('/');
