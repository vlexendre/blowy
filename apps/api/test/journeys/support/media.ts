/* eslint-disable @typescript-eslint/no-explicit-any -- vues média JSON */
/** Médias SYNTHÉTIQUES (aplats de couleur générés par sharp) : aucune photo réelle, aucun visage. */
import sharp from 'sharp';
import type { Person } from './actor.js';

export function synthImage(o: { width?: number; height?: number; color?: string } = {}): Promise<Buffer> {
  return sharp({ create: { width: o.width ?? 800, height: o.height ?? 800, channels: 3, background: o.color ?? '#c96' } })
    .jpeg()
    .toBuffer();
}

/** Session d'upload → PUT des octets → finalisation → traitement (drain) → vue. */
export async function upload(p: Person, o: { purpose: string; bytes: Buffer; mimeType?: string; relationshipId?: string; missionKey?: string }) {
  const s = await p.call('POST', '/v1/media/uploads', { purpose: o.purpose, mimeType: o.mimeType ?? 'image/jpeg', bytes: o.bytes.length, ...(o.relationshipId ? { relationshipId: o.relationshipId } : {}), ...(o.missionKey ? { missionKey: o.missionKey } : {}) });
  if (!s.ok) throw new Error(`session d'upload refusée ${s.status} ${JSON.stringify(s.data)}`);
  const mediaId = (s.data as any).mediaId as string;
  const put = await p.raw('PUT', `/v1/media/uploads/${mediaId}`, o.bytes, { 'content-type': 'application/octet-stream' });
  if (put.status !== 204) throw new Error(`PUT ${put.status} ${put.buf.toString()}`);
  const fin = await p.call('POST', `/v1/media/${mediaId}/finalize`, {});
  if (!fin.ok) throw new Error(`finalize ${fin.status} ${JSON.stringify(fin.data)}`);
  await p.world.drain();
  const view = await p.call('GET', `/v1/media/${mediaId}`);
  return { id: mediaId, view: view.data as any };
}

/** Lecture du contenu d'un média par une personne (statut + largeur décodée si image). */
export async function look(p: Person, mediaId: string, variant: string, relationshipId?: string) {
  const qs = new URLSearchParams({ variant, ...(relationshipId ? { relationshipId } : {}) });
  const r = await p.raw('GET', `/v1/media/${mediaId}/content?${qs}`);
  let width: number | null = null;
  if (r.status === 200) width = (await sharp(r.buf).metadata()).width ?? null;
  return { status: r.status, width, buf: r.buf };
}
