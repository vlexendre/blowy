/* eslint-disable @typescript-eslint/no-explicit-any -- réponses JSON dynamiques en test */
/**
 * Aides d'intégration agent E : upload d'octets bruts, lecture binaire, images SYNTHÉTIQUES
 * (aplats de couleur générés par sharp, avec EXIF/GPS factices pour vérifier leur retrait).
 * Aucune photo réelle, aucun visage, aucun contenu sensible.
 */
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { synthWav } from '@blowy/ai';
import type { Harness, TestClient } from './harness.js';

export async function synthImage(o: { width: number; height: number; color?: string; withGps?: boolean }): Promise<Buffer> {
  let img = sharp({ create: { width: o.width, height: o.height, channels: 3, background: o.color ?? '#3a7' } });
  if (o.withGps) img = img.withExif({ IFD0: { Make: 'SyntheticCam', Model: 'Test', Copyright: 'synthetic' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '48/1 51/1 24/1', GPSLongitudeRef: 'E', GPSLongitude: '2/1 21/1 3/1' } });
  return img.jpeg().toBuffer();
}

export const svgBytes = Buffer.from('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
export const wavBytes = (o: { sampleRate?: number; durationMs?: number; amplitude?: number } = {}) => Buffer.from(synthWav({ sampleRate: o.sampleRate ?? 16000, durationMs: o.durationMs ?? 1200, amplitude: o.amplitude ?? 8000 }));

export async function raw(h: Harness, c: TestClient, method: string, path: string, body?: Buffer, headers: Record<string, string> = {}): Promise<{ status: number; headers: { get(name: string): string | null }; buf: Buffer; json: () => any }> {
  const res = await fetch(`${h.baseUrl}${path}`, { method, headers: { ...(c.token ? { authorization: `Bearer ${c.token}` } : {}), ...headers }, ...(body ? { body: new Uint8Array(body) } : {}) });
  const buf = Buffer.from(await res.arrayBuffer());
  return { status: res.status, headers: res.headers, buf, json: () => (buf.length ? JSON.parse(buf.toString('utf8')) : null) };
}

/** Session → PUT → finalize ; renvoie la vue média après traitement (file inline). */
export async function uploadMedia(h: Harness, c: TestClient, o: { purpose: string; mimeType: string; bytes: Buffer; relationshipId?: string; conversationId?: string; missionKey?: string }) {
  const s = await c.call('POST', '/v1/media/uploads', { purpose: o.purpose, mimeType: o.mimeType, bytes: o.bytes.length, ...(o.relationshipId ? { relationshipId: o.relationshipId } : {}), ...(o.conversationId ? { conversationId: o.conversationId } : {}), ...(o.missionKey ? { missionKey: o.missionKey } : {}) });
  if (s.status !== 201) throw new Error(`upload session ${s.status} ${JSON.stringify(s.body)}`);
  const put = await raw(h, c, 'PUT', `/v1/media/uploads/${s.body.mediaId}`, o.bytes, { 'content-type': 'application/octet-stream' });
  if (put.status !== 204) throw new Error(`put ${put.status} ${put.buf.toString()}`);
  const fin = await c.call('POST', `/v1/media/${s.body.mediaId}/finalize`, {});
  await h.drain();
  const view = await c.call('GET', `/v1/media/${s.body.mediaId}`);
  return { id: s.body.mediaId as string, finalize: fin, view: view.body as any };
}

export const cid = () => randomUUID();
