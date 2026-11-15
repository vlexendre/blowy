import type { Identity, LocationStatus, MatchExplanation, VisionProfileDto, VisionTest } from '@blowy/contract';
import { type Locale, visionExploreLine, visionSideLine, visionText } from '@blowy/content';
import { type AxisLeans, type AxisSide, VISION_AXES, VISION_TEST, type VisionAxis, ZONE_RADIUS_KM, entitlements, sideOf } from '@blowy/domain';
import type { Profile } from '../../me/ports';
import type { PlaceRecord, VisionSnapshot } from '../ports';

export const toVisionTest = (locale: Locale = 'fr'): VisionTest => ({
  title: visionText.in(locale).test.title,
  intro: visionText.in(locale).test.intro,
  questions: VISION_TEST.map((q) => {
    const t = visionText.in(locale).questions[q.id];
    if (!t) throw new Error(`texte manquant pour la situation ${q.id}`);
    return { id: q.id, situation: t.situation, choices: [t.choices[0], t.choices[1]] };
  }),
});

export const toVisionProfile = (s: VisionSnapshot, locale: Locale = 'fr'): VisionProfileDto => ({
  title: visionText.in(locale).profile.title,
  note: visionText.in(locale).profile.note,
  testDone: s.testDone,
  axes: VISION_AXES.map((axis) => {
    const r = s.profile[axis];
    const t = visionText.in(locale).axes[axis];
    const side = sideOf(r.value);
    return { axis, name: t.name, about: t.about, lowLabel: t.low, highLabel: t.high, value: r.value, confidence: r.confidence, side, line: visionSideLine(locale, axis, side) };
  }),
});

export interface ExplanationInput {
  /** `leans` : où penche chacun (côté et cran) ; absent d'une entrée de cache plus ancienne. */
  common: readonly { axis: VisionAxis; side: AxisSide; leans?: AxisLeans }[];
  explore: { axis: VisionAxis; mine: AxisSide; theirs: AxisSide; leans?: AxisLeans };
}

/** Les deux repères d'un axe, vus par la personne qui lit (`mine` = elle). Côté et cran seulement. */
const markers = (leans: AxisLeans | undefined) => (leans ? { mine: { ...leans.mine }, theirs: { ...leans.theirs } } : {});

/**
 * Ce que l'autre voit : 3 points communs et 1 différence, en phrases, et sur ces 4 axes seulement où penche chacun
 * (côté et cran, `axisLean`). Jamais de valeur chiffrée d'axe, jamais la confiance, rien sur les deux autres axes.
 */
export function toExplanation(c: ExplanationInput, otherName: string, locale: Locale = 'fr'): MatchExplanation {
  const t = visionText.in(locale);
  const common = c.common.slice(0, 3).map((p) => ({ axis: p.axis, name: t.axes[p.axis].name, text: t.common[p.axis][p.side], ...markers(p.leans) }));
  if (common.length !== 3) throw new Error('explication incomplète');
  return {
    commonTitle: t.match.commonTitle,
    common,
    exploreTitle: t.match.exploreTitle,
    explore: {
      axis: c.explore.axis,
      name: t.axes[c.explore.axis].name,
      text: visionExploreLine(locale, c.explore.axis, c.explore.mine, c.explore.theirs, otherName),
      ...markers(c.explore.leans),
    },
  };
}

/** Premier point commun en une phrase (pour ce que dit le minimoa). */
export const firstCommonLine = (c: ExplanationInput, locale: Locale = 'fr'): string => {
  const first = c.common[0];
  return first ? visionText.in(locale).common[first.axis][first.side] : '';
};

export function toLocationStatus(profile: Profile, place: PlaceRecord | null, plus: boolean): LocationStatus {
  const usable = profile.locationConsentAt ? place : null;
  return {
    consentAt: profile.locationConsentAt,
    locatedAt: usable?.locatedAt ?? null,
    zone: usable ? { center: { latitude: usable.home.lat, longitude: usable.home.lng }, radiusKm: ZONE_RADIUS_KM } : null,
    chosenCity: usable?.chosenCity ? { label: usable.chosenCity.label, latitude: usable.chosenCity.lat, longitude: usable.chosenCity.lng } : null,
    chosenCityActive: !!usable?.chosenCity && entitlements(plus).changeCity,
  };
}

export const toIdentity = (profile: Profile, place: PlaceRecord | null, plus: boolean): Identity => ({
  gender: profile.gender,
  seeking: profile.seeking,
  whom: profile.whom,
  locale: profile.locale,
  discreet: profile.discreet,
  sensitiveConsentAt: profile.sensitiveConsentAt,
  location: toLocationStatus(profile, place, plus),
});
