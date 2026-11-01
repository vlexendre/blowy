/**
 * Analyse WAV PCM minimale (en-tête RIFF + énergie RMS 16 bits) — utilisée par la
 * transcription locale et par la vérification du type réel côté serveur.
 */
export interface WavInfo {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  durationMs: number;
  rms: number;
}

export function parseWav(bytes: Uint8Array): WavInfo | null {
  if (bytes.length < 44) return null;
  const b = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WAVE') return null;
  let off = 12;
  let fmt: { channels: number; sampleRate: number; bits: number; format: number } | null = null;
  while (off + 8 <= b.length) {
    const id = b.toString('ascii', off, off + 4);
    const size = b.readUInt32LE(off + 4);
    const body = off + 8;
    if (id === 'fmt ' && body + 16 <= b.length) {
      fmt = { format: b.readUInt16LE(body), channels: b.readUInt16LE(body + 2), sampleRate: b.readUInt32LE(body + 4), bits: b.readUInt16LE(body + 14) };
    } else if (id === 'data' && fmt) {
      if (fmt.format !== 1 || fmt.bits !== 16 || fmt.channels < 1 || fmt.sampleRate < 1) return null;
      const end = Math.min(b.length, body + size);
      const samples = Math.floor((end - body) / 2);
      let sum = 0;
      for (let i = 0; i < samples; i++) {
        const v = b.readInt16LE(body + i * 2);
        sum += v * v;
      }
      const frames = samples / fmt.channels;
      return { sampleRate: fmt.sampleRate, channels: fmt.channels, bitsPerSample: fmt.bits, durationMs: Math.round((frames / fmt.sampleRate) * 1000), rms: samples ? Math.sqrt(sum / samples) : 0 };
    }
    off = body + size + (size % 2);
  }
  return null;
}

/** Fabrique un WAV PCM 16 bits mono (tests, fixtures synthétiques). */
export function synthWav(o: { sampleRate: number; durationMs: number; amplitude: number; freq?: number }): Uint8Array {
  const n = Math.round((o.sampleRate * o.durationMs) / 1000);
  const b = Buffer.alloc(44 + n * 2);
  b.write('RIFF', 0, 'ascii');
  b.writeUInt32LE(36 + n * 2, 4);
  b.write('WAVE', 8, 'ascii');
  b.write('fmt ', 12, 'ascii');
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(o.sampleRate, 24);
  b.writeUInt32LE(o.sampleRate * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36, 'ascii');
  b.writeUInt32LE(n * 2, 40);
  const f = o.freq ?? 440;
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.round(o.amplitude * Math.sin((2 * Math.PI * f * i) / o.sampleRate)), 44 + i * 2);
  return new Uint8Array(b);
}
