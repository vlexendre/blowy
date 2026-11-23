import type { Db } from '../../persistence/database.types';
import type { Storage, StoredBytes, UploadTicket } from './ports';

const BUCKET = 'media';
const LIST_PAGE = 1000;

export class SupabaseStorage implements Storage {
  constructor(private readonly client: Db) {}

  private get bucket() {
    return this.client.storage.from(BUCKET);
  }

  async createUploadTicket(path: string): Promise<UploadTicket> {
    const { data, error } = await this.bucket.createSignedUploadUrl(path);
    if (error) throw new Error(`ticket d'envoi impossible : ${error.message}`);
    return { path: data.path, uploadUrl: data.signedUrl, token: data.token };
  }

  async signedUrl(path: string, seconds: number): Promise<string> {
    const { data, error } = await this.bucket.createSignedUrl(path, seconds);
    if (error) throw new Error(`URL signée impossible : ${error.message}`);
    return data.signedUrl;
  }

  async signedUrls(paths: readonly string[], seconds: number): Promise<(string | null)[]> {
    if (paths.length === 0) return [];
    const { data, error } = await this.bucket.createSignedUrls([...paths], seconds);
    if (error) throw new Error(`URL signées impossibles : ${error.message}`);
    // Un fichier absent revient avec une erreur et sans URL ; l'ordre suit `paths` (on le vérifie par le chemin).
    const byPath = new Map(data.map((d) => [d.path, d.error ? null : d.signedUrl]));
    return paths.map((p) => byPath.get(p) ?? null);
  }

  async remove(paths: readonly string[]): Promise<void> {
    if (paths.length === 0) return;
    const { error } = await this.bucket.remove([...paths]);
    if (error) throw new Error(`suppression de médias impossible : ${error.message}`);
  }

  async exists(path: string): Promise<boolean> {
    const { data, error } = await this.bucket.exists(path);
    if (error) return false;
    return data;
  }

  async read(path: string): Promise<StoredBytes | null> {
    const { data, error } = await this.bucket.download(path);
    if (error || !data) return null;
    return { bytes: Buffer.from(await data.arrayBuffer()), contentType: data.type };
  }

  async list(folder: string): Promise<string[]> {
    const dir = folder.replace(/\/+$/, '');
    const out: string[] = [];
    // Par pages de 1 000 (plafond de Supabase) ; un dossier vide ou absent rend une liste vide.
    for (let offset = 0; ; offset += LIST_PAGE) {
      const { data, error } = await this.bucket.list(dir, { limit: LIST_PAGE, offset, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw new Error(`liste des médias impossible : ${error.message}`);
      // Un sous-dossier revient sans identifiant : seuls les fichiers comptent.
      for (const f of data ?? []) if (f.id) out.push(`${dir}/${f.name}`);
      if (!data || data.length < LIST_PAGE) return out;
    }
  }

  async write(path: string, file: StoredBytes): Promise<void> {
    const { error } = await this.bucket.upload(path, file.bytes, { contentType: file.contentType, upsert: true, cacheControl: '3600' });
    if (error) throw new Error(`écriture de média impossible : ${error.message}`);
  }
}
