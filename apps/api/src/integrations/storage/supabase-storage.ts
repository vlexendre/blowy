import type { Db } from '../../persistence/database.types';
import type { Storage, UploadTicket } from './ports';

const BUCKET = 'media';

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
}
