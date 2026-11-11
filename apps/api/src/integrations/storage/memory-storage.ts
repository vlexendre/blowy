import { randomBytes } from 'node:crypto';
import type { Clock } from '../../shared/clock';
import type { PublicUrl, Storage, UploadTicket } from './ports';

interface StoredFile {
  bytes: Buffer;
  contentType: string;
}

/**
 * Stockage en mémoire qui se comporte comme Supabase Storage : ticket d'envoi à usage unique
 * (PUT sur `/dev/uploads/<path>?token=…`) et URL de lecture signée qui expire (`/dev/media/<path>?token=…`).
 */
export class MemoryStorage implements Storage {
  private readonly files = new Map<string, StoredFile>();
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

  async remove(paths: readonly string[]): Promise<void> {
    for (const p of paths) this.files.delete(p);
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path);
  }

  /** Reçoit le fichier envoyé avec un ticket ; faux si le ticket n'est pas valable. */
  put(path: string, token: string, file: StoredFile): boolean {
    if (this.uploadTokens.get(path) !== token) return false;
    this.uploadTokens.delete(path);
    this.files.set(path, file);
    return true;
  }

  /** Lit un fichier avec un jeton de lecture encore valable. */
  read(path: string, token: string): StoredFile | null {
    const grant = this.readTokens.get(token);
    if (!grant || grant.path !== path || grant.until < this.clock.now().getTime()) return null;
    return this.files.get(path) ?? null;
  }
}

const encodePath = (path: string): string => path.split('/').map(encodeURIComponent).join('/');
