/**
 * Durée RÉELLE d'un vocal (jamais la valeur client) :
 *  - WAV PCM : en-tête RIFF (@blowy/ai parseWav) ;
 *  - MP4/M4A : boîte `mvhd` (timescale + duration) lue sans décodage.
 */
import { parseWav } from '@blowy/ai';
import type { AudioProbe } from '../application/ports/media.ports.js';

function mp4Duration(b: Buffer): number | null {
  const find = (start: number, end: number, type: string): number | null => {
    let off = start;
    while (off + 8 <= end) {
      let size = b.readUInt32BE(off);
      const t = b.toString('ascii', off + 4, off + 8);
      let header = 8;
      if (size === 1 && off + 16 <= end) {
        size = Number(b.readBigUInt64BE(off + 8));
        header = 16;
      }
      if (size < header || off + size > end) return null;
      if (t === type) return off + header;
      off += size;
    }
    return null;
  };
  const moov = find(0, b.length, 'moov');
  if (moov === null) return null;
  const moovSize = b.readUInt32BE(moov - 8);
  const mvhd = find(moov, moov - 8 + moovSize, 'mvhd');
  if (mvhd === null) return null;
  const version = b[mvhd]!;
  if (version === 1) {
    const timescale = b.readUInt32BE(mvhd + 20);
    const duration = Number(b.readBigUInt64BE(mvhd + 24));
    return timescale ? Math.round((duration / timescale) * 1000) : null;
  }
  const timescale = b.readUInt32BE(mvhd + 12);
  const duration = b.readUInt32BE(mvhd + 16);
  return timescale ? Math.round((duration / timescale) * 1000) : null;
}

export class ContainerAudioProbe implements AudioProbe {
  async probe(bytes: Uint8Array, sniffed: 'audio/wav' | 'audio/mp4') {
    if (sniffed === 'audio/wav') {
      const w = parseWav(bytes);
      return w ? { durationMs: w.durationMs } : null;
    }
    try {
      const d = mp4Duration(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength));
      return d === null ? null : { durationMs: d };
    } catch {
      return null;
    }
  }
}
