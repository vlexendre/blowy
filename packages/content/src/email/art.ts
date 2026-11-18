/**
 * Images des e-mails : poses des minimoas servies par le site (`apps/web/public/email`, générées par
 * `apps/web/scripts/email-images.py`). PNG en 2x : `width` et `height` sont les tailles affichées (px CSS).
 * Chaque scène a le panneau de son espèce (`speciesGradient` de @blowy/tokens) et la personne qui parle dans la bulle.
 */
import { color, gradient, speciesGradient, type GradientName } from '@blowy/tokens';

/** Adresse publique des images (jamais un chemin relatif : un e-mail n'a pas d'origine). */
export const EMAIL_ASSETS_URL = 'https://minimoa.app/email';

type Speaker = 'Nino' | 'Suzie' | 'Gaston' | 'Pia' | 'duo' | 'band';

interface Art {
  width: number;
  height: number;
  panel: GradientName;
  speaker: Speaker;
}

const of = (species: keyof typeof speciesGradient, width: number, height: number): Art => ({
  width,
  height,
  panel: speciesGradient[species],
  speaker: (species.charAt(0).toUpperCase() + species.slice(1)) as Speaker,
});

export const EMAIL_ART = {
  'nino-coucou': of('nino', 184, 210),
  'nino-pense': of('nino', 148, 200),
  'nino-check': of('nino', 171, 200),
  'nino-accueil': of('nino', 207, 200),
  'suzie-coucou': of('suzie', 172, 200),
  'suzie-dodo': of('suzie', 143, 170),
  'suzie-timide': of('suzie', 142, 190),
  'gaston-joie': of('gaston', 210, 200),
  'gaston-neutre': of('gaston', 186, 190),
  'gaston-pense': of('gaston', 164, 190),
  'gaston-assis': of('gaston', 166, 170),
  'pia-assis': of('pia', 179, 180),
  'pia-fete': of('pia', 206, 200),
  'pia-check': of('pia', 113, 120),
  'duo-rencontre': { width: 294, height: 190, panel: 'wine', speaker: 'duo' },
  'bande-fete': { width: 513, height: 180, panel: 'violet', speaker: 'band' },
} as const satisfies Record<string, Art>;

export type EmailScene = keyof typeof EMAIL_ART;

/** Têtes des quatre minimoas, en pied de chaque e-mail. */
export const EMAIL_FACES = { file: 'bande-tetes', width: 148, height: 34 } as const;

export const emailArtUrl = (file: string): string => `${EMAIL_ASSETS_URL}/${file}.png`;

/** Couleurs des e-mails, toutes tirées des jetons. */
export const EMAIL_COLORS = {
  night: color.night,
  panel: color.panel,
  card: color.card,
  line: color.line,
  text: color.white,
  mute: color.mute,
  ink: color.dark,
  accent: color.accent,
  accentSoft: color.accentSoft,
} as const;

/** Fond plein (repli) et dégradé d'un panneau, et la couleur du texte posé dessus (encre sur le jaune, blanc ailleurs). */
export function panelOf(name: GradientName): { solid: string; from: string; to: string; fg: string } {
  const [from, to] = gradient[name];
  const light = name === 'accent' || name === 'rose' || name === 'orange';
  return { solid: name === 'wine' ? to : from, from, to, fg: light ? color.dark : color.white };
}
