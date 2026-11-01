/**
 * Adaptateurs ObjectStorage (Strategy) :
 *  - S3ObjectStorage : S3 privé / MinIO (SDK officiel AWS) — production ;
 *  - FsObjectStorage : système de fichiers (tests, local sans Docker — D-006), interdit en prod.
 * Clés validées (pas de `..`, pas de chemin absolu) : aucune traversée possible.
 */
import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mkdir, readFile, rm, stat, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import type { AppConfig } from '../../../config/env.js';
import type { ObjectStorage, StoredObject } from '../../application/ports/object-storage.port.js';

const KEY_RE = /^[a-z0-9][a-z0-9/_.-]{0,400}$/i;
function checkKey(key: string): string {
  if (!KEY_RE.test(key) || key.includes('..') || key.includes('//')) throw new Error('clé de stockage invalide');
  return key;
}

export class FsObjectStorage implements ObjectStorage {
  readonly driver = 'fs' as const;
  constructor(
    private readonly root: string,
    isProduction: boolean,
  ) {
    if (isProduction) throw new Error('FsObjectStorage interdit en production');
  }
  private p(key: string) {
    return path.join(this.root, checkKey(key));
  }
  async put(key: string, bytes: Uint8Array, contentType: string) {
    const f = this.p(key);
    await mkdir(path.dirname(f), { recursive: true });
    await writeFile(f, bytes);
    await writeFile(`${f}.__meta`, JSON.stringify({ contentType }));
  }
  async get(key: string): Promise<StoredObject | null> {
    try {
      const f = this.p(key);
      const [bytes, meta] = await Promise.all([readFile(f), readFile(`${f}.__meta`, 'utf8')]);
      return { bytes: new Uint8Array(bytes), contentType: (JSON.parse(meta) as { contentType: string }).contentType };
    } catch {
      return null;
    }
  }
  async delete(key: string) {
    const f = this.p(key);
    await rm(f, { force: true });
    await rm(`${f}.__meta`, { force: true });
  }
  async deletePrefix(prefix: string) {
    const dir = this.p(prefix.replace(/\/$/, ''));
    let n: number;
    try {
      n = (await readdir(dir, { recursive: true })).filter((f) => !String(f).endsWith('.__meta')).length;
    } catch {
      return 0;
    }
    await rm(dir, { recursive: true, force: true });
    return n;
  }
  async exists(key: string) {
    try {
      await stat(this.p(key));
      return true;
    } catch {
      return false;
    }
  }
}

export class S3ObjectStorage implements ObjectStorage {
  readonly driver = 's3' as const;
  constructor(
    private readonly s3: S3Client,
    private readonly bucket: string,
  ) {}
  async put(key: string, bytes: Uint8Array, contentType: string) {
    // Pas d'ACL publique ; chiffrement au repos côté serveur S3.
    await this.s3.send(new PutObjectCommand({ Bucket: this.bucket, Key: checkKey(key), Body: bytes, ContentType: contentType, ServerSideEncryption: 'AES256' }));
  }
  async get(key: string): Promise<StoredObject | null> {
    try {
      const r = await this.s3.send(new GetObjectCommand({ Bucket: this.bucket, Key: checkKey(key) }));
      const bytes = await r.Body!.transformToByteArray();
      return { bytes, contentType: r.ContentType ?? 'application/octet-stream' };
    } catch (e) {
      if ((e as { name?: string }).name === 'NoSuchKey') return null;
      throw e;
    }
  }
  async delete(key: string) {
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: checkKey(key) }));
  }
  async deletePrefix(prefix: string) {
    let n = 0;
    let token: string | undefined;
    do {
      const r = await this.s3.send(new ListObjectsV2Command({ Bucket: this.bucket, Prefix: checkKey(prefix), ContinuationToken: token }));
      for (const o of r.Contents ?? []) {
        if (o.Key) {
          await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: o.Key }));
          n++;
        }
      }
      token = r.IsTruncated ? r.NextContinuationToken : undefined;
    } while (token);
    return n;
  }
  async exists(key: string) {
    try {
      await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: checkKey(key) }));
      return true;
    } catch {
      return false;
    }
  }
}

export function createObjectStorage(cfg: AppConfig): ObjectStorage {
  if (cfg.STORAGE_DRIVER === 'fs') return new FsObjectStorage(path.resolve(cfg.STORAGE_FS_ROOT), cfg.isProduction);
  if (!cfg.S3_BUCKET) throw new Error('STORAGE_DRIVER=s3 exige S3_BUCKET');
  const s3 = new S3Client({
    region: cfg.S3_REGION,
    ...(cfg.S3_ENDPOINT ? { endpoint: cfg.S3_ENDPOINT } : {}),
    forcePathStyle: cfg.S3_FORCE_PATH_STYLE,
    ...(cfg.S3_ACCESS_KEY && cfg.S3_SECRET ? { credentials: { accessKeyId: cfg.S3_ACCESS_KEY, secretAccessKey: cfg.S3_SECRET } } : {}),
  });
  return new S3ObjectStorage(s3, cfg.S3_BUCKET);
}
