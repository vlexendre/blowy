/**
 * Carte story du quiz (1080 × 1920), dessinée dans le navigateur, même composition que `ShareCard` de packages/ui
 * (360 × 640 capturé à ×3) : panneau dégradé de l'espèce, « minimoa. », petite ligne, grand titre, le minimoa en pied
 * en bas à droite, la phrase d'appel et le lien sur une pilule blanche. Police Allo (celle du site), en 800 pour le
 * titre. Le dernier huitième reste libre pour l'interface d'Instagram.
 */
import { color, gradient, speciesGradient } from '@blowy/tokens';

export const STORY_W = 1080;
export const STORY_H = 1920;
const S = 3; // échelle de ShareCard
const FONT = "'Allo', system-ui, sans-serif";

type GradientName = keyof typeof gradient;
const ON_GRADIENT: Record<GradientName, string> = {
  accent: color.dark,
  orange: color.dark,
  coral: color.white,
  violet: color.white,
  rose: color.dark,
  wine: color.white,
  night: color.white,
};

export interface StoryCardInput {
  species: keyof typeof speciesGradient;
  kicker: string;
  /** Titre (mis en capitales). */
  title: string;
  /** Ligne sous le titre (« C’est Nino. »). */
  subtitle: string;
  /** La phrase de profil. */
  sentence: string;
  petSrc: string;
  callout: string;
  /** Lien sans protocole ; la fin (le code) est mise en couleur. */
  url: string;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image ${src}`));
    img.src = src;
  });
}

/** Coupe un texte en lignes qui tiennent dans `width`. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width <= width || !line) line = next;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Dessine la carte ; rend le canevas (à convertir en fichier PNG pour le partage). */
export async function drawStoryCard(input: StoryCardInput): Promise<HTMLCanvasElement> {
  await Promise.all([document.fonts.load(`800 120px ${FONT}`), document.fonts.load(`600 40px ${FONT}`)]).catch(() => undefined);
  const pet = await loadImage(input.petSrc);
  const canvas = document.createElement('canvas');
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  const g = speciesGradient[input.species] as GradientName;
  const [top, bottom] = gradient[g];
  const ink = ON_GRADIENT[g];

  // Panneau et halo blanc du haut (comme `.panel::before` du site).
  const bg = ctx.createLinearGradient(0, 0, 0, STORY_H);
  bg.addColorStop(0, top);
  bg.addColorStop(1, bottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, STORY_W, STORY_H);
  const glow = ctx.createRadialGradient(STORY_W / 2, 0, 0, STORY_W / 2, 0, STORY_W * 0.9);
  glow.addColorStop(0, 'rgba(255,255,255,0.26)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, STORY_W, STORY_H * 0.6);

  const left = 24 * S;
  const inner = STORY_W - left * 2;
  ctx.textBaseline = 'alphabetic';

  // « minimoa. »
  let y = 56 * S + 22 * S;
  ctx.font = `800 ${22 * S}px ${FONT}`;
  ctx.fillStyle = ink;
  ctx.fillText('minimoa', left, y);
  ctx.fillStyle = g === 'accent' ? color.dark : color.accent;
  ctx.fillText('.', left + ctx.measureText('minimoa').width, y);

  // Petite ligne.
  y += 12 * S + 16 * S;
  ctx.font = `700 ${16 * S}px ${FONT}`;
  ctx.fillStyle = ink;
  ctx.globalAlpha = 0.85;
  ctx.fillText(input.kicker, left, y);
  ctx.globalAlpha = 1;

  // Grand titre : la plus grande taille (de 46 à 30 × 3) qui tient en 4 lignes.
  const title = input.title.toLocaleUpperCase();
  let size = 46 * S;
  let lines: string[] = [];
  for (; size >= 30 * S; size -= 2 * S) {
    ctx.font = `800 ${size}px ${FONT}`;
    lines = wrap(ctx, title, inner);
    if (lines.length <= 4 && lines.every((l) => ctx.measureText(l).width <= inner)) break;
  }
  const lh = size * 0.94;
  y += 10 * S;
  for (const l of lines) {
    y += lh;
    ctx.fillText(l, left - size * 0.03, y);
  }

  // « C’est Nino. » sur une pastille d'accent.
  y += 18 * S;
  ctx.font = `800 ${20 * S}px ${FONT}`;
  const subW = ctx.measureText(input.subtitle).width + 32 * S;
  const pillH = 40 * S;
  ctx.fillStyle = g === 'accent' ? color.dark : color.accent;
  ctx.beginPath();
  ctx.roundRect(left, y, subW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = g === 'accent' ? color.accent : color.dark;
  ctx.fillText(input.subtitle, left + 16 * S, y + pillH / 2 + 7 * S);
  y += pillH;
  const afterPill = y;

  // La phrase de profil, sur la colonne de gauche (le minimoa occupe la droite du bas).
  y += 16 * S;
  ctx.font = `600 ${16 * S}px ${FONT}`;
  ctx.fillStyle = ink;
  for (const l of wrap(ctx, input.sentence, inner * 0.6)) {
    y += 22 * S;
    ctx.fillText(l, left, y);
  }

  // Le minimoa en pied, ombre douce, en bas à droite (au-dessus du pied de carte), à côté de la phrase.
  const footTop = STORY_H - 84 * S - 56 * S - 8 * S - 18 * S;
  const petH = Math.min(320 * S, footTop - afterPill - 6 * S);
  const petW = (pet.width / pet.height) * petH;
  const petX = STORY_W - petW + 6 * S;
  const petY = footTop - petH - 4 * S;
  ctx.save();
  ctx.shadowColor = 'rgba(20,16,31,0.35)';
  ctx.shadowBlur = 18 * S;
  ctx.shadowOffsetY = 8 * S;
  ctx.drawImage(pet, petX, petY, petW, petH);
  ctx.restore();

  // Pied : la phrase d'appel, puis le lien sur une pilule blanche.
  const pillY = STORY_H - 84 * S - 56 * S;
  ctx.font = `800 ${15 * S}px ${FONT}`;
  ctx.fillStyle = ink;
  ctx.textAlign = 'center';
  ctx.fillText(input.callout, STORY_W / 2, pillY - 10 * S);
  ctx.fillStyle = color.white;
  ctx.beginPath();
  ctx.roundRect(left, pillY, inner, 56 * S, 28 * S);
  ctx.fill();
  let urlSize = 19 * S;
  ctx.font = `800 ${urlSize}px ${FONT}`;
  while (ctx.measureText(input.url).width > inner - 32 * S && urlSize > 11 * S) {
    urlSize -= S;
    ctx.font = `800 ${urlSize}px ${FONT}`;
  }
  const cut = input.url.lastIndexOf('/') + 1;
  const head = input.url.slice(0, cut);
  const tail = input.url.slice(cut);
  const total = ctx.measureText(input.url).width;
  const x0 = STORY_W / 2 - total / 2;
  ctx.textAlign = 'left';
  ctx.fillStyle = color.dark;
  ctx.fillText(head, x0, pillY + 28 * S + urlSize * 0.36);
  ctx.fillStyle = '#6D3DF0';
  ctx.fillText(tail, x0 + ctx.measureText(head).width, pillY + 28 * S + urlSize * 0.36);
  return canvas;
}

export function canvasToFile(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(new File([b], name, { type: 'image/png' })) : reject(new Error('toBlob'))), 'image/png'),
  );
}
