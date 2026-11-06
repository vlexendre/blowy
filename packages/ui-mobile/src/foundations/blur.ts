/**
 * Halo `.blob` des maquettes : disque plein (`border-radius:50%`) passé dans `filter: blur(σ)`.
 * React Native n'a pas de filtre de flou portable (iOS : aucun ; Android ≥ 12 seulement) : on
 * calcule le profil radial EXACT d'un disque convolué par une gaussienne d'écart-type σ, puis on le
 * dessine en dégradé radial SVG (identique sur iOS, Android et web).
 *
 * I(r) = ∫₀ᴿ (ρ/σ²)·exp(−(r²+ρ²)/2σ²)·I₀(rρ/σ²) dρ   (I₀ : Bessel modifiée), intégrée sur
 * ρ ∈ [r−7σ, r+7σ] avec I₀ mise à l'échelle (stable pour tout rayon).
 */

/** exp(−x)·I₀(x) (Bessel modifiée d'ordre 0, mise à l'échelle) — Abramowitz & Stegun 9.8.1–9.8.2. */
export function besselI0e(x: number): number {
  const ax = Math.abs(x);
  if (ax < 3.75) {
    const t = (ax / 3.75) ** 2;
    return (
      Math.exp(-ax) *
      (1 +
        t *
          (3.5156229 +
            t * (3.0899424 + t * (1.2067492 + t * (0.2659732 + t * (0.0360768 + t * 0.0045813))))))
    );
  }
  const t = 3.75 / ax;
  return (
    (1 / Math.sqrt(ax)) *
    (0.39894228 +
      t *
        (0.01328592 +
          t *
            (0.00225319 +
              t *
                (-0.00157565 +
                  t *
                    (0.00916281 +
                      t * (-0.02057706 + t * (0.02635537 + t * (-0.01647633 + t * 0.00392377))))))))
  );
}

/** Intensité (0..1) au rayon r d'un disque de rayon R flouté par une gaussienne σ. */
export function blurredDiscIntensity(r: number, R: number, sigma: number): number {
  if (sigma <= 0) return r <= R ? 1 : 0;
  const s2 = sigma * sigma;
  const lo = Math.max(0, r - 7 * sigma);
  const hi = Math.min(R, r + 7 * sigma);
  if (hi <= lo) return 0;
  const n = 400;
  const h = (hi - lo) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const rho = lo + (i + 0.5) * h;
    // (ρ/σ²)·exp(−(r²+ρ²)/2σ²)·I₀(rρ/σ²) = (ρ/σ²)·exp(−(r−ρ)²/2σ²)·I₀e(rρ/σ²)
    sum += (rho / s2) * Math.exp(-((r - rho) ** 2) / (2 * s2)) * besselI0e((r * rho) / s2);
  }
  return Math.min(1, sum * h);
}

export interface GradientStop {
  /** Position 0..1 le long du rayon du dégradé (rayon = R + 3σ). */
  offset: number;
  opacity: number;
}

/** Étendue du halo (rayon total dessiné). */
export const blobExtent = (R: number, sigma: number): number => R + 3 * sigma;

/** Arrêts de dégradé radial reproduisant le disque flouté (opacité multipliée par `opacity`). */
export function blurredDiscStops(
  R: number,
  sigma: number,
  opacity = 1,
  count = 24,
): GradientStop[] {
  const extent = blobExtent(R, sigma);
  const stops: GradientStop[] = [];
  for (let i = 0; i < count; i++) {
    const offset = i / (count - 1);
    const v = blurredDiscIntensity(offset * extent, R, sigma);
    stops.push({ offset, opacity: Math.round(v * opacity * 10000) / 10000 });
  }
  stops[stops.length - 1] = { offset: 1, opacity: 0 };
  return stops;
}
