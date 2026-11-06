/**
 * Paramètres d'animation partagés (maquette : `pop`, `sq` squash/stretch, `bounce`).
 * Fonctions pures pour être testées sans moteur d'animation.
 */
export const BREATH = {
  periodMs: 2400,
  lift: 10,
  squashX: 1.05,
  squashY: 0.95,
  stretchX: 0.96,
  stretchY: 1.05,
} as const;
export const POP = { durationMs: 650, fromScale: 0.94, fromY: 18 } as const;
export const PRESS = { depth: 4 } as const;

/**
 * Courbe de respiration normalisée t∈[0,1) → {translateY, scaleX, scaleY}, reprise de @keyframes sq :
 * 0 % repos, 30 % étiré en l'air, 52 % écrasé au sol, 100 % repos. Le point d'ancrage est le sol.
 */
export function breathAt(
  t: number,
  amplitude = 1,
): { translateY: number; scaleX: number; scaleY: number } {
  'worklet';
  const u = ((t % 1) + 1) % 1;
  const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
  let ty: number;
  let sx: number;
  let sy: number;
  if (u < 0.3) {
    const k = u / 0.3;
    ty = lerp(0, -BREATH.lift, k);
    sx = lerp(1, BREATH.stretchX, k);
    sy = lerp(1, BREATH.stretchY, k);
  } else if (u < 0.52) {
    const k = (u - 0.3) / 0.22;
    ty = lerp(-BREATH.lift, 0, k);
    sx = lerp(BREATH.stretchX, BREATH.squashX, k);
    sy = lerp(BREATH.stretchY, BREATH.squashY, k);
  } else {
    const k = (u - 0.52) / 0.48;
    ty = 0;
    sx = lerp(BREATH.squashX, 1, k);
    sy = lerp(BREATH.squashY, 1, k);
  }
  return {
    translateY: ty * amplitude,
    scaleX: 1 + (sx - 1) * amplitude,
    scaleY: 1 + (sy - 1) * amplitude,
  };
}

/** Index de frame d'une séquence (marche/saut) à l'instant `elapsedMs`. */
export const frameIndexAt = (
  elapsedMs: number,
  frameMs: number,
  frameCount: number,
  loop = true,
): number => {
  if (frameCount <= 0) return 0;
  const i = Math.floor(Math.max(0, elapsedMs) / frameMs);
  return loop ? i % frameCount : Math.min(i, frameCount - 1);
};

/** Bornes du zoom pinch et du pan de la scène du Nid. */
export const SCENE_LIMITS = {
  minScale: 1,
  maxScale: 1.8,
  parallaxBack: 0.35,
  parallaxFront: 1,
} as const;

export const clamp = (v: number, min: number, max: number): number => {
  'worklet';
  return Math.min(max, Math.max(min, v));
};

/** Débattement horizontal maximal de la caméra selon le zoom (bords jamais visibles). */
export const maxPanX = (viewportW: number, contentW: number, scale: number): number => {
  'worklet';
  return Math.max(0, (contentW * scale - viewportW) / 2);
};
