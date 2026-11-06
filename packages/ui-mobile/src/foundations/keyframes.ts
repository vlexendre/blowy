/**
 * Moteur de keyframes CSS, pur et compatible worklet (Reanimated) : reproduit exactement la
 * sémantique des `@keyframes` des maquettes (courbe appliquée PAR INTERVALLE entre deux images
 * clés, `animation-delay` négatif, `animation-direction: reverse`, `fill-mode: both`).
 * Les données (durées, courbes, images clés) viennent de `keyframes` de @blowy/design-tokens.
 */
import { easing as EASING, keyframes as KEYFRAMES, type KeyframeName, type KeyframeSpec, type KeyframeStop } from '@blowy/design-tokens';

export { KEYFRAMES };
export type { KeyframeName, KeyframeSpec, KeyframeStop };

/** Évalue une courbe cubic-bezier(x1,y1,x2,y2) en x (Newton + bissection, comme les navigateurs). */
export function cubicBezierAt(x1: number, y1: number, x2: number, y2: number, x: number): number {
  'worklet';
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  if (x1 === y1 && x2 === y2) return x;
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  let t = x;
  for (let i = 0; i < 8; i++) {
    const err = sx(t) - x;
    if (Math.abs(err) < 1e-7) return ((ay * t + by) * t + cy) * t;
    const d = dx(t);
    if (Math.abs(d) < 1e-6) break;
    t -= err / d;
  }
  let lo = 0;
  let hi = 1;
  t = x;
  for (let i = 0; i < 40; i++) {
    const v = sx(t);
    if (Math.abs(v - x) < 1e-7) break;
    if (v < x) lo = t;
    else hi = t;
    t = (lo + hi) / 2;
  }
  return ((ay * t + by) * t + cy) * t;
}

export interface PlayOptions {
  /** `animation-delay` en ms (négatif = déjà en cours). */
  delayMs?: number;
  /** `animation-direction: reverse`. */
  reverse?: boolean;
  /** Durée surchargée (ex. `.dr2` 12 s, `.sq` 2,2 s sur Chat). */
  durationMs?: number;
}

export type KeyframeValues = Required<Omit<KeyframeStop, 'at'>>;
const IDENTITY: KeyframeValues = { tx: 0, ty: 0, s: 1, sx: 1, sy: 1, r: 0, o: 1, spread: 0, a: 0 };

/** Progression orientée (0..1) d'une animation à l'instant `timeMs` (horloge depuis le début). */
export function directedProgress(spec: KeyframeSpec, timeMs: number, opts: PlayOptions = {}): number {
  'worklet';
  const duration = opts.durationMs ?? spec.durationMs;
  const local = timeMs - (opts.delayMs ?? 0);
  let p: number;
  if (local <= 0) p = 0; // fill backwards (`both`) ; les boucles à délai positif attendent au début
  else if (!spec.loop) p = Math.min(1, local / duration);
  else p = (local % duration) / duration;
  return opts.reverse ? 1 - p : p;
}

/** Valeurs interpolées à la progression orientée `p` (courbe de l'image clé de départ de l'intervalle). */
export function sampleAt(spec: KeyframeSpec, p: number): KeyframeValues {
  'worklet';
  const stops = spec.stops;
  let i = 0;
  while (i < stops.length - 2 && p > stops[i + 1]!.at) i++;
  const a = stops[i]!;
  const b = stops[i + 1] ?? a;
  const span = b.at - a.at;
  const k = span > 0 ? Math.min(1, Math.max(0, (p - a.at) / span)) : 1;
  const e = EASING[spec.easing];
  const w = cubicBezierAt(e[0], e[1], e[2], e[3], k);
  const pick = (key: keyof KeyframeValues): number => {
    const va = a[key] ?? IDENTITY[key];
    const vb = b[key] ?? IDENTITY[key];
    return va + (vb - va) * w;
  };
  return { tx: pick('tx'), ty: pick('ty'), s: pick('s'), sx: pick('sx'), sy: pick('sy'), r: pick('r'), o: pick('o'), spread: pick('spread'), a: pick('a') };
}

/** Valeurs de l'animation `name` à `timeMs` (ms écoulées depuis le montage). */
export function sampleKeyframes(name: KeyframeName, timeMs: number, opts: PlayOptions = {}): KeyframeValues {
  'worklet';
  const spec = KEYFRAMES[name] as KeyframeSpec;
  return sampleAt(spec, directedProgress(spec, timeMs, opts));
}

/** Pose de repos (mouvement réduit) : fin pour une entrée (`pop`), début pour une boucle. */
export function restValues(name: KeyframeName): KeyframeValues {
  'worklet';
  const spec = KEYFRAMES[name] as KeyframeSpec;
  return sampleAt(spec, spec.loop ? 0 : 1);
}

/** Transformation RN équivalente (ordre CSS : translate → rotate → scale). */
export function toTransform(v: KeyframeValues): Array<{ translateX: number } | { translateY: number } | { rotate: string } | { scaleX: number } | { scaleY: number }> {
  'worklet';
  return [{ translateX: v.tx }, { translateY: v.ty }, { rotate: `${v.r}deg` }, { scaleX: v.s * v.sx }, { scaleY: v.s * v.sy }];
}
