import type { Identity, LocationStatus, MatchExplanation, VisionProfileDto, VisionTest } from '@blowy/contract';
import {
  visionAxisText,
  visionCommonText,
  visionExploreLine,
  visionMatchText,
  visionProfileText,
  visionQuestionText,
  visionSideLine,
  visionTestText,
} from '@blowy/content';
import { type AxisSide, VISION_AXES, VISION_TEST, type VisionAxis, ZONE_RADIUS_KM, entitlements, sideOf } from '@blowy/domain';
import type { Profile } from '../../me/ports';
import type { PlaceRecord, VisionSnapshot } from '../ports';

export const toVisionTest = (): VisionTest => ({
  title: visionTestText.title,
  intro: visionTestText.intro,
  questions: VISION_TEST.map((q) => {
    const t = visionQuestionText[q.id];
    if (!t) throw new Error(`texte manquant pour la situation ${q.id}`);
    return { id: q.id, situation: t.situation, choices: [t.choices[0], t.choices[1]] };
  }),
});

export const toVisionProfile = (s: VisionSnapshot): VisionProfileDto => ({
  title: visionProfileText.title,
  note: visionProfileText.note,
  testDone: s.testDone,
  axes: VISION_AXES.map((axis) => {
    const r = s.profile[axis];
    const t = visionAxisText[axis];
    const side = sideOf(r.value);
    return { axis, name: t.name, about: t.about, lowLabel: t.low, highLabel: t.high, value: r.value, confidence: r.confidence, side, line: visionSideLine(axis, side) };
  }),
});

export interface ExplanationInput {
  common: readonly { axis: VisionAxis; side: AxisSide }[];
  explore: { axis: VisionAxis; mine: AxisSide; theirs: AxisSide };
}

/** Ce que l'autre voit : 3 points communs et 1 différence, en phrases. Jamais de valeur chiffrée d'axe. */
export function toExplanation(c: ExplanationInput, otherName: string): MatchExplanation {
  const common = c.common.slice(0, 3).map((p) => ({ axis: p.axis, name: visionAxisText[p.axis].name, text: visionCommonText[p.axis][p.side] }));
  if (common.length !== 3) throw new Error('explication incomplète');
  return {
    commonTitle: visionMatchText.commonTitle,
    common,
    exploreTitle: visionMatchText.exploreTitle,
    explore: { axis: c.explore.axis, name: visionAxisText[c.explore.axis].name, text: visionExploreLine(c.explore.axis, c.explore.mine, c.explore.theirs, otherName) },
  };
}

/** Premier point commun en une phrase (pour ce que dit le minimoa). */
export const firstCommonLine = (c: ExplanationInput): string => {
  const first = c.common[0];
  return first ? visionCommonText[first.axis][first.side] : '';
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
