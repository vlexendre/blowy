/**
 * Générateur PDF minimal (une page A4, texte Helvetica, encodage WinAnsi) pour le contrat d'une page
 * du lieu : aucune dépendance, aucun script, aucune ressource externe.
 */
const WIN_ANSI: Record<string, number> = { '€': 0x80, '’': 0x92, '‘': 0x91, '“': 0x93, '”': 0x94, '–': 0x96, '—': 0x97, '…': 0x85, ' ': 0x20, ' ': 0x20 };

function encode(s: string): string {
  let out = '';
  for (const ch of s) {
    const code = WIN_ANSI[ch] ?? (ch.charCodeAt(0) < 256 ? ch.charCodeAt(0) : 0x3f);
    const c = String.fromCharCode(code);
    out += c === '(' || c === ')' || c === '\\' ? `\\${c}` : c;
  }
  return out;
}

/** Découpe naïve par largeur moyenne de caractère (Helvetica ≈ 0,5 em). */
function wrap(text: string, size: number, width: number): string[] {
  const max = Math.floor(width / (size * 0.5));
  const lines: string[] = [];
  let cur = '';
  for (const w of text.split(/\s+/)) {
    if ((cur + ' ' + w).trim().length > max) {
      lines.push(cur.trim());
      cur = w;
    } else cur = `${cur} ${w}`;
  }
  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

export interface PdfBlock {
  text: string;
  size: number;
  bold?: boolean;
  gapBefore?: number;
}

export function onePagePdf(title: string, blocks: PdfBlock[]): ArrayBuffer {
  const ops: string[] = ['BT'];
  let y = 800;
  for (const b of blocks) {
    y -= b.gapBefore ?? 0;
    for (const line of wrap(b.text, b.size, 495)) {
      y -= b.size * 1.35;
      ops.push(`/${b.bold ? 'F2' : 'F1'} ${b.size} Tf 1 0 0 1 50 ${y.toFixed(1)} Tm (${encode(line)}) Tj`);
    }
  }
  ops.push('ET');
  const stream = ops.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
    `<< /Title (${encode(title)}) /Producer (Blowy) >>`,
  ];
  let body = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(Buffer.byteLength(body, 'latin1'));
    body += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(body, 'latin1');
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 7 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  const buf = Buffer.from(body, 'latin1');
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}
